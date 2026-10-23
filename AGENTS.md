# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Commands
- Build: `mvn clean package` (Java 17, `<release>17</release>` in `maven-compiler-plugin`; WAR at `target/HospitalSystemV2-1.0-SNAPSHOT.war`).
- Stack: Struts 6.8.0, Hibernate 5.6 (`hibernate-core`, no `hibernate-entitymanager`), JasperReports 7.0.7 + `jasperreports-pdf` (OpenPDF; iText 2.1.7 and Gson are gone). The code still uses the `javax.*` namespace (Tomcat 9), so do not introduce `jakarta.*`.
- `pom.xml` pins versions through `dependencyManagement` (Jackson BOM, FreeMarker). Do NOT pin `ognl` to 3.4.13; it is binary-incompatible with Struts 6.8.0 (`NoSuchMethodError` at startup). `javassist` is excluded from `struts2-core` and added back explicitly.
- No lint config. No tests exist (`src/test` absent; JUnit 4.13.2 is declared). A single test would be `mvn test -Dtest=ClassName#method`.
- Run: Oracle + Tomcat 9 (`tomcat:9-jdk17`) in a Podman pod (see `README.md`). Redeploy = `mvn clean package && podman restart tomcat` (WAR is bind-mounted).
- DB credentials: `bash setup-credentials.sh <user> <pass>` rewrites `src/main/resources/hibernate.cfg.xml` in place. `cleanup.sh` resets it to `YOUR_APP_USER`/`YOUR_APP_PASSWORD`. The file is git-tracked despite the script's comment, so never commit real credentials. The working tree currently holds real credentials (`hadeel`/`hadeel`), so run `cleanup.sh` before committing.
- Seed (first run only, NOT idempotent): `java -cp "target/classes:target/HospitalSystemV2-1.0-SNAPSHOT/WEB-INF/lib/*" com.hospital.queries.TestDbConnection`. This is a `main()`, not a test. It must run before `sample-data/SampleData.java`. Login `admin`/`123456`.

## Architecture gotchas
- **Two routing systems exist, only one is used by JSPs.** JSPs submit to `Process?action=<ActionType name>` and `ProcessAction.execute()` dispatches through an if/else chain to `*Listener` singletons. The `admin_*`, `doctor_*` and similar wildcard mappings in `struts.xml` go to `*Action` classes that are thin wrappers around the same listeners. To add an operation, do all of these:
  1. Add a constant to `utils/ActionType.java`.
  2. Add a branch to `ProcessAction`.
  3. Add a method to the matching `*Listener`.
  4. Add the DAO method to the interface and to `HospitalService`.
- `ActionType` casing is inconsistent (`deleteEmployee` vs `DeleteRoom`). JSPs use the exact enum name.
- `struts.xml` has `struts.enable.DynamicMethodInvocation=false` and `global-allowed-methods` is an explicit comma-separated whitelist (no longer `regex:.*`). A new public method on a `*Action` class that is reached through a `struts.xml` mapping must be added to that list or Struts will reject it.
- `HospitalService` is a singleton implementing every `*DAO` interface and extending `HibernateDriver`. `HibernateDriver` keeps ONE `session`/`transaction` as instance fields, so it is not thread-safe. Each method follows `openSession()` → work → `closeSession()` (commits) in `finally`, with `roleBack()` in `catch`.
- DAO methods swallow exceptions (`printStackTrace`) and return `null` or `0` on failure. Callers must null-check lists.
- Every new `@Entity` must be added to `<mapping class=...>` in `hibernate.cfg.xml`. There is no scanning. `PatientDrugInvoice` and `EmployeeStatatistic` are deliberately non-entities (report/query DTOs). The schema is created by `hbm2ddl.auto=update`.
- `Employee` is `SINGLE_TABLE` with discriminator column `type` (`Admin` is the base value). Subclasses are Doctor, Nurse, Lab, Xray, Pharmatiest, Receptioniest and Accountant. The login stores the `Employee` in session attribute `"employee"`, and listeners cast it to the subclass (e.g. `(Pharmatiest) session.getAttribute("employee")`).
- `Employee.qualifications` and `Employee.workExperinces` are `Set`s (`HashSet`), not `List`s. Hibernate 5 fails on multiple eager `List` bags, so use `Set<Qualification>` / `Set<WorkExperince>` in `AdminListener` and anywhere else they are set.
- Passwords are `PasswordEncryption.encrypt()` (MD5 then Base64). Login compares the stored hash.
- Drug sale IDs are hand-managed. `getMaxIDObject()` plus a raw SQL insert in `HospitalService.sellDrug` uses `id + 1`. Do not switch to `save()` without changing both.
- Seed data assumes `Category` id 1 exists (`TestDbConnection.addAdmin`).
- Raw SQL uses real table/column names (`Messages`, `fto_employee_id`, `SelledDrugs`, `BookBeds`). Keep them in sync with entity mappings.

## Reports
- Jasper templates are loaded at runtime from `src/main/webapp/reports/` (`employeeReport.jrxml`, `Invoice.jrxml`, `invoice_logo.png`). They are compiled on every request. `/reports/.*` is excluded from Struts via `struts.action.excludePattern`. PDF export needs the `jasperreports-pdf` module (JasperReports 7).
- `src/main/webapp/WEB-INF/reports/` and `src/main/java/com/hospital/reports/` hold unused or duplicate templates. Edit the `webapp/reports/` copy.

## Code style
- Match the surrounding file; there is no formatter. Files mix tabs (older DAO/util/model code) and 4 spaces (Struts action classes).
- Keep the existing misspelled names (`Pharmatiest`, `Receptioniest`, `Diesease`, `WorkExperince`, `EmployeeStatatistic`, `roleBack`, `FormateDate`, `Selled*`). They are referenced across JSPs, SQL, `ActionType` and `struts.xml`, so renaming breaks things.
- Listeners are `private`-constructor singletons with `getInstance()`. Errors are handled by `printStackTrace()` plus `response.sendRedirect("<page>.jsp?error=true")`, and success by `?add=true` or `?delete=true`.
- JSP pages: top-level `*.jsp` (e.g. `empmgmt.jsp`) are shells that `jsp:include` fragments from `admin/`, `reception/`, `pharmacy/`, `doctor/`, `nurse/`, `accountant/` and `templates/`.
