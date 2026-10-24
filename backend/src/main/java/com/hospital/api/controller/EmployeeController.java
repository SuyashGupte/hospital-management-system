package com.hospital.api.controller;

import java.util.List;

import javax.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.hospital.api.config.OpenApiConfig;
import com.hospital.api.dto.Dtos.EmployeeRequest;
import com.hospital.api.security.AuthUser;
import com.hospital.api.service.AuthService;
import com.hospital.api.service.EmployeeService;
import com.hospital.models.Employee;
import com.hospital.models.EmployeeStatatistic;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/employees")
@Tag(name = "Employees", description = "Staff management (Admin). Replaces AddEmployee / UpdateEmployee / deleteEmployee and the dashboard")
@SecurityRequirement(name = OpenApiConfig.BEARER)
public class EmployeeController {

    private final EmployeeService employees;
    private final AuthService auth;

    public EmployeeController(EmployeeService employees, AuthService auth) {
        this.employees = employees;
        this.auth = auth;
    }

    @Operation(summary = "List employees", description = "Role: ADMIN. Optional filter by type: Admin, Doctor, Nurse, Lab, Xray, pharmacist, Receptionist, Accountant.")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<Employee> list(@RequestParam(required = false) String type) {
        return employees.list(type);
    }

    @Operation(summary = "Headcount per employee type (dashboard)", description = "Role: ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/statistics")
    public List<EmployeeStatatistic> statistics() {
        return employees.statistics();
    }

    @Operation(summary = "Possible message recipients (all employees except me)", description = "Any role.")
    @GetMapping("/recipients")
    public List<Employee> recipients(@AuthenticationPrincipal AuthUser user) {
        return auth.others(user);
    }

    @Operation(summary = "Get one employee", description = "Role: ADMIN. 404 when unknown.")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public Employee get(@PathVariable Integer id) {
        return employees.get(id);
    }

    @Operation(summary = "Create employee", description = "Role: ADMIN. type and password are required. e-mail and username must be unique (409). The password is stored as MD5/Base64 like the legacy app.")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Employee create(@Valid @RequestBody EmployeeRequest request) {
        return employees.create(request);
    }

    @Operation(summary = "Update employee", description = "Role: ADMIN. The type cannot change. A blank password keeps the stored one; omitted qualification / work-experience lists are kept.")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public Employee update(@PathVariable Integer id, @Valid @RequestBody EmployeeRequest request) {
        return employees.update(id, request);
    }

    @Operation(summary = "Upload / replace the employee photo", description = "Role: ADMIN. multipart/form-data, part name 'picture' (image/*). Stored as a Base64 data URI like the legacy app.")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping(value = "/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Employee photo(@PathVariable Integer id, @RequestPart("picture") MultipartFile picture) {
        return employees.setPhoto(id, picture);
    }

    @Operation(summary = "Delete employee", description = "Role: ADMIN. Their messages are deleted first. 409 if other records (e.g. sales, diagnoses) still reference the employee.")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        employees.delete(id);
    }
}
