# Hospital Management System

A Java EE web application for managing hospital operations including patient management, staff administration, pharmacy, reporting, and internal messaging.

---

## Architecture

### Technology Stack

| Layer | Technology |
|---|---|
| Language | Java 8 |
| Frontend | JSP + JSTL, HTML/CSS |
| MVC Framework | Apache Struts 2.5 |
| ORM / Persistence | Hibernate 4.3 + JPA 2.1 |
| Database | Oracle Database (JDBC thin driver, ojdbc8) |
| Reporting | JasperReports 6.2 + iText 2.1.7 |
| File Upload | Apache Commons FileUpload / Commons IO |
| Build Tool | Maven 3 |
| Packaging | WAR |
| Server | Apache Tomcat 8+ / JBoss / WildFly |

---

### Package Structure

```
com.hospital
├── DbConfig/           # Hibernate session factory setup
│   ├── HibernateDriver.java
│   └── HibernateUtil.java
├── models/             # JPA entity classes (mapped to DB tables)
│   ├── Patient, Doctor, Nurse, Accountant, Pharmatiest, Receptioniest
│   ├── Employee, Drug, SelledDrug, Room, RoomType, BookBed
│   ├── BloodGroup, Category, Disease, Lab, Xray
│   ├── Message, NextOfKin, Qualification, WorkExperince
│   ├── ShiftTime, NurseServiceTime, PatientDrugInvoice
│   └── EmployeeStatatistic
├── entities/           # DAO layer (CRUD operations via Hibernate)
│   ├── HospitalService.java     # Central service facade
│   ├── AdminDAO, DoctorDAO, NurseDAO, AccountantDAO
│   ├── PharmatiestDAO, ReceptioniestDAO, EmployeeDAO
│   └── UserDAO
├── actions/            # Struts 2 Action classes (controller layer)
│   ├── LoginAction
│   ├── ProcessAction            # Dispatcher / shared actions
│   ├── AdminAction, DoctorAction, PharmatiestAction
│   ├── ReceptioniestAction, AccountancyAction
│   ├── UserAction, ReportAction
│   └── *Listener.java          # Struts 2 action interceptors
├── authentication/     # Login service & session management
│   ├── LoginService.java
│   └── Process.java
├── reports/            # JasperReports templates and generation
│   ├── Invoice_Table_Based.jrxml / .jasper
│   └── TestReports.java
├── queries/            # Ad-hoc DB query helpers
│   └── TestDbConnection.java
└── utils/              # Shared utilities
    ├── ActionType.java
    ├── Entity.java
    ├── FormateDate.java
    └── PasswordEncryption.java
```

---

### Request Flow (MVC)

```
Browser
  │
  ▼
Struts 2 Filter  (StrutsPrepareAndExecuteFilter — intercepts /*)
  │
  ▼
struts.xml routing  (e.g. admin_* → AdminAction, reception_* → ReceptioniestAction)
  │
  ▼
Action class  (validates input, calls DAO)
  │
  ▼
DAO / HospitalService  (Hibernate Session → Oracle DB)
  │
  ▼
JSP view  (JSTL, rendered back to browser)
```

---

### Role-Based Modules

| Role | Action Class | Main Views |
|---|---|---|
| Admin | `AdminAction` | `empmgmt.jsp`, `admin/` |
| Doctor | `DoctorAction` | `dieseasePatient.jsp` |
| Pharmacist | `PharmatiestAction` | `drugmgmt.jsp`, `selldrug.jsp` |
| Receptionist | `ReceptioniestAction` | `patientmgmt.jsp`, `bookBed.jsp` |
| Accountant | `AccountancyAction` | `computefees.jsp` |
| All users | `UserAction`, `ReportAction` | `home.jsp`, `inbox.jsp`, reports |

---

### Database Configuration

Hibernate is configured in [`src/main/resources/hibernate.cfg.xml`](src/main/resources/hibernate.cfg.xml):

```xml
<property name="hibernate.connection.url">jdbc:oracle:thin:@//127.0.0.1:1521/FREEPDB1</property>
<property name="hibernate.connection.username">hadeel</property>
<property name="hibernate.connection.password">hadeel</property>
<property name="hibernate.hbm2ddl.auto">update</property>
```

Schema is auto-created/updated by Hibernate on first run (`hbm2ddl.auto=update`).

---

## Prerequisites

- **Java JDK 8**
- **Maven 3.x**
- **Podman** — used to run Oracle DB and Tomcat as containers

---

## Current Runtime Setup

Both Oracle and Tomcat run inside a single Podman **pod** named `hospital`, sharing a network namespace. The WAR is bind-mounted directly from the build output into the Tomcat container — no manual copy step needed after a rebuild.

