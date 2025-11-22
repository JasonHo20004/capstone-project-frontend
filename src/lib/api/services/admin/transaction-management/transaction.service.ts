import apiClient from '../../../config';
import type { ApiResponse } from '../../../types';
import type {
  TransactionFilters,
  TransactionListResponse,
  TransactionDetailResponse,
  TransactionStats
} from '../../../types/transaction.types';

class TransactionManagementService {
  /**
   * Get all transactions with filters and pagination
   */
  async getTransactions(filters: TransactionFilters = {}): Promise<ApiResponse<TransactionListResponse>> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.transactionType && filters.transactionType !== 'all') params.append('transactionType', filters.transactionType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.walletId) params.append('walletId', filters.walletId);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<ApiResponse<TransactionListResponse>>(
      `/admin/transactions?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get transaction details by ID
   */
  async getTransactionById(transactionId: string): Promise<ApiResponse<TransactionDetailResponse>> {
    const response = await apiClient.get<ApiResponse<TransactionDetailResponse>>(
      `/admin/transactions/${transactionId}`
    );
    return response.data;
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(filters: TransactionFilters = {}): Promise<ApiResponse<TransactionStats>> {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.transactionType && filters.transactionType !== 'all') params.append('transactionType', filters.transactionType);

    const response = await apiClient.get<ApiResponse<TransactionStats>>(
      `/admin/transactions/stats?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Export transactions to CSV/Excel
   */
  async exportTransactions(filters: TransactionFilters = {}, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.transactionType && filters.transactionType !== 'all') params.append('transactionType', filters.transactionType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    params.append('format', format);

    const response = await apiClient.get(
      `/admin/transactions/export?${params.toString()}`,
      { responseType: 'blob' }
    );
    return response.data;
  }
}

export const transactionManagementService = new TransactionManagementService();
