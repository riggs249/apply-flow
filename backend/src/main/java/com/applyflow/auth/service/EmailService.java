package com.applyflow.auth.service;

import com.applyflow.notification.NotificationEmailMessage;

public interface EmailService {

    void send(NotificationEmailMessage message);
}
