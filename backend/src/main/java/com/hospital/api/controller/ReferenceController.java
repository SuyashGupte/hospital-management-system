package com.hospital.api.controller;

import java.util.List;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hospital.api.config.OpenApiConfig;
import com.hospital.api.service.EmployeeService;
import com.hospital.api.service.ReportService;
import com.hospital.api.service.ReferenceDataService;
import com.hospital.models.BloodGroup;
import com.hospital.models.Category;
import com.hospital.models.RoomType;
import com.hospital.models.ShiftTime;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api")
@Tag(name = "Reference data & reports", description = "Lookup lists for forms, and the employee PDF report (replaces DownloadEmployeeReport)")
@SecurityRequirement(name = OpenApiConfig.BEARER)
public class ReferenceController {

    private final ReferenceDataService reference;
    private final ReportService reports;

    public ReferenceController(ReferenceDataService reference, ReportService reports) {
        this.reference = reference;
        this.reports = reports;
    }

    @Operation(summary = "Employee categories", description = "Any role.")
    @GetMapping("/lookups/categories")
    public List<Category> categories() {
        return reference.categories();
    }

    @Operation(summary = "Room types", description = "Any role.")
    @GetMapping("/lookups/room-types")
    public List<RoomType> roomTypes() {
        return reference.roomTypes();
    }

    @Operation(summary = "Blood groups", description = "Any role (also public: GET /api/public/blood-groups).")
    @GetMapping("/lookups/blood-groups")
    public List<BloodGroup> bloodGroups() {
        return reference.bloodGroups();
    }

    @Operation(summary = "Nurse shift times", description = "Any role.")
    @GetMapping("/lookups/shift-times")
    public List<ShiftTime> shiftTimes() {
        return reference.shiftTimes();
    }

    @Operation(summary = "Employee types", description = "Any role. Values of the Employee type discriminator.")
    @GetMapping("/lookups/employee-types")
    public List<String> employeeTypes() {
        return EmployeeService.TYPES;
    }

    @Operation(summary = "Employee report (PDF)", description = "Role: ADMIN. One report per employee type, e.g. Doctor, Nurse, pharmacist, Receptionist.")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(value = "/reports/employees/{type}", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> employeeReport(@PathVariable String type) {
        byte[] pdf = reports.employeeReport(type);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename("employees-" + type + ".pdf").build().toString())
                .contentType(MediaType.APPLICATION_PDF).body(pdf);
    }
}
