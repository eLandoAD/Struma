package com.videoshop.signaling;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

@Component
public class SignalingSessionManager {

    // Tempo massimo totale dalla join_queue prima che la sessione vada in MISSED,
    // indipendentemente da quanti consulenti l'hanno ignorata nel frattempo.
    private static final long QUEUE_TIMEOUT_SECONDS = 90;

    // Tempo massimo che UN consulente ha per rispondere a una notifica
    // incoming_customer, prima che la richiesta torni in coda per il prossimo.
    private static final long RINGING_TIMEOUT_SECONDS = 15;

    private final ObjectMapper mapper = new ObjectMapper();

    private final Map<String, CallSession> sessions = new ConcurrentHashMap<>();
    private final List<CallSession> completedSessions = new ArrayList<>();
    private final Deque<String> waitingCustomers = new ArrayDeque<>();
    private final Deque<WebSocketSession> availableConsultants = new ArrayDeque<>();
    private final Object matchLock = new Object();
    private final CallSessionRepository repository;

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    private final Map<String, ScheduledFuture<?>> timeoutTasks = new ConcurrentHashMap<>();
    private final Map<String, ScheduledFuture<?>> ringingTimeoutTasks = new ConcurrentHashMap<>();

    public SignalingSessionManager(CallSessionRepository repository) {
        this.repository = repository;
    }

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
            case "ping" -> { /* keepalive, nessuna azione */ }
            default -> System.out.println("Tipo messaggio non riconosciuto: " + type);
        }
    }

    public void handleDisconnect(WebSocketSession socket) throws IOException {
        synchronized (matchLock) {
            boolean wasAvailable = availableConsultants.remove(socket);
            if (wasAvailable) {
                System.out
                        .println("[CONSULENTE RIMOSSO] dal pool disponibili (disconnesso prima di essere accoppiato)");
            }
        }
        for (CallSession session : sessions.values()) {
            if (socket.equals(session.getCustomerSocket()) || socket.equals(session.getConsultantSocket())) {
                System.out.println("[DISCONNESSIONE] socket appartenente a sessione " + session.getId() + " (stato: "
                        + session.getStatus() + ")");
                endSession(session, socket, "disconnect");
            }
        }
    }

    private void handleJoinQueue(WebSocketSession customer, JsonNode payload) throws IOException {
        String sourcePage = payload.path("sourcePage").asText("unknown");
        String sessionId = UUID.randomUUID().toString();
        CallSession session = new CallSession(sessionId, sourcePage, customer);
        sessions.put(sessionId, session);
        repository.save(new CallSessionEntity(sessionId, "QUEUED", sourcePage, Instant.now()));
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
                TimeUnit.SECONDS);
        timeoutTasks.put(sessionId, future);
    }

    private void cancelTimeout(String sessionId) {
        ScheduledFuture<?> future = timeoutTasks.remove(sessionId);
        if (future != null) {
            future.cancel(false);
        }
    }

    private void scheduleRingingTimeout(String sessionId) {
        ScheduledFuture<?> future = scheduler.schedule(
                () -> handleRingingTimeout(sessionId),
                RINGING_TIMEOUT_SECONDS,
                TimeUnit.SECONDS);
        ringingTimeoutTasks.put(sessionId, future);
    }

    private void cancelRingingTimeout(String sessionId) {
        ScheduledFuture<?> future = ringingTimeoutTasks.remove(sessionId);
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
                return;
            }

            waitingCustomers.remove(sessionId);

            try {
                endSession(session, null, "timeout");
            } catch (IOException e) {
                System.out.println("[TIMEOUT] errore nella chiusura sessione: " + e.getMessage());
            }

            System.out.println("[TIMEOUT] sessione " + sessionId + " -> MISSED (nessuna risposta entro " + QUEUE_TIMEOUT_SECONDS + "s totali)");
        }
    }

    /**
     * Scade il tempo che UN consulente specifico aveva per rispondere.
     * A differenza di handleTimeout, questo NON chiude la sessione: la
     * rimette in coda per essere riproposta al prossimo consulente
     * disponibile. Il timeout "totale" (handleTimeout, 30s) resta comunque
     * attivo in background e farà comunque scattare MISSED se il tempo
     * complessivo scade, indipendentemente da quanti consulenti l'hanno
     * ignorata nel frattempo.
     */
    private void handleRingingTimeout(String sessionId) {
        synchronized (matchLock) {
            ringingTimeoutTasks.remove(sessionId);
            CallSession session = sessions.get(sessionId);
            if (session == null) return;
            if (session.getStatus() != CallSession.Status.RINGING) return; // già risposto/gestito altrove

            WebSocketSession unresponsiveConsultant = session.getConsultantSocket();

            session.setConsultantSocket(null);
            session.setStatus(CallSession.Status.QUEUED);
            waitingCustomers.addFirst(sessionId);

            try {
                if (unresponsiveConsultant != null && unresponsiveConsultant.isOpen()) {
                    send(unresponsiveConsultant, "incoming_customer_cancelled", sessionId, Map.of());
                }
                tryMatch();
            } catch (IOException e) {
                System.out.println("[RINGING TIMEOUT] errore nel rimettere in coda: " + e.getMessage());
            }

            System.out.println("[RINGING TIMEOUT] sessione " + sessionId + " -> rimessa in coda (consulente non ha risposto entro " + RINGING_TIMEOUT_SECONDS + "s)");
        }
    }

    private void handleConsultantAvailable(WebSocketSession consultant) throws IOException {
        synchronized (matchLock) {
            availableConsultants.addLast(consultant);
            tryMatch();
        }
    }

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
            scheduleRingingTimeout(sessionId);

            send(consultant, "incoming_customer", sessionId, Map.of(
                    "sourcePage", session.getSourcePage(),
                    "waitingSince", session.getQueuedAt().toEpochMilli()));
        }
    }

    private void handleAnswerCustomer(WebSocketSession consultant, String sessionId) throws IOException {
        CallSession session = sessions.get(sessionId);
        if (session == null || !consultant.equals(session.getConsultantSocket()))
            return;

        cancelTimeout(sessionId);
        cancelRingingTimeout(sessionId);

        session.setAnsweredAt(Instant.now());
        session.setStatus(CallSession.Status.ACTIVE);

        repository.findById(sessionId).ifPresent(entity -> {
            entity.setStatus("ACTIVE");
            entity.setAnsweredAt(Instant.now());
            repository.save(entity);
        });

        send(session.getConsultantSocket(), "call_assigned", sessionId, Map.of("role", "caller"));
        send(session.getCustomerSocket(), "call_assigned", sessionId, Map.of("role", "callee"));
    }

    private void handleDeclineCustomer(WebSocketSession consultant, String sessionId) throws IOException {
        CallSession session = sessions.get(sessionId);
        if (session == null || !consultant.equals(session.getConsultantSocket()))
            return;

        cancelRingingTimeout(sessionId);

        session.setConsultantSocket(null);
        session.setStatus(CallSession.Status.QUEUED);

        synchronized (matchLock) {
            waitingCustomers.addFirst(sessionId);
            tryMatch();
        }
    }

    private void relay(WebSocketSession sender, String sessionId, String type, JsonNode payload) throws IOException {
        CallSession session = sessions.get(sessionId);
        if (session == null)
            return;
        WebSocketSession recipient = session.otherParty(sender);
        if (recipient == null || !recipient.isOpen())
            return;
        send(recipient, type, sessionId, payload);
    }

    private void handleHangup(WebSocketSession sender, String sessionId, JsonNode payload) throws IOException {
        CallSession session = sessions.get(sessionId);
        if (session == null)
            return;
        endSession(session, sender, payload.path("reason").asText("hangup"));
    }

    private void endSession(CallSession session, WebSocketSession initiator, String reason) throws IOException {
        if (session.getStatus() == CallSession.Status.ENDED || session.getStatus() == CallSession.Status.MISSED) {
            return;
        }

        cancelTimeout(session.getId());
        cancelRingingTimeout(session.getId());
        session.setEndedAt(Instant.now());
        session.setEndReason(reason);

        boolean wasNeverAnswered = session.getAnsweredAt() == null;
        CallSession.Status finalStatus = wasNeverAnswered ? CallSession.Status.MISSED : CallSession.Status.ENDED;
        session.setStatus(finalStatus);

        repository.findById(session.getId()).ifPresent(entity -> {
            entity.setStatus(finalStatus.name());
            entity.setEndedAt(Instant.now());
            entity.setEndReason(reason);
            repository.save(entity);
        });

        if (wasNeverAnswered) {
            if (session.getCustomerSocket() != null && session.getCustomerSocket().isOpen()
                    && !session.getCustomerSocket().equals(initiator)) {
                send(session.getCustomerSocket(), "missed", session.getId(), Map.of());
            }
            if (session.getConsultantSocket() != null && session.getConsultantSocket().isOpen()
                    && !session.getConsultantSocket().equals(initiator)) {
                send(session.getConsultantSocket(), "hangup", session.getId(), Map.of("reason", reason));
            }
        } else {
            WebSocketSession other = session.otherParty(initiator);
            if (other != null && other.isOpen()) {
                send(other, "hangup", session.getId(), Map.of("reason", reason));
            }
        }

        completedSessions.add(session);
        sessions.remove(session.getId());

        System.out.println("[RIMOSSA] sessione " + session.getId() + " (motivo: " + reason
                + ", stato finale: " + finalStatus + ") | totale sessioni rimanenti: " + sessions.size());
    }

    private void send(WebSocketSession recipient, String type, String sessionId, Object payload) throws IOException {
        if (recipient == null || !recipient.isOpen())
            return;
        ObjectNode envelope = mapper.createObjectNode();
        envelope.put("type", type);
        if (sessionId != null)
            envelope.put("sessionId", sessionId);
        envelope.set("payload", mapper.valueToTree(payload));
        recipient.sendMessage(new TextMessage(mapper.writeValueAsString(envelope)));
    }

    public List<CallSession> getAllSessions() {
        List<CallSession> result = new ArrayList<>();
        result.addAll(sessions.values());
        result.addAll(completedSessions);
        return result;
    }
}
