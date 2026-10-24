package com.hospital.api.controller;

import javax.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.hospital.api.config.OpenApiConfig;
import com.hospital.api.dto.Dtos.ChangePasswordRequest;
import com.hospital.api.dto.Dtos.LoginRequest;
import com.hospital.api.dto.Dtos.LoginResponse;
import com.hospital.api.security.AuthUser;
import com.hospital.api.service.AuthService;
import com.hospital.models.Employee;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Login (JWT), profile and password change. Replaces LoginService / logout / ChangePassword")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @Operation(summary = "Login with username or e-mail + password", description = "Public. Returns a bearer token (use the Authorize button). 401 on bad credentials.")
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return auth.login(request);
    }

    @Operation(summary = "Profile of the signed-in employee", description = "Any role.", security = @SecurityRequirement(name = OpenApiConfig.BEARER))
    @GetMapping("/me")
    public Employee me(@AuthenticationPrincipal AuthUser user) {
        return auth.current(user);
    }

    @Operation(summary = "Change own password", description = "Any role. The current password must match; 400 otherwise.", security = @SecurityRequirement(name = OpenApiConfig.BEARER))
    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody ChangePasswordRequest request) {
        auth.changePassword(user, request);
    }

    @Operation(summary = "Logout", description = "Tokens are stateless: the client just discards its token. Provided for API completeness.", security = @SecurityRequirement(name = OpenApiConfig.BEARER))
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }
}
