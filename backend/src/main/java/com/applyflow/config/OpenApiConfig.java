package com.applyflow.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI applyFlowOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("HanapTracker API")
                        .version("v1")
                        .description("REST API for the HanapTracker job application management platform"));
    }
}
