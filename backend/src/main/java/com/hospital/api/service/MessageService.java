package com.hospital.api.service;

import java.util.Date;
import java.util.List;

import org.springframework.stereotype.Service;

import com.hospital.api.dto.Dtos.MessageRequest;
import com.hospital.api.dto.Dtos.UnreadCount;
import com.hospital.api.exception.ApiException;
import com.hospital.api.security.AuthUser;
import com.hospital.models.Employee;
import com.hospital.models.Message;
import com.hospital.models.Patient;

/** Internal messaging between employees, always about a patient. */
@Service
public class MessageService {

    /** Employee.type discriminator of receptionists. */
    private static final String RECEPTIONIST = "Receptionist";

    private final HospitalGateway gw;

    public MessageService(HospitalGateway gw) {
        this.gw = gw;
    }

    public List<Message> inbox(AuthUser user) {
        List<Message> list = gw.run(d -> d.getAllMessagesForEmployee(user.employeeId()));
        return list == null ? List.of() : list;
    }

    public List<Message> sent(AuthUser user) {
        List<Message> list = gw.run(d -> d.getAllMessagesSentByEmployee(user.employeeId()));
        return list == null ? List.of() : list;
    }

    public UnreadCount unread(AuthUser user) {
        List<Message> list = gw.run(d -> d.getAllUnreadMessagesForEmployee(user.employeeId()));
        return new UnreadCount(list == null ? 0 : list.size());
    }

    /**
     * Sends to one employee, or - when allReceptionists is true - one message per receptionist. (The legacy fan-out
     * queried the type "Receptioniest", which matches no row; the real discriminator "Receptionist" is used.)
     */
    public int compose(AuthUser user, MessageRequest r) {
        boolean single = r.recipientId() != null;
        if (single == r.allReceptionists()) {
            throw ApiException.badRequest("Provide exactly one of recipientId or allReceptionists=true");
        }
        return gw.run(d -> {
            Employee from = gw.requireRef(Employee.class, user.employeeId(), "Sender");
            Patient patient = gw.requireRef(Patient.class, r.patientId(), "Patient");
            List<Employee> recipients;
            if (single) {
                recipients = List.of(gw.requireRef(Employee.class, r.recipientId(), "Recipient"));
            } else {
                recipients = d.getEmployees(RECEPTIONIST);
                if (recipients == null || recipients.isEmpty()) {
                    throw ApiException.unprocessable("There are no receptionists to send the message to");
                }
            }
            for (Employee to : recipients) {
                Message m = new Message(); // a new instance per recipient (the legacy code re-saved one object)
                m.setSubject(r.subject());
                m.setMessageBody(r.body());
                m.setMessageDate(new Date());
                m.setMessageStatus(false);
                m.setFromEmployee(from);
                m.setToEmployee(to);
                m.setPatient(patient);
                d.composeMessage(m);
            }
            return recipients.size();
        });
    }

    /** Reading a message marks it as read (only for its recipient). Sender and recipient may open it. */
    public Message read(AuthUser user, Integer id) {
        Message m = gw.require(Message.class, id, "Message");
        boolean recipient = m.getToEmployee() != null && user.employeeId().equals(m.getToEmployee().getEmployeeId());
        boolean sender = m.getFromEmployee() != null && user.employeeId().equals(m.getFromEmployee().getEmployeeId());
        if (!recipient && !sender) {
            throw ApiException.forbidden("You can only read your own messages");
        }
        if (recipient && !m.isMessageStatus()) {
            m.setMessageStatus(true);
            gw.exec(d -> d.updateObject(m));
        }
        return m;
    }
}
