package com.hospital.api.service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;

import com.hospital.api.common.Dates;
import com.hospital.api.dto.Dtos.BookingRequest;
import com.hospital.api.dto.Dtos.FeeRecord;
import com.hospital.api.dto.Dtos.PatientRequest;
import com.hospital.api.exception.ApiException;
import com.hospital.models.BloodGroup;
import com.hospital.models.BookBed;
import com.hospital.models.NextOfKin;
import com.hospital.models.Patient;
import com.hospital.models.Room;

/** Patient registry, bed booking and patient fees (Receptionist / Accountant functions). */
@Service
public class PatientService {

    private final HospitalGateway gw;

    public PatientService(HospitalGateway gw) {
        this.gw = gw;
    }

    // ---- patients ----
    public List<Patient> patients() {
        return gw.list(Patient.class);
    }

    public Patient patient(Integer id) {
        return gw.require(Patient.class, id, "Patient");
    }

    public Patient createPatient(PatientRequest r) {
        Patient p = new Patient();
        apply(p, r);
        p.setJoiningDate(new Date());
        NextOfKin kin = new NextOfKin();
        applyKin(kin, r);
        p.setNextOfKin(kin);
        int id = gw.run(d -> d.saveObject(p));
        if (id == 0) {
            throw ApiException.conflict("Patient could not be saved");
        }
        return patient(id);
    }

    /** The joining date is kept (the legacy update reset it to "now", listed as a known defect). */
    public Patient updatePatient(Integer id, PatientRequest r) {
        Patient p = patient(id);
        apply(p, r);
        NextOfKin kin = p.getNextOfKin() != null ? p.getNextOfKin() : new NextOfKin();
        applyKin(kin, r);
        p.setNextOfKin(kin);
        gw.exec(d -> d.updateObject(p));
        return patient(id);
    }

    public void deletePatient(Integer id) {
        Patient p = patient(id);
        gw.deleteVerified(Patient.class, id, "Patient", d -> {
            p.setBloodGroup(null);
            d.deleteAllPatientMessages(id); // messages first, as the legacy listener does
            d.deleteObject(p);
        });
    }

    private void apply(Patient p, PatientRequest r) {
        p.setName(r.firstName());
        p.setFatherName(r.fatherName());
        p.setFamilyName(r.familyName());
        p.setAddress(r.address());
        p.setEmail(r.email());
        p.setDob(Dates.parse("dob", r.dob()));
        p.setPhone(Long.parseLong(r.phone()));
        p.setGender(r.gender());
        p.setBloodGroup(gw.requireRef(BloodGroup.class, r.bloodGroupId(), "Blood group"));
    }

    private void applyKin(NextOfKin kin, PatientRequest r) {
        kin.setFullName(r.nextOfKin().fullName());
        kin.setAddress(r.nextOfKin().address());
        kin.setRelationship(r.nextOfKin().relationship());
        kin.setPhone(r.nextOfKin().phone());
    }

    // ---- bed bookings ----
    public List<BookBed> bookings() {
        return gw.list(BookBed.class);
    }

    public BookBed booking(Integer id) {
        return gw.require(BookBed.class, id, "Booking");
    }

    /** Rule: only rooms with a free bed can be booked; booking takes one bed; new bookings are unpaid (status=false). */
    public BookBed book(BookingRequest r) {
        int id = gw.run(d -> {
            Patient patient = gw.requireRef(Patient.class, r.patientId(), "Patient");
            Room room = gw.requireRef(Room.class, r.roomId(), "Room");
            if (room.getNumberOfAvailableBeds() <= 0) {
                throw ApiException.conflict("Room " + room.getRoomNumber() + " has no available beds");
            }
            room.setNumberOfAvailableBeds(room.getNumberOfAvailableBeds() - 1);
            BookBed b = new BookBed();
            b.setDatePlaced(new Date());
            b.setDepartement(r.departement());
            b.setStatus(false);
            b.setPatient(patient);
            b.setRoom(room);
            return d.saveObject(b);
        });
        if (id == 0) {
            throw ApiException.conflict("Booking could not be saved");
        }
        return booking(id);
    }

    /**
     * Updates patient / room / department of an existing booking. When an unpaid booking moves to another room the bed
     * counters of both rooms are adjusted (the legacy update left them untouched, which corrupted the counts).
     */
    public BookBed updateBooking(Integer id, BookingRequest r) {
        gw.exec(d -> {
            BookBed b = booking(id);
            Patient patient = gw.requireRef(Patient.class, r.patientId(), "Patient");
            Room target = gw.requireRef(Room.class, r.roomId(), "Room");
            Room current = b.getRoom();
            if (!b.isStatus() && current != null && !current.getRoomId().equals(target.getRoomId())) {
                if (target.getNumberOfAvailableBeds() <= 0) {
                    throw ApiException.conflict("Room " + target.getRoomNumber() + " has no available beds");
                }
                current.setNumberOfAvailableBeds(current.getNumberOfAvailableBeds() + 1);
                d.updateObject(current);
                target.setNumberOfAvailableBeds(target.getNumberOfAvailableBeds() - 1);
                d.updateObject(target);
            }
            b.setPatient(patient);
            b.setRoom(target);
            b.setDepartement(r.departement());
            d.updateObject(b);
        });
        return booking(id);
    }

    /** Cancelling gives the bed back (only if it was not already released by a payment) and deletes the booking. */
    public void cancelBooking(Integer id) {
        BookBed b = booking(id);
        gw.deleteVerified(BookBed.class, id, "Booking", d -> {
            Room room = b.getRoom();
            if (room != null && !b.isStatus()) {
                room.setNumberOfAvailableBeds(room.getNumberOfAvailableBeds() + 1);
                d.updateObject(room);
            }
            b.setRoom(null);
            b.setPatient(null);
            d.deleteObject(b);
        });
    }

    // ---- fees (Accountant) ----
    /** Fee = whole days between datePlaced and now x room-type cost. */
    public List<FeeRecord> fees() {
        List<FeeRecord> result = new ArrayList<>();
        Date now = new Date();
        for (BookBed b : bookings()) {
            result.add(fee(b, now));
        }
        return result;
    }

    public FeeRecord fee(Integer bookingId) {
        return fee(booking(bookingId), new Date());
    }

    private FeeRecord fee(BookBed b, Date now) {
        long days = TimeUnit.DAYS.convert(now.getTime() - b.getDatePlaced().getTime(), TimeUnit.MILLISECONDS);
        double cost = b.getRoom() != null && b.getRoom().getRoomType() != null ? b.getRoom().getRoomType().getRoomCost()
                : 0;
        return new FeeRecord(b, days, cost, days * cost);
    }

    /**
     * Marking as paid releases the bed (+1 available) and sets status=true. Marking as unpaid again only resets the
     * status (the bed is NOT re-occupied), exactly like the legacy toggle. Repeating the current state is a no-op.
     */
    public BookBed setPaid(Integer id, boolean paid) {
        gw.exec(d -> {
            BookBed b = booking(id);
            if (paid && !b.isStatus()) {
                Room room = b.getRoom();
                room.setNumberOfAvailableBeds(room.getNumberOfAvailableBeds() + 1);
                d.updateObject(room);
                b.setStatus(true);
                d.updateObject(b);
            } else if (!paid && b.isStatus()) {
                b.setStatus(false);
                d.updateObject(b);
            }
        });
        return booking(id);
    }
}
