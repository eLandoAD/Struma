package com.videoshop.signaling;

import org.springframework.web.socket.WebSocketSession;

import java.time.Duration;
import java.time.Instant;

public class CallSession {

    public enum Status {
        QUEUED,
        RINGING,
        ACTIVE,
        ENDED,
        MISSED
    }

    private final String id;
    private final String sourcePage;
    private final Instant queuedAt;

    private Instant answeredAt;
    private Instant endedAt;

    private String consultantName;
    private String endReason;

    private final WebSocketSession customerSocket;
    private WebSocketSession consultantSocket;

    private Status status;

    public CallSession(
            String id,
            String sourcePage,
            WebSocketSession customerSocket
    ) {
        this.id = id;
        this.sourcePage = sourcePage;
        this.customerSocket = customerSocket;
        this.queuedAt = Instant.now();
        this.status = Status.QUEUED;
    }

    public String getId() {
        return id;
    }

    public String getSourcePage() {
        return sourcePage;
    }

    public Instant getQueuedAt() {
        return queuedAt;
    }

    public Instant getAnsweredAt() {
        return answeredAt;
    }

    public void setAnsweredAt(Instant answeredAt) {
        this.answeredAt = answeredAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(Instant endedAt) {
        this.endedAt = endedAt;
    }

    public String getConsultantName() {
        return consultantName;
    }

    public void setConsultantName(String consultantName) {
        this.consultantName = consultantName;
    }

    public String getEndReason() {
        return endReason;
    }

    public void setEndReason(String endReason) {
        this.endReason = endReason;
    }

    public WebSocketSession getCustomerSocket() {
        return customerSocket;
    }

    public WebSocketSession getConsultantSocket() {
        return consultantSocket;
    }

    public void setConsultantSocket(WebSocketSession consultantSocket) {
        this.consultantSocket = consultantSocket;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public long getDurationSeconds() {

        if (answeredAt == null || endedAt == null) {
            return 0;
        }

        return Duration.between(
                answeredAt,
                endedAt
        ).getSeconds();
    }

    public long getSpeedOfAnswerSeconds() {

        if (answeredAt == null) {
            return 0;
        }

        return Duration.between(
                queuedAt,
                answeredAt
        ).getSeconds();
    }

    public WebSocketSession otherParty(WebSocketSession socket) {

        if (socket == customerSocket) {
            return consultantSocket;
        }

        if (socket == consultantSocket) {
            return customerSocket;
        }

        return null;
    }
}