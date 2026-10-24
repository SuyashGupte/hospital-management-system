import apiClient from '../api/client';
import type { Disease, DiseaseRequest } from '../api/types';

export const clinicalService = {
  async getDiseases(): Promise<Disease[]> {
    const response = await apiClient.get<Disease[]>('/diseases');
    return response.data;
  },

  async getMyDiseases(): Promise<Disease[]> {
    const response = await apiClient.get<Disease[]>('/diseases/mine');
    return response.data;
  },

  async recordDisease(disease: DiseaseRequest): Promise<Disease> {
    const response = await apiClient.post<Disease>('/diseases', disease);
    return response.data;
  },

  async updateDisease(id: number, disease: DiseaseRequest): Promise<Disease> {
    const response = await apiClient.put<Disease>(`/diseases/${id}`, disease);
    return response.data;
  },

  async deleteDisease(id: number): Promise<void> {
    await apiClient.delete(`/diseases/${id}`);
  },
};
