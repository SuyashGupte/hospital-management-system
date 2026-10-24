import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { EmployeeList } from './components/admin/EmployeeList';
import { RoomManagement } from './components/admin/RoomManagement';
import { NurseServiceRoster } from './components/admin/NurseServiceRoster';

// Receptionist Components
import { PatientList } from './components/reception/PatientList';
import { BedBookingManagement } from './components/reception/BedBookingManagement';

// Doctor Components
import { DoctorDiagnoses } from './components/doctor/DoctorDiagnoses';

// Nurse and Clinical Staff Components
import { NurseScheduleView } from './components/nurse/NurseScheduleView';
import { ClinicalPatientDirectory } from './components/clinical/ClinicalPatientDirectory';

// Pharmacy Components
import { DrugInventory } from './components/pharmacy/DrugInventory';
import { DrugDispensing } from './components/pharmacy/DrugDispensing';

// Accountant Components
import { PatientFeeBilling } from './components/accountant/PatientFeeBilling';

// Messaging Components
import { MessagesInbox } from './components/messaging/MessagesInbox';
import { MessagesSent } from './components/messaging/MessagesSent';
import { MessagesCompose } from './components/messaging/MessagesCompose';

// Profile Component
import { UserProfile } from './components/profile/UserProfile';

import { ROUTES } from './utils/constants';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Shell Layout wrapper */}
                <Route element={<AppLayout />}>
                  {/* Public routes */}
                  <Route path={ROUTES.HOME} element={<LandingPage />} />
                  <Route path={ROUTES.LOGIN} element={<LoginPage />} />

                  {/* Admin Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                    <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
                    <Route path={ROUTES.ADMIN_EMPLOYEES} element={<EmployeeList />} />
                    <Route path={ROUTES.ADMIN_ROOMS} element={<RoomManagement />} />
                    <Route path={ROUTES.ADMIN_SERVICE_TIMES} element={<NurseServiceRoster />} />
                  </Route>

                  {/* Receptionist Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['Admin', 'Receptionist', 'Receptioniest']} />}>
                    <Route path={ROUTES.RECEPTION_PATIENTS} element={<PatientList />} />
                    <Route path={ROUTES.RECEPTION_BOOK_BED} element={<BedBookingManagement />} />
                  </Route>

                  {/* Doctor Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['Admin', 'Doctor']} />}>
                    <Route path={ROUTES.DOCTOR_DIAGNOSES} element={<DoctorDiagnoses />} />
                  </Route>

                  {/* Nurse, Lab, and Xray Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['Admin', 'Nurse', 'Lab', 'Xray']} />}>
                    <Route path={ROUTES.NURSE_SERVICE_TIMES} element={<NurseScheduleView />} />
                    <Route path={ROUTES.VIEW_PATIENTS} element={<ClinicalPatientDirectory />} />
                  </Route>

                  {/* Pharmacy Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['Admin', 'pharmacist', 'Pharmatiest']} />}>
                    <Route path={ROUTES.PHARMACY_DRUGS} element={<DrugInventory />} />
                    <Route path={ROUTES.PHARMACY_SALES} element={<DrugDispensing />} />
                  </Route>

                  {/* Accountant Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['Admin', 'Accountant']} />}>
                    <Route path={ROUTES.ACCOUNTANT_FEES} element={<PatientFeeBilling />} />
                  </Route>

                  {/* Messaging Routes (All authenticated users) */}
                  <Route element={<ProtectedRoute />}>
                    <Route path={ROUTES.MESSAGES_INBOX} element={<MessagesInbox />} />
                    <Route path={ROUTES.MESSAGES_SENT} element={<MessagesSent />} />
                    <Route path={ROUTES.MESSAGES_COMPOSE} element={<MessagesCompose />} />
                    <Route path={ROUTES.PROFILE} element={<UserProfile />} />
                  </Route>

                  {/* 404 Catch-All */}
                  <Route path="/404" element={<NotFoundPage />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
