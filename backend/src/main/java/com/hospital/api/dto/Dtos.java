package com.hospital.api.dto;

import java.util.List;

import javax.validation.Valid;
import javax.validation.constraints.Email;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;

import com.hospital.models.BookBed;
import com.hospital.models.Employee;

/** Request/response bodies. Dates use the legacy format MM/dd/yyyy. */
public final class Dtos {

    private static final String DATE = "^\\d{2}/\\d{2}/\\d{4}$";
    private static final String DATE_MSG = "must use the format MM/dd/yyyy";
    private static final String PHONE = "^\\d{7,15}$";
    private static final String PHONE_MSG = "must be 7 to 15 digits";

    private Dtos() {
    }

    // ---- auth ----
    public record LoginRequest(@NotBlank String user, @NotBlank String pass) {
    }

    public record LoginResponse(String token, String tokenType, long expiresInSeconds, Employee employee) {
    }

    public record ChangePasswordRequest(@NotBlank String currentPassword, @NotBlank String newPassword) {
    }

    // ---- employees ----
    public record QualificationDto(@NotBlank String instituteName, @NotBlank String qualificationName,
            @NotBlank String degree, @NotBlank String educationDate) {
    }

    public record WorkExperienceDto(@NotBlank String nameOfOrganization, @NotBlank String position,
            @NotBlank String startDate, @NotBlank String endDate) {
    }

    /**
     * type and password are mandatory on create only (enforced in the service). On update an empty password keeps the
     * stored one and omitted qualification/work-experience lists keep the stored ones.
     */
    public record EmployeeRequest(@NotBlank String firstName, @NotBlank String fatherName,
            @NotBlank String familyName, @NotBlank String userName, @NotBlank String address,
            @NotBlank @Email String email,
            @NotBlank @Pattern(regexp = DATE, message = DATE_MSG) String dob, @NotBlank String phone,
            @NotBlank String gender, @NotNull Integer categoryId,
            String type, String password, @Valid List<QualificationDto> qualifications,
            @Valid List<WorkExperienceDto> workExperiences) {
    }

    // ---- rooms / nurse service ----
    public record RoomRequest(@NotNull Integer roomTypeId, @NotNull @Min(1) Integer bedNumbers,
            @NotNull @Min(0) Integer roomNumber) {
    }

    public record ServiceTimeRequest(@NotNull Integer nurseId, @NotNull Integer shiftTimeId,
            @NotBlank @Pattern(regexp = DATE, message = DATE_MSG) String serviceDate, @NotBlank String department) {
    }

    // ---- patients / beds / fees ----
    public record NextOfKinDto(@NotBlank String fullName, String address, @NotBlank String relationship,
            @NotBlank @Pattern(regexp = PHONE, message = PHONE_MSG) String phone) {
    }

    public record PatientRequest(@NotBlank String firstName, @NotBlank String fatherName,
            @NotBlank String familyName, @NotBlank String address, @Email String email,
            @NotBlank @Pattern(regexp = DATE, message = DATE_MSG) String dob,
            @NotBlank @Pattern(regexp = PHONE, message = PHONE_MSG) String phone, @NotBlank String gender,
            @NotNull Integer bloodGroupId, @NotNull @Valid NextOfKinDto nextOfKin) {
    }

    public record BookingRequest(@NotNull Integer patientId, @NotNull Integer roomId, @NotBlank String departement) {
    }

    public record PaymentRequest(@NotNull Boolean paid) {
    }

    public record FeeRecord(BookBed booking, long days, double roomCost, double totalCost) {
    }

    // ---- clinical ----
    public record DiseaseRequest(@NotNull Integer patientId, @NotBlank String disease, String note) {
    }

    // ---- pharmacy ----
    public record DrugRequest(@NotBlank String name, @NotNull @Min(0) Double cost, @NotNull @Min(0) Integer quantity,
            @NotBlank @Pattern(regexp = DATE, message = DATE_MSG) String startDate,
            @NotBlank @Pattern(regexp = DATE, message = DATE_MSG) String expiryDate) {
    }

    public record SaleRequest(@NotNull Integer drugId, @NotNull Integer patientId, @NotNull @Min(1) Integer quantity,
            @NotBlank String unitPerDay, @NotBlank @Pattern(regexp = DATE, message = DATE_MSG) String startTake,
            @NotBlank @Pattern(regexp = DATE, message = DATE_MSG) String endTake) {
    }

    public record SaleResult(Integer saleId, int remainingStock, boolean lowStock, String message) {
    }

    // ---- messages ----
    /** Exactly one of recipientId / allReceptionists must be supplied. */
    public record MessageRequest(Integer recipientId, boolean allReceptionists, @NotNull Integer patientId,
            @NotBlank String subject, @NotBlank String body) {
    }

    public record UnreadCount(int unread) {
    }
}
