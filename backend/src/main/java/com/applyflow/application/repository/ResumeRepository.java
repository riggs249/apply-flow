package com.applyflow.application.repository;

import com.applyflow.application.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResumeRepository extends JpaRepository<Resume, UUID> {

    List<Resume> findByUserIdOrderByUpdatedAtDesc(UUID userId);

    Optional<Resume> findByIdAndUserId(UUID id, UUID userId);
}
