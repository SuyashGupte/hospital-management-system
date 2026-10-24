# Hospital Management System

A role-based hospital administration system for managing employees, patients, rooms and beds, diagnoses, pharmacy stock and sales, patient billing, nurse shifts, internal messaging, and PDF reports.

The project is split into two applications:

| Folder | What it is |
|---|---|
| [`backend/`](backend/README.md) | Spring Boot REST API (JWT security, Hibernate 5 + Oracle, JasperReports) |
| [`frontend/`](frontend) | React + TypeScript single-page app (Vite, Carbon Design System) |

The earlier Struts/JSP implementation has been removed from this repository. Its data-access layer (`models`, `entities`, `DbConfig`, `utils`) lives on unchanged inside `backend/`.

See [`architecture.md`](architecture.md) for the full architecture, business rules and data model.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router 7, Axios, `@carbon/react`, Sass |
| API | Spring Boot 2.7.18 (`javax.*` namespace), Spring Security (stateless JWT), Bean Validation, springdoc OpenAPI |
| ORM / Persistence | Plain Hibernate 5.6 (`hibernate-core`), configured by `hibernate.cfg.xml` |
| Database | Oracle Database (ojdbc8) |
| Reporting | JasperReports 7.0.7 + `jasperreports-pdf` (OpenPDF) |
| Language / Build | Java 17, Maven 3 (backend) · Node.js + npm (frontend) |

---

## Project Structure

```
hospital-management-system/
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/hospital/
│       │   ├── HospitalApplication.java   # Spring Boot entry point
│       │   ├── api/                       # REST layer (config, controller, dto, exception, security, service)
│       │   ├── DbConfig/                  # HibernateUtil / HibernateDriver
│       │   ├── entities/                  # *DAO interfaces + HospitalService facade
│       │   ├── models/                    # JPA entities and report DTOs
│       │   ├── queries/                   # SeedData / TestDbConnection (seeding `main()` classes)
│       │   └── utils/                     # Entity, FormateDate, PasswordEncryption
│       └── resources/
│           ├── application.yml
│           ├── hibernate.cfg.xml          # git-ignored, holds real DB credentials
│           ├── hibernate.cfg.xml.example
│           └── reports/                   # employeeReport.jrxml, Invoice.jrxml, invoice_logo.png
└── frontend/
    ├── package.json, vite.config.ts
    └── src/
        ├── api/                           # Axios client + API types
        ├── services/                      # One service per backend area
        ├── contexts/ hooks/               # Auth, notification and theme state
        ├── components/                    # admin, reception, doctor, nurse, clinical, pharmacy, accountant, messaging, profile, layout, guards, common
        ├── pages/                         # Landing, Login, NotFound
        └── utils/
```

---

## Request Flow

```
Browser (React SPA, http://localhost:5173)
  │   Axios, Authorization: Bearer <JWT>
  ▼
Vite dev server  (proxies /api → http://localhost:8080)
  │
  ▼
Spring Security filter chain  (JwtAuthenticationFilter, @PreAuthorize role checks)
  │
  ▼
@RestController  →  *Service  →  HospitalGateway (synchronized)  →  HospitalService (Hibernate Session → Oracle)
```

---

## Role-Based Modules

