package com.hospital.api.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.hospital.api.common.Hashing;
import com.hospital.api.dto.Dtos.ChangePasswordRequest;
import com.hospital.api.dto.Dtos.LoginRequest;
import com.hospital.api.dto.Dtos.LoginResponse;
import com.hospital.api.exception.ApiException;
import com.hospital.api.security.AuthUser;
import com.hospital.api.security.JwtService;
import com.hospital.models.Employee;

@Service
public class AuthService {

    private final HospitalGateway gw;
    private final JwtService jwt;

    public AuthService(HospitalGateway gw, JwtService jwt) {
        this.gw = gw;
        this.jwt = jwt;
    }

    /** Login by e-mail OR username + password (MD5/Base64 hash, as stored by the legacy application). */
    public LoginResponse login(LoginRequest req) {
        Employee employee = gw.run(d -> d.getEmployee(req.user().trim(), Hashing.md5Base64(req.pass())));
        if (employee == null) {
            throw ApiException.unauthorized("Invalid username/e-mail or password");
        }
        return new LoginResponse(jwt.generate(employee), "Bearer", jwt.getExpirationSeconds(), employee);
    }

    /** Loads the authenticated employee; 401 when the account no longer exists. */
    public Employee current(AuthUser user) {
        Employee employee = gw.get(Employee.class, user.employeeId());
        if (employee == null) {
            throw ApiException.unauthorized("The account of this token no longer exists");
        }
        return employee;
    }

    public void changePassword(AuthUser user, ChangePasswordRequest req) {
        Employee employee = current(user);
        if (!employee.getPassword().equals(Hashing.md5Base64(req.currentPassword()))) {
            throw ApiException.badRequest("Current password is incorrect");
        }
        employee.setPassword(Hashing.md5Base64(req.newPassword()));
        gw.exec(d -> d.updateObject(employee));
    }

    /** All other employees (message recipients). */
    public List<Employee> others(AuthUser user) {
        List<Employee> list = gw.run(d -> d.getListEmployeeWithout(user.employeeId()));
        return list == null ? List.of() : list;
    }
}
