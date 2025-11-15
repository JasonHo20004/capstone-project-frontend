import apiClient from '../config';
import type { ApiResponse, EmptyResponse } from '../types';

/**
 * Auth Service - Xử lý tất cả API calls liên quan đến authentication
 */

// Types cho Auth
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
    name: string;
    role: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

class AuthService {
  /**
   * Đăng nhập
   */
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      data
    );
    return response.data;
  }

  /**
   * Refresh token
   */
  async refreshToken(
    data: RefreshTokenRequest
  ): Promise<ApiResponse<RefreshTokenResponse>> {
    const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>(
      '/auth/refresh',
      data
    );
    return response.data;
  }

  /**
   * Đăng ký
   */
  async register(data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    const response = await apiClient.post<ApiResponse<RegisterResponse>>(
      '/auth/register',
      data
    );
    return response.data;
  }

  /**
   * Đăng xuất
   */
  async logout(): Promise<ApiResponse<EmptyResponse>> {
    const response = await apiClient.post<ApiResponse<EmptyResponse>>(
      '/auth/logout'
    );
    return response.data;
  }
}

export const authService = new AuthService();

