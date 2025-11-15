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

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error response type
export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

// Common request/response types
export interface EmptyResponse {
  message?: string;
  success?: boolean;
}

