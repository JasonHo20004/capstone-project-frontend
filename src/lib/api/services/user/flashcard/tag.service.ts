import apiClient from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';
import type { Tag } from '@/types/type'; // (Đảm bảo bạn đã thêm `Tag` vào `types.ts`)

class TagService {
  /**
   * Lấy tất cả các tag có sẵn
   */
  async getAllTags(): Promise<ApiResponse<Tag[]>> {
    const response = await apiClient.get<ApiResponse<Tag[]>>('/tags');
    return response.data;
  }
}

export const tagService = new TagService();