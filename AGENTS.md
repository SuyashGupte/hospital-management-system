# AGENTS.md

This file provides guidance to agents when working with code in this repository.

The repo has two apps: `backend/` (Spring Boot REST API) and `frontend/` (React + Vite SPA). The legacy Struts/JSP app was removed; its data-access layer (`models`, `entities`, `DbConfig`, `utils`) lives on inside `backend/`.

## Commands
- Backend build: `cd backend && mvn clean package` (Java 17, Spring Boot 2.7.18, jar at `backend/target/hospital-backend-1.0-SNAPSHOT.jar`).
- Backend run: `cd backend && mvn spring-boot:run`. Do not use `java -jar`; JasperReports compiles `.jrxml` at runtime and needs the full classpath. API on `:8080`, Swagger UI at `/swagger-ui.html`.
- Frontend: `cd frontend && npm install && npm run dev` (Vite on `:5173`, proxies `/api` to `:8080`). `npm run build` runs `tsc -b && vite build`. `npm run lint` runs oxlint.
- Stack: Hibernate 5.6 (`hibernate-core` only), JasperReports 7.0.7 + `jasperreports-pdf`, JJWT 0.11.5, springdoc 1.7.0. The code uses the `javax.*` namespace (Spring Boot 2.7), so do not introduce `jakarta.*`.
- No tests exist (`backend/src/test/java` is empty, no frontend test runner). Verify with `mvn clean package` and `npm run build`.
- Database: Oracle. Connection is read from `backend/src/main/resources/hibernate.cfg.xml` (git-ignored; copy from `hibernate.cfg.xml.example`), NOT from `application.yml`. Never commit real credentials.
- Seed (first run only): `cd backend && mvn compile dependency:copy-dependencies -DoutputDirectory=target/dependency -q && java -cp "target/classes:target/dependency/*" com.hospital.queries.SeedData`. It is idempotent. Login `admin`/`123456`. `queries/TestDbConnection` is an older, non-idempotent `main()` seeder.

## Backend architecture
- Layers: `api/controller` (`@RestController`, `@PreAuthorize` role checks) -> `api/service` -> `HospitalGateway` -> `entities/HospitalService` (legacy DAO facade) -> Hibernate -> Oracle. Request/response types are in `api/dto/Dtos.java`.
- To add an operation: add the DTO to `Dtos.java`, add a DAO method to the matching `entities/*DAO` interface and `HospitalService`, add the service method, add the controller endpoint with `@PreAuthorize`, then add the frontend service method and types.
- `HospitalService` holds ONE shared `Session`/`Transaction` (not thread-safe). All calls must go through `HospitalGateway.run(...)`/`exec(...)`, which is `synchronized`. Keep the `openSession()`/`closeSession()` pattern and `roleBack()` in `catch` inside the DAO.
- DAO methods swallow exceptions (`printStackTrace`) and return `null` or `0` on failure. Callers must null-check lists.
- Every new `@Entity` must be added to `<mapping class=...>` in `hibernate.cfg.xml` and `hibernate.cfg.xml.example`. There is no scanning. `PatientDrugInvoice` and `EmployeeStatatistic` are deliberately non-entities (report DTOs). The schema is created by `hbm2ddl.auto=update`.
- `Employee` is `SINGLE_TABLE` with discriminator column `type` (`Admin` is the base value). Subclasses: Doctor, Nurse, Lab, Xray, Pharmatiest (`pharmacist`), Receptioniest (`Receptionist`), Accountant.
- `Employee.qualifications` and `Employee.workExperinces` are `Set`s. Hibernate 5 fails on multiple eager `List` bags.
- Security is stateless JWT (`SecurityConfig`, `JwtAuthenticationFilter`, `JwtService`). Public paths: `/api/auth/login`, `/api/public/**`, Swagger. Config keys are `app.jwt.*` and `app.cors.*` in `application.yml`; `JWT_SECRET` must be at least 32 bytes.
- Passwords are `Hashing.md5Base64()` (wraps `PasswordEncryption.encrypt()`); existing stored hashes must keep matching.
- Drug sale IDs are hand-managed. `getMaxIDObject()` plus a raw SQL insert in `HospitalService.sellDrug` uses `id + 1`. Do not switch to `save()` without changing both.
- Seed data assumes `Category` id 1 exists.
- Raw SQL uses real table/column names (`Messages`, `fto_employee_id`, `SelledDrugs`, `BookBeds`). Keep them in sync with entity mappings.
- Dates use the `MM/dd/yyyy` format (`FormateDate`, `api/common/Dates`).

## Reports
- Jasper templates live in `backend/src/main/resources/reports/` (`employeeReport.jrxml`, `Invoice.jrxml`, `invoice_logo.png`) and are compiled once and cached by `ReportService`. PDF export needs the `jasperreports-pdf` module.

## Frontend architecture
- Entry: `src/main.tsx` -> `App.tsx`. Routes are declared in `App.tsx` using the `ROUTES` constants in `src/utils/constants.ts`, wrapped in `ProtectedRoute allowedRoles={[...]}`.
- Role names in `allowedRoles` must match the backend discriminator values, which include the legacy spellings (`Receptionist`/`Receptioniest`, `pharmacist`/`Pharmatiest`).
- API access: `src/api/client.ts` (Axios, bearer token in `localStorage` key `hospital_auth_token`) plus one `src/services/*Service.ts` per backend area. Shared API types are in `src/api/types.ts`.
- Use the `@/` alias for `src/`. TypeScript is strict with `noUnusedLocals`/`noUnusedParameters`, so unused imports fail `npm run build`.

## Code style
- Match the surrounding file; there is no formatter. `models`, `DbConfig` and `utils` use tabs; `entities`, `queries` and the `api` package mostly use 4 spaces.
- Keep the existing misspelled names (`Pharmatiest`, `Receptioniest`, `WorkExperince`, `EmployeeStatatistic`, `roleBack`, `FormateDate`, `Selled*`). They are referenced in raw SQL, DTOs, the frontend role checks and Jackson mixins, so renaming breaks things.
