package com.hospital.api.exception;

import java.time.Instant;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

/** Uniform JSON error body returned for every failed request. */
@Schema(description = "Standard error response")
public class ApiError {

    private final String timestamp = Instant.now().toString();
    private final int status;
    private final String error;
    private final String message;
    private final String path;
    private final List<String> details;

    public ApiError(int status, String error, String message, String path, List<String> details) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
        this.details = details;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public int getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }

    public String getMessage() {
        return message;
    }

    public String getPath() {
        return path;
    }

    public List<String> getDetails() {
        return details;
    }
}
