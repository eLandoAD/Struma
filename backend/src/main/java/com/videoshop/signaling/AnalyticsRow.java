package com.videoshop.signaling;

import java.time.Instant;

public record AnalyticsRow(
        String consultant,
        String sourcePage,
        Instant queuedAt,
        long durationSeconds,
        String status,
        String endReason
) {
}