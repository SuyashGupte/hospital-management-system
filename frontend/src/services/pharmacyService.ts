import apiClient from '../api/client';
import type {
  Drug,
  DrugRequest,
  SelledDrug,
  SaleRequest,
  SaleResult,
} from '../api/types';

export const pharmacyService = {
  async getAllDrugs(): Promise<Drug[]> {
    const response = await apiClient.get<Drug[]>('/drugs');
    return response.data;
  },

  async getDrugById(id: number): Promise<Drug> {
    const response = await apiClient.get<Drug>(`/drugs/${id}`);
    return response.data;
  },

  async createDrug(drug: DrugRequest): Promise<Drug> {
    const response = await apiClient.post<Drug>('/drugs', drug);
    return response.data;
  },

  async updateDrug(id: number, drug: DrugRequest): Promise<Drug> {
    const response = await apiClient.put<Drug>(`/drugs/${id}`, drug);
    return response.data;
  },

  async deleteDrug(id: number): Promise<void> {
    await apiClient.delete(`/drugs/${id}`);
  },

  async getSales(): Promise<SelledDrug[]> {
    const response = await apiClient.get<SelledDrug[]>('/drug-sales');
    return response.data;
  },

  async sellDrug(sale: SaleRequest): Promise<SaleResult> {
    const response = await apiClient.post<SaleResult>('/drug-sales', sale);
    return response.data;
  },

  async updateSale(id: number, sale: SaleRequest): Promise<SaleResult> {
    const response = await apiClient.put<SaleResult>(`/drug-sales/${id}`, sale);
    return response.data;
  },

  async reverseSale(id: number): Promise<void> {
    await apiClient.delete(`/drug-sales/${id}`);
  },

  async downloadInvoicePdf(saleId: number): Promise<void> {
    const response = await apiClient.post(`/drug-sales/${saleId}/invoice`, null, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  },
};
