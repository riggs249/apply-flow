package com.applyflow.application.service;

import com.applyflow.application.dto.ReminderCreateRequest;
import com.applyflow.application.dto.ReminderResponse;
import com.applyflow.application.dto.ReminderUpdateRequest;

import java.util.List;
import java.util.UUID;

public interface ReminderService {
    List<ReminderResponse> findAll(UUID userId);
    List<ReminderResponse> findByApplicationId(UUID userId, UUID applicationId);
    ReminderResponse findById(UUID userId, UUID reminderId);
    ReminderResponse create(UUID userId, ReminderCreateRequest request);
    ReminderResponse update(UUID userId, UUID reminderId, ReminderUpdateRequest request);
    ReminderResponse complete(UUID userId, UUID reminderId);
    ReminderResponse reopen(UUID userId, UUID reminderId);
    void delete(UUID userId, UUID reminderId);
}
