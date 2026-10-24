/**
 * Application constants
 */

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'hospital_auth_token',
  USER_INFO: 'hospital_user_info',
  THEME_MODE: 'hospital_theme_mode',
} as const;

export const DATE_FORMATS = {
  API_DATE: 'MM/dd/yyyy',
  DISPLAY_DATE: 'MMM dd, yyyy',
  DISPLAY_DATETIME: 'MMM dd, yyyy HH:mm',
} as const;

export const EMPLOYEE_ROLES = {
  ADMIN: 'Admin',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  LAB: 'Lab',
  XRAY: 'Xray',
  PHARMACIST: 'pharmacist',
  PHARMATIEST: 'Pharmatiest',
  RECEPTIONIST: 'Receptionist',
  RECEPTIONIEST: 'Receptioniest',
  ACCOUNTANT: 'Accountant',
} as const;

export const ROLE_LABELS: Record<string, string> = {
  Admin: 'Administrator',
  Doctor: 'Doctor',
  Nurse: 'Nurse',
  Lab: 'Lab Technician',
  Xray: 'X-Ray Technician',
  pharmacist: 'Pharmacist',
  Pharmatiest: 'Pharmacist',
  Receptionist: 'Receptionist',
  Receptioniest: 'Receptionist',
  Accountant: 'Accountant',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_EMPLOYEES: '/admin/employees',
  ADMIN_ROOMS: '/admin/rooms',
  ADMIN_SERVICE_TIMES: '/admin/service-times',
  RECEPTION_PATIENTS: '/reception/patients',
  RECEPTION_BOOK_BED: '/reception/book-bed',
  DOCTOR_DIAGNOSES: '/doctor/diagnoses',
  NURSE_SERVICE_TIMES: '/nurse/service-times',
  VIEW_PATIENTS: '/clinical/patients',
  PHARMACY_DRUGS: '/pharmacy/drugs',
  PHARMACY_SALES: '/pharmacy/sales',
  ACCOUNTANT_FEES: '/accountant/fees',
  MESSAGES_INBOX: '/messages/inbox',
  MESSAGES_SENT: '/messages/sent',
  MESSAGES_COMPOSE: '/messages/compose',
  PROFILE: '/profile',
  CHANGE_PASSWORD: '/profile/change-password',
} as const;
