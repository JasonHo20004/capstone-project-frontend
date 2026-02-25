import type {
  Transaction,
  TransactionType,
  TransactionStatus,
} from "@/domain";
import type { ApiResponse } from "../types";

/**
 * Transaction API Types - request/response contracts for admin transaction management endpoints
 */

export interface TransactionFilters {
  search?: string;
  status?: TransactionStatus | 'all';
  transactionType?: TransactionType | 'all';
  startDate?: string;
  endDate?: string;
  walletId?: string;
  page?: number;
  limit?: number;
}

/** Extended transaction type with relationships for list/detail views */
export interface TransactionWithRelations extends Transaction {
  wallet: {
    id: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      profilePicture?: string;
    };
  };
  order?: {
    id: string;
    totalAmount: number;
    createdAt: string;
  } | null;
  topupOrder?: {
    id: string;
    realMoney: number;
    paymentMethod: string;
  } | null;
}

export interface TransactionListResponse {
  transactions: TransactionWithRelations[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TransactionDetailResponse {
  transaction: TransactionWithRelations;
}

export interface TransactionStats {
  totalAmount: number;
  successCount: number;
  pendingCount: number;
  failedCount: number;
  byType: {
    DEPOSIT: number;
    PAYMENT: number;
    MONTHLYFEE: number;
    WITHDRAW: number;
  };
}

// Response aliases for better readability

export type GetTransactionsResponse = ApiResponse<TransactionListResponse>;

export type GetTransactionDetailResponse = ApiResponse<TransactionDetailResponse>;

export type GetTransactionStatsResponse = ApiResponse<TransactionStats>;
