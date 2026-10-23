<%@page import="com.hospital.models.Employee"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
         pageEncoding="ISO-8859-1"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">


<%
Employee employee=(Employee) session.getAttribute("employee");

if(employee!=null)
	response.sendRedirect("home.jsp");

%>

<%
try {
	request.setAttribute("bloodGroups",
			com.hospital.entities.HospitalService.getInstance().getListObjects(com.hospital.models.BloodGroup.class));
} catch (Throwable t) {
	// database unavailable: the landing page still renders, the blood type list is just empty
}
%>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Hospital Management System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="assets/css/bootstrap.min.css" rel="stylesheet">
        <link href="assets/css/scrolling-nav.css" rel="stylesheet" />
        <link href="assets/css/style.css" rel="stylesheet" type="text/css" />
        <script src="assets/js/jquery-3.1.0.min.js"></script>
        <script src="assets/js/bootstrap.min.js"></script>
        <script src="assets/js/scrolling-nav.js"></script>
        <style>

            .carousel-inner>.item>a>img, .carousel-inner>.item>img{
                width:100%;
                height:600px;
            }
            .carousel-inner{
                top:90px;
            }
            .navbar-nav{
                float:right;
            }
            #hmsNav{
                width: 100%;
            }

            .modal-dialog{
                width: 350px;
            }

        </style>

<script>
function errorPassword() {
	demo.showNotification('top','right','User name or passsword error','danger');
}
function registered() {
	demo.showNotification('top','right','Registration received. A receptionist will contact you to confirm your details.','success');
}
function registrationError() {
	demo.showNotification('top','right','Registration failed. Please check the details and try again.','danger');
}
</script>

    </head>
 