| Role | Frontend routes |
|---|---|
| Admin | `/admin/dashboard`, `/admin/employees`, `/admin/rooms`, `/admin/service-times` (Admin can also open the other roles' pages) |
| Receptionist | `/reception/patients`, `/reception/book-bed` |
| Doctor | `/doctor/diagnoses` |
| Nurse, Lab, Xray | `/nurse/service-times`, `/clinical/patients` |
| Pharmacist | `/pharmacy/drugs`, `/pharmacy/sales` |
| Accountant | `/accountant/fees` |
| All users | `/messages/inbox`, `/messages/sent`, `/messages/compose`, `/profile` |

The same roles are enforced server-side with `@PreAuthorize` on every endpoint.

---

## Prerequisites

- **Java JDK 17** and **Maven 3.x**
- **Node.js** and **npm**
- **Podman** (or Docker) to run Oracle

---

## Steps to Run

### 1. Clone the repository

```bash
git clone https://github.com/SuyashGupte/hospital-management-system.git
cd hospital-management-system
```

### 2. Start Oracle

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

The image creates the `hadeel` application user and the `FREEPDB1` service on first boot.

### 3. Configure the database connection

Copy [`backend/src/main/resources/hibernate.cfg.xml.example`](backend/src/main/resources/hibernate.cfg.xml.example) to `hibernate.cfg.xml` (same folder) if it is missing, then set the URL and credentials:

```xml
<property name="hibernate.connection.url">jdbc:oracle:thin:@//127.0.0.1:1521/FREEPDB1</property>
<property name="hibernate.connection.username">hadeel</property>
<property name="hibernate.connection.password">hadeel</property>
<property name="hibernate.hbm2ddl.auto">update</property>
```

The schema is created and updated by Hibernate (`hbm2ddl.auto=update`). `hibernate.cfg.xml` is git-ignored; never commit real credentials.

### 4. Seed the database (first run only)

```bash
cd backend
mvn compile dependency:copy-dependencies -DoutputDirectory=target/dependency -q
java -cp "target/classes:target/dependency/*" com.hospital.queries.SeedData
```

`SeedData` loads lookup tables, the admin user and demo data, and is idempotent. Login: **`admin`** / **`123456`**; every demo employee uses password `123456`. If it hangs, Oracle is not ready yet: stop it, wait for the ready message above and retry. See [`backend/README.md`](backend/README.md) for what gets inserted.

### 5. Start the backend

```bash
cd backend
mvn spring-boot:run
```

API: <http://localhost:8080/api> · Swagger UI: <http://localhost:8080/swagger-ui.html>

Use `mvn spring-boot:run`, not `java -jar`: JasperReports compiles `.jrxml` templates at runtime and needs the full classpath.

### 6. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The dev server proxies `/api` to `http://localhost:8080`.

Both servers can also be started together from VS Code with the **Launch Full Stack Application** task (`.vscode/tasks.json`).

### Useful commands

| Command | Purpose |
|---|---|
| `cd backend && mvn clean package` | Build the backend jar (`target/hospital-backend-1.0-SNAPSHOT.jar`) |
| `cd frontend && npm run build` | Type-check and build the frontend into `frontend/dist` |
| `cd frontend && npm run lint` | Lint the frontend with oxlint |

---

## Configuration

Backend settings are in [`application.yml`](backend/src/main/resources/application.yml) and can be overridden with environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `SERVER_PORT` | `8080` | API port |
| `JWT_SECRET` | dev placeholder | HS256 signing key (at least 32 characters). Override outside local development |
| `JWT_EXPIRATION_MINUTES` | `120` | Token lifetime |
| `CORS_ALLOWED_ORIGINS` | localhost/127.0.0.1 on ports 3000, 5173, 5174 | Allowed browser origins |

---

## Built With

- [Spring Boot](https://spring.io/projects/spring-boot) and [Spring Security](https://spring.io/projects/spring-security): REST API and JWT auth
- [Hibernate ORM](https://hibernate.org/): persistence
- [Oracle Database](https://www.oracle.com/database/): relational database
- [JasperReports](https://community.jaspersoft.com/): report generation
- [React](https://react.dev/), [Vite](https://vite.dev/) and [Carbon Design System](https://carbondesignsystem.com/): frontend
- [Maven](https://maven.apache.org/) and [npm](https://www.npmjs.com/): build tooling

## Authors

- **Salah Atwa** (original Struts/JSP application): [GitHub](https://github.com/salahatwa) · [LinkedIn](https://www.linkedin.com/in/salah-atwa/)
