package com.videoshop.signaling;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

@Component
public class SignalingSessionManager {

    // Tempo massimo in coda prima di passare a MISSED. 30s per i test;
    // da alzare a un valore realistico (es. 60-120s) prima della demo.
    private static final long QUEUE_TIMEOUT_SECONDS = 30;

    private final ObjectMapper mapper = new ObjectMapper();

    private final Map<String, CallSession> sessions = new ConcurrentHashMap<>();
    private final Deque<String> waitingCustomers = new ArrayDeque<>();
    private final Deque<WebSocketSession> availableConsultants = new ArrayDeque<>();
    private final Object matchLock = new Object();

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    private final Map<String, ScheduledFuture<?>> timeoutTasks = new ConcurrentHashMap<>();

    public void handleMessage(WebSocketSession sender, String rawJson) throws IOException {
        JsonNode root = mapper.readTree(rawJson);
        String type = root.path("type").asText();
        String sessionId = root.hasNonNull("sessionId") ? root.get("sessionId").asText() : null;
        JsonNode payload = root.path("payload");

        switch (type) {
            case "join_queue" -> handleJoinQueue(sender, payload);
            case "consultant_available" -> handleConsultantAvailable(sender);
            case "answer_customer" -> handleAnswerCustomer(sender, sessionId);
            case "decline_customer" -> handleDeclineCustomer(sender, sessionId);
            case "offer", "answer", "ice_candidate" -> relay(sender, sessionId, type, payload);
            case "hangup" -> handleHangup(sender, sessionId, payload);
            default -> System.out.println("Tipo messaggio non riconosciuto: " + type);
        }
    }

    public void handleDisconnect(WebSocketSession socket) throws IOException {
        synchronized (matchLock) {
            boolean wasAvailable = availableConsultants.remove(socket);
            if (wasAvailable) {
                System.out.println("[CONSULENTE RIMOSSO] dal pool disponibili (disconnesso prima di essere accoppiato)");
            }
        }
        for (CallSession session : sessions.values()) {
            if (socket.equals(session.getCustomerSocket()) || socket.equals(session.getConsultantSocket())) {
                System.out.println("[DISCONNESSIONE] socket appartenente a sessione " + session.getId() + " (stato: " + session.getStatus() + ")");
                endSession(session, socket, "disconnect");
            }
        }
    }

    private void handleJoinQueue(WebSocketSession customer, JsonNode payload) throws IOException {
        String sourcePage = payload.path("sourcePage").asText("unknown");
        String sessionId = UUID.randomUUID().toString();
        CallSession session = new CallSession(sessionId, sourcePage, customer);
        sessions.put(sessionId, session);
        System.out.println("[CREATA] sessione " + sessionId + " | totale sessioni attive: " + sessions.size());

        send(customer, "queued", sessionId, Map.of("sourcePage", sourcePage));

        scheduleTimeout(sessionId);

        synchronized (matchLock) {
            waitingCustomers.addLast(sessionId);
            tryMatch();
        }
    }

    private void scheduleTimeout(String sessionId) {
        ScheduledFuture<?> future = scheduler.schedule(
            () -> handleTimeout(sessionId),
            QUEUE_TIMEOUT_SECONDS,
            TimeUnit.SECONDS
        );
        timeoutTasks.put(sessionId, future);
    }

    private void cancelTimeout(String sessionId) {
        ScheduledFuture<?> future = timeoutTasks.remove(sessionId);
        if (future != null) {
            future.cancel(false);
        }
    }

    private void handleTimeout(String sessionId) {
        synchronized (matchLock) {
            timeoutTasks.remove(sessionId);
            CallSession session = sessions.get(sessionId);
            if (session == null) return;

            CallSession.Status status = session.getStatus();
            if (status == CallSession.Status.ACTIVE
                || status == CallSession.Status.ENDED
                || status == CallSession.Status.MISSED) {
                return; // già risolta, niente da fare
            }

            session.setStatus(CallSession.Status.MISSED);
            waitingCustomers.remove(sessionId);
            sessions.remove(sessionId);

            try {
                send(session.getCustomerSocket(), "missed", sessionId, Map.of());
                WebSocketSession consultant = session.getConsultantSocket();
                if (consultant != null && consultant.isOpen()) {
                    send(consultant, "hangup", sessionId, Map.of("reason", "timeout"));
                }
            } catch (IOException e) {
                System.out.println("[TIMEOUT] errore nell'invio del messaggio missed: " + e.getMessage());
            }

            System.out.println("[TIMEOUT] sessione " + sessionId + " -> MISSED (nessuna risposta entro " + QUEUE_TIMEOUT_SECONDS + "s)");
        }
    }

