package com.hospital.api.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Locale;
import java.util.Optional;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.hospital.models.Employee;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

/** Issues and validates stateless HS256 JWTs. The role claim is the Employee discriminator value. */
@Component
public class JwtService {

    private final SecretKey key;
    private final long expirationMillis;

    public JwtService(@Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-minutes}") long expirationMinutes) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret must be at least 32 characters (set JWT_SECRET)");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.expirationMillis = expirationMinutes * 60_000L;
    }

    public String generate(Employee employee) {
        Date now = new Date();
        return Jwts.builder().setSubject(String.valueOf(employee.getEmployeeId()))
                .claim("username", employee.getUsername()).claim("role", employee.getType()).setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + expirationMillis)).signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public long getExpirationSeconds() {
        return expirationMillis / 1000;
    }

    public Optional<AuthUser> parse(String token) {
        try {
            Claims claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
            return Optional.of(new AuthUser(Integer.valueOf(claims.getSubject()), claims.get("username", String.class),
                    claims.get("role", String.class)));
        } catch (JwtException | IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    /** "pharmacist" -> ROLE_PHARMACIST, "Receptionist" -> ROLE_RECEPTIONIST, "Admin" -> ROLE_ADMIN ... */
    public static String authority(String employeeType) {
        return "ROLE_" + employeeType.toUpperCase(Locale.ROOT);
    }
}
