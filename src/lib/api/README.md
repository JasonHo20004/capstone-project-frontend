# API Service Layer - Best Practices

Cấu trúc API service layer được thiết kế theo chuẩn công nghiệp với các tính năng:

## 📁 Cấu trúc

```
src/lib/api/
├── config.ts          # Axios instance với interceptors
├── types.ts           # TypeScript interfaces chung
└── services/
    ├── auth.service.ts
    ├── course.service.ts
    └── index.ts       # Export tất cả services

src/hooks/api/
├── use-auth.ts        # Custom hooks cho auth
├── use-courses.ts     # Custom hooks cho courses
└── index.ts           # Export tất cả hooks
```

## 🔧 Tính năng

### 1. Axios Interceptors

**Request Interceptor:**
- Tự động attach JWT token vào header `Authorization: Bearer <token>`
- Token được lấy từ `localStorage.getItem('accessToken')`

**Response Interceptor:**
- Tự động refresh token khi nhận 401 (Unauthorized)
- Global error handling với toast notifications
- Tự động logout khi refresh token fail

### 2. Type Safety

Tất cả API requests và responses đều có TypeScript interfaces:

```typescript
// Request type
interface LoginRequest {
  email: string;
  password: string;
}

// Response type
interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}
```

### 3. Service Pattern

Mỗi domain có service riêng, tách biệt khỏi components:

```typescript
// services/auth.service.ts
class AuthService {
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  }
}
```

### 4. React Query Integration

Custom hooks sử dụng React Query để quản lý:
- Loading states
- Error states
- Caching
- Automatic refetching

## 📖 Cách sử dụng

### Authentication

```typescript
import { useAuth } from '@/hooks/api';

const LoginComponent = () => {
  const { login, isLoggingIn } = useAuth();
  
  const handleLogin = () => {
    login({ email: 'user@example.com', password: 'password' });
    // Toast và redirect tự động được xử lý
  };
  
  return (
    <button onClick={handleLogin} disabled={isLoggingIn}>
      {isLoggingIn ? 'Đang đăng nhập...' : 'Đăng nhập'}
    </button>
  );
};
```

### Fetching Data

```typescript
import { useCourses } from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';

const CoursesList = () => {
  const { data, isLoading, isError, error, refetch } = useCourses({
    page: 1,
    limit: 10,
  });
  
  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage message={error.message} onRetry={refetch} />;
  
  return (
    <div>
      {data?.data.map(course => (
        <div key={course.id}>{course.title}</div>
      ))}
    </div>
  );
};
```

### Mutations (Create/Update/Delete)

```typescript
import { useCreateCourse } from '@/hooks/api';

const CreateCourseForm = () => {
  const createCourse = useCreateCourse();
  
  const handleSubmit = (data) => {
    createCourse.mutate(data, {
      onSuccess: () => {
        // Form reset, toast notification tự động
      },
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={createCourse.isPending}>
        {createCourse.isPending ? 'Đang tạo...' : 'Tạo khóa học'}
      </button>
    </form>
  );
};
```

## 🔐 Token Management

Tokens được lưu trong `localStorage`:
- `accessToken`: JWT token cho authentication
- `refreshToken`: Token để refresh access token

Khi access token hết hạn:
1. Interceptor tự động gọi `/auth/refresh`
2. Lưu access token mới
3. Retry request ban đầu

## 🎨 UI Feedback

### Loading States

```typescript
import { LoadingSpinner, FullPageLoading, InlineLoading } from '@/components/ui/loading-spinner';

// Full page loading
<FullPageLoading text="Đang tải..." />

// Inline loading
<LoadingSpinner size="md" text="Đang xử lý..." />

// Button loading
<Button disabled={isLoading}>
  {isLoading && <InlineLoading />}
  Submit
</Button>
```

### Error Handling

```typescript
import { ErrorMessage } from '@/components/ui/error-message';

<ErrorMessage
  title="Đã xảy ra lỗi"
  message={error.message}
  onRetry={() => refetch()}
/>
```

### Toast Notifications

Toast notifications được xử lý tự động trong:
- Interceptors (global errors)
- Custom hooks (success messages)

Sử dụng `sonner` library đã được cấu hình sẵn.

## 🌐 Environment Variables

Tạo file `.env` trong root:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## 📝 Thêm Service Mới

1. Tạo service file trong `src/lib/api/services/`:

```typescript
// services/user.service.ts
import apiClient from '../config';
import type { ApiResponse } from '../types';

export interface User {
  id: string;
  name: string;
  email: string;
}

class UserService {
  async getUsers(): Promise<ApiResponse<User[]>> {
    const response = await apiClient.get('/users');
    return response.data;
  }
}

export const userService = new UserService();
```

2. Tạo custom hook trong `src/hooks/api/`:

```typescript
// hooks/api/use-users.ts
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/lib/api/services';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
    select: (response) => response.data,
  });
};
```

3. Export trong `index.ts`:

```typescript
export { userService } from './user.service';
export { useUsers } from './use-users';
```

## ✅ Best Practices

1. **Luôn sử dụng TypeScript interfaces** cho requests và responses
2. **Tách biệt service logic** khỏi components
3. **Sử dụng React Query hooks** thay vì gọi service trực tiếp
4. **Xử lý loading và error states** trong components
5. **Sử dụng toast notifications** cho user feedback
6. **Cache data** với React Query để tối ưu performance

