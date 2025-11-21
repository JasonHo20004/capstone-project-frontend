import apiClient from '../../config';
import type { ApiResponse } from '../../types';
import type {
  RevenueData,
  RevenueStats,
  RevenueFilters,
  TransactionListResponse
} from '../../types/revenue.types';

class RevenueManagementService {
  /**
   * Get complete revenue data (stats + chart + transactions)
   */
  async getRevenueData(filters: RevenueFilters = {}): Promise<ApiResponse<RevenueData>> {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.period && filters.period !== 'all') params.append('period', filters.period);
    if (filters.transactionType && filters.transactionType !== 'all') params.append('transactionType', filters.transactionType);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<ApiResponse<RevenueData>>(
      `/admin/revenue?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get revenue statistics only
   */
  async getRevenueStats(filters: RevenueFilters = {}): Promise<ApiResponse<RevenueStats>> {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.period && filters.period !== 'all') params.append('period', filters.period);
    if (filters.transactionType && filters.transactionType !== 'all') params.append('transactionType', filters.transactionType);

    const response = await apiClient.get<ApiResponse<RevenueStats>>(
      `/admin/revenue/stats?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get transactions list with filters
   */
  async getTransactions(filters: RevenueFilters = {}): Promise<ApiResponse<TransactionListResponse>> {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.period && filters.period !== 'all') params.append('period', filters.period);
    if (filters.transactionType && filters.transactionType !== 'all') params.append('transactionType', filters.transactionType);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<ApiResponse<TransactionListResponse>>(
      `/admin/revenue/transactions?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Export revenue data to CSV/Excel
   */
  async exportRevenue(filters: RevenueFilters = {}, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.period && filters.period !== 'all') params.append('period', filters.period);
    if (filters.transactionType && filters.transactionType !== 'all') params.append('transactionType', filters.transactionType);
    params.append('format', format);

    const response = await apiClient.get(
      `/admin/revenue/export?${params.toString()}`,
      { responseType: 'blob' }
    );
    return response.data;
  }
}

export const revenueManagementService = new RevenueManagementService();
