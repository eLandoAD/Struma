package com.videoshop.signaling;

import org.springframework.web.socket.WebSocketSession;
import java.time.Instant;

public class CallSession {

    public enum Status { QUEUED, RINGING, ACTIVE, ENDED, MISSED }

    private final String id;
    private final String sourcePage;
    private final Instant queuedAt;
    private final WebSocketSession customerSocket;
    private WebSocketSession consultantSocket;
    private Status status;

    public CallSession(String id, String sourcePage, WebSocketSession customerSocket) {
        this.id = id;
        this.sourcePage = sourcePage;
        this.customerSocket = customerSocket;
        this.queuedAt = Instant.now();
        this.status = Status.QUEUED;
    }

    public String getId() { return id; }
    public String getSourcePage() { return sourcePage; }
    public Instant getQueuedAt() { return queuedAt; }
    public WebSocketSession getCustomerSocket() { return customerSocket; }
    public WebSocketSession getConsultantSocket() { return consultantSocket; }
    public void setConsultantSocket(WebSocketSession s) { this.consultantSocket = s; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    /** Dato il socket di uno dei due, ritorna l'altro. Null se non appartiene a questa sessione. */
    public WebSocketSession otherParty(WebSocketSession socket) {
        if (socket == customerSocket) return consultantSocket;
        if (socket == consultantSocket) return customerSocket;
        return null;
    }
}