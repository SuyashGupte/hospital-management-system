/*
 * Loads demo data (lookup tables, admin user, staff, rooms, patients,
 * bookings, diagnoses, drugs, nurse shifts, and inbox messages) into a
 * freshly-created Oracle schema through the application's own service layer.
 *
 * Prerequisites:
 *   - Oracle is running and hibernate.cfg.xml points at it.
 *   - hbm2ddl.auto=update has already run (start the app once, or just run
 *     this class — Hibernate creates the schema on first SessionFactory init).
 *
 * Idempotent: exits immediately if a Doctor record already exists.
 *
 * Run from the backend/ directory after `mvn compile`:
 *
 *   mvn dependency:copy-dependencies -DoutputDirectory=target/dependency -q
 *   java -cp "target/classes:target/dependency/*" \
 *        com.hospital.queries.SeedData
 *
 * Every demo employee has the password 123456.
 * Admin login: admin / 123456
 */
package com.hospital.queries;

import java.util.Calendar;
import java.util.Date;
import java.util.List;

import com.hospital.DbConfig.HibernateUtil;
import com.hospital.entities.HospitalService;
import com.hospital.models.Accountant;
import com.hospital.models.BloodGroup;
import com.hospital.models.BookBed;
import com.hospital.models.Category;
import com.hospital.models.Disease;
import com.hospital.models.Doctor;
import com.hospital.models.Drug;
import com.hospital.models.Employee;
import com.hospital.models.Lab;
import com.hospital.models.Message;
import com.hospital.models.NextOfKin;
import com.hospital.models.Nurse;
import com.hospital.models.NurseServiceTime;
import com.hospital.models.Patient;
import com.hospital.models.Pharmatiest;
import com.hospital.models.Qualification;
import com.hospital.models.Receptioniest;
import com.hospital.models.Room;
import com.hospital.models.RoomType;
import com.hospital.models.SelledDrug;
import com.hospital.models.ShiftTime;
import com.hospital.models.WorkExperince;
import com.hospital.models.Xray;
import com.hospital.utils.PasswordEncryption;

public class SeedData {

    static final HospitalService hs = HospitalService.getInstance();

    // ------------------------------------------------------------------ dates

    static Date daysAgo(int d) {
        Calendar c = Calendar.getInstance();
        c.add(Calendar.DAY_OF_YEAR, -d);
        return c.getTime();
    }

    static Date daysAhead(int d) { return daysAgo(-d); }

    static Date date(int y, int m, int d) {
        Calendar c = Calendar.getInstance();
        c.clear();
        c.set(y, m - 1, d);
        return c.getTime();
    }

    // -------------------------------------------------------- bootstrap seeds

    static void seedCategories() {
        for (String name : new String[]{"General", "Foot", "Leg", "Eye", "BOO", "Brain"}) {
            Category c = new Category();
            c.setCategoryName(name);
            hs.saveObject(c);
        }
        System.out.println("  6 categories");
    }

    static void seedBloodGroups() {
        for (String name : new String[]{"A+", "B+", "O+", "A"}) {
            BloodGroup b = new BloodGroup();
            b.setBloodGroupName(name);
            hs.saveObject(b);
        }
        System.out.println("  4 blood groups");
    }

    static void seedRoomTypes() {
        int[][] types = {{2, 550}, {3, 5150}, {4, 55550}, {5, 588850}};
        for (int[] t : types) {
            RoomType rt = new RoomType();
            rt.setTypeOfroom(t[0] + " bed");
            rt.setRoomCost(t[1]);
            hs.saveObject(rt);
        }
        System.out.println("  4 room types");
    }

    static void seedShiftTimes() {
        String[][] shifts = {{"6 AM", "2 PM"}, {"2 PM", "10 PM"}, {"10 PM", "6 AM"}};
        for (String[] s : shifts) {
            ShiftTime st = new ShiftTime();
            st.setFromTime(s[0]);
            st.setToTime(s[1]);
            hs.saveObject(st);
        }
        System.out.println("  3 shift times");
    }

