package com.hospital.actions;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.struts2.ServletActionContext;

import com.opensymphony.xwork2.ActionSupport;

public class AccountancyAction extends ActionSupport {

    private static final long serialVersionUID = 1L;

    private AccountancyListener accountancyListener = AccountancyListener.getInstance();

    public String checkedPatientFees() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        accountancyListener.checkedPatientFees(request, response);
        return NONE;
    }

    @Override
    public String execute() {
        return checkedPatientFees();
    }
}
