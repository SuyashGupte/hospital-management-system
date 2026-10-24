package com.hospital.api.controller;

import java.util.List;

import javax.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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
import com.hospital.api.dto.Dtos.BookingRequest;
import com.hospital.api.dto.Dtos.FeeRecord;
import com.hospital.api.dto.Dtos.PatientRequest;
import com.hospital.api.dto.Dtos.PaymentRequest;
import com.hospital.api.service.PatientService;
import com.hospital.models.BookBed;
import com.hospital.models.Patient;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api")
@Tag(name = "Patients, bookings & fees", description = "Replaces AddPatient / UpdatePatient / DeletePatient, BookBed / UpdateBookBed / DeleteBookBed and CheckedPatientFees")
@SecurityRequirement(name = OpenApiConfig.BEARER)
public class PatientController {

    private final PatientService patients;

    public PatientController(PatientService patients) {
        this.patients = patients;
    }

    // ---- patients ----
    @Operation(summary = "List patients", description = "Any authenticated role (receptionists, clinicians, pharmacists and message composition all need it).")
    @GetMapping("/patients")
    public List<Patient> list() {
        return patients.patients();
    }

    @Operation(summary = "Get a patient", description = "Any authenticated role. 404 when unknown.")
    @GetMapping("/patients/{id}")
    public Patient get(@PathVariable Integer id) {
        return patients.patient(id);
    }

    @Operation(summary = "Register a patient", description = "Roles: RECEPTIONIST, ADMIN. (Public self sign-up: POST /api/public/patients.)")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN')")
    @PostMapping("/patients")
    @ResponseStatus(HttpStatus.CREATED)
    public Patient create(@Valid @RequestBody PatientRequest request) {
        return patients.createPatient(request);
    }

    @Operation(summary = "Update a patient", description = "Roles: RECEPTIONIST, ADMIN.")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN')")
    @PutMapping("/patients/{id}")
    public Patient update(@PathVariable Integer id, @Valid @RequestBody PatientRequest request) {
        return patients.updatePatient(id, request);
    }

    @Operation(summary = "Delete a patient", description = "Roles: RECEPTIONIST, ADMIN. The patient's messages are deleted first. 409 if bookings, diagnoses or sales still reference the patient.")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN')")
    @DeleteMapping("/patients/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        patients.deletePatient(id);
    }

    // ---- bed bookings ----
    @Operation(summary = "List bed bookings", description = "Roles: RECEPTIONIST, ACCOUNTANT, ADMIN.")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ACCOUNTANT','ADMIN')")
    @GetMapping("/bookings")
    public List<BookBed> bookings() {
        return patients.bookings();
    }

    @Operation(summary = "Get a booking", description = "Roles: RECEPTIONIST, ACCOUNTANT, ADMIN. 404 when unknown.")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ACCOUNTANT','ADMIN')")
    @GetMapping("/bookings/{id}")
    public BookBed booking(@PathVariable Integer id) {
        return patients.booking(id);
    }

    @Operation(summary = "Book a bed", description = "Role: RECEPTIONIST. Takes one available bed; 409 when the room is full. New bookings are unpaid.")
    @PreAuthorize("hasRole('RECEPTIONIST')")
    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public BookBed book(@Valid @RequestBody BookingRequest request) {
        return patients.book(request);
    }

    @Operation(summary = "Change a booking", description = "Role: RECEPTIONIST. Moving an unpaid booking to another room adjusts both rooms' free-bed counters.")
    @PreAuthorize("hasRole('RECEPTIONIST')")
    @PutMapping("/bookings/{id}")
    public BookBed updateBooking(@PathVariable Integer id, @Valid @RequestBody BookingRequest request) {
        return patients.updateBooking(id, request);
    }

    @Operation(summary = "Cancel a booking", description = "Role: RECEPTIONIST. Gives the bed back (unless the fee was already paid) and deletes the booking.")
    @PreAuthorize("hasRole('RECEPTIONIST')")
    @DeleteMapping("/bookings/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable Integer id) {
        patients.cancelBooking(id);
    }

    // ---- fees ----
    @Operation(summary = "Patient fees for every booking", description = "Roles: ACCOUNTANT, ADMIN. Fee = whole days since booking x room cost.")
    @PreAuthorize("hasAnyRole('ACCOUNTANT','ADMIN')")
    @GetMapping("/fees")
    public List<FeeRecord> fees() {
        return patients.fees();
    }

    @Operation(summary = "Fee of one booking", description = "Roles: ACCOUNTANT, ADMIN. 404 when unknown.")
    @PreAuthorize("hasAnyRole('ACCOUNTANT','ADMIN')")
    @GetMapping("/fees/{bookingId}")
    public FeeRecord fee(@PathVariable Integer bookingId) {
        return patients.fee(bookingId);
    }

    @Operation(summary = "Mark a booking paid / unpaid", description = "Role: ACCOUNTANT. paid=true releases the bed; paid=false only resets the status (legacy behaviour). Repeating the current state changes nothing.")
    @PreAuthorize("hasRole('ACCOUNTANT')")
    @PutMapping("/fees/{bookingId}/payment")
    public BookBed payment(@PathVariable Integer bookingId, @Valid @RequestBody PaymentRequest request) {
        return patients.setPaid(bookingId, request.paid());
    }
}
