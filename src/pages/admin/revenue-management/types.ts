/**
 * UI Types - Revenue Management screen
 * Filter form state, view models (mapped to API params by component/hook)
 */

import type { TransactionType } from "@/domain";

/** Form filter state - UI values for revenue filters */
export interface RevenueFilterFormValues {
  startDate: string;
  endDate: string;
  period: "all" | "today" | "week" | "month" | "quarter" | "year";
  transactionType: TransactionType | "all";
  page: number;
  limit: number;
}

/** Default values for revenue filter form */
export const defaultRevenueFilterFormValues: RevenueFilterFormValues = {
  startDate: "",
  endDate: "",
  period: "all",
  transactionType: "all",
  page: 1,
  limit: 10,
};
