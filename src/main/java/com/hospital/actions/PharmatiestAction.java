package com.hospital.actions;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.struts2.ServletActionContext;

import com.opensymphony.xwork2.ActionSupport;

public class PharmatiestAction extends ActionSupport {


	private static final long serialVersionUID = 1L;

    private PharmatiestListener pharmatiestListener = PharmatiestListener.getInstance();

    public String addDrug() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        pharmatiestListener.addDrug(request, response);
        return NONE;
    }

    public String updateDrug() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        pharmatiestListener.updateDrug(request, response);
        return NONE;
    }

    public String deleteDrug() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        pharmatiestListener.deleteDrug(request, response);
        return NONE;
    }

    public String sellDrug() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        pharmatiestListener.sellDrug(request, response);
        return NONE;
    }

    public String updateSellDrug() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        pharmatiestListener.updateSellDrug(request, response);
        return NONE;
    }

    public String deleteSellDrug() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        pharmatiestListener.deleteSellDrug(request, response);
        return NONE;
    }

    public String invoiceDrug() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        try {
            pharmatiestListener.getDrugInvoice(request, response);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return NONE;
    }

    @Override
    public String execute() {
        return SUCCESS;
    }
}
