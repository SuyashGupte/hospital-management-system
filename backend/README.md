# Hospital Management System – REST API (Spring Boot)

Replaces the Struts/JSP front end of the legacy application. The legacy data access layer
(`com.hospital.models`, `entities`, `DbConfig`, `utils`, `hibernate.cfg.xml`) is copied **unchanged**; only the web layer is new
(`com.hospital.api`).

## Setup and Run

### 1. Start Oracle DB

If you don't have Oracle running already, start it via Podman (or Docker — swap `podman` for `docker`):

```bash
podman run -d \
  --name oracle \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=sys_123 \
  -e APP_USER=hadeel \
  -e APP_USER_PASSWORD=hadeel \
  docker.io/gvenzl/oracle-free:23-slim-faststart

# Wait until ready (60–90 s)
podman logs -f oracle 2>&1 | grep -m1 "DATABASE IS READY TO USE"
```

The image auto-creates the `FREEPDB1` service name and the app user. Skip this step if you already have an Oracle instance.

### 2. Configure credentials

Edit `src/main/resources/hibernate.cfg.xml` (copy from `hibernate.cfg.xml.example` if it is missing):

```xml
<property name="hibernate.connection.url">jdbc:oracle:thin:@//127.0.0.1:1521/FREEPDB1</property>
<property name="hibernate.connection.username">hadeel</property>
<property name="hibernate.connection.password">hadeel</property>
```

Change the host, port, service name, and credentials to match your Oracle instance.

### 3. Seed the database (first run only)

`SeedData` is fully self-contained — it creates the schema, loads all lookup tables, the admin user, and demo data in one step. It is idempotent: if a Doctor record already exists it exits immediately.

```bash
cd backend
mvn compile dependency:copy-dependencies -DoutputDirectory=target/dependency -q
java -cp "target/classes:target/dependency/*" com.hospital.queries.SeedData
```

What gets inserted:

| Phase | Data |
|---|---|
| Bootstrap | 6 categories, 4 blood groups, 4 room types, 3 shift times |
| Admin | username `admin` / password `123456` |
| Staff | 2 doctors, 1 receptionist, 1 pharmacist, 2 nurses, 1 accountant, 1 lab, 1 X-ray tech |
| Rooms | 4 rooms (101, 102, 201, 202) |
| Patients | 5 patients with next-of-kin |
| Bed bookings | 4 bookings (1 already paid/discharged) |
| Diagnoses | 4 diagnoses linked to doctors and patients |
| Pharmacy | 6 drugs, 4 drug sales |
| Nurse shifts | 6 service-time entries |
| Messages | 3 inbox messages between staff |

### 4. Run the server

```bash
cd backend
# Optional overrides:
# export JWT_SECRET='<at least 32 characters>'
# export CORS_ALLOWED_ORIGINS='http://localhost:3000'
mvn spring-boot:run
```

* API: http://localhost:8080/api  ·  Swagger UI: http://localhost:8080/swagger-ui.html
* Use `mvn spring-boot:run` (not `java -jar`). JasperReports compiles `.jrxml` templates at runtime using the JDK
  compiler, which needs the full classpath — the fat jar does not provide it.

## Authentication

`POST /api/auth/login` `{ "user": "admin", "pass": "123456" }` → `{ "token": "..." }`, then send
`Authorization: Bearer <token>`. Role checks are per endpoint (`@PreAuthorize`) and listed in each Swagger description.

## Legacy action → endpoint

| Legacy `Process?action=` | Endpoint |
|---|---|
| LoginService / logout / ChangePassword | `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/change-password`, `GET /api/auth/me` |
| AddEmployee / UpdateEmployee / deleteEmployee | `POST/PUT/DELETE /api/employees[/{id}]`, `PUT /api/employees/{id}/photo` |
| (dashboard) / DownloadEmployeeReport | `GET /api/employees/statistics`, `GET /api/reports/employees/{type}` (PDF) |
| AddRoom / UpdateRoom / DeleteRoom | `POST/PUT/DELETE /api/rooms[/{id}]`, `GET /api/rooms/available` |
| AddServiceTime / UpdateServiceTime / DeleteServiceTime | `POST/PUT/DELETE /api/service-times[/{id}]`, `GET /api/service-times/mine` |
| AddPatient / UpdatePatient / DeletePatient | `POST/PUT/DELETE /api/patients[/{id}]`, public sign-up `POST /api/public/patients` |
| BookBed / UpdateBookBed / DeleteBookBed | `POST/PUT/DELETE /api/bookings[/{id}]` |
| CheckedPatientFees | `GET /api/fees`, `PUT /api/fees/{bookingId}/payment` |
| AddDiesease / UpdateDiesease / DeleteDiesease | `POST/PUT/DELETE /api/diseases[/{id}]`, `GET /api/diseases/mine` |
| AddDrug / UpdateDrug / DeleteDrug | `POST/PUT/DELETE /api/drugs[/{id}]` |
| SellDrug / UpdateSellDrug / ReverseSellDrug / InvoiceDrug | `POST/PUT/DELETE /api/drug-sales[/{id}]`, `POST /api/drug-sales/{id}/invoice` (PDF) |
| ComposeEmail / ViewMessage / inbox / sent | `POST /api/messages`, `GET /api/messages/{id}`, `/inbox`, `/sent`, `/unread-count` |

Dates use the legacy `MM/dd/yyyy` format.

## Behaviour differences from the legacy app (deliberate)

* Server-side authorization (JWT + roles) instead of hiding menu items.
* Proper HTTP status codes and a JSON error body instead of `?error=true` redirects.
* "All receptionists" fan-out now matches the real discriminator `Receptionist` (the legacy code queried `Receptioniest`).
* Updating a sale returns the previous quantity to stock; updating a patient keeps the joining date; a blank password on
  employee update keeps the stored password; moving a booking between rooms adjusts both bed counters.