    static void seedAdmin() throws Exception {
        Employee e = new Employee();
        e.setFirstName("salah");
        e.setPassword(PasswordEncryption.encrypt("123456"));
        e.setUsername("admin");
        e.setEmail("salah323@outlook.com");
        e.setCategory((Category) hs.getObject(1, Category.class));
        hs.saveObject(e);
        System.out.println("  admin user");
    }

    // --------------------------------------------------------- helper methods

    static <T extends Employee> T emp(T e,
            String first, String father, String family,
            String username, String email, String gender,
            Date dob, String phone, String address, int categoryId,
            String degree, String institute, String org, String position) throws Exception {
        e.setFirstName(first);
        e.setFatherName(father);
        e.setFamilyName(family);
        e.setUsername(username);
        e.setEmail(email);
        e.setPassword(PasswordEncryption.encrypt("123456"));
        e.setGender(gender);
        e.setDob(dob);
        e.setPhone(phone);
        e.setAddress(address);
        e.setJoinDate(daysAgo(200));
        e.setCategory((Category) hs.getObject(categoryId, Category.class));

        Qualification q = new Qualification();
        q.setDegree(degree);
        q.setInstituteName(institute);
        q.setQualificationName(degree);
        q.setQualificationDate("2012");
        e.getQualifications().add(q);

        WorkExperince w = new WorkExperince();
        w.setNameOfOrganization(org);
        w.setPosition(position);
        w.setStartDate("2013");
        w.setEndDate("2019");
        e.getWorkExperinces().add(w);

        int id = hs.saveObject(e);
        if (id == 0) throw new RuntimeException("Could not save employee " + username);
        System.out.println("  employee " + id + " " + username + " (" + e.getClass().getSimpleName() + ")");
        return e;
    }

    static Patient patient(String first, String father, String family,
            String gender, Date dob, long phone, String address, String email,
            int bloodGroupId, String kin, String rel, String kinPhone) {
        NextOfKin k = new NextOfKin();
        k.setFullName(kin);
        k.setRelationship(rel);
        k.setPhone(kinPhone);
        k.setAddress(address);

        Patient p = new Patient();
        p.setName(first);
        p.setFatherName(father);
        p.setFamilyName(family);
        p.setGender(gender);
        p.setDob(dob);
        p.setPhone(phone);
        p.setAddress(address);
        p.setEmail(email);
        p.setJoiningDate(new Date());
        p.setBloodGroup((BloodGroup) hs.getObject(bloodGroupId, BloodGroup.class));
        p.setNextOfKin(k);

        int id = hs.saveObject(p);
        if (id == 0) throw new RuntimeException("Could not save patient " + first);
        System.out.println("  patient " + id + " " + first + " " + family);
        return p;
    }

    static Room room(int roomTypeId, int number, int beds) {
        Room r = new Room();
        r.setRoomNumber(number);
        r.setNumberOfBeds(beds);
        r.setNumberOfAvailableBeds(beds);
        r.setRoomType((RoomType) hs.getObject(roomTypeId, RoomType.class));
        int id = hs.saveObject(r);
        if (id == 0) throw new RuntimeException("Could not save room " + number);
        System.out.println("  room " + id + " no." + number);
        return r;
    }

    static void book(Patient p, Room r, String dept, int placedDaysAgo, boolean paid) {
        Room room = (Room) hs.getObject(r.getRoomId(), Room.class);
        room.setNumberOfAvailableBeds(room.getNumberOfAvailableBeds() - 1);
        BookBed b = new BookBed();
        b.setPatient(p);
        b.setRoom(room);
        b.setDepartement(dept);
        b.setDatePlaced(daysAgo(placedDaysAgo));
        b.setStatus(false);
        int id = hs.saveObject(b);
        if (id == 0) throw new RuntimeException("Could not book bed for " + p.getName());
        if (paid) {
            BookBed saved = (BookBed) hs.getObject(id, BookBed.class);
            Room rm = saved.getRoom();
            rm.setNumberOfAvailableBeds(rm.getNumberOfAvailableBeds() + 1);
            hs.updateObject(rm);
            saved.setStatus(true);
            hs.updateObject(saved);
        }
        System.out.println("  booking " + id + " " + p.getName()
                + " -> room " + room.getRoomNumber() + (paid ? " (paid)" : ""));
    }

