package com.hospital.actions;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.struts2.ServletActionContext;

import com.opensymphony.xwork2.ActionSupport;

public class UserAction extends ActionSupport {

    private static final long serialVersionUID = 1L;

    private UserListener userListener = UserListener.getInstance();

    public String changePassword() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        boolean flag = userListener.changePassword(request, response);
        try {
            if (flag) {
                response.sendRedirect("changePassword.jsp");
            } else {
                response.sendRedirect("changePassword.jsp?Error=true");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return NONE;
    }

    public String composeEmail() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        userListener.composeEmail(request, response);
        return NONE;
    }

    public String viewMessage() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();
        userListener.viewMessage(request, response);
        return NONE;
    }

    @Override
    public String execute() {
        return SUCCESS;
    }
}
