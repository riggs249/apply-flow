package com.applyflow.auth.service;

public interface EmailService {

    void sendVerificationEmail(String toEmail, String displayName, String verificationUrl);
}
