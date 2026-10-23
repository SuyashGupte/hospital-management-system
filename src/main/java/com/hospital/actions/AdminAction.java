package com.hospital.actions;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.struts2.ServletActionContext;

import com.opensymphony.xwork2.ActionSupport;

public class AdminAction extends ActionSupport {


	private static final long serialVersionUID = 1L;

    private AdminListener adminListener = AdminListener.getInstance();

    public String addEmployee() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        adminListener.addEmployee(request, response);
        return NONE;
    }

    public String updateEmployee() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        adminListener.updateEmployee(request, response);
        return NONE;
    }

    public String deleteEmployee() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        adminListener.deleteEmployee(request, response);
        return NONE;
    }

    public String addRoom() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        adminListener.addRoom(request, response);
        return NONE;
    }

    public String updateRoom() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        adminListener.updateRoom(request, response);
        return NONE;
    }

    public String deleteRoom() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        adminListener.deleteRoom(request, response);
        return NONE;
    }

    public String addServiceTime() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        adminListener.addServiceTime(request, response);
        return NONE;
    }

    public String updateServiceTime() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        adminListener.updateServiceTime(request, response);
        return NONE;
    }

    public String deleteServiceTime() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        adminListener.deleteServiceTime(request, response);
        return NONE;
    }

    @Override
    public String execute() {
        return SUCCESS;
    }
}
