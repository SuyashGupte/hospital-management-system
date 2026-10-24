import apiClient from '../api/client';
import type {
  Employee,
  EmployeeRequest,
  EmployeeStatistic,
  EmployeeRole,
} from '../api/types';

export const employeeService = {
  async getAllEmployees(type?: EmployeeRole | string): Promise<Employee[]> {
    const params = type ? { type } : undefined;
    const response = await apiClient.get<Employee[]>('/employees', { params });
    return response.data;
  },

  async getRecipients(): Promise<Employee[]> {
    const response = await apiClient.get<Employee[]>('/employees/recipients');
    return response.data;
  },

  async getEmployeeById(id: number): Promise<Employee> {
    const response = await apiClient.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  async createEmployee(employee: EmployeeRequest): Promise<Employee> {
    const response = await apiClient.post<Employee>('/employees', employee);
    return response.data;
  },

  async updateEmployee(id: number, employee: EmployeeRequest): Promise<Employee> {
    const response = await apiClient.put<Employee>(`/employees/${id}`, employee);
    return response.data;
  },

  async deleteEmployee(id: number): Promise<void> {
    await apiClient.delete(`/employees/${id}`);
  },

  async uploadPhoto(id: number, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('picture', file);
    await apiClient.put(`/employees/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async getEmployeeStatistics(): Promise<EmployeeStatistic[]> {
    const response = await apiClient.get<EmployeeStatistic[]>('/employees/statistics');
    return response.data;
  },

  async downloadReportPdf(type: string): Promise<void> {
    const response = await apiClient.get(`/reports/employees/${encodeURIComponent(type)}`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  },

  getReportPdfUrl(type: string): string {
    return `/api/reports/employees/${encodeURIComponent(type)}`;
  },
};
