import apiClient from "@/lib/api/config";
import type { ApiResponse } from "@/lib/api/types";
import type { User, CourseSellerApplication } from "@/types/type";

export interface UpdateProfileDTO {
  fullName?: string;
  phoneNumber?: string;
  profilePicture?: string;
  dateOfBirth?: string; // ISO Date string
  englishLevel?: string;
  learningGoals?: string[];
  bio?: string;
}

class UserService {
  /**
   * Lấy-thông-tin-người-dùng-hiện-tại-(đã-xác-thực)
   */

  async updateProfile(
    data: UpdateProfileDTO | FormData
  ): Promise<ApiResponse<User>> {
    // Dùng PATCH để chỉ update những trường thay đổi
    const isFormData = data instanceof FormData;
    const response = await apiClient.put<ApiResponse<User>>(
      "/users/me/update",
      data,
      {
        headers: {
          // Nếu là FormData, axios/browser sẽ tự set boundary,
          // ta chỉ cần báo là multipart hoặc để auto (thường để auto tốt hơn)
          "Content-Type": isFormData ? undefined : "application/json",
        },
      }
    );
    return response.data;
  }
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>("/users/me");
    return response.data;
  }
  async getMe(): Promise<ApiResponse<User>> {
    // Endpoint-này-bạn-cần-có-ở-backend
    // Nó-sẽ-đọc-token-từ-header-và-trả-về-user-tương-ứng
    const response = await apiClient.get<ApiResponse<User>>("/users/me");
    return response.data;
  }

  async createCourseSellerApplication(formData: FormData): Promise<ApiResponse<any>> {
    // Axios tự động set Content-Type là multipart/form-data khi data là FormData
    // NHƯNG cần lưu ý: Đừng set thủ công Content-Type: application/json
    const response = await apiClient.post<ApiResponse<any>>(
      '/users/me/course-seller-application',
      formData,
      {
        headers: {
          // Để undefined để browser tự set boundary
          'Content-Type': undefined, 
        },
      }
    );
    return response.data;
  }
}

export const userService = new UserService();
