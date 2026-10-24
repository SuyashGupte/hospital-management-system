package com.hospital.api.controller;

import java.util.List;

import javax.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.hospital.api.config.OpenApiConfig;
import com.hospital.api.dto.Dtos.DiseaseRequest;
import com.hospital.api.security.AuthUser;
import com.hospital.api.service.DiseaseService;
import com.hospital.models.Disease;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/diseases")
@Tag(name = "Diagnoses", description = "Replaces AddDiesease / UpdateDiesease / DeleteDiesease and the read-only patient view")
@SecurityRequirement(name = OpenApiConfig.BEARER)
public class DiseaseController {

    private final DiseaseService diseases;

    public DiseaseController(DiseaseService diseases) {
        this.diseases = diseases;
    }

    @Operation(summary = "All diagnoses", description = "Roles: NURSE, LAB, XRAY, ADMIN (read-only patient view).")
    @PreAuthorize("hasAnyRole('NURSE','LAB','XRAY','ADMIN')")
    @GetMapping
    public List<Disease> all() {
        return diseases.all();
    }

    @Operation(summary = "My diagnoses", description = "Role: DOCTOR. Only the diagnoses recorded by the signed-in doctor.")
    @PreAuthorize("hasRole('DOCTOR')")
    @GetMapping("/mine")
    public List<Disease> mine(@AuthenticationPrincipal AuthUser user) {
        return diseases.byDoctor(user.employeeId());
    }

    @Operation(summary = "Get a diagnosis", description = "Roles: DOCTOR, NURSE, LAB, XRAY, ADMIN. 404 when unknown.")
    @PreAuthorize("hasAnyRole('DOCTOR','NURSE','LAB','XRAY','ADMIN')")
    @GetMapping("/{id}")
    public Disease get(@PathVariable Integer id) {
        return diseases.get(id);
    }

    @Operation(summary = "Record a diagnosis", description = "Role: DOCTOR. The doctor is the signed-in user; the date is set by the server.")
    @PreAuthorize("hasRole('DOCTOR')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Disease create(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody DiseaseRequest request) {
        return diseases.create(user, request);
    }

    @Operation(summary = "Update a diagnosis", description = "Role: DOCTOR (only the author; 403 otherwise).")
    @PreAuthorize("hasRole('DOCTOR')")
    @PutMapping("/{id}")
    public Disease update(@AuthenticationPrincipal AuthUser user, @PathVariable Integer id,
            @Valid @RequestBody DiseaseRequest request) {
        return diseases.update(user, id, request);
    }

    @Operation(summary = "Delete a diagnosis", description = "Role: DOCTOR (only the author; 403 otherwise).")
    @PreAuthorize("hasRole('DOCTOR')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthUser user, @PathVariable Integer id) {
        diseases.delete(user, id);
    }
}
