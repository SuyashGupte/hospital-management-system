package com.hospital.api.service;

import java.util.Date;
import java.util.List;

import org.springframework.stereotype.Service;

import com.hospital.api.dto.Dtos.DiseaseRequest;
import com.hospital.api.exception.ApiException;
import com.hospital.api.security.AuthUser;
import com.hospital.models.Disease;
import com.hospital.models.Employee;
import com.hospital.models.Patient;

/** Doctor diagnoses. */
@Service
public class DiseaseService {

    private final HospitalGateway gw;

    public DiseaseService(HospitalGateway gw) {
        this.gw = gw;
    }

    public List<Disease> all() {
        return gw.list(Disease.class);
    }

    public List<Disease> byDoctor(Integer employeeId) {
        List<Disease> list = gw.run(d -> d.getAllDiseaseByEmployeeID(employeeId));
        return list == null ? List.of() : list;
    }

    public Disease get(Integer id) {
        return gw.require(Disease.class, id, "Diagnosis");
    }

    public Disease create(AuthUser user, DiseaseRequest r) {
        Disease disease = new Disease();
        fill(disease, user, r);
        int id = gw.run(d -> d.saveObject(disease));
        if (id == 0) {
            throw ApiException.conflict("Diagnosis could not be saved");
        }
        return get(id);
    }

    public Disease update(AuthUser user, Integer id, DiseaseRequest r) {
        Disease disease = owned(user, id);
        fill(disease, user, r);
        gw.exec(d -> d.updateObject(disease));
        return get(id);
    }

    public void delete(AuthUser user, Integer id) {
        Disease disease = owned(user, id);
        gw.deleteVerified(Disease.class, id, "Diagnosis", d -> {
            disease.setEmployee(null);
            disease.setPatient(null);
            d.deleteObject(disease);
        });
    }

    /** Legacy lists only the doctor's own diagnoses; editing someone else's is now rejected explicitly. */
    private Disease owned(AuthUser user, Integer id) {
        Disease disease = get(id);
        if (disease.getEmployee() == null || !user.employeeId().equals(disease.getEmployee().getEmployeeId())) {
            throw ApiException.forbidden("Only the doctor who recorded a diagnosis can change it");
        }
        return disease;
    }

    private void fill(Disease disease, AuthUser user, DiseaseRequest r) {
        disease.setDisease(r.disease());
        disease.setNote(r.note());
        disease.setDiseaseDate(new Date()); // set server side, as in the legacy listener
        disease.setEmployee(gw.requireRef(Employee.class, user.employeeId(), "Employee"));
        disease.setPatient(gw.requireRef(Patient.class, r.patientId(), "Patient"));
    }
}
