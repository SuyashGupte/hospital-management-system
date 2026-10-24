package com.hospital.api.security;

import java.io.IOException;
import java.util.Collections;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/** Reads "Authorization: Bearer <jwt>" and populates the SecurityContext. Invalid tokens are simply ignored (-> 401). */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String PREFIX = "Bearer ";

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(PREFIX) && SecurityContextHolder.getContext().getAuthentication() == null) {
            jwtService.parse(header.substring(PREFIX.length()).trim()).ifPresent(user -> {
                if (user.role() != null) {
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(user, null,
                            Collections.singletonList(new SimpleGrantedAuthority(JwtService.authority(user.role()))));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            });
        }
        chain.doFilter(request, response);
    }
}
