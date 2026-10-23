package com.hospital.actions;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.struts2.ServletActionContext;

import com.opensymphony.xwork2.ActionSupport;

public class ReportAction extends ActionSupport {

    private static final long serialVersionUID = 1L;

    private ReportListener reportListener = ReportListener.getInstance();

    public String downloadEmployeeReport() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        try {
            reportListener.downloadEmployeeReport(request, response);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return NONE;
    }

    @Override
    public String execute() {
        return downloadEmployeeReport();
    }
}
