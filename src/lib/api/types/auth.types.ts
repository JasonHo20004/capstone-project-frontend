import type { ApiResponse, EmptyResponse } from "@/lib/api/types";

/**
 * Auth API Types - request/response contracts for authentication endpoints
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

// Single, canonical definition of RegisterRequest
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  dateOfBirth?: string; // ISO String
}

export interface RegisterResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

// Response aliases for better readability

export type LoginApiResponse = ApiResponse<LoginResponse>;

export type RegisterApiResponse = ApiResponse<RegisterResponse>;

export type RefreshTokenApiResponse = ApiResponse<RefreshTokenResponse>;

export type LogoutApiResponse = ApiResponse<EmptyResponse>;

