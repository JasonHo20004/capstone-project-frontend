import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

// API Base URL - có thể lấy từ environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Tạo axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Để gửi cookies (cho refresh token)
});

// Request Interceptor - Attach token vào mọi request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Lấy token từ localStorage
    const token = localStorage.getItem('accessToken');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Xử lý global error và token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Xử lý lỗi 401 (Unauthorized) - Token expired hoặc invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Thử refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
            { withCredentials: true }
          );

          const { accessToken } = response.data;
          
          // Lưu token mới
          localStorage.setItem('accessToken', accessToken);
          
          // Retry request với token mới
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          
          return apiClient(originalRequest);
        } else {
          // Không có refresh token, redirect về login
          handleLogout();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Refresh token failed, logout user
        handleLogout();
        return Promise.reject(refreshError);
      }
    }

    // Xử lý các lỗi khác
    handleApiError(error);
    
    return Promise.reject(error);
  }
);

// Hàm xử lý logout
const handleLogout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  // Redirect về trang login (có thể dùng react-router)
  window.location.href = '/login';
};

// Hàm xử lý lỗi API
const handleApiError = (error: AxiosError) => {
  const status = error.response?.status;
  const data = error.response?.data as { message?: string; code?: string } | undefined;
  const message = data?.message || error.message || 'Đã xảy ra lỗi không xác định';

  // Không hiển thị toast cho lỗi 401 (đã xử lý ở trên)
  if (status === 401) {
    return;
  }

  // Hiển thị thông báo lỗi dựa trên status code
  switch (status) {
    case 400:
      toast.error('Yêu cầu không hợp lệ', {
        description: message,
      });
      break;
    case 403:
      toast.error('Không có quyền truy cập', {
        description: message,
      });
      break;
    case 404:
      toast.error('Không tìm thấy tài nguyên', {
        description: message,
      });
      break;
    case 500:
      toast.error('Lỗi máy chủ', {
        description: 'Vui lòng thử lại sau',
      });
      break;
    default:
      toast.error('Đã xảy ra lỗi', {
        description: message,
      });
  }
};

export default apiClient;

