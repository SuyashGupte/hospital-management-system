package com.hospital.actions;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.struts2.ServletActionContext;

import com.opensymphony.xwork2.ActionSupport;

public class DoctorAction extends ActionSupport {

    private static final long serialVersionUID = 1L;

    private DoctorListener doctorListener = DoctorListener.getInstance();

    public String addDiesease() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        doctorListener.addDiesease(request, response);
        return NONE;
    }

    public String deleteDiesease() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        doctorListener.deleteDiesease(request, response);
        return NONE;
    }

    public String updateDiesease() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        doctorListener.updateDiesease(request, response);
        return NONE;
    }

    @Override
    public String execute() {
        return SUCCESS;
    }
}
