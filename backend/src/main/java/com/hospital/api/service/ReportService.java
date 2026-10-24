package com.hospital.api.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.hospital.api.exception.ApiException;
import com.hospital.models.Employee;
import com.hospital.models.PatientDrugInvoice;
import com.hospital.models.SelledDrug;

import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRBeanArrayDataSource;

/** PDF reports. The templates (src/main/resources/reports) are the unchanged legacy .jrxml files. */
@Service
public class ReportService {

    private final HospitalGateway gw;
    private final PharmacyService pharmacy;

    private volatile JasperReport employeeTemplate;
    private volatile JasperReport invoiceTemplate;

    public ReportService(HospitalGateway gw, PharmacyService pharmacy) {
        this.gw = gw;
        this.pharmacy = pharmacy;
    }

    public byte[] employeeReport(String employeeType) {
        EmployeeService.requireType(employeeType);
        List<Employee> employees = gw.run(d -> d.getEmployees(employeeType));
        Object[] rows = employees == null ? new Object[0] : employees.toArray();
        return render(employeeTemplate(), rows);
    }

    /**
     * Builds the invoice of ALL sales of the patient who bought the given sale (total = sum(cost x quantity)) and, as in
     * the legacy application, removes those sales afterwards. The PDF is rendered first, so nothing is deleted if
     * rendering fails.
     */
    public byte[] drugInvoice(Integer saleId) {
        return gw.run(d -> {
            SelledDrug anchor = pharmacy.sale(saleId);
            if (anchor.getPatient() == null) {
                throw ApiException.conflict("Sale " + saleId + " has no patient");
            }
            List<SelledDrug> sales = pharmacy.salesForPatient(anchor.getPatient().getPatientId());
            PatientDrugInvoice[] rows = new PatientDrugInvoice[sales.size()];
            double sum = 0;
            for (int i = 0; i < sales.size(); i++) {
                SelledDrug s = sales.get(i);
                PatientDrugInvoice p = new PatientDrugInvoice();
                p.setAddress(s.getPatient().getAddress());
                p.setBloodGroupName(s.getPatient().getBloodGroup().getBloodGroupName());
                p.setEmail(s.getPatient().getEmail());
                p.setFamilyName(s.getPatient().getFamilyName());
                p.setFatherName(s.getPatient().getFatherName());
                p.setGender(s.getPatient().getGender());
                p.setJoiningDate(s.getPatient().getJoiningDate());
                p.setPhone(s.getPatient().getPhone());
                p.setDob(s.getPatient().getDob());
                p.setName(s.getPatient().getName());
                p.setPatientID(s.getPatient().getPatientId());
                p.setCost(s.getDrug().getCost());
                p.setDrugId(s.getDrug().getDrugId());
                p.setDrugName(s.getDrug().getName());
                p.setDrug_expired(s.getEndDate());
                p.setStartDate(s.getStartDate());
                p.setQuantity(s.getQuantity());
                p.setUnitPerDay(s.getUnitPerDay());
                sum += s.getDrug().getCost() * s.getQuantity();
                rows[i] = p;
            }
            for (PatientDrugInvoice p : rows) {
                p.setTotalCost(sum);
            }

            byte[] pdf = render(invoiceTemplate(), rows);

            for (SelledDrug s : sales) { // legacy behaviour: invoiced sales are removed
                s.setDrug(null);
                s.setPatient(null);
                s.setPharmatiest(null);
                d.deleteObject(s);
            }
            return pdf;
        });
    }

    private byte[] render(JasperReport template, Object[] rows) {
        try {
            Map<String, Object> params = new HashMap<>();
            return JasperExportManager
                    .exportReportToPdf(JasperFillManager.fillReport(template, params, new JRBeanArrayDataSource(rows)));
        } catch (JRException ex) {
            throw ApiException.internal("Report generation failed: " + ex.getMessage());
        }
    }

    private JasperReport employeeTemplate() {
        if (employeeTemplate == null) {
            employeeTemplate = compile("reports/employeeReport.jrxml");
        }
        return employeeTemplate;
    }

    private JasperReport invoiceTemplate() {
        if (invoiceTemplate == null) {
            invoiceTemplate = compile("reports/Invoice.jrxml");
        }
        return invoiceTemplate;
    }

    // Compiled once and cached (the legacy code recompiled the .jrxml on every request).
    private JasperReport compile(String classpathLocation) {
        try (InputStream in = new ClassPathResource(classpathLocation).getInputStream()) {
            return JasperCompileManager.compileReport(in);
        } catch (IOException | JRException ex) {
            throw ApiException.internal("Report template could not be compiled: " + ex.getMessage());
        }
    }
}
