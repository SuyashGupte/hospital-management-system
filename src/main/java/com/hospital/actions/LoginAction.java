package com.hospital.actions;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.apache.struts2.ServletActionContext;

import com.hospital.entities.HospitalService;
import com.hospital.models.Employee;
import com.hospital.utils.PasswordEncryption;
import com.opensymphony.xwork2.ActionSupport;

public class LoginAction extends ActionSupport {


	private static final long serialVersionUID = 1L;

    private String user;
    private String pass;
    private HospitalService hospitalService = HospitalService.getInstance();

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public String getPass() {
        return pass;
    }

    public void setPass(String pass) {
        this.pass = pass;
    }

    public String login() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpSession session = request.getSession();

        if (user == null || user.trim().isEmpty()) {
            user = request.getParameter("user");
        }
        if (pass == null || pass.trim().isEmpty()) {
            pass = request.getParameter("pass");
        }

        try {
            Employee employee = (Employee) session.getAttribute("employee");
            if (employee == null && user != null && pass != null) {
                employee = hospitalService.getEmployee(user, PasswordEncryption.encrypt(pass));
                if (employee != null) {
                    session.setAttribute("employee", employee);
                    return SUCCESS;
                } else {
                    return ERROR;
                }
            } else if (employee != null) {
                return SUCCESS;
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ERROR;
        }
        return ERROR;
    }

    public String logout() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.removeAttribute("employee");
            session.invalidate();
        }
        return SUCCESS;
    }

    @Override
    public String execute() {
        return login();
    }
}
