package com.hospital.api.service;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;
import java.util.function.Function;

import javax.persistence.PersistenceException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import com.hospital.DbConfig.HibernateUtil;
import com.hospital.api.exception.ApiException;
import com.hospital.entities.HospitalService;

/**
 * Serialises every call into the legacy {@link HospitalService}. That singleton keeps ONE Hibernate session and
 * transaction in instance fields (not thread-safe), so concurrent HTTP requests must not interleave. The class itself
 * stays unmodified; the lock lives here. Multi-step operations run inside a single {@code run(...)} block (the lock
 * is re-entrant).
 */
@Component
public class HospitalGateway {

    private static final Logger log = LoggerFactory.getLogger(HospitalGateway.class);

    private final HospitalService dao = HospitalService.getInstance();

    public synchronized <T> T run(Function<HospitalService, T> work) {
        try {
            // Fail fast with a clear message when the database is down: HibernateUtil builds the SessionFactory in a
            // static initializer, which otherwise surfaces as an Error / NullPointerException from the legacy DAO.
            HibernateUtil.getSessionFactory();
        } catch (ExceptionInInitializerError | NoClassDefFoundError ex) {
            log.error("Database layer is not available", ex);
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Database is not available. Check src/main/resources/hibernate.cfg.xml and that Oracle is running");
        }
        try {
            return work.apply(dao);
        } catch (IllegalStateException | PersistenceException ex) {
            // The legacy DAO rolls back and then commits again in finally{}, which throws when the DB rejected the
            // statement (unique / foreign-key / not-null violation, ...).
            log.warn("Database rejected the operation: {}", ex.toString());
            throw ApiException.conflict("The database rejected the operation (constraint violation or invalid data)");
        }
    }

    public synchronized void exec(Consumer<HospitalService> work) {
        run(d -> {
            work.accept(d);
            return null;
        });
    }

    /** Typed lookup by id; null when missing (the legacy DAO returns null). */
    public <T> T get(Class<T> type, Integer id) {
        if (id == null) {
            return null;
        }
        return run(d -> type.cast(d.getObject(id, type)));
    }

    public <T> List<T> list(Class<T> type) {
        List<T> result = run(d -> d.getListObjects(type));
        return result == null ? new ArrayList<>() : result;
    }

    /** Resource addressed in the URL path: 404 when missing. */
    public <T> T require(Class<T> type, Integer id, String what) {
        T found = get(type, id);
        if (found == null) {
            throw ApiException.notFound(what + " with id " + id + " was not found");
        }
        return found;
    }

    /** Id referenced from a request body: 400 when missing. */
    public <T> T requireRef(Class<T> type, Integer id, String what) {
        T found = get(type, id);
        if (found == null) {
            throw ApiException.badRequest(what + " with id " + id + " does not exist");
        }
        return found;
    }

    /**
     * The legacy DAO swallows/blurs delete failures (e.g. foreign keys), so success is verified by re-reading the row.
     */
    public void deleteVerified(Class<?> type, Integer id, String what, Consumer<HospitalService> work) {
        run(d -> {
            try {
                work.accept(d);
            } catch (RuntimeException ex) {
                log.warn("Delete of {} {} failed: {}", what, id, ex.toString());
            }
            if (d.getObject(id, type) != null) {
                throw ApiException.conflict(
                        what + " " + id + " cannot be deleted because other records still reference it");
            }
            return null;
        });
    }
}
