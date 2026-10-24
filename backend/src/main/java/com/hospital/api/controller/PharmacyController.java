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
import com.hospital.api.dto.Dtos.DrugRequest;
import com.hospital.api.dto.Dtos.SaleRequest;
import com.hospital.api.dto.Dtos.SaleResult;
import com.hospital.api.security.AuthUser;
import com.hospital.api.service.PharmacyService;
import com.hospital.api.service.ReportService;
import com.hospital.models.Drug;
import com.hospital.models.SelledDrug;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api")
@Tag(name = "Pharmacy", description = "Replaces AddDrug / UpdateDrug / DeleteDrug and SellDrug / UpdateSellDrug / ReverseSellDrug / InvoiceDrug")
@SecurityRequirement(name = OpenApiConfig.BEARER)
public class PharmacyController {

    private final PharmacyService pharmacy;
    private final ReportService reports;

    public PharmacyController(PharmacyService pharmacy, ReportService reports) {
        this.pharmacy = pharmacy;
        this.reports = reports;
    }

    // ---- drugs ----
    @Operation(summary = "List drugs (stock)", description = "Roles: PHARMACIST, ADMIN.")
    @PreAuthorize("hasAnyRole('PHARMACIST','ADMIN')")
    @GetMapping("/drugs")
    public List<Drug> drugs() {
        return pharmacy.drugs();
    }

    @Operation(summary = "Get a drug", description = "Roles: PHARMACIST, ADMIN. 404 when unknown.")
    @PreAuthorize("hasAnyRole('PHARMACIST','ADMIN')")
    @GetMapping("/drugs/{id}")
    public Drug drug(@PathVariable Integer id) {
        return pharmacy.drug(id);
    }

    @Operation(summary = "Add a drug", description = "Role: PHARMACIST. startDate / expiryDate use MM/dd/yyyy.")
    @PreAuthorize("hasRole('PHARMACIST')")
    @PostMapping("/drugs")
    @ResponseStatus(HttpStatus.CREATED)
    public Drug createDrug(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody DrugRequest request) {
        return pharmacy.createDrug(user, request);
    }

    @Operation(summary = "Update a drug", description = "Role: PHARMACIST.")
    @PreAuthorize("hasRole('PHARMACIST')")
    @PutMapping("/drugs/{id}")
    public Drug updateDrug(@AuthenticationPrincipal AuthUser user, @PathVariable Integer id,
            @Valid @RequestBody DrugRequest request) {
        return pharmacy.updateDrug(user, id, request);
    }

    @Operation(summary = "Delete a drug", description = "Role: PHARMACIST. 409 if sales still reference it.")
    @PreAuthorize("hasRole('PHARMACIST')")
    @DeleteMapping("/drugs/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDrug(@PathVariable Integer id) {
        pharmacy.deleteDrug(id);
    }

    // ---- sales ----
    @Operation(summary = "List drug sales", description = "Roles: PHARMACIST, ADMIN.")
    @PreAuthorize("hasAnyRole('PHARMACIST','ADMIN')")
    @GetMapping("/drug-sales")
    public List<SelledDrug> sales() {
        return pharmacy.sales();
    }

    @Operation(summary = "Get a drug sale", description = "Roles: PHARMACIST, ADMIN. 404 when unknown.")
    @PreAuthorize("hasAnyRole('PHARMACIST','ADMIN')")
    @GetMapping("/drug-sales/{id}")
    public SelledDrug sale(@PathVariable Integer id) {
        return pharmacy.sale(id);
    }

    @Operation(summary = "Sell a drug to a patient", description = "Role: PHARMACIST. quantity must be strictly less than the stock (422 otherwise). Stock is reduced; lowStock=true when the remaining stock is <= 50.")
    @PreAuthorize("hasRole('PHARMACIST')")
    @PostMapping("/drug-sales")
    @ResponseStatus(HttpStatus.CREATED)
    public SaleResult sell(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody SaleRequest request) {
        return pharmacy.sell(user, request);
    }

    @Operation(summary = "Update a sale", description = "Role: PHARMACIST. Previously sold quantity is returned to stock before the new one is deducted.")
    @PreAuthorize("hasRole('PHARMACIST')")
    @PutMapping("/drug-sales/{id}")
    public SaleResult updateSale(@PathVariable Integer id, @Valid @RequestBody SaleRequest request) {
        return pharmacy.updateSale(id, request);
    }

    @Operation(summary = "Reverse (delete) a sale", description = "Role: PHARMACIST.")
    @PreAuthorize("hasRole('PHARMACIST')")
    @DeleteMapping("/drug-sales/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reverseSale(@PathVariable Integer id) {
        pharmacy.reverseSale(id);
    }

    @Operation(summary = "PDF invoice of the patient's sales", description = "Role: PHARMACIST. Total = sum(cost x quantity) of ALL the patient's sales. Legacy behaviour kept: the invoiced sales are deleted after the PDF is produced, so it can only be generated once.")
    @PreAuthorize("hasRole('PHARMACIST')")
    @PostMapping(value = "/drug-sales/{id}/invoice", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> invoice(@PathVariable Integer id) {
        byte[] pdf = reports.drugInvoice(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename("invoice-sale-" + id + ".pdf").build().toString())
                .contentType(MediaType.APPLICATION_PDF).body(pdf);
    }
}
