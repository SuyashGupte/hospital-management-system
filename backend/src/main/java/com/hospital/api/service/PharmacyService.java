package com.hospital.api.service;

import java.util.Date;
import java.util.List;

import org.springframework.stereotype.Service;

import com.hospital.api.common.Dates;
import com.hospital.api.dto.Dtos.DrugRequest;
import com.hospital.api.dto.Dtos.SaleRequest;
import com.hospital.api.dto.Dtos.SaleResult;
import com.hospital.api.exception.ApiException;
import com.hospital.api.security.AuthUser;
import com.hospital.models.Drug;
import com.hospital.models.Employee;
import com.hospital.models.Patient;
import com.hospital.models.Pharmatiest;
import com.hospital.models.SelledDrug;

/** Drug stock and sales (Pharmacist functions). */
@Service
public class PharmacyService {

    /** Remaining stock at or below this value triggers the low-stock warning. */
    public static final int LOW_STOCK_THRESHOLD = 50;

    private final HospitalGateway gw;

    public PharmacyService(HospitalGateway gw) {
        this.gw = gw;
    }

    // ---- drugs ----
    public List<Drug> drugs() {
        return gw.list(Drug.class);
    }

    public Drug drug(Integer id) {
        return gw.require(Drug.class, id, "Drug");
    }

    public Drug createDrug(AuthUser user, DrugRequest r) {
        Drug drug = new Drug();
        fill(drug, user, r);
        int id = gw.run(d -> d.saveObject(drug));
        if (id == 0) {
            throw ApiException.conflict("Drug could not be saved");
        }
        return drug(id);
    }

    public Drug updateDrug(AuthUser user, Integer id, DrugRequest r) {
        Drug drug = drug(id);
        fill(drug, user, r);
        gw.exec(d -> d.updateObject(drug));
        return drug(id);
    }

    public void deleteDrug(Integer id) {
        Drug drug = drug(id);
        gw.deleteVerified(Drug.class, id, "Drug", d -> {
            drug.setEmployee(null);
            d.deleteObject(drug);
        });
    }

    private void fill(Drug drug, AuthUser user, DrugRequest r) {
        drug.setName(r.name());
        drug.setCost(r.cost());
        drug.setQuantity(r.quantity());
        drug.setStartDate(Dates.parse("startDate", r.startDate()));
        drug.setDrug_expired(Dates.parse("expiryDate", r.expiryDate()));
        drug.setEmployee(gw.requireRef(Employee.class, user.employeeId(), "Employee"));
    }

    // ---- sales ----
    public List<SelledDrug> sales() {
        return gw.list(SelledDrug.class);
    }

    public SelledDrug sale(Integer id) {
        return gw.require(SelledDrug.class, id, "Sale");
    }

    /**
     * Rule: the sold quantity must be strictly less than the stock (kept from the legacy listener). Stock is reduced
     * and a warning flag is returned when the remaining stock is &lt;= 50. The sale id is max(id)+1, assigned by the
     * unchanged DAO (raw SQL insert), so the whole operation runs under one lock.
     */
    public SaleResult sell(AuthUser user, SaleRequest r) {
        return gw.run(d -> {
            Pharmatiest pharmacist = gw.requireRef(Pharmatiest.class, user.employeeId(), "Pharmacist");
            Drug drug = gw.requireRef(Drug.class, r.drugId(), "Drug");
            Patient patient = gw.requireRef(Patient.class, r.patientId(), "Patient");
            if (r.quantity() >= drug.getQuantity()) {
                throw ApiException.unprocessable("Requested quantity " + r.quantity()
                        + " must be less than the available stock (" + drug.getQuantity() + ")");
            }
            Date start = Dates.parse("startTake", r.startTake());
            Date end = Dates.parse("endTake", r.endTake());

            SelledDrug sale = new SelledDrug();
            int maxId = d.getMaxIDObject();
            sale.setSelledDrugID(maxId);
            sale.setPatient(patient);
            sale.setPharmatiest(pharmacist);
            sale.setQuantity(r.quantity());
            sale.setDrug(drug);
            sale.setSelledDate(new Date());
            sale.setUnitPerDay(r.unitPerDay());
            sale.setStartDate(start);
            sale.setEndDate(end);
            d.sellDrug(sale); // inserts with id = maxId + 1

            drug.setQuantity(drug.getQuantity() - r.quantity());
            d.updateObject(drug);
            return result(maxId + 1, drug.getQuantity(), "Sale recorded");
        });
    }

    /**
     * Updates an existing sale. Unlike the legacy code (which subtracted the full new quantity again and also dropped
     * the pharmacist), the previously sold quantity of the same drug is returned to stock first.
     */
    public SaleResult updateSale(Integer id, SaleRequest r) {
        return gw.run(d -> {
            SelledDrug sale = sale(id);
            Drug drug = gw.requireRef(Drug.class, r.drugId(), "Drug");
            Patient patient = gw.requireRef(Patient.class, r.patientId(), "Patient");
            int restored = sale.getDrug() != null && sale.getDrug().getDrugId().equals(drug.getDrugId())
                    ? sale.getQuantity()
                    : 0;
            int available = drug.getQuantity() + restored;
            if (r.quantity() >= available) {
                throw ApiException.unprocessable("Requested quantity " + r.quantity()
                        + " must be less than the available stock (" + available + ")");
            }
            if (sale.getDrug() != null && restored == 0) {
                Drug previous = sale.getDrug();
                previous.setQuantity(previous.getQuantity() + sale.getQuantity());
                d.updateObject(previous);
            }
            sale.setDrug(drug);
            sale.setPatient(patient);
            sale.setQuantity(r.quantity());
            sale.setUnitPerDay(r.unitPerDay());
            sale.setStartDate(Dates.parse("startTake", r.startTake()));
            sale.setEndDate(Dates.parse("endTake", r.endTake()));
            sale.setSelledDate(new Date());
            drug.setQuantity(available - r.quantity());
            d.updateObject(drug);
            d.updateObject(sale);
            return result(id, drug.getQuantity(), "Sale updated");
        });
    }

    /** Reverse a sale (legacy "ReverseSellDrug"): the row is removed; stock is not changed, as in the legacy code. */
    public void reverseSale(Integer id) {
        SelledDrug sale = sale(id);
        gw.deleteVerified(SelledDrug.class, id, "Sale", d -> {
            sale.setDrug(null);
            sale.setPatient(null);
            sale.setPharmatiest(null);
            d.deleteObject(sale);
        });
    }

    public List<SelledDrug> salesForPatient(Integer patientId) {
        List<SelledDrug> list = gw.run(d -> d.getAllSelledDrugForPatient(patientId));
        return list == null ? List.of() : list;
    }

    private SaleResult result(Integer id, int remaining, String message) {
        boolean low = remaining <= LOW_STOCK_THRESHOLD;
        return new SaleResult(id, remaining, low,
                low ? message + ". Warning: remaining stock is " + remaining + " (<= " + LOW_STOCK_THRESHOLD + ")"
                        : message);
    }
}