    static void disease(Doctor d, Patient p, String name, String note, int diagnosedDaysAgo) {
        Disease x = new Disease();
        x.setDisease(name);
        x.setNote(note);
        x.setEmployee(d);
        x.setPatient(p);
        x.setDiseaseDate(daysAgo(diagnosedDaysAgo));
        if (hs.saveObject(x) == 0) throw new RuntimeException("Could not save disease " + name);
        System.out.println("  diagnosis " + name + " -> " + p.getName());
    }

    static Drug drug(Pharmatiest ph, String name, double cost, int qty, Date expiry) {
        Drug d = new Drug();
        d.setName(name);
        d.setCost(cost);
        d.setQuantity(qty);
        d.setDrug_expired(expiry);
        d.setStartDate(daysAgo(30));
        d.setEmployee(ph);
        if (hs.saveObject(d) == 0) throw new RuntimeException("Could not save drug " + name);
        System.out.println("  drug " + d.getDrugId() + " " + name + " x" + qty);
        return d;
    }

    static void sell(Pharmatiest ph, Patient p, Drug d, int qty, String perDay, int days) {
        SelledDrug s = new SelledDrug();
        s.setSelledDrugID(hs.getMaxIDObject());
        s.setDrug(d);
        s.setPatient(p);
        s.setPharmatiest(ph);
        s.setQuantity(qty);
        s.setUnitPerDay(perDay);
        s.setSelledDate(new Date());
        s.setStartDate(new Date());
        s.setEndDate(daysAhead(days));
        hs.sellDrug(s);
        d.setQuantity(d.getQuantity() - qty);
        hs.updateObject(d);
        System.out.println("  sold " + qty + " x " + d.getName() + " -> " + p.getName());
    }

    static void service(Nurse n, int shiftId, int dayOffset, String dept) {
        NurseServiceTime t = new NurseServiceTime();
        t.setNurse(n);
        t.setShiftTime((ShiftTime) hs.getObject(shiftId, ShiftTime.class));
        t.setServiceDate(daysAhead(dayOffset));
        t.setDepartment(dept);
        if (hs.saveObject(t) == 0) throw new RuntimeException("Could not save service time");
    }

    /**
     * Save a message in a single raw session so that all referenced entities
     * (Employee, Patient) are loaded fresh — avoiding the
     * NonUniqueObjectException that occurs when detached objects from different
     * sessions are cascaded through HospitalService.saveObject.
     */
    @SuppressWarnings("unchecked")
    static void message(String fromUsername, String toUsername, int patientId,
            String subject, String body, int daysAgo, boolean read) {
        org.hibernate.Session s = HibernateUtil.getSessionFactory().openSession();
        org.hibernate.Transaction tx = s.beginTransaction();
        try {
            List<Employee> froms = s.createQuery("from Employee where username = :u")
                    .setParameter("u", fromUsername).list();
            List<Employee> tos = s.createQuery("from Employee where username = :u")
                    .setParameter("u", toUsername).list();
            if (froms.isEmpty()) throw new RuntimeException("Employee not found: " + fromUsername);
            if (tos.isEmpty())   throw new RuntimeException("Employee not found: " + toUsername);
            Patient p = (Patient) s.get(Patient.class, patientId);

            Message m = new Message();
            m.setFromEmployee(froms.get(0));
            m.setToEmployee(tos.get(0));
            m.setPatient(p);
            m.setSubject(subject);
            m.setMessageBody(body);
            m.setMessageDate(daysAgo(daysAgo));
            m.setMessageStatus(read);
            s.save(m);
            tx.commit();
            System.out.println("  message \"" + subject + "\"");
        } catch (Exception e) {
            tx.rollback();
            throw new RuntimeException("Could not save message: " + subject, e);
        } finally {
            s.close();
        }
    }

    // --------------------------------------------------------------- main

