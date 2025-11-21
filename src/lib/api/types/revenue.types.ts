import { Transaction, TransactionType, TransactionStatus } from '@/types/type';

export interface RevenueStats {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  revenueGrowth: number; // Percentage
}

export interface RevenueChartData {
  name: string; // Time period label (e.g., "T1", "Mon", "10:00")
  revenue: number;
  transactions: number;
}

export interface RevenueFilters {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
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

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}