<body id="page-top" <c:if test="${not empty param['error']}"> onload="errorPassword();" </c:if><c:if test="${not empty param['registered']}"> onload="registered();" </c:if><c:if test="${not empty param['regerror']}"> onload="registrationError();" </c:if> >
    
        <!-- Navigation -->
    <nav class="navbar navbar-default navbar-fixed-top" role="navigation">
        <div class="container">
            <div class="navbar-header page-scroll">
                <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-ex1-collapse">
                    <span class="sr-only">Toggle navigation</span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                </button>
                <a class="navbar-brand page-scroll" href="#page-top">Hospital Management System</a>
            </div>

            <!-- Collect the nav links, forms, and other content for toggling -->
            <div class="collapse navbar-collapse navbar-ex1-collapse">
                <ul class="nav navbar-nav">
                    <!-- Hidden li included to remove active class from about link when scrolled up past about section -->
                    <li class="hidden">
                        <a class="page-scroll" href="#page-top"></a>
                    </li>
                    <li>
                        <a class="page-scroll" href="#about">About</a>
                    </li>
                    <li>
                        <a class="page-scroll" href="#services">Services</a>
                    </li>
                    <li>
                        <a class="page-scroll" href="#contact">Contact</a>
                    </li>
                    <li><a href="#" data-toggle="modal" data-target="#login-modal">Employee Login</a></li>
                    <li><a href="#" data-toggle="modal" data-target="#signup-modal">Patient Registration</a></li>
                </ul>
            </div>
            <!-- /.navbar-collapse -->
        </div>
        <!-- /.container -->
    </nav>

    <div id="myCarousel" class="carousel slide" data-ride="carousel">
        <ol class="carousel-indicators">
            <li data-target="#myCarousel" data-slide-to="0" class="active"></li>
            <li data-target="#myCarousel" data-slide-to="1"></li>
            <li data-target="#myCarousel" data-slide-to="2"></li>
            <li data-target="#myCarousel" data-slide-to="3"></li>
            <li data-target="#myCarousel" data-slide-to="4"></li>
        </ol>

        <div class="carousel-inner" role="listbox">
            <div class="item active">
                <img src="assets/img/slide1.jpg" />
            </div>

            <div class="item">
                <img src="assets/img/slide2.jpg" />
            </div>

            <div class="item">
                <img src="assets/img/slide3.jpg" />
            </div>
            <div class="item">
                <img src="assets/img/slide4.jpg" />
            </div>
            <div class="item">
                <img src="assets/img/slide5.jpg" />
            </div>
        </div>
    </div>

    <!-- About Section -->
    <section id="about" class="about-section">
        <div class="container">
            <div class="row">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header" data-background-color="purple">
                            <h4 class="title">About Us</h4>
                            <p class="category">One system for every department of the hospital</p>
                        </div>
                        <div class="card-content">
                            <p>
                                The Hospital Management System brings the daily work of a hospital into one place.
                                Administrators, doctors, nurses, receptionists, pharmacists and accountants each sign in
                                to a workspace built for their role, and all of them work from the same up-to-date
                                patient and staff records.
                            </p>
                            <p>
                                Patient registration, bed booking, diagnoses, pharmacy sales, billing and internal
                                messaging are handled in the system, so information does not have to be copied between
                                departments or kept on paper.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Services Section -->
    <section id="services" class="services-section">
        <div class="container">
            <div class="row">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header" data-background-color="purple">
                            <h4 class="title">Our Services</h4>
                            <p class="category">What each department can do in the system</p>
                        </div>
                        <div class="card-content">
                            <div class="row">
                                <div class="col-md-4">
                                    <h4>Patient Management</h4>
                                    <p>Register patients, record next of kin and blood group, and keep patient details up to date.</p>
                                </div>
                                <div class="col-md-4">
                                    <h4>Rooms and Beds</h4>
                                    <p>Manage rooms and room types, see available beds, and book a bed for a patient.</p>
                                </div>
                                <div class="col-md-4">
                                    <h4>Doctors and Diagnosis</h4>
                                    <p>Doctors record each patient's diseases and diagnoses and can review a patient's history.</p>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <h4>Pharmacy</h4>
                                    <p>Maintain the drug inventory, sell drugs to patients and print a PDF invoice for each sale.</p>
                                </div>
                                <div class="col-md-4">
                                    <h4>Billing</h4>
                                    <p>Accountants calculate a patient's fees from room and drug charges and mark them as paid.</p>
                                </div>
                                <div class="col-md-4">
                                    <h4>Staff and Reports</h4>
                                    <p>Manage employees and nurse shifts, send messages between staff, and download employee reports as PDF.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="contact-section">
        <div class="container">
            <div class="row">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header" data-background-color="purple">
                            <h4 class="title">Contact</h4>
                            <p class="category">Who to ask for help</p>
                        </div>
                        <div class="card-content">
                            <div class="row">
                                <div class="col-md-6">
                                    <h4>Hospital staff</h4>
                                    <p>
                                        Use <strong>Employee Login</strong> at the top of this page. If you have forgotten
                                        your password or do not have an account yet, ask your system administrator.
                                    </p>
                                </div>
                                <div class="col-md-6">
                                    <h4>Patients</h4>
                                    <p>
                                        Visit the reception desk and a receptionist will register you and book your bed
                                        or appointment.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <div class="modal fade" id="login-modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true" style="display: none;">
        <div class="modal-dialog">
            <div class="loginmodal-container">
                <h1>Login to Your Account</h1><br>
                <form method="POST" action="LoginService">
                    <input type="text" name="user" placeholder="Username" required>
                    <input type="password" name="pass" placeholder="Password" required>
                    <input type="submit" name="login" class="login loginmodal-submit" value="Login">
                </form>
            </div>
        </div>
    </div>

    <div class="modal fade" id="signup-modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true" style="display: none;">
        <div class="modal-dialog">
            <div class="signupmodal-container">
                <h1>Patient Registration</h1><br>
                <form id="signupform" method="POST" action="Process?action=AddPatient">
                    <input type="hidden" name="source" value="public">
                    <input type="text" name="firstname" placeholder="First Name" required>
                    <input type="text" name="fathername" placeholder="Father Name" required>
                    <input type="text" name="familyname" placeholder="Family Name" required>
                    <input type="text" name="dob" placeholder="Date of Birth (MM/DD/YYYY)" pattern="\d{2}/\d{2}/\d{4}" title="Use MM/DD/YYYY, for example 05/20/1990" required>
                    <div class="radio">
                        <label><input type="radio" name="gender" value="male" required/> Male</label>
                        <label><input type="radio" name="gender" value="female"/> Female</label>
                    </div>
                    <select name="bloodGroupID" required>
                        <option value="">Select Blood Type</option>
                        <c:forEach items="${bloodGroups}" var="bloodGroup">
                            <option value="${bloodGroup.bloodGroupId}"><c:out value="${bloodGroup.bloodGroupName}" /></option>
                        </c:forEach>
                    </select>
                    <input type="tel" name="phone" placeholder="Phone (digits only)" pattern="\d{7,15}" title="7 to 15 digits, no spaces" required>
                    <input type="email" name="email" placeholder="Email (optional)">
                    <input type="text" name="address" placeholder="Address" required>
                    <label>Next of kin</label>
                    <input type="text" name="nfullname" placeholder="Full Name" required>
                    <input type="text" name="nrelationship" placeholder="Relationship" required>
                    <input type="tel" name="nphone" placeholder="Phone (digits only)" pattern="\d{7,15}" title="7 to 15 digits, no spaces" required>
                    <input type="text" name="naddress" placeholder="Address (optional)">
                    <input type="submit" name="signup" class="signup signupmodal-submit" value="Register">
                </form>
            </div>
        </div>
    </div>


	<!--  Notifications Plugin    -->
	<script src="assets/js/bootstrap-notify.js"></script>

	<!-- Material Dashboard DEMO methods, don't include it in your project! -->
	<script src="assets/js/demo.js"></script>

</body>
</html>
