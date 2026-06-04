import apiClient from "@/lib/api/config";
import type { ApiResponse } from "@/lib/api/types";
import type { User } from "@/domain";

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
      "users"
    );
    return response.data;
  }

  async getUserById(userId: string): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>(
      `users/${userId}`
    );
    return response.data;
  }

  async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    const response = await apiClient.post<ApiResponse<User>>(
      "users/create",
      data
    );
    return response.data;
  }

  async updateUser(data: UpdateUserRequest): Promise<ApiResponse<User>> {
    const response = await apiClient.put<ApiResponse<User>>(
      `users/${data.id}`,
      data
    );
    return response.data;
  }

  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `users/${userId}`
    );
    return response.data;
  }

  async updateUserStatus(
    userId: string,
    payload: UpdateUserStatusRequest,
  ): Promise<ApiResponse<UpdateUserStatusResult>> {
    const response = await apiClient.patch<ApiResponse<UpdateUserStatusResult>>(
      `users/${userId}/status`,
      payload,
    );
    return response.data;
  }
}

export type UserStatusValue = "ACTIVE" | "SUSPENDED" | "BANNED";

export interface UpdateUserStatusRequest {
  status: UserStatusValue;
  reason: string;
  suspendedUntil?: string | null;
}

export interface UpdateUserStatusResult {
  id: string;
  userStatus: UserStatusValue;
  statusReason: string | null;
  suspendedUntil: string | null;
}

export const userManagementService = new UserManagementService();
