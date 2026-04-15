import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/types";
import { authService } from "../api/services";

type ErrorWithDetails = {
  code?: string;
  message?: string;
  response?: { status?: number; data?: { message?: string; error?: string } };
};

/**
 * Extracts a user-friendly error message from an unknown error.
 * Handles common cases: timeout, 401, 503, S3/connection errors.
 */
function extractErrorMessage(error: unknown): string {
  const err = error as ErrorWithDetails;
  const apiMessage = getErrorMessage(error);

  // Timeout / connection aborted
  if (err?.code === "ECONNABORTED" || err?.message?.includes("timeout")) {
    return "Thời gian tải lên quá lâu. File video quá lớn hoặc kết nối chậm. Vui lòng thử lại với file nhỏ hơn hoặc kiểm tra kết nối mạng.";
  }

  // 401 Unauthorized
  if (err?.response?.status === 401) {
    void authService.logout().catch(() => undefined);
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.";
  }

  // 503 Service Unavailable
  if (err?.response?.status === 503) {
    return apiMessage || "Dịch vụ lưu trữ file hiện không khả dụng.";
  }

  // 400 with S3/connection errors
  if (err?.response?.status === 400 && apiMessage) {
    if (
      apiMessage.includes("getaddrinfo") ||
      apiMessage.includes("EAI_AGAIN") ||
      apiMessage.includes("S3")
    ) {
      return "Lỗi kết nối dịch vụ lưu trữ. Không thể kết nối đến dịch vụ lưu trữ file. Vui lòng thử lại sau hoặc liên hệ quản trị viên.";
    }
  }

  if (apiMessage) return apiMessage;
  if (error instanceof Error) return error.message;
  return "An error occurred";
}

/**
 * Global error handler for React Query.
 * Shows a toast notification for failed queries and mutations.
 * Use with QueryCache.onError and MutationCache.onError.
 */
export function handleQueryError(error: unknown): void {
  const err = error as ErrorWithDetails;
  if (err?.response?.status === 403) return;

  const message = extractErrorMessage(error);
  toast.error(message, { id: "GLOBAL_QUERY_ERROR" });
}

export function handleMutationError(error: unknown): void {
  const message = extractErrorMessage(error);
  toast.error(message);
}
