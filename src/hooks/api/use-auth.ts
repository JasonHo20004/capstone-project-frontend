import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AxiosError } from "axios";
import {
  authService,
  type LoginRequest,
  type RegisterRequest,
  type LoginResponse,
} from "@/lib/api/services/user";
import type { VerifyEmailResponse } from "@/lib/api/types/auth.types";
import { SUBSCRIPTION_CACHE_KEY } from "@/hooks/api/use-user-subscription";

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
    onSuccess: (_response, variables) => {
      toast.success("Đăng ký thành công!", {
        description: "Vui lòng kiểm tra email để xác thực tài khoản.",
      });
      const params = new URLSearchParams({
        pending: "true",
        email: variables.email,
      });
      navigate(`/auth/verify?${params.toString()}`);
    },
  });

  // Logout mutation - onSettled ensures local cleanup even when API fails
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
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
        localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
        queryClient.clear();
        window.dispatchEvent(new Event('auth-change'));
        navigate("/login");
      }
    },
  });

  // Verify email mutation — backend returns a session, so we auto-login
  const verifyEmailMutation = useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
    onSuccess: (response) => {
      const data = (response as { data?: VerifyEmailResponse })?.data;
      if (!data) return;

      const user = {
        id: data.userId,
        email: data.email,
        fullName: data.fullName,
        role: data.role ?? "",
      };

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      queryClient.setQueryData(["user", "me"], user);
      window.dispatchEvent(new Event("auth-change"));
    },
  });

  // Resend verification mutation — surface 429 cooldown to the caller
  const resendVerificationMutation = useMutation({
    mutationFn: (email: string) => authService.resendVerification({ email }),
    onSuccess: () => {
      toast.success("Verification email sent", {
        description: "Please check your inbox.",
      });
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<{ error?: string; retryAfterSeconds?: number }>;
      if (axiosError?.response?.status === 429) {
        const seconds = axiosError.response.data?.retryAfterSeconds;
        toast.error("Please wait before trying again", {
          description: seconds ? `You can request another email in ${seconds}s.` : undefined,
        });
        return;
      }
      const message = axiosError?.response?.data?.error ?? "Failed to send verification email.";
      toast.error(message);
    },
  });

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    verifyEmail: verifyEmailMutation.mutateAsync,
    resendVerification: resendVerificationMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isVerifying: verifyEmailMutation.isPending,
    isResending: resendVerificationMutation.isPending,
    registerError: registerMutation.error,
  };
};