    public static void main(String[] args) throws Exception {

        // Idempotency guard: do nothing if staff already exist
        List<Employee> existing = hs.getEmployees("Doctor");
        if (existing != null && !existing.isEmpty()) {
            System.out.println("Sample data already present — nothing to do.");
            System.exit(0);
        }

        // Bootstrap lookup tables + admin
        // Resulting ids (Oracle sequence, contiguous on a clean DB):
        //   categories  1=General 2=Foot 3=Leg 4=Eye 5=BOO 6=Brain
        //   blood groups  7=A+  8=B+  9=O+  10=A
        //   room types   11="2 bed" 12="3 bed" 13="4 bed" 14="5 bed"
        //   shift times  15=6AM-2PM  16=2PM-10PM  17=10PM-6AM
        System.out.println("Bootstrap");
        seedCategories();
        seedBloodGroups();
        seedRoomTypes();
        seedShiftTimes();
        seedAdmin();

        System.out.println("Staff");
        Doctor priya = emp(new Doctor(),
                "Priya", "Ramesh", "Sharma", "dr.priya", "priya.sharma@hospital.test",
                "female", date(1980, 3, 14), "9820011101", "12 Lake View Road, Pune",
                6, "MD Neurology", "AIIMS Delhi", "City General Hospital", "Consultant Neurologist");
        Doctor rahul = emp(new Doctor(),
                "Rahul", "Suresh", "Mehta", "dr.rahul", "rahul.mehta@hospital.test",
                "male", date(1976, 9, 2), "9820011102", "44 Green Park, Pune",
                1, "MBBS, MD Medicine", "Grant Medical College", "Sunrise Clinic", "Physician");
        Receptioniest anita = emp(new Receptioniest(),
                "Anita", "Mohan", "Desai", "reception", "anita.desai@hospital.test",
                "female", date(1990, 5, 21), "9820011103", "7 Rose Colony, Pune",
                1, "BA Hospitality", "Pune University", "Grand Hotel", "Front Desk Executive");
        Pharmatiest vikram = emp(new Pharmatiest(),
                "Vikram", "Anil", "Rao", "pharmacist", "vikram.rao@hospital.test",
                "male", date(1985, 11, 30), "9820011104", "88 Station Road, Pune",
                1, "B.Pharm", "Poona College of Pharmacy", "MedPlus", "Pharmacist");
        Nurse sunita = emp(new Nurse(),
                "Sunita", "Dilip", "Patil", "nurse.sunita", "sunita.patil@hospital.test",
                "female", date(1992, 1, 8), "9820011105", "3 Hill Side, Pune",
                1, "BSc Nursing", "Sassoon Nursing College", "District Hospital", "Staff Nurse");
        Nurse meera = emp(new Nurse(),
                "Meera", "Ganesh", "Iyer", "nurse.meera", "meera.iyer@hospital.test",
                "female", date(1994, 7, 19), "9820011106", "19 Temple Street, Pune",
                1, "GNM Nursing", "Ruby Hall Nursing School", "Ruby Hall Clinic", "Staff Nurse");
        emp(new Accountant(),
                "Rohan", "Prakash", "Kulkarni", "accountant", "rohan.kulkarni@hospital.test",
                "male", date(1988, 2, 25), "9820011107", "52 Market Yard, Pune",
                1, "M.Com", "Fergusson College", "Tally Services", "Accounts Executive");
        emp(new Lab(),
                "Kiran", "Vijay", "Joshi", "lab", "kiran.joshi@hospital.test",
                "male", date(1987, 4, 11), "9820011108", "21 Garden Lane, Pune",
                1, "BSc DMLT", "Pune University", "PathCare Labs", "Lab Technician");
        emp(new Xray(),
                "Neha", "Sanjay", "Kapoor", "xray", "neha.kapoor@hospital.test",
                "female", date(1991, 12, 3), "9820011109", "5 Sky Heights, Pune",
                1, "Diploma Radiology", "KEM Hospital", "Scan Centre", "Radiographer");

        System.out.println("Rooms");
        Room r101 = room(11, 101, 2);
        Room r102 = room(12, 102, 3);
        Room r201 = room(13, 201, 4);
        Room r202 = room(14, 202, 5);

        System.out.println("Patients");
        Patient aarav   = patient("Aarav",   "Sanjay", "Singh",  "male",   date(1985,  6, 12), 9811100001L, "14 MG Road, Pune",       "aarav.singh@mail.test",   7,  "Neha Singh",   "Wife",   "9811100011");
        Patient diya    = patient("Diya",    "Karan",  "Nair",   "female", date(1998,  2,  3), 9811100002L, "9 Palm Grove, Pune",     "diya.nair@mail.test",     9,  "Karan Nair",   "Father", "9811100012");
        Patient imran   = patient("Imran",   "Yusuf",  "Khan",   "male",   date(1971, 10, 27), 9811100003L, "31 Camp Area, Pune",     "imran.khan@mail.test",    8,  "Saira Khan",   "Wife",   "9811100013");
        Patient lakshmi = patient("Lakshmi", "Venkat", "Reddy",  "female", date(1960,  8, 15), 9811100004L, "2 Residency Road, Pune", "lakshmi.reddy@mail.test", 10, "Arun Reddy",   "Son",    "9811100014");
        patient("Rohit", "Mahesh", "Verma",  "male",   date(2001, 12,  1), 9811100005L,        "66 Baner Road, Pune",    "rohit.verma@mail.test",   7,  "Mahesh Verma", "Father", "9811100015");

        System.out.println("Bed bookings");
        book(aarav,   r101, "Neurology",       6, false);
        book(diya,    r102, "General Medicine", 4, false);
        book(imran,   r201, "General Medicine", 9, true);
        book(lakshmi, r202, "Neurology",        2, false);

        System.out.println("Diagnoses");
        disease(priya, aarav,   "Migraine",        "Recurring headaches for 3 weeks. MRI advised, avoid bright light.", 5);
        disease(priya, lakshmi, "Vertigo",          "Dizziness on standing. Monitor blood pressure twice a day.",        2);
        disease(rahul, diya,    "Viral fever",      "Fever for 3 days. Rest, fluids, paracetamol as needed.",            3);
        disease(rahul, imran,   "Type 2 diabetes",  "Blood sugar high on admission. Started metformin, diet plan given.", 8);

        System.out.println("Pharmacy");
        Drug para = drug(vikram, "Paracetamol 500mg",  2.5,  500, date(2027,  6, 30));
               drug(vikram, "Amoxicillin 250mg",  12.0, 200, date(2027,  3, 31));
        Drug ibu  = drug(vikram, "Ibuprofen 400mg",    5.0,  300, date(2027,  9, 30));
        Drug cet  = drug(vikram, "Cetirizine 10mg",    3.0,  150, date(2027,  1, 31));
        Drug met  = drug(vikram, "Metformin 500mg",    4.5,  120, date(2027, 11, 30));
               drug(vikram, "Omeprazole 20mg",     6.0,  250, date(2027,  8, 31));
        sell(vikram, diya,    para, 15, "3", 5);
        sell(vikram, imran,   met,  60, "2", 30);
        sell(vikram, aarav,   ibu,  10, "2", 5);
        sell(vikram, lakshmi, cet,   7, "1", 7);

        System.out.println("Nurse shifts");
        service(sunita, 15, 0, "Neurology");
        service(sunita, 15, 1, "Neurology");
        service(sunita, 16, 2, "General Medicine");
        service(meera,  16, 0, "General Medicine");
        service(meera,  17, 1, "Neurology");
        service(meera,  15, 3, "General Medicine");

        System.out.println("Messages");
        message("reception",  "dr.rahul",   diya.getPatientId(),    "New admission: Diya Nair",
                "Ms. Nair is in room 102 with fever. Family is waiting for an update.", 4, true);
        message("dr.priya",   "pharmacist", lakshmi.getPatientId(), "Medication for Lakshmi Reddy",
                "Please dispense cetirizine for Mrs. Reddy as per the notes.", 2, false);
        message("admin",      "dr.priya",   aarav.getPatientId(),   "Duty roster updated",
                "The night shift roster for next week has been updated. Please check your service times.", 1, false);

        System.out.println("Done. Login with admin / 123456");
        System.exit(0);
    }
}
