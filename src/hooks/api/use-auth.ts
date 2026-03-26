import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  authService,
  type LoginRequest,
  type RegisterRequest,
  type LoginResponse,
} from "@/lib/api/services/user";

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
        typeof (response as { data?: LoginResponse })?.data !== "undefined"
          ? (response as { data: LoginResponse }).data
          : (response as unknown as LoginResponse);

      const { accessToken, user } = data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      queryClient.setQueryData(["user", "me"], user);
      // Notify PurchasesContext to re-fetch enrolled courses
      window.dispatchEvent(new Event('auth-change'));
      navigate("/dashboard");
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: () => {
      toast.success("Đăng ký thành công!", {
        description: "Vui lòng kiểm tra email để xác thực tài khoản.",
      });
      navigate("/auth/verify?pending=true");
    },
  });

  // Logout mutation - onSettled ensures local cleanup even when API fails
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      queryClient.clear();
      window.dispatchEvent(new Event('auth-change'));
      toast.success("Đăng xuất thành công!");
      navigate("/login");
    },
    onSettled: (_data, error) => {
      if (error) {
        // When API fails, still clear local state and redirect
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        queryClient.clear();
        window.dispatchEvent(new Event('auth-change'));
        navigate("/login");
      }
    },
  });

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    registerError: registerMutation.error,
  };
};
