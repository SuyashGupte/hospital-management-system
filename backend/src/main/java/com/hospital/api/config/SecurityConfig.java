package com.hospital.api.config;

import java.io.IOException;

import javax.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.api.exception.ApiError;
import com.hospital.api.security.JwtAuthenticationFilter;
import com.hospital.api.security.JwtService;

/**
 * Stateless JWT security. Authentication happens in {@link JwtAuthenticationFilter}; per-endpoint role checks are done
 * with @PreAuthorize on the controllers (the legacy app only hid menu items in the JSP sidebar).
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private static final String[] PUBLIC_PATHS = { "/api/auth/login", "/api/public/**", "/swagger-ui.html",
            "/swagger-ui/**", "/v3/api-docs/**", "/error" };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtService jwtService, ObjectMapper mapper)
            throws Exception {
        http.csrf(csrf -> csrf.disable()) // stateless bearer-token API, no cookies/session
                .cors(cors -> {
                }) // uses the CorsConfigurationSource bean
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeRequests(a -> a.antMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .antMatchers(PUBLIC_PATHS).permitAll().anyRequest().authenticated())
                .exceptionHandling(e -> e.authenticationEntryPoint((req, res, ex) -> write(mapper, req.getRequestURI(),
                        res, HttpStatus.UNAUTHORIZED, "Authentication required: send 'Authorization: Bearer <token>'"))
                        .accessDeniedHandler((req, res, ex) -> write(mapper, req.getRequestURI(), res,
                                HttpStatus.FORBIDDEN, "You do not have permission to perform this action")))
                .addFilterBefore(new JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private static void write(ObjectMapper mapper, String path, HttpServletResponse res, HttpStatus status,
            String message) throws IOException {
        res.setStatus(status.value());
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(res.getOutputStream(),
                new ApiError(status.value(), status.getReasonPhrase(), message, path, null));
    }
}
