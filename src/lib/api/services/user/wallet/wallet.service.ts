import apiClient from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';
import type { Wallet, Transaction } from '@/domain';
import type { PaginationMeta } from '@/lib/api/types';

export interface WalletTransactionsResponse {
  data: Transaction[];
  pagination: PaginationMeta;
}

export interface WalletSummary {
  monthlyTopupAmount: number;
  monthlySuccessfulTransactions: number;
}

class WalletService {
  /**
   * Get current user's wallet
   * GET /wallet
   */
  async getWallet(): Promise<ApiResponse<Wallet>> {
    const response = await apiClient.get<ApiResponse<Wallet>>('/wallet');
    return response.data;
  }

  /**
   * Deposit money into wallet
   * POST /wallet/deposit
   */
  async deposit(amount: number, description?: string): Promise<ApiResponse<Wallet>> {
    const response = await apiClient.post<ApiResponse<Wallet>>('/wallet/deposit', {
      amount,
      description,
    });
    return response.data;
  }

  /**
   * Get wallet transaction history
   * GET /wallet/transactions
   */
  async getTransactions(params?: {
    page?: number;
    limit?: number;
  }): Promise<WalletTransactionsResponse> {
    const response = await apiClient.get<WalletTransactionsResponse>(
      '/wallet/transactions',
      { params }
    );
    return response.data;
  }

  async getSummary(): Promise<ApiResponse<WalletSummary>> {
    const response = await apiClient.get<ApiResponse<WalletSummary>>('/wallet/summary');
    return response.data;
  }
}

export const walletService = new WalletService();
