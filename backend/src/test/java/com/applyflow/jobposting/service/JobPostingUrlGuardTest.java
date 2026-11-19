package com.applyflow.jobposting.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JobPostingUrlGuardTest {

    private final JobPostingUrlGuard guard = new JobPostingUrlGuard();

    @Test
    void acceptsPublicHttpsUrl() {
        assertThat(guard.validatePublicHttpUrl("https://boards.greenhouse.io/acme/jobs/1").getHost())
                .isEqualTo("boards.greenhouse.io");
    }

    @Test
    void rejectsLocalhost() {
        assertThatThrownBy(() -> guard.validatePublicHttpUrl("http://localhost:8080/secret"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be used");
    }
}
