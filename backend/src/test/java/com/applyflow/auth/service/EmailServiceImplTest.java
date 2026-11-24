package com.applyflow.auth.service;

import com.applyflow.notification.NotificationEmailComposer;
import com.applyflow.notification.NotificationEmailMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailServiceImplTest {

    @Mock ObjectProvider<JavaMailSender> mailSender;
    @Mock ResendHttpMailClient resendHttpMailClient;
    @Mock NotificationEmailComposer composer;

    @Test
    void prefersResendHttpWhenConfigured() {
        when(resendHttpMailClient.isConfigured()).thenReturn(true);
        when(composer.plainText(org.mockito.ArgumentMatchers.any())).thenReturn("text");
        when(composer.html(org.mockito.ArgumentMatchers.any())).thenReturn("<p>html</p>");

        EmailServiceImpl service = new EmailServiceImpl(
                mailSender,
                resendHttpMailClient,
                composer,
                "HanapTracker <onboarding@resend.dev>",
                "smtp.resend.com",
                "auto"
        );

        service.send(sampleMessage());

        verify(resendHttpMailClient).send(
                eq("HanapTracker <onboarding@resend.dev>"),
                eq("user@example.com"),
                eq("Subject"),
                eq("text"),
                eq("<p>html</p>")
        );
        verifyNoInteractions(mailSender);
    }

    @Test
    void usesResendWhenProviderForced() {
        when(resendHttpMailClient.isConfigured()).thenReturn(true);
        when(composer.plainText(org.mockito.ArgumentMatchers.any())).thenReturn("text");
        when(composer.html(org.mockito.ArgumentMatchers.any())).thenReturn("<p>html</p>");

        EmailServiceImpl service = new EmailServiceImpl(
                mailSender,
                resendHttpMailClient,
                composer,
                "HanapTracker <onboarding@resend.dev>",
                "",
                "resend"
        );

        service.send(sampleMessage());

        verify(resendHttpMailClient).send(anyString(), anyString(), anyString(), anyString(), anyString());
    }

    private static NotificationEmailMessage sampleMessage() {
        return new NotificationEmailMessage(
                "user@example.com",
                "User",
                "Subject",
                "Eyebrow",
                "Headline",
                "Intro",
                List.of(),
                "https://example.com",
                "Open",
                null
        );
    }
}
