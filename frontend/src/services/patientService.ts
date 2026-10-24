import apiClient from '../api/client';
import type {
  Patient,
  PatientRequest,
  BookBed,
  BookingRequest,
  FeeRecord,
} from '../api/types';

export const patientService = {
  async getAllPatients(): Promise<Patient[]> {
    const response = await apiClient.get<Patient[]>('/patients');
    return response.data;
  },

  async getPatientById(id: number): Promise<Patient> {
    const response = await apiClient.get<Patient>(`/patients/${id}`);
    return response.data;
  },

  async createPatient(patient: PatientRequest): Promise<Patient> {
    const response = await apiClient.post<Patient>('/patients', patient);
    return response.data;
  },

  async updatePatient(id: number, patient: PatientRequest): Promise<Patient> {
    const response = await apiClient.put<Patient>(`/patients/${id}`, patient);
    return response.data;
  },

  async deletePatient(id: number): Promise<void> {
    await apiClient.delete(`/patients/${id}`);
  },

  async getBookedBeds(): Promise<BookBed[]> {
    const response = await apiClient.get<BookBed[]>('/bookings');
    return response.data;
  },

  async bookBed(booking: BookingRequest): Promise<BookBed> {
    const response = await apiClient.post<BookBed>('/bookings', booking);
    return response.data;
  },

  async updateBookedBed(id: number, booking: BookingRequest): Promise<BookBed> {
    const response = await apiClient.put<BookBed>(`/bookings/${id}`, booking);
    return response.data;
  },

  async cancelBookedBed(id: number): Promise<void> {
    await apiClient.delete(`/bookings/${id}`);
  },

  async getFeeRecords(): Promise<FeeRecord[]> {
    const response = await apiClient.get<FeeRecord[]>('/fees');
    return response.data;
  },

  async setBookingPaidStatus(bookingId: number, paid: boolean): Promise<void> {
    await apiClient.put(`/fees/${bookingId}/payment`, { paid });
  },
};
