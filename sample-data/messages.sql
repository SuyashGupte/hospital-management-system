-- Demo messages for the staff inbox / sent-mail screens.
-- Run as the application user after SampleData has loaded the staff and patients:
--   sqlplus hadeel/hadeel@//localhost/FREEPDB1 @sample-data/messages.sql
-- Ids are looked up by username / patient name, so this works whatever the generated ids are.
-- Safe to re-run: a message is only inserted if one with the same subject does not exist.

set feedback on

insert into Messages (messageId, messageBody, subject, messageStatus, messageDate, from_employee_id, fto_employee_id, patient_id)
select hibernate_sequence.nextval,
       'Ms. Nair is in room 102 with fever. Family is waiting for an update.',
       'New admission: Diya Nair', 1, sysdate - 4,
       (select employeeId from Employee where username = 'reception'),
       (select employeeId from Employee where username = 'dr.rahul'),
       (select min(patientId) from Patients where name = 'Diya')
from dual
where not exists (select 1 from Messages where subject = 'New admission: Diya Nair');

insert into Messages (messageId, messageBody, subject, messageStatus, messageDate, from_employee_id, fto_employee_id, patient_id)
select hibernate_sequence.nextval,
       'Please dispense cetirizine for Mrs. Reddy as per the notes.',
       'Medication for Lakshmi Reddy', 0, sysdate - 2,
       (select employeeId from Employee where username = 'dr.priya'),
       (select employeeId from Employee where username = 'pharmacist'),
       (select min(patientId) from Patients where name = 'Lakshmi')
from dual
where not exists (select 1 from Messages where subject = 'Medication for Lakshmi Reddy');

insert into Messages (messageId, messageBody, subject, messageStatus, messageDate, from_employee_id, fto_employee_id, patient_id)
select hibernate_sequence.nextval,
       'The night shift roster for next week has been updated. Please check your service times.',
       'Duty roster updated', 0, sysdate - 1,
       (select employeeId from Employee where username = 'admin'),
       (select employeeId from Employee where username = 'dr.priya'),
       (select min(patientId) from Patients where name = 'Aarav')
from dual
where not exists (select 1 from Messages where subject = 'Duty roster updated');

commit;
exit
