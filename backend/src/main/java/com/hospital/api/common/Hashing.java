package com.hospital.api.common;

import java.security.NoSuchAlgorithmException;

import com.hospital.utils.PasswordEncryption;

/** Unchecked wrapper over the legacy MD5+Base64 hash (existing stored passwords must keep matching). */
public final class Hashing {

    private Hashing() {
    }

    public static String md5Base64(String plain) {
        try {
            return PasswordEncryption.encrypt(plain);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("MD5 not available", ex);
        }
    }
}
