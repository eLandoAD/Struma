package com.videoshop.signaling;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "call_session")
public class CallSessionEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String status;

    @Column(name = "source_page")
    private String sourcePage;

    @Column(name = "queued_at", nullable = false)
    private Instant queuedAt;

    @Column(name = "answered_at")
    private Instant answeredAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "end_reason")
    private String endReason;

    protected CallSessionEntity() {
        // richiesto da JPA, non usare direttamente
    }

    public CallSessionEntity(String id, String status, String sourcePage, Instant queuedAt) {
        this.id = id;
        this.status = status;
        this.sourcePage = sourcePage;
        this.queuedAt = queuedAt;
    }

    public String getId() { return id; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSourcePage() { return sourcePage; }
    public Instant getQueuedAt() { return queuedAt; }
    public Instant getAnsweredAt() { return answeredAt; }
    public void setAnsweredAt(Instant answeredAt) { this.answeredAt = answeredAt; }
    public Instant getEndedAt() { return endedAt; }
    public void setEndedAt(Instant endedAt) { this.endedAt = endedAt; }
    public String getEndReason() { return endReason; }
    public void setEndReason(String endReason) { this.endReason = endReason; }
}