package com.videoshop.signaling;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CallSessionRepository extends JpaRepository<CallSessionEntity, String> {
}