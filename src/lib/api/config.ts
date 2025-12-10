import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
// import type { ApiError } from "@/lib/api/types";
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

    // If sending FormData, remove Content-Type header to let axios/browser set it with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
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

    // Không cần xử lý lỗi ở đây nữa, để component tự xử lý
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

export default apiClient;
