package com.hospital.actions;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.struts2.ServletActionContext;

import com.opensymphony.xwork2.ActionSupport;

public class ReceptioniestAction extends ActionSupport {


	private static final long serialVersionUID = 1L;

    private ReceptioniestListener receptioniestListener = ReceptioniestListener.getInstance();

    public String addPatient() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        receptioniestListener.addpatient(request, response);
        return NONE;
    }

    public String deletePatient() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        receptioniestListener.deletePatient(request, response);
        return NONE;
    }

    public String updatePatient() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        receptioniestListener.updatePatient(request, response);
        return NONE;
    }

    public String bookBed() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        receptioniestListener.bookBed(request, response);
        return NONE;
    }

    public String deleteBookBed() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        receptioniestListener.deleteBookedBed(request, response);
        return NONE;
    }

    public String updateBookBed() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        receptioniestListener.updateBookedBed(request, response);
        return NONE;
    }

    @Override
    public String execute() {
        return SUCCESS;
    }
}
