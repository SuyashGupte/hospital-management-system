import apiClient from '../api/client';
import type {
  Room,
  RoomRequest,
  NurseServiceTime,
  ServiceTimeRequest,
  ShiftTime,
} from '../api/types';

export const facilityService = {
  async getAllRooms(): Promise<Room[]> {
    const response = await apiClient.get<Room[]>('/rooms');
    return response.data;
  },

  async getAvailableRooms(): Promise<Room[]> {
    const response = await apiClient.get<Room[]>('/rooms/available');
    return response.data;
  },

  async createRoom(room: RoomRequest): Promise<Room> {
    const response = await apiClient.post<Room>('/rooms', room);
    return response.data;
  },

  async updateRoom(id: number, room: RoomRequest): Promise<Room> {
    const response = await apiClient.put<Room>(`/rooms/${id}`, room);
    return response.data;
  },

  async deleteRoom(id: number): Promise<void> {
    await apiClient.delete(`/rooms/${id}`);
  },

  async getNurseServiceTimes(): Promise<NurseServiceTime[]> {
    const response = await apiClient.get<NurseServiceTime[]>('/service-times');
    return response.data;
  },

  async getMyServiceTimes(): Promise<NurseServiceTime[]> {
    const response = await apiClient.get<NurseServiceTime[]>('/service-times/mine');
    return response.data;
  },

  async createNurseServiceTime(request: ServiceTimeRequest): Promise<NurseServiceTime> {
    const response = await apiClient.post<NurseServiceTime>('/service-times', request);
    return response.data;
  },

  async updateNurseServiceTime(id: number, request: ServiceTimeRequest): Promise<NurseServiceTime> {
    const response = await apiClient.put<NurseServiceTime>(`/service-times/${id}`, request);
    return response.data;
  },

  async deleteNurseServiceTime(id: number): Promise<void> {
    await apiClient.delete(`/service-times/${id}`);
  },

  async getShiftTimes(): Promise<ShiftTime[]> {
    const response = await apiClient.get<ShiftTime[]>('/lookups/shift-times');
    return response.data;
  },
};
