import { useQuery,useMutation, useQueryClient } from '@tanstack/react-query';
import { userService , type UpdateProfileDTO} from '@/lib/api/services/user.service';
import { User } from '@/types/type';
import { AxiosError } from 'axios';
import type { ApiError } from '@/lib/api/types';
import { toast } from 'sonner';

export const useProfile = () => {
  const { data, isLoading, isError, error } = useQuery<User | null, AxiosError<ApiError>>({
    queryKey: ['profile', 'me'],
    
    // SỬA: Bỏ try...catch
    queryFn: async () => {
  
      const response = await userService.getProfile();

      return response.data; 
    },

    staleTime: 1000 * 60 * 5,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const myApplications = [];
  if (data?.courseSellerApplication) {
    myApplications.push(data.courseSellerApplication);
  }

  return {
    user: data || null,
    myApplications: myApplications,
    isLoading,
    isError,

    
    error: (error?.response?.data?.message  || error?.message) || null,
  };
};

export const useUser = () => {
  
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['user', 'me'], // Khóa-query-để-cache
    queryFn: async () => {
      try {
        const response = await userService.getMe();
        return response.data; // Trả-về-dữ-liệu-user
      } catch (e) {
        // Nếu-API-trả-về-401 (token-hết-hạn/không-hợp-lệ),
        // Interceptor-sẽ-xử-lý,-và-query-này-sẽ-bị-lỗi
        return null; // Trả-về-null-nếu-lỗi
      }
    },
    staleTime: 1000 * 60 * 5, // 5 phút-cache
    retry: false, // Không-cần-thử-lại-nếu-lỗi-(thường-là-lỗi-401)
    refetchOnWindowFocus: false, // Không-cần-tải-lại-khi-focus-window
  });

  return {
    user: data || null, // Trả-về-user-hoặc-null
    isLoading,
    isError,
    error,
  };
};
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileDTO|FormData) => userService.updateProfile(data),
    
    onSuccess: () => {
      
      
      // QUAN TRỌNG: Làm mới data để UI cập nhật ngay lập tức
      // 1. Làm mới trang Profile
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      // 2. Làm mới Navbar (nếu Navbar dùng key ['user', 'me'])
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
    
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Cập nhật thất bại';
      toast.error(message);
    },
  });
};