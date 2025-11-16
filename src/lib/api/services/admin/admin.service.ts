import apiClient from '../../config';
import type { ApiResponse } from '../../types';
import type { User } from '@/types/type';

class AdminService {
  async getUsers(): Promise<ApiResponse<User[]>> {
    const response = await apiClient.get<ApiResponse<User[]>>('/admin/users');
    return response.data;
  }
}

export const adminService = new AdminService();

