import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";
import type { ApiError } from "@/lib/api/types";
type FailedQueuePromise = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void; // THAY ĐỔI: any -> unknown
};
// API Base URL - có thể lấy từ environment variable
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// Tạo axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Để gửi cookies (cho refresh token)
});

// Request Interceptor - Attach token vào mọi request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Lấy token từ localStorage
    const token = localStorage.getItem("accessToken");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: Array<FailedQueuePromise> = [];
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};
// Response Interceptor - Xử lý global error và token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Nếu request thành công, trả về response
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    
    // Chỉ xử lý lỗi 401 (Unauthorized) và không phải là request retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nếu đang trong quá trình refresh, đưa request vào hàng đợi
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = "Bearer " + token;
          }
          return apiClient(originalRequest);
        });
      }

      // Đánh dấu là đang refresh
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // **ĐIỂM SỬA CHÍNH**
        // Gọi /auth/refresh mà KHÔNG cần body.
        // Cookie (refreshToken) sẽ được gửi tự động.
        const response = await apiClient.post("/auth/refresh");

        const { accessToken } = response.data;

        // Lưu accessToken mới
        localStorage.setItem("accessToken", accessToken);

        // Cập nhật header cho apiClient
        apiClient.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${accessToken}`;

        // Xử lý hàng đợi (các request bị 401 trong khi đang refresh)
        processQueue(null, accessToken);

        // Retry request gốc với token mới
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Nếu refresh token cũng thất bại (hết hạn, bị thu hồi)
        processQueue(refreshError, null);
        handleLogout(); // Đẩy người dùng về trang đăng nhập
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false; // Xong-việc-refresh
      }
    }

    // Xử lý các lỗi API khác (nếu không phải 401)
    handleApiError(error);

    return Promise.reject(error);
  }
);
// Hàm xử lý logout
const handleLogout = () => {
  // **ĐIỂM SỬA CHÍNH**
  // Chỉ-xóa-accessToken-vì-refreshToken-nằm-trong-cookie
  localStorage.removeItem("accessToken");

  // Xóa header mặc định (phòng-trường-hợp-còn-lưu)
  delete apiClient.defaults.headers.common["Authorization"];

  // Redirect (Không gọi-API-logout-ở-đây,-việc-đó-thuộc-về-useAuth-hook)
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};
// Hàm xử lý lỗi API
const handleApiError = (error: AxiosError) => {
  if (!error.response) {
    // Lỗi-mạng-hoặc-timeout
    toast.error("Lỗi mạng", { description: "Không thể kết nối đến máy chủ." });
    return;
  }

  const status = error.response?.status;
  const data = error.response?.data as
    | { message?: string; code?: string }
    | undefined;
  const message =
    data?.message || error.message || "Đã xảy ra lỗi không xác định";

  // Không hiển thị toast cho lỗi 401 (đã xử lý ở trên)
  if (status === 401) {
    return;
  }

  switch (status) {
    case 400:
      toast.error("Yêu cầu không hợp lệ", { description: message });
      break;
    case 403:
      toast.error("Không có quyền truy cập", { description: message });
      break;
    case 404:
      toast.error("Không tìm thấy", { description: message });
      break;
    case 500:
      toast.error("Lỗi máy chủ", { description: "Vui lòng thử lại sau." });
      break;
    default:
      toast.error("Đã xảy ra lỗi", { description: message });
  }
};

export default apiClient;
