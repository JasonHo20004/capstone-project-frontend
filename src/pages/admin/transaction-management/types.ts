/**
 * UI Types - Transaction Management screen
 * Filter form state, view models (mapped to API params by component/hook)
 */

import type { TransactionStatus } from "@/domain";
import type { TransactionWithRelations } from "@/lib/api/types/transaction.types";

/** Form filter state - immediate UI values (before apply) */
export interface TransactionFilterFormValues {
  searchText: string;
  status: TransactionStatus | "all";
  transactionType: "DEPOSIT" | "PAYMENT" | "MONTHLYFEE" | "WITHDRAW" | "all";
  startDate: string;
  endDate: string;
}

/** Default values for filter form */
export const defaultTransactionFilterFormValues: TransactionFilterFormValues = {
  searchText: "",
  status: "all",
  transactionType: "all",
  startDate: "",
  endDate: "",
};

/** View model for transaction list row (can extend with UI-only fields) */
export type TransactionRowViewModel = TransactionWithRelations;
