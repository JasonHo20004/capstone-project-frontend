import apiClient from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';
import type { Tag } from '@/types/type';

export interface CreateTagDTO {
  name: string;
}

export interface UpdateTagDTO {
  name: string;
}

class TagService {
  /**
   * Lấy tất cả các tag có sẵn
   */
  async getAllTags(): Promise<ApiResponse<Tag[]>> {
    const response = await apiClient.get<ApiResponse<Tag[]>>('/tags');
    return response.data;
  }

  /**
   * Tạo tag mới (Admin only)
   */
  async createTag(data: CreateTagDTO): Promise<ApiResponse<Tag>> {
    const response = await apiClient.post<ApiResponse<Tag>>('/tags/create', data);
    return response.data;
  }

  /**
   * Cập nhật tag (Admin only)
   */
  async updateTag(tagId: string, data: UpdateTagDTO): Promise<ApiResponse<Tag>> {
    const response = await apiClient.post<ApiResponse<Tag>>(`/tags/update/${tagId}`, data);
    return response.data;
  }
}

export const tagService = new TagService();