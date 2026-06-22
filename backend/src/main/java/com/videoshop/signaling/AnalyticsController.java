package com.videoshop.signaling;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin("*")
public class AnalyticsController {

    private final SignalingSessionManager manager;

    public AnalyticsController(
            SignalingSessionManager manager
    ) {
        this.manager = manager;
    }

    @GetMapping("/call-log")
    public List<AnalyticsRow> callLog(
            @RequestParam(required = false) String view
    ) {

        return manager.getAllSessions()
                .stream()
                .filter(session -> {

                    if (view == null) {
                        return true;
                    }

                    return switch (view) {

                        case "current" ->
                                session.getStatus() == CallSession.Status.RINGING
                                        || session.getStatus() == CallSession.Status.ACTIVE;

                        case "past" ->
                                session.getStatus() == CallSession.Status.ENDED;

                        case "missed" ->
                                session.getStatus() == CallSession.Status.MISSED;

                        default -> true;
                    };
                })
                .map(session ->
                        new AnalyticsRow(
                                session.getConsultantName(),
                                session.getSourcePage(),
                                session.getQueuedAt(),
                                session.getDurationSeconds(),
                                session.getStatus().name(),
                                session.getEndReason()
                        )
                )
                .toList();
    }

    @GetMapping("/calls-per-day")
    public Map<LocalDate, Long> callsPerDay() {

        return manager.getAllSessions()
                .stream()
                .collect(
                        Collectors.groupingBy(
                                s -> s.getQueuedAt()
                                        .atZone(
                                                ZoneId.systemDefault()
                                        )
                                        .toLocalDate(),
                                Collectors.counting()
                        )
                );
    }

    @GetMapping("/speed-of-answer")
public Map<String, Double> speedOfAnswer() {

    List<Long> values =
            manager.getAllSessions()
                    .stream()
                    .filter(
                            s ->
                                    s.getAnsweredAt()
                                            != null
                    )
                    .map(
                            CallSession::getSpeedOfAnswerSeconds
                    )
                    .sorted()
                    .toList();

    double average =
            values.stream()
                    .mapToLong(
                            Long::longValue
                    )
                    .average()
                    .orElse(0);

    double median = 0;

    if (!values.isEmpty()) {

        int middle =
                values.size() / 2;

        if (
            values.size() % 2 == 0
        ) {

            median =
                    (
                        values.get(
                                middle - 1
                        )
                        +
                        values.get(
                                middle
                        )
                    ) / 2.0;

        } else {

            median =
                    values.get(
                            middle
                    );
        }
    }

    return Map.of(
            "average",
            average,
            "median",
            median
    );
}

    @GetMapping("/export")
    public ResponseEntity<String> exportCsv() {

        StringBuilder csv = new StringBuilder();

        csv.append(
                "Consultant,Source Page,Queued At,Duration,Status,End Reason\n"
        );

        manager.getAllSessions()
                .forEach(session -> {

                    csv.append(session.getConsultantName())
                            .append(",")

                            .append(session.getSourcePage())
                            .append(",")

                            .append(session.getQueuedAt())
                            .append(",")

                            .append(session.getDurationSeconds())
                            .append(",")

                            .append(session.getStatus())
                            .append(",")

                            .append(session.getEndReason())
                            .append("\n");
                });

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=call-log.csv"
                )
                .contentType(
                        MediaType.TEXT_PLAIN
                )
                .body(csv.toString());
    }
}