package com.hospital.api.common;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

import com.hospital.api.exception.ApiException;

/** Legacy date format is MM/dd/yyyy (see FormateDate). Parsed strictly so bad input yields 400 instead of null. */
public final class Dates {

    private Dates() {
    }

    public static Date parse(String field, String text) {
        if (text == null || text.isBlank()) {
            throw ApiException.badRequest(field + " is required (format MM/dd/yyyy)");
        }
        SimpleDateFormat format = new SimpleDateFormat("MM/dd/yyyy");
        format.setLenient(false);
        try {
            return format.parse(text.trim());
        } catch (ParseException ex) {
            throw ApiException.badRequest(field + " must be a valid date in MM/dd/yyyy format");
        }
    }
}
