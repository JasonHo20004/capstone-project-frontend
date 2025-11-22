import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  authService,
  type LoginRequest,
  type RegisterRequest,
  type LoginResponse,
} from "@/lib/api/services";
import { AxiosError } from "axios";
import type { ApiError } from "@/lib/api/types";

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
      const data =
        typeof (response as any)?.data !== "undefined"
          ? (response as { data: LoginResponse }).data
          : (response as unknown as LoginResponse);

      const { accessToken, user } = data;
      // Lưu tokens vào localStorage
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      queryClient.setQueryData(["user", "me"], user);
      navigate("/");
    },
    onError: (error) => {
      // Error đã được xử lý trong interceptor, nhưng có thể custom thêm ở đây
      console.error("Login error:", error);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),

    onSuccess: (_response) => {
      // Response bây giờ chỉ chứa thông tin user, KHÔNG có token
      // const user = response.data;

      // 1. Thông báo thành công
      toast.success("Đăng ký thành công!", {
        description: "Vui lòng đăng nhập bằng tài khoản vừa tạo.",
      });

      // 2. Chuyển hướng về trang Login (Thay vì trang chủ)
      navigate("/login");
    },

    // onError: (_error: AxiosError<ApiError>) => {
    //   const message =
    //     "Đăng ký thất bại. Vui lòng thử lại.";
    //   toast.error(message);
    // },
  });
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Xóa tokens
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      // Clear query cache
      queryClient.clear();

      toast.success("Đăng xuất thành công!");
      navigate("/login");
    },
    onError: (error) => {
      // Ngay cả khi API fail, vẫn logout local
      localStorage.removeItem("accessToken");
      // localStorage.removeItem('refreshToken');
      queryClient.clear();
      navigate("/login");
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
