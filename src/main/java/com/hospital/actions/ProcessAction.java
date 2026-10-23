package com.hospital.actions;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.struts2.ServletActionContext;

import com.hospital.utils.ActionType;
import com.opensymphony.xwork2.ActionSupport;

public class ProcessAction extends ActionSupport {

    private static final long serialVersionUID = 1L;

    private AdminListener adminListener = AdminListener.getInstance();
    private UserListener userListener = UserListener.getInstance();
    private ReceptioniestListener receptioniestListener = ReceptioniestListener.getInstance();
    private DoctorListener doctorListener = DoctorListener.getInstance();
    private PharmatiestListener pharmatiestListener = PharmatiestListener.getInstance();
    private AccountancyListener accountancyListener = AccountancyListener.getInstance();
    private ReportListener reportListener = ReportListener.getInstance();

    private String action;

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    @Override
    public String execute() {
        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();

        String actionName = action != null ? action : request.getParameter("action");
        if (actionName == null) {
            return SUCCESS;
        }

        try {
            if (actionName.equals(ActionType.AddEmployee.name())) {
                adminListener.addEmployee(request, response);
            } else if (actionName.equals(ActionType.UpdateEmployee.name())) {
                adminListener.updateEmployee(request, response);
            } else if (actionName.equals(ActionType.deleteEmployee.name())) {
                adminListener.deleteEmployee(request, response);
            } else if (actionName.equals(ActionType.AddRoom.name())) {
                adminListener.addRoom(request, response);
            } else if (actionName.equals(ActionType.DeleteRoom.name())) {
                adminListener.deleteRoom(request, response);
            } else if (actionName.equals(ActionType.UpdateRoom.name())) {
                adminListener.updateRoom(request, response);
            } else if (actionName.equals(ActionType.AddServiceTime.name())) {
                adminListener.addServiceTime(request, response);
            } else if (actionName.equals(ActionType.UpdateServiceTime.name())) {
                adminListener.updateServiceTime(request, response);
            } else if (actionName.equals(ActionType.DeleteServiceTime.name())) {
                adminListener.deleteServiceTime(request, response);
            } else if (actionName.equals(ActionType.AddPatient.name())) {
                receptioniestListener.addpatient(request, response);
            } else if (actionName.equals(ActionType.DeletePatient.name())) {
                receptioniestListener.deletePatient(request, response);
            } else if (actionName.equals(ActionType.UpdatePatient.name())) {
                receptioniestListener.updatePatient(request, response);
            } else if (actionName.equals(ActionType.BookBed.name())) {
                receptioniestListener.bookBed(request, response);
            } else if (actionName.equals(ActionType.DeleteBookBed.name())) {
                receptioniestListener.deleteBookedBed(request, response);
            } else if (actionName.equals(ActionType.UpdateBookBed.name())) {
                receptioniestListener.updateBookedBed(request, response);
            } else if (actionName.equals(ActionType.AddDiesease.name())) {
                doctorListener.addDiesease(request, response);
            } else if (actionName.equals(ActionType.DeleteDiesease.name())) {
                doctorListener.deleteDiesease(request, response);
            } else if (actionName.equals(ActionType.UpdateDiesease.name())) {
                doctorListener.updateDiesease(request, response);
            } else if (actionName.equals(ActionType.AddDrug.name())) {
                pharmatiestListener.addDrug(request, response);
            } else if (actionName.equals(ActionType.DeleteDrug.name())) {
                pharmatiestListener.deleteDrug(request, response);
            } else if (actionName.equals(ActionType.UpdateDrug.name())) {
                pharmatiestListener.updateDrug(request, response);
            } else if (actionName.equals(ActionType.SellDrug.name())) {
                pharmatiestListener.sellDrug(request, response);
            } else if (actionName.equals(ActionType.ReverseSellDrug.name())) {
                pharmatiestListener.deleteSellDrug(request, response);
            } else if (actionName.equals(ActionType.UpdateSellDrug.name())) {
                pharmatiestListener.updateSellDrug(request, response);
            } else if (actionName.equals(ActionType.InvoiceDrug.name())) {
                pharmatiestListener.getDrugInvoice(request, response);
            } else if (actionName.equals(ActionType.CheckedPatientFees.name())) {
                accountancyListener.checkedPatientFees(request, response);
            } else if (actionName.equals(ActionType.DownloadEmployeeReport.name())) {
                reportListener.downloadEmployeeReport(request, response);
            } else if (actionName.equals(ActionType.ChangePassword.name())) {
                boolean flag = userListener.changePassword(request, response);
                if (flag) {
                    response.sendRedirect("changePassword.jsp");
                } else {
                    response.sendRedirect("changePassword.jsp?Error=true");
                }
            } else if (actionName.equals(ActionType.ComposeEmail.name())) {
                userListener.composeEmail(request, response);
            } else if (actionName.equals(ActionType.ViewMessage.name())) {
                userListener.viewMessage(request, response);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ERROR;
        }

        return NONE;
    }
}
