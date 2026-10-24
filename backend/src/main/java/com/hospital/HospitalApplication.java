package com.hospital;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

/**
 * Spring Boot entry point. The legacy Hibernate data access layer
 * (com.hospital.entities / DbConfig / models) is used unchanged; the REST layer lives in com.hospital.api.
 * Authentication is done with JWT, so the default generated in-memory user is disabled.
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class HospitalApplication {

    public static void main(String[] args) {
        SpringApplication.run(HospitalApplication.class, args);
    }
}
