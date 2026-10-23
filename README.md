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
| Database | Oracle Database (JDBC thin driver, ojdbc6) |
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
<property name="hibernate.connection.username">YOUR_APP_USER</property>
<property name="hibernate.connection.password">YOUR_APP_PASSWORD</property>
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
│           APP_USER=<app_user>   APP_USER_PASSWORD=<app_password>           │
│           ORACLE_PASSWORD=<sys_password>  (SYS password)                   │
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
git clone https://github.com/salahatwa/Hospital-Management-System.git
cd Hospital-Management-System
```

### 2. Install the Oracle JDBC driver into your local Maven repository

The `ojdbc6` JAR is not available in Maven Central. Download it from [Oracle's website](https://www.oracle.com/database/technologies/jdbc-downloads.html) and install it manually:

```bash
mvn install:install-file \
  -Dfile=/path/to/ojdbc6.jar \
  -DgroupId=com.oracle \
  -DartifactId=ojdbc6 \
  -Dversion=11.2.0.3 \
  -Dpackaging=jar
```

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
  -e ORACLE_PASSWORD=<your_sys_password> \
  -e APP_USER=<your_app_user> \
  -e APP_USER_PASSWORD=<your_app_password> \
  docker.io/gvenzl/oracle-free:23-slim-faststart
```

The image automatically creates the application user and the `FREEPDB1` pluggable database on first boot.
Update [`src/main/resources/hibernate.cfg.xml`](src/main/resources/hibernate.cfg.xml) to match the credentials you chose above.
Wait ~60 seconds for Oracle to be ready before starting Tomcat.

### 6. Start Tomcat

```bash
podman run -d --pod hospital \
  --name tomcat \
  --hostname hospital \
  -v "$(pwd)/target/HospitalSystemV2-1.0-SNAPSHOT.war:/usr/local/tomcat/webapps/HospitalSystemV2.war:ro" \
  docker.io/library/tomcat:9-jdk8
```

Hibernate will auto-create all tables on first deployment (`hbm2ddl.auto=update`).

### 7. Seed the database (first run only)

#### 7a. Bootstrap lookup data + admin user

Uncomment the seed calls in [`src/main/java/com/hospital/queries/TestDbConnection.java`](src/main/java/com/hospital/queries/TestDbConnection.java) (lines 215–219):

```java
testDbConnection.addCategory();    // 6 department categories  (IDs 1–6)
testDbConnection.addBloodGroup();  // 4 blood groups           (IDs 7–10)
testDbConnection.addRoomType();    // 4 room types             (IDs 11–14)
testDbConnection.addShiftTime();   // 3 nurse shifts           (IDs 15–17)
testDbConnection.addAdmin();       // username: admin  (default credentials set in TestDbConnection.java)
```

Then compile and run from the project root:

```bash
CP="target/classes:target/HospitalSystemV2-1.0-SNAPSHOT/WEB-INF/lib/*"
java -cp "$CP" com.hospital.queries.TestDbConnection
```

Re-comment those calls afterwards to prevent duplicate inserts on re-run.

#### 7b. Load demo staff, patients, rooms, and drugs (optional)

```bash
CP="target/classes:target/HospitalSystemV2-1.0-SNAPSHOT/WEB-INF/lib/*"
mkdir -p target/sample-data
javac -cp "$CP" -d target/sample-data sample-data/SampleData.java
java  -cp "target/sample-data:$CP" SampleData
```

Idempotent — exits immediately if a Doctor record already exists. Every demo employee uses the default credentials set in [`SampleData.java`](sample-data/SampleData.java).

#### 7c. Load demo inbox messages (optional)

```bash
podman exec -i oracle sqlplus <app_user>/<app_password>@//localhost:1521/FREEPDB1 @/dev/stdin \
  < sample-data/messages.sql
```

### 8. Access the application

```
http://localhost:8080/HospitalSystemV2/
```

Login with the admin credentials configured in [`TestDbConnection.java`](src/main/java/com/hospital/queries/TestDbConnection.java).

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
