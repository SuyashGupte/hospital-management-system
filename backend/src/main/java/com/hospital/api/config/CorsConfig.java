package com.hospital.api.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Single source of truth for CORS. It is consumed by Spring Security (http.cors()), so pre-flight OPTIONS requests
 * are answered before authentication. Supports localhost and 127.0.0.1 on any port with allowCredentials=true.
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource(CorsProperties props) {
        CorsConfiguration cfg = new CorsConfiguration();

        List<String> originPatterns = new ArrayList<>();
        originPatterns.add("http://localhost:[*]");
        originPatterns.add("http://127.0.0.1:[*]");
        originPatterns.add("http://[::1]:[*]");

        if (props.getAllowedOrigins() != null) {
            for (String origin : props.getAllowedOrigins()) {
                if (origin != null && !origin.trim().isEmpty() && !origin.equals("*")) {
                    originPatterns.add(origin.trim());
                }
            }
        }

        cfg.setAllowedOriginPatterns(originPatterns);
        cfg.setAllowedMethods(props.getAllowedMethods());
        cfg.setAllowedHeaders(props.getAllowedHeaders());
        cfg.setExposedHeaders(props.getExposedHeaders());
        cfg.setAllowCredentials(props.isAllowCredentials());
        cfg.setMaxAge(props.getMaxAgeSeconds());

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
