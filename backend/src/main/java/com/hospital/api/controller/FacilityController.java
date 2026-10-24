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
import com.hospital.api.dto.Dtos.RoomRequest;
import com.hospital.api.dto.Dtos.ServiceTimeRequest;
import com.hospital.api.security.AuthUser;
import com.hospital.api.service.FacilityService;
import com.hospital.models.NurseServiceTime;
import com.hospital.models.Room;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api")
@Tag(name = "Rooms & nurse rota", description = "Replaces AddRoom / UpdateRoom / DeleteRoom and AddServiceTime / UpdateServiceTime / DeleteServiceTime")
@SecurityRequirement(name = OpenApiConfig.BEARER)
public class FacilityController {

    private final FacilityService facility;

    public FacilityController(FacilityService facility) {
        this.facility = facility;
    }

    // ---- rooms ----
    @Operation(summary = "List rooms", description = "Roles: ADMIN, RECEPTIONIST, ACCOUNTANT.")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','ACCOUNTANT')")
    @GetMapping("/rooms")
    public List<Room> rooms() {
        return facility.rooms();
    }

    @Operation(summary = "Rooms with at least one free bed", description = "Roles: ADMIN, RECEPTIONIST. Used when booking a bed.")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    @GetMapping("/rooms/available")
    public List<Room> available() {
        return facility.availableRooms();
    }

    @Operation(summary = "Get a room", description = "Roles: ADMIN, RECEPTIONIST, ACCOUNTANT. 404 when unknown.")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','ACCOUNTANT')")
    @GetMapping("/rooms/{id}")
    public Room room(@PathVariable Integer id) {
        return facility.room(id);
    }

    @Operation(summary = "Create a room", description = "Role: ADMIN. All beds start as available.")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/rooms")
    @ResponseStatus(HttpStatus.CREATED)
    public Room createRoom(@Valid @RequestBody RoomRequest request) {
        return facility.createRoom(request);
    }

    @Operation(summary = "Update a room", description = "Role: ADMIN. Like the legacy app, available beds are reset to the bed count.")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/rooms/{id}")
    public Room updateRoom(@PathVariable Integer id, @Valid @RequestBody RoomRequest request) {
        return facility.updateRoom(id, request);
    }

    @Operation(summary = "Delete a room", description = "Role: ADMIN. Its bookings are deleted first.")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/rooms/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRoom(@PathVariable Integer id) {
        facility.deleteRoom(id);
    }

    // ---- nurse service times ----
    @Operation(summary = "List all nurse shifts", description = "Role: ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/service-times")
    public List<NurseServiceTime> serviceTimes() {
        return facility.serviceTimes();
    }

    @Operation(summary = "My shifts", description = "Role: NURSE (own roster).")
    @PreAuthorize("hasRole('NURSE')")
    @GetMapping("/service-times/mine")
    public List<NurseServiceTime> mine(@AuthenticationPrincipal AuthUser user) {
        return facility.serviceTimesForNurse(user.employeeId());
    }

    @Operation(summary = "Get a shift", description = "Role: ADMIN. 404 when unknown.")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/service-times/{id}")
    public NurseServiceTime serviceTime(@PathVariable Integer id) {
        return facility.serviceTime(id);
    }

    @Operation(summary = "Assign a nurse to a shift", description = "Role: ADMIN. serviceDate uses MM/dd/yyyy.")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/service-times")
    @ResponseStatus(HttpStatus.CREATED)
    public NurseServiceTime createServiceTime(@Valid @RequestBody ServiceTimeRequest request) {
        return facility.createServiceTime(request);
    }

    @Operation(summary = "Update a shift", description = "Role: ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/service-times/{id}")
    public NurseServiceTime updateServiceTime(@PathVariable Integer id, @Valid @RequestBody ServiceTimeRequest request) {
        return facility.updateServiceTime(id, request);
    }

    @Operation(summary = "Delete a shift", description = "Role: ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/service-times/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteServiceTime(@PathVariable Integer id) {
        facility.deleteServiceTime(id);
    }
}
