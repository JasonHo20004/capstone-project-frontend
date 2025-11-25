import apiClient from "../../../config";
import type { ApiResponse } from "../../../types";
import type { User } from "@/types/type";

export interface GetUsersResponse {
  users: User[];
  totalWallet: number;
  userCount: number;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  dateOfBirth: string;
  englishLevel?: string;
  learningGoals: string[];
  role?: "COURSESELLER" | "ADMINISTRATOR";
  courseSellerProfile?: {
    certification: string[];
    expertise: string[];
    isActive?: boolean;
  };
  walletAllowance?: number;
}

export interface UpdateUserRequest {
  id: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  englishLevel?: string;
  learningGoals?: string[];
  role?: "COURSESELLER" | "ADMINISTRATOR";
  courseSellerProfile?: {
    id?: string;
    certification?: string[];
    expertise?: string[];
    isActive?: boolean;
  };
  walletAllowance?: number;
}

class UserManagementService {
  async getUsers(): Promise<ApiResponse<GetUsersResponse>> {
    const response = await apiClient.get<ApiResponse<GetUsersResponse>>(
      "admin/users"
    );
    return response.data;
  }

  async getUserById(userId: string): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>(
      `admin/users/${userId}`
    );
    return response.data;
  }

  async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    const response = await apiClient.post<ApiResponse<User>>(
      "admin/users/create",
      data
    );
    return response.data;
  }

  async updateUser(data: UpdateUserRequest): Promise<ApiResponse<User>> {
    const response = await apiClient.put<ApiResponse<User>>(
      `admin/users/update/${data.id}`,
      data
    );
    return response.data;
  }

  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `admin/users/delete/${userId}`
    );
    return response.data;
  }
}

export const userManagementService = new UserManagementService();
