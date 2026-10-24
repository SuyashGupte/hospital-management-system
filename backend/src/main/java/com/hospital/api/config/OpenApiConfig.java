package com.hospital.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenApiConfig {

    public static final String BEARER = "bearerAuth";

    @Bean
    public OpenAPI hospitalOpenApi() {
        return new OpenAPI()
                .info(new Info().title("Hospital Management System API").version("1.0")
                        .description("REST API replacing the legacy Struts/JSP application. "
                                + "Call POST /api/auth/login, then use the returned token with the Authorize button. "
                                + "Role per endpoint is shown in each operation description."))
                .components(new Components().addSecuritySchemes(BEARER,
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));
    }
}
