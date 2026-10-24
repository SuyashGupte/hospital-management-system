package com.hospital.api.service;

import java.io.IOException;
import java.util.Base64;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.hospital.api.common.Dates;
import com.hospital.api.common.Hashing;
import com.hospital.api.dto.Dtos.EmployeeRequest;
import com.hospital.api.exception.ApiException;
import com.hospital.models.Accountant;
import com.hospital.models.Category;
import com.hospital.models.Doctor;
import com.hospital.models.Employee;
import com.hospital.models.EmployeeStatatistic;
import com.hospital.models.Lab;
import com.hospital.models.Nurse;
import com.hospital.models.Pharmatiest;
import com.hospital.models.Qualification;
import com.hospital.models.Receptioniest;
import com.hospital.models.WorkExperince;
import com.hospital.models.Xray;

@Service
public class EmployeeService {

    /** Discriminator values stored in Employee.type. */
    public static final List<String> TYPES = List.of("Admin", "Doctor", "Nurse", "Lab", "Xray", "pharmacist",
            "Receptionist", "Accountant");

    private final HospitalGateway gw;

    public EmployeeService(HospitalGateway gw) {
        this.gw = gw;
    }

    public List<Employee> list(String type) {
        if (type == null || type.isBlank()) {
            return gw.list(Employee.class);
        }
        requireType(type);
        List<Employee> list = gw.run(d -> d.getEmployees(type));
        return list == null ? List.of() : list;
    }

    public Employee get(Integer id) {
        return gw.require(Employee.class, id, "Employee");
    }

    public Employee create(EmployeeRequest r) {
        if (r.type() == null || r.type().isBlank()) {
            throw ApiException.badRequest("type is required, one of " + TYPES);
        }
        if (r.password() == null || r.password().isBlank()) {
            throw ApiException.badRequest("password is required when creating an employee");
        }
        Employee employee = instantiate(r.type());
        checkUnique(r, null);
        apply(employee, r);
        employee.setPassword(Hashing.md5Base64(r.password()));
        employee.setJoinDate(new Date());
        employee.setQualifications(qualifications(r));
        employee.setWorkExperinces(experiences(r));
        int id = gw.run(d -> d.saveObject(employee));
        if (id == 0) {
            throw ApiException.conflict("Employee could not be saved (invalid data or duplicate e-mail)");
        }
        return gw.require(Employee.class, id, "Employee");
    }

    public Employee update(Integer id, EmployeeRequest r) {
        Employee employee = get(id);
        checkUnique(r, id);
        apply(employee, r);
        // Legacy always re-hashed the submitted value (even when empty); a blank password now keeps the stored one.
        if (r.password() != null && !r.password().isBlank()) {
            employee.setPassword(Hashing.md5Base64(r.password()));
        }
        if (r.qualifications() != null) {
            employee.setQualifications(qualifications(r));
        }
        if (r.workExperiences() != null) {
            employee.setWorkExperinces(experiences(r));
        }
        gw.exec(d -> d.updateObject(employee));
        return get(id);
    }

    public void delete(Integer id) {
        Employee employee = get(id);
        gw.deleteVerified(Employee.class, id, "Employee", d -> {
            employee.setCategory(null);
            d.deleteAllMessageForEmployee(id); // messages first, as the legacy listener does
            d.deleteObject(employee);
        });
    }

    public Employee setPhoto(Integer id, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("A non-empty image file is required");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw ApiException.badRequest("The photo must be an image");
        }
        Employee employee = get(id);
        try {
            employee.setPhoto("data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(file.getBytes()));
        } catch (IOException ex) {
            throw ApiException.internal("Could not read the uploaded file");
        }
        gw.exec(d -> d.updateObject(employee));
        return get(id);
    }

    public List<EmployeeStatatistic> statistics() {
        List<EmployeeStatatistic> stats = gw.run(d -> d.getEmployeeStatistic());
        return stats == null ? List.of() : stats;
    }

    public static void requireType(String type) {
        if (!TYPES.contains(type)) {
            throw ApiException.badRequest("Unknown employee type '" + type + "', expected one of " + TYPES);
        }
    }

    private Employee instantiate(String type) {
        switch (type) {
        case "Doctor":
            return new Doctor();
        case "Nurse":
            return new Nurse();
        case "Lab":
            return new Lab();
        case "Xray":
            return new Xray();
        case "pharmacist":
            return new Pharmatiest();
        case "Receptionist":
            return new Receptioniest();
        case "Accountant":
            return new Accountant();
        case "Admin":
            return new Employee();
        default:
            throw ApiException.badRequest("Unknown employee type '" + type + "', expected one of " + TYPES);
        }
    }

    private void apply(Employee e, EmployeeRequest r) {
        e.setFirstName(r.firstName());
        e.setFatherName(r.fatherName());
        e.setFamilyName(r.familyName());
        e.setUsername(r.userName());
        e.setAddress(r.address());
        e.setEmail(r.email());
        e.setDob(Dates.parse("dob", r.dob()));
        e.setPhone(r.phone());
        e.setGender(r.gender());
        e.setCategory(gw.requireRef(Category.class, r.categoryId(), "Category"));
    }

    /** Employee.email is unique in the DB; a duplicate username would make login ambiguous. */
    private void checkUnique(EmployeeRequest r, Integer selfId) {
        for (Employee other : gw.list(Employee.class)) {
            if (selfId != null && selfId.equals(other.getEmployeeId())) {
                continue;
            }
            if (r.email().equalsIgnoreCase(other.getEmail())) {
                throw ApiException.conflict("E-mail " + r.email() + " is already used by another employee");
            }
            if (r.userName().equals(other.getUsername())) {
                throw ApiException.conflict("Username " + r.userName() + " is already used by another employee");
            }
        }
    }

    private Set<Qualification> qualifications(EmployeeRequest r) {
        Set<Qualification> set = new HashSet<>();
        if (r.qualifications() != null) {
            r.qualifications().forEach(q -> {
                Qualification x = new Qualification();
                x.setInstituteName(q.instituteName());
                x.setQualificationName(q.qualificationName());
                x.setDegree(q.degree());
                x.setQualificationDate(q.educationDate());
                set.add(x);
            });
        }
        return set;
    }

    private Set<WorkExperince> experiences(EmployeeRequest r) {
        Set<WorkExperince> set = new HashSet<>();
        if (r.workExperiences() != null) {
            r.workExperiences().forEach(w -> {
                WorkExperince x = new WorkExperince();
                x.setNameOfOrganization(w.nameOfOrganization());
                x.setPosition(w.position());
                x.setStartDate(w.startDate());
                x.setEndDate(w.endDate());
                set.add(x);
            });
        }
        return set;
    }
}
