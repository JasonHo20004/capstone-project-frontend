import { Transaction, TransactionType, TransactionStatus } from '@/types/type';

export interface TransactionFilters {
  search?: string; // Search by description or ID
  status?: TransactionStatus | 'all';
  transactionType?: TransactionType | 'all';
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  walletId?: string;
  page?: number;
  limit?: number;
}

// Extended transaction type with relationships
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
  transaction: Transaction;
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
