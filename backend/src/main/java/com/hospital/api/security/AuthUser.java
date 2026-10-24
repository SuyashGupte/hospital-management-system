package com.hospital.api.security;

/** Identity extracted from a validated JWT (the authentication principal). */
public record AuthUser(Integer employeeId, String username, String role) {
}