    private void handleConsultantAvailable(WebSocketSession consultant) throws IOException {
        synchronized (matchLock) {
            availableConsultants.addLast(consultant);
            tryMatch();
        }
    }

    /** Va chiamato sempre dentro matchLock. */
    private void tryMatch() throws IOException {
        while (!waitingCustomers.isEmpty() && !availableConsultants.isEmpty()) {
            String sessionId = waitingCustomers.pollFirst();
            CallSession session = sessions.get(sessionId);
            if (session == null || session.getStatus() != CallSession.Status.QUEUED) {
                continue;
            }
            WebSocketSession consultant = availableConsultants.pollFirst();
            if (consultant == null || !consultant.isOpen()) {
                waitingCustomers.addFirst(sessionId);
                continue;
            }

            session.setConsultantSocket(consultant);
            session.setStatus(CallSession.Status.RINGING);
            // Il timeout NON viene cancellato qui: continua a contare il tempo
            // totale di attesa, anche se questo consulente poi declina.

            send(consultant, "incoming_customer", sessionId, Map.of("sourcePage", session.getSourcePage()));
        }
    }

    private void handleAnswerCustomer(WebSocketSession consultant, String sessionId) throws IOException {
        CallSession session = sessions.get(sessionId);
        if (session == null || !consultant.equals(session.getConsultantSocket())) return;

        cancelTimeout(sessionId); // risposto per davvero: il timer si ferma qui

        session.setStatus(CallSession.Status.ACTIVE);
        send(session.getConsultantSocket(), "call_assigned", sessionId, Map.of("role", "caller"));
        send(session.getCustomerSocket(), "call_assigned", sessionId, Map.of("role", "callee"));
    }

    private void handleDeclineCustomer(WebSocketSession consultant, String sessionId) throws IOException {
        CallSession session = sessions.get(sessionId);
        if (session == null || !consultant.equals(session.getConsultantSocket())) return;

        session.setConsultantSocket(null);
        session.setStatus(CallSession.Status.QUEUED);

        synchronized (matchLock) {
            waitingCustomers.addFirst(sessionId);
            tryMatch();
        }
    }

    private void relay(WebSocketSession sender, String sessionId, String type, JsonNode payload) throws IOException {
        CallSession session = sessions.get(sessionId);
        if (session == null) return;
        WebSocketSession recipient = session.otherParty(sender);
        if (recipient == null || !recipient.isOpen()) return;
        send(recipient, type, sessionId, payload);
    }

    private void handleHangup(WebSocketSession sender, String sessionId, JsonNode payload) throws IOException {
        CallSession session = sessions.get(sessionId);
        if (session == null) return;
        endSession(session, sender, payload.path("reason").asText("hangup"));
    }

    private void endSession(CallSession session, WebSocketSession initiator, String reason) throws IOException {
        if (session.getStatus() == CallSession.Status.ENDED) return;

        cancelTimeout(session.getId());
        session.setStatus(CallSession.Status.ENDED);

        WebSocketSession other = session.otherParty(initiator);
        if (other != null && other.isOpen()) {
            send(other, "hangup", session.getId(), Map.of("reason", reason));
        }
        sessions.remove(session.getId());
        System.out.println("[RIMOSSA] sessione " + session.getId() + " (motivo: " + reason + ") | totale sessioni rimanenti: " + sessions.size());
    }

    private void send(WebSocketSession recipient, String type, String sessionId, Object payload) throws IOException {
        if (recipient == null || !recipient.isOpen()) return;
        ObjectNode envelope = mapper.createObjectNode();
        envelope.put("type", type);
        if (sessionId != null) envelope.put("sessionId", sessionId);
        envelope.set("payload", mapper.valueToTree(payload));
        recipient.sendMessage(new TextMessage(mapper.writeValueAsString(envelope)));
    }
}