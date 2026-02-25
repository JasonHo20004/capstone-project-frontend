import type { Transaction, TransactionType, TransactionStatus } from "@/domain";
import type { ApiResponse } from "@/lib/api/types";

/**
 * Revenue API Types - request/response contracts for admin revenue management endpoints
 */

export interface RevenueStats {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  revenueGrowth: number;
}

export interface RevenueChartData {
  name: string;
  revenue: number;
  transactions: number;
}

export interface RevenueFilters {
  startDate?: string;
  endDate?: string;
  period?: 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year';
  transactionType?: TransactionType | 'all';
  page?: number;
  limit?: number;
}

export interface RevenueData {
  stats: RevenueStats;
  chartData: RevenueChartData[];
  transactions: Transaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Transaction list returned by revenue endpoints (distinct from transaction-management) */
export interface RevenueTransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

// Response aliases for better readability

export type GetRevenueDataResponse = ApiResponse<RevenueData>;

export type GetRevenueStatsResponse = ApiResponse<RevenueStats>;

export type GetRevenueTransactionsResponse = ApiResponse<RevenueTransactionListResponse>;
