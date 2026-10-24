/**
 * TypeScript Data Models and API Contracts for Hospital Management System
 */

// ==========================================
// Common & Reference Types
// ==========================================

export type EmployeeRole =
  | 'Admin'
  | 'Doctor'
  | 'Nurse'
  | 'Lab'
  | 'Xray'
  | 'pharmacist'
  | 'Pharmatiest'
  | 'Receptionist'
  | 'Receptioniest'
  | 'Accountant';

export interface Category {
  id?: number;
  categoryName: string;
}

export interface BloodGroup {
  id?: number;
  bloodGroup: string;
}

export interface ShiftTime {
  id?: number;
  fromTime: string;
  toTime: string;
}

export interface RoomType {
  id?: number;
  typeOfroom: string;
  roomCost: number;
}

// ==========================================
// Employee Models
// ==========================================

export interface Qualification {
  id?: number;
  instituteName: string;
  qualificationName: string;
  degree: string;
  educationDate: string;
}

export interface WorkExperience {
  id?: number;
  nameOfOrganization: string;
  position: string;
  startDate: string;
  endDate: string;
}

export interface Employee {
  id?: number;
  firstName: string;
  fatherName: string;
  familyName: string;
  userName: string;
  address: string;
  email: string;
  dob: string;
  phone: string;
  gender: 'Male' | 'Female' | string;
  category?: Category;
  qualifications?: Qualification[];
  workExperinces?: WorkExperience[];
  photo?: string;
  type: EmployeeRole;
  joinDate?: string;
}

export interface EmployeeRequest {
  firstName: string;
  fatherName: string;
  familyName: string;
  userName: string;
  address: string;
  email: string;
  dob: string; // MM/dd/yyyy
  phone: string;
  gender: string;
  categoryId: number;
  type?: string;
  password?: string;
  qualifications?: Qualification[];
  workExperiences?: WorkExperience[];
}

export interface EmployeeStatistic {
  count: number;
  type: string;
}

// ==========================================
// Patient & Next of Kin Models
// ==========================================

export interface NextOfKin {
  id?: number;
  fullName: string;
  address?: string;
  relationship: string;
  phone: string;
}

export interface Patient {
  id?: number;
  firstName: string;
  fatherName: string;
  familyName: string;
  address: string;
  email?: string;
  dob: string;
  phone: string;
  gender: 'Male' | 'Female' | string;
  bloodGroup?: BloodGroup;
  nextOfKin?: NextOfKin;
  joiningDate?: string;
}

export interface PatientRequest {
  firstName: string;
  fatherName: string;
  familyName: string;
  address: string;
  email?: string;
  dob: string; // MM/dd/yyyy
  phone: string; // 7 to 15 digits
  gender: string;
  bloodGroupId: number;
  nextOfKin: {
    fullName: string;
    address?: string;
    relationship: string;
    phone: string;
  };
}

// ==========================================
// Facility & Room Models
// ==========================================

export interface Room {
  id?: number;
  roomNumber: number;
  numberOfBeds: number;
  numberOfAvailableBeds: number;
  roomType?: RoomType;
}

export interface RoomRequest {
  roomTypeId: number;
  bedNumbers: number;
  roomNumber: number;
}

export interface BookBed {
  id?: number;
  patient?: Patient;
  room?: Room;
  departement: string;
  datePlaced?: string;
  status: boolean; // false = unpaid/occupied, true = paid/released
}

export interface BookingRequest {
  patientId: number;
  roomId: number;
  departement: string;
}

export interface FeeRecord {
  id?: number;
  booking: BookBed;
  days: number;
  roomCost: number;
  totalCost: number;
}

export interface NurseServiceTime {
  id?: number;
  nurse?: Employee;
  shiftTime?: ShiftTime;
  serviceDate: string;
  department: string;
}

export interface ServiceTimeRequest {
  nurseId: number;
  shiftTimeId: number;
  serviceDate: string; // MM/dd/yyyy
  department: string;
}

// ==========================================
// Clinical Diagnosis Models
// ==========================================

export interface Disease {
  id?: number;
  patient?: Patient;
  employee?: Employee;
  disease: string;
  note?: string;
  diseaseDate?: string;
}

export interface DiseaseRequest {
  patientId: number;
  disease: string;
  note?: string;
}

// ==========================================
// Pharmacy & Drug Models
// ==========================================

export interface Drug {
  id?: number;
  employee?: Employee;
  name: string;
  cost: number;
  quantity: number;
  drug_expired: string; // MM/dd/yyyy
  startDate?: string;
}

export interface DrugRequest {
  name: string;
  cost: number;
  quantity: number;
  startDate: string; // MM/dd/yyyy
  expiryDate: string; // MM/dd/yyyy
}

export interface SelledDrug {
  id?: number;
  drug?: Drug;
  pharmatiest?: Employee;
  patient?: Patient;
  quantity: number;
  unitPerDay: string;
  startTake: string;
  endTake: string;
  soldDate?: string;
}

export interface SaleRequest {
  drugId: number;
  patientId: number;
  quantity: number;
  unitPerDay: string;
  startTake: string; // MM/dd/yyyy
  endTake: string; // MM/dd/yyyy
}

export interface SaleResult {
  saleId: number;
  remainingStock: number;
  lowStock: boolean;
  message: string;
}

// ==========================================
// Messaging Models
// ==========================================

export interface Message {
  id?: number;
  fromEmployee?: Employee;
  toEmployee?: Employee;
  patient?: Patient;
  subject: string;
  messageBody: string;
  messageDate?: string;
  messageStatus: boolean; // false = unread, true = read
}

export interface MessageRequest {
  recipientId?: number;
  allReceptionists: boolean;
  patientId: number;
  subject: string;
  body: string;
}

export interface UnreadCount {
  unread: number;
}

// ==========================================
// Auth & User Session Models
// ==========================================

export interface LoginRequest {
  user: string;
  pass: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresInSeconds: number;
  employee: Employee;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: Employee | null;
  token: string | null;
  role: string | null;
  loading: boolean;
}

// ==========================================
// Error and API Response Types
// ==========================================

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string>;
}

export interface AppNotification {
  id: string;
  kind: 'error' | 'info' | 'success' | 'warning';
  title: string;
  subtitle?: string;
  caption?: string;
  timeout?: number;
}
