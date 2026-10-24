package com.hospital.api.service;

import java.util.Date;
import java.util.List;

import org.springframework.stereotype.Service;

import com.hospital.api.common.Dates;
import com.hospital.api.dto.Dtos.RoomRequest;
import com.hospital.api.dto.Dtos.ServiceTimeRequest;
import com.hospital.api.exception.ApiException;
import com.hospital.models.Nurse;
import com.hospital.models.NurseServiceTime;
import com.hospital.models.Room;
import com.hospital.models.RoomType;
import com.hospital.models.ShiftTime;

/** Rooms and nurse rota (Admin functions). */
@Service
public class FacilityService {

    private final HospitalGateway gw;

    public FacilityService(HospitalGateway gw) {
        this.gw = gw;
    }

    // ---- rooms ----
    public List<Room> rooms() {
        return gw.list(Room.class);
    }

    public Room room(Integer id) {
        return gw.require(Room.class, id, "Room");
    }

    public List<Room> availableRooms() {
        List<Room> rooms = gw.run(d -> d.getAllAvailableRoom());
        return rooms == null ? List.of() : rooms;
    }

    public Room createRoom(RoomRequest r) {
        Room room = new Room();
        room.setNumberOfBeds(r.bedNumbers());
        room.setNumberOfAvailableBeds(r.bedNumbers()); // rule: a new room starts with all beds available
        room.setRoomType(gw.requireRef(RoomType.class, r.roomTypeId(), "Room type"));
        room.setRoomNumber(r.roomNumber());
        int id = gw.run(d -> d.saveObject(room));
        if (id == 0) {
            throw ApiException.conflict("Room could not be saved");
        }
        return room(id);
    }

    /**
     * Legacy rule kept: an update resets available beds to the total bed count. Unlike the legacy code (which built a
     * brand-new Room) the existing row is updated, so the booked beds are not lost silently - but the reset itself is
     * documented behaviour in architecture.md section 4.3.
     */
    public Room updateRoom(Integer id, RoomRequest r) {
        Room room = room(id);
        room.setNumberOfBeds(r.bedNumbers());
        room.setNumberOfAvailableBeds(r.bedNumbers());
        room.setRoomType(gw.requireRef(RoomType.class, r.roomTypeId(), "Room type"));
        room.setRoomNumber(r.roomNumber());
        gw.exec(d -> d.updateObject(room));
        return room(id);
    }

    public void deleteRoom(Integer id) {
        Room room = room(id);
        gw.deleteVerified(Room.class, id, "Room", d -> {
            room.setRoomType(null);
            d.deleteAllRoomBooked(id); // bookings first, as the legacy listener does
            d.deleteObject(room);
        });
    }

    // ---- nurse service times ----
    public List<NurseServiceTime> serviceTimes() {
        return gw.list(NurseServiceTime.class);
    }

    public List<NurseServiceTime> serviceTimesForNurse(Integer nurseId) {
        List<NurseServiceTime> list = gw.run(d -> d.getAllServiceTime(nurseId));
        return list == null ? List.of() : list;
    }

    public NurseServiceTime serviceTime(Integer id) {
        return gw.require(NurseServiceTime.class, id, "Service time");
    }

    public NurseServiceTime createServiceTime(ServiceTimeRequest r) {
        NurseServiceTime t = new NurseServiceTime();
        fill(t, r);
        int id = gw.run(d -> d.saveObject(t));
        if (id == 0) {
            throw ApiException.conflict("Service time could not be saved");
        }
        return serviceTime(id);
    }

    public NurseServiceTime updateServiceTime(Integer id, ServiceTimeRequest r) {
        NurseServiceTime t = serviceTime(id);
        fill(t, r);
        gw.exec(d -> d.updateObject(t));
        return serviceTime(id);
    }

    public void deleteServiceTime(Integer id) {
        NurseServiceTime t = serviceTime(id);
        gw.deleteVerified(NurseServiceTime.class, id, "Service time", d -> {
            t.setShiftTime(null);
            t.setNurse(null);
            d.deleteObject(t);
        });
    }

    private void fill(NurseServiceTime t, ServiceTimeRequest r) {
        Date date = Dates.parse("serviceDate", r.serviceDate());
        t.setDepartment(r.department());
        t.setServiceDate(date);
        t.setShiftTime(gw.requireRef(ShiftTime.class, r.shiftTimeId(), "Shift time"));
        t.setNurse(gw.requireRef(Nurse.class, r.nurseId(), "Nurse"));
    }
}
