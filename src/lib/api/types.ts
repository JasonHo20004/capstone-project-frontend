/**
 * Common API Response Types
 */

// Generic API Response wrapper
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success?: boolean;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Error response type
export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

// Type for API error with axios response structure
export interface ErrorWithResponse {
  response?: { data?: { message?: string } };
}

export function getErrorMessage(error: unknown): string | undefined {
  const e = error as ErrorWithResponse;
  return e.response?.data?.message;
}

// Common request/response types
export interface EmptyResponse {
  message?: string;
  success?: boolean;
}



