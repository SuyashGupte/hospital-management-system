package com.hospital.api.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.hospital.models.BloodGroup;
import com.hospital.models.Category;
import com.hospital.models.RoomType;
import com.hospital.models.ShiftTime;

/** Read-only lookup tables used to fill forms (seeded by the legacy TestDbConnection). */
@Service
public class ReferenceDataService {

    private final HospitalGateway gw;

    public ReferenceDataService(HospitalGateway gw) {
        this.gw = gw;
    }

    public List<Category> categories() {
        return gw.list(Category.class);
    }

    public List<RoomType> roomTypes() {
        return gw.list(RoomType.class);
    }

    public List<BloodGroup> bloodGroups() {
        return gw.list(BloodGroup.class);
    }

    public List<ShiftTime> shiftTimes() {
        return gw.list(ShiftTime.class);
    }
}
