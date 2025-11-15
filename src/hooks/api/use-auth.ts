import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService, type LoginRequest, type RegisterRequest, type LoginResponse } from '@/lib/api/services';

/**
 * Custom hook cho Authentication với React Query
 * Xử lý login, logout, và quản lý token
 */
export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (response) => {
      const data = (typeof (response as any)?.data !== 'undefined')
        ? (response as { data: LoginResponse }).data
        : (response as unknown as LoginResponse);
        
      const { accessToken } = data;
      
      // Lưu tokens vào localStorage
      localStorage.setItem('accessToken', accessToken);

      navigate('/');
    },
    onError: (error) => {
      // Error đã được xử lý trong interceptor, nhưng có thể custom thêm ở đây
      console.error('Login error:', error);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (response) => {
      const { accessToken, refreshToken, user } = response.data;

      // Lưu tokens vào localStorage
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // Lưu user info vào query cache
      queryClient.setQueryData(['user'], user);

      toast.success('Đăng ký thành công!', {
        description: `Chào mừng ${user.name} đến với SkillBoost!`,
      });

      // Redirect về trang chủ
      navigate('/');
    },
    onError: (error) => {
      // Error đã được xử lý trong interceptor
      console.error('Register error:', error);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Xóa tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      // Clear query cache
      queryClient.clear();

      toast.success('Đăng xuất thành công!');
      navigate('/login');
    },
    onError: (error) => {
      // Ngay cả khi API fail, vẫn logout local
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      queryClient.clear();
      navigate('/login');
    },
  });

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
};