```
┌─── pod: hospital  (ports: 1521→1521, 8080→8080) ──────────────────────────┐
│                                                                             │
│  oracle   gvenzl/oracle-free:23-slim-faststart                             │
│           ORACLE_SID=FREE   service name = FREEPDB1                        │
│           APP_USER=hadeel   APP_USER_PASSWORD=hadeel                       │
│           ORACLE_PASSWORD=sys_123  (SYS/SYSTEM password)                   │
│                                                                             │
│  tomcat   tomcat:9-jdk8                                                    │
│           bind-mount:                                                       │
│             ./target/HospitalSystemV2-1.0-SNAPSHOT.war                     │
│             → /usr/local/tomcat/webapps/HospitalSystemV2.war               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

Both containers share `localhost` inside the pod, so Hibernate connects to Oracle at `127.0.0.1:1521/FREEPDB1` with no extra network config.

---

## Steps to Run

### 1. Clone the repository

```bash
git clone https://github.com/SuyashGupte/hospital-management-system.git
cd hospital-management-system
```

### 2. Set credentials

```bash
bash setup-credentials.sh hadeel hadeel
```

This writes the DB username and password into [`src/main/resources/hibernate.cfg.xml`](src/main/resources/hibernate.cfg.xml).
To use different credentials, pass them as arguments:

```bash
bash setup-credentials.sh <app_user> <app_password>
```

> The `app_user` and `app_password` must match what you pass to `-e APP_USER` and `-e APP_USER_PASSWORD` when starting the Oracle container in step 5.

### 3. Build the project

```bash
mvn clean package
```

The WAR is produced at `target/HospitalSystemV2-1.0-SNAPSHOT.war`.

### 4. Create the Podman pod

```bash
podman pod create --name hospital -p 1521:1521 -p 8080:8080
```

### 5. Start Oracle

```bash
podman run -d --pod hospital \
  --name oracle \
  --hostname hospital \
  -e ORACLE_PASSWORD=sys_123 \
  -e APP_USER=hadeel \
  -e APP_USER_PASSWORD=hadeel \
  docker.io/gvenzl/oracle-free:23-slim-faststart
```

The image automatically creates the `hadeel` application user and the `FREEPDB1` pluggable database on first boot.

**Wait for Oracle to be fully ready before proceeding — this is required.**

The health check can take a long time. Instead, watch the logs for the ready message:

```bash
podman logs -f oracle 2>&1 | grep -m1 "DATABASE IS READY TO USE"
```

This exits as soon as Oracle is ready (usually 60–90 seconds). Then proceed with the seed.

### 6. Seed the database (first run only)

#### 6a. Bootstrap lookup data + admin user

```bash
CP="target/classes:target/HospitalSystemV2-1.0-SNAPSHOT/WEB-INF/lib/*"
java -cp "$CP" com.hospital.queries.TestDbConnection
```

> If the seed hangs indefinitely, Oracle is not ready yet. Kill it (`Ctrl+C`), re-run the log watch above, then retry.

#### 6b. Load demo staff, patients, rooms, and drugs (optional)

```bash
CP="target/classes:target/HospitalSystemV2-1.0-SNAPSHOT/WEB-INF/lib/*"
mkdir -p target/sample-data
javac -cp "$CP" -d target/sample-data sample-data/SampleData.java
java  -cp "target/sample-data:$CP" SampleData
```

Idempotent — exits immediately if a Doctor record already exists. Every demo employee has password `123456`.

#### 6c. Load demo inbox messages (optional)

```bash
podman exec -i oracle sqlplus hadeel/hadeel@//localhost:1521/FREEPDB1 @/dev/stdin \
  < sample-data/messages.sql
```

### 7. Start Tomcat

```bash
podman run -d --pod hospital \
  --name tomcat \
  --hostname hospital \
  -v "$(pwd)/target/HospitalSystemV2-1.0-SNAPSHOT.war:/usr/local/tomcat/webapps/HospitalSystemV2.war:ro" \
  docker.io/library/tomcat:9-jdk8
```

### 8. Access the application

```
http://localhost:8080/HospitalSystemV2/
```

Login: **username** `admin` · **password** `123456`

---

### Redeploying after a code change

The WAR is bind-mounted read-only, so just rebuild and restart Tomcat:

```bash
mvn clean package
podman restart tomcat
```

---

## Project Screenshots

### Home Page
![home](https://user-images.githubusercontent.com/11550708/27002545-accfd84e-4d99-11e7-9252-3ca14829f4b4.PNG)

### Mobile View
![mobileview](https://user-images.githubusercontent.com/11550708/27002547-aced4104-4d99-11e7-86b2-cad04e5c0d47.PNG)

### Messaging
![viewallsentmails](https://user-images.githubusercontent.com/11550708/27002543-acb02832-4d99-11e7-9772-3dbf3d094872.PNG) ![compose](https://user-images.githubusercontent.com/11550708/27002555-ad34d654-4d99-11e7-81d8-11f8f1b335bf.PNG)

### Statistics
![statisticpage](https://user-images.githubusercontent.com/11550708/27002556-ad53f408-4d99-11e7-8a32-8e6adc9398ca.PNG)

### Drug Invoice
![druginvoice](https://user-images.githubusercontent.com/11550708/27002557-ad891e8a-4d99-11e7-8651-324a25fe8fd3.PNG)

### Employee Report
![employeereport](https://user-images.githubusercontent.com/11550708/27002549-ad0e75a4-4d99-11e7-9226-8e1372e9a679.PNG)

### Pharmacy
![pharmacy](https://user-images.githubusercontent.com/11550708/27002550-ad0ec4c8-4d99-11e7-95ac-fa8e9008a335.PNG) ![selldrug](https://user-images.githubusercontent.com/11550708/27002554-ad317e1e-4d99-11e7-8776-d4f55758286e.PNG)

### Patient Management
![bookbed](https://user-images.githubusercontent.com/11550708/27002544-acb60e64-4d99-11e7-8e3f-ffdd88afd3de.PNG) ![patient](https://user-images.githubusercontent.com/11550708/27002548-acf6d480-4d99-11e7-812d-1d82413682c8.PNG)

---

## Built With

- [Apache Struts 2](https://struts.apache.org/) — MVC framework
- [Hibernate ORM](https://hibernate.org/) — persistence
- [Oracle Database](https://www.oracle.com/database/) — relational database
- [JasperReports](https://community.jaspersoft.com/) — report generation
- [Maven](https://maven.apache.org/) — build and dependency management

## Authors

- **Salah Atwa** — [GitHub](https://github.com/salahatwa) · [LinkedIn](https://www.linkedin.com/in/salah-atwa/)
