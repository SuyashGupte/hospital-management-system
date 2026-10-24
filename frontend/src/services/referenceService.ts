import apiClient from '../api/client';
import type {
  Category,
  RoomType,
  BloodGroup,
  ShiftTime,
} from '../api/types';

export const referenceService = {
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/lookups/categories');
    return response.data;
  },

  async getRoomTypes(): Promise<RoomType[]> {
    const response = await apiClient.get<RoomType[]>('/lookups/room-types');
    return response.data;
  },

  async getBloodGroups(): Promise<BloodGroup[]> {
    const response = await apiClient.get<BloodGroup[]>('/lookups/blood-groups');
    return response.data;
  },

  async getShiftTimes(): Promise<ShiftTime[]> {
    const response = await apiClient.get<ShiftTime[]>('/lookups/shift-times');
    return response.data;
  },

  async getEmployeeTypes(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/lookups/employee-types');
    return response.data;
  },

  async getPublicBloodGroups(): Promise<BloodGroup[]> {
    const response = await apiClient.get<BloodGroup[]>('/public/blood-groups');
    return response.data;
  },
};
