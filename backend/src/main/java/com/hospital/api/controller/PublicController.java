package com.hospital.api.controller;

import java.util.List;

import javax.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.hospital.api.dto.Dtos.PatientRequest;
import com.hospital.api.service.PatientService;
import com.hospital.api.service.ReferenceDataService;
import com.hospital.models.BloodGroup;
import com.hospital.models.Patient;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/public")
@Tag(name = "Public", description = "No authentication. Replaces the public patient sign-up on index.jsp")
public class PublicController {

    private final PatientService patients;
    private final ReferenceDataService reference;

    public PublicController(PatientService patients, ReferenceDataService reference) {
        this.patients = patients;
        this.reference = reference;
    }

    @Operation(summary = "Blood groups for the sign-up form", description = "Public.")
    @GetMapping("/blood-groups")
    public List<BloodGroup> bloodGroups() {
        return reference.bloodGroups();
    }

    @Operation(summary = "Patient self sign-up", description = "Public. Phone numbers: 7-15 digits; dob: MM/dd/yyyy; e-mail and next-of-kin address are optional.")
    @PostMapping("/patients")
    @ResponseStatus(HttpStatus.CREATED)
    public Patient signUp(@Valid @RequestBody PatientRequest request) {
        return patients.createPatient(request);
    }
}
