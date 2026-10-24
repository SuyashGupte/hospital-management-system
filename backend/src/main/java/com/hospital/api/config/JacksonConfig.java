package com.hospital.api.config;

import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hospital.models.Drug;
import com.hospital.models.Disease;
import com.hospital.models.Employee;
import com.hospital.models.Nurse;
import com.hospital.models.NurseServiceTime;
import com.hospital.models.Pharmatiest;
import com.hospital.models.SelledDrug;

/**
 * The legacy entities are serialized as-is (they must not be modified), so response shaping is done with Jackson
 * mix-ins: the password hash is never exposed and the (large, base64) photo is omitted from nested employees.
 * A mix-in on Employee also applies to Doctor, Nurse, Pharmatiest, ... .
 */
@Configuration
public class JacksonConfig {

    @JsonIgnoreProperties(value = "password", allowSetters = true)
    abstract static class EmployeeMixin {
    }

    abstract static class DrugMixin {
        @JsonIgnoreProperties({ "password", "photo" })
        abstract Employee getEmployee();
    }

    abstract static class DiseaseMixin {
        @JsonIgnoreProperties({ "password", "photo" })
        abstract Employee getEmployee();
    }

    abstract static class SelledDrugMixin {
        @JsonIgnoreProperties({ "password", "photo" })
        abstract Pharmatiest getPharmatiest();
    }

    abstract static class NurseServiceTimeMixin {
        @JsonIgnoreProperties({ "password", "photo" })
        abstract Nurse getNurse();
    }

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer hospitalMixins() {
        return builder -> builder.mixIn(Employee.class, EmployeeMixin.class).mixIn(Drug.class, DrugMixin.class)
                .mixIn(Disease.class, DiseaseMixin.class).mixIn(SelledDrug.class, SelledDrugMixin.class)
                .mixIn(NurseServiceTime.class, NurseServiceTimeMixin.class);
    }
}
