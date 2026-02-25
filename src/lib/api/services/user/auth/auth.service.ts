import apiClient from '@/lib/api/config';
import type {
  LoginRequest,
  LoginApiResponse,
  RegisterRequest,
  RegisterApiResponse,
  RefreshTokenRequest,
  RefreshTokenApiResponse,
  LogoutApiResponse,
} from '@/lib/api/types/auth.types';

class AuthService {
  /**
   * Đăng nhập
   */
  async login(data: LoginRequest): Promise<LoginApiResponse> {
    const response = await apiClient.post<LoginApiResponse>(
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
  ): Promise<RefreshTokenApiResponse> {
    const response = await apiClient.post<RefreshTokenApiResponse>(
      '/auth/refresh',
      data
    );
    return response.data;
  }

  /**
   * Đăng ký
   */
  async register(data: RegisterRequest): Promise<RegisterApiResponse> {
    const response = await apiClient.post<RegisterApiResponse>(
      '/users/register',
      data
    );
    return response.data;
  }

  /**
   * Đăng xuất
   */
  async logout(): Promise<LogoutApiResponse> {
    const response = await apiClient.post<LogoutApiResponse>(
      '/auth/logout',
    );
    return response.data;
  }
}

export const authService = new AuthService();

