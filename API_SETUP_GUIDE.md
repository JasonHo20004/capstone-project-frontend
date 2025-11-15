# 🚀 Hướng Dẫn Thiết Lập API Communication - Best Practices

## ✅ Đã Hoàn Thành

Hệ thống API communication đã được thiết lập theo chuẩn công nghiệp với các tính năng:

### 1. ✅ Cấu trúc Service Pattern
- Tách biệt logic API khỏi Components
- Mỗi domain có service riêng (auth, courses, etc.)
- Dễ dàng mở rộng và bảo trì

### 2. ✅ Axios với Interceptors
- **Request Interceptor**: Tự động attach JWT token
- **Response Interceptor**: 
  - Tự động refresh token khi hết hạn
  - Global error handling với toast notifications
  - Tự động logout khi refresh token fail

### 3. ✅ TypeScript Type Safety
- Interfaces cho tất cả Request/Response
- Type-safe API calls
- Autocomplete trong IDE

### 4. ✅ React Query Integration
- Custom hooks với loading/error states
- Automatic caching và refetching
- Optimistic updates

### 5. ✅ UI Feedback Components
- Loading Spinner (Full page, inline, button)
- Error Message với retry button
- Toast notifications (tự động từ interceptors)

## 📁 Cấu Trúc Files

```
src/
├── lib/
│   └── api/
│       ├── config.ts              # Axios instance + interceptors
│       ├── types.ts               # Common TypeScript types
│       ├── services/
│       │   ├── auth.service.ts    # Auth API calls
│       │   ├── course.service.ts  # Course API calls
│       │   └── index.ts          # Export all services
│       └── README.md              # Chi tiết documentation
│
├── hooks/
│   └── api/
│       ├── use-auth.ts            # Auth hooks
│       ├── use-courses.ts         # Course hooks
│       └── index.ts               # Export all hooks
│
├── components/
│   └── ui/
│       ├── loading-spinner.tsx    # Loading components
│       └── error-message.tsx      # Error display component
│
└── examples/
    ├── LoginExample.tsx           # Ví dụ sử dụng auth
    ├── CoursesExample.tsx         # Ví dụ sử dụng courses
    └── UpdatedLoginExample.tsx    # Ví dụ cập nhật Login page
```

## 🚀 Bắt Đầu Sử Dụng

### Bước 1: Cấu hình Environment Variable

Tạo file `.env` trong root của frontend:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Bước 2: Sử dụng trong Component

#### Authentication Example

```typescript
import { useAuth } from '@/hooks/api';
import { InlineLoading } from '@/components/ui/loading-spinner';

const LoginComponent = () => {
  const { login, isLoggingIn } = useAuth();

  const handleLogin = () => {
    login({
      email: 'user@example.com',
      password: 'password123'
    });
    // Toast và redirect tự động được xử lý
  };

  return (
    <button onClick={handleLogin} disabled={isLoggingIn}>
      {isLoggingIn ? <InlineLoading /> : 'Đăng nhập'}
    </button>
  );
};
```

#### Fetching Data Example

```typescript
import { useCourses } from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';

const CoursesList = () => {
  const { data, isLoading, isError, error, refetch } = useCourses({
    page: 1,
    limit: 10,
    search: 'react'
  });

  if (isLoading) return <LoadingSpinner text="Đang tải..." />;
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

#### Mutation Example (Create/Update/Delete)

```typescript
import { useCreateCourse } from '@/hooks/api';

const CreateCourseForm = () => {
  const createCourse = useCreateCourse();

  const handleSubmit = (formData) => {
    createCourse.mutate(formData, {
      onSuccess: () => {
        // Toast notification tự động
        // Cache tự động được update
      }
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

Tokens được lưu tự động trong `localStorage`:
- `accessToken`: JWT token cho authentication
- `refreshToken`: Token để refresh access token

**Flow tự động:**
1. User login → tokens được lưu vào localStorage
2. Mọi API request → token tự động được attach vào header
3. Token hết hạn (401) → tự động gọi refresh token
4. Refresh thành công → retry request ban đầu
5. Refresh fail → tự động logout và redirect về login

## 🎨 UI Components

### Loading States

```typescript
import { 
  LoadingSpinner, 
  FullPageLoading, 
  InlineLoading 
} from '@/components/ui/loading-spinner';

// Full page overlay
<FullPageLoading text="Đang tải dữ liệu..." />

// Inline spinner
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

Toast notifications được xử lý tự động:
- ✅ Success messages từ mutations
- ❌ Error messages từ interceptors
- Sử dụng `sonner` library (đã được cấu hình)

## 📝 Thêm Service Mới

### 1. Tạo Service File

```typescript
// src/lib/api/services/user.service.ts
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

### 2. Tạo Custom Hook

```typescript
// src/hooks/api/use-users.ts
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

### 3. Export trong index.ts

```typescript
// src/lib/api/services/index.ts
export { userService } from './user.service';

// src/hooks/api/index.ts
export { useUsers } from './use-users';
```

## 🔍 Kiểm Tra và Debug

### Kiểm tra Token

```typescript
// Trong browser console
localStorage.getItem('accessToken');
localStorage.getItem('refreshToken');
```

### Kiểm tra Network Requests

Mở DevTools → Network tab để xem:
- Request headers có chứa `Authorization: Bearer <token>`
- Response status codes
- Error responses

### Debug Interceptors

Thêm `console.log` trong `config.ts` để debug:
- Request interceptor: xem token có được attach không
- Response interceptor: xem error handling

## ⚠️ Lưu Ý Quan Trọng

1. **Environment Variables**: Đảm bảo `VITE_API_BASE_URL` được cấu hình đúng
2. **CORS**: Backend phải cho phép CORS từ frontend origin
3. **Cookies**: Backend phải set `withCredentials: true` cho refresh token
4. **Error Handling**: Global errors đã được xử lý, nhưng có thể custom thêm trong hooks
5. **Type Safety**: Luôn định nghĩa TypeScript interfaces cho requests/responses

## 📚 Tài Liệu Tham Khảo

- Xem chi tiết trong: `src/lib/api/README.md`
- Xem ví dụ trong: `src/examples/`
- React Query docs: https://tanstack.com/query/latest
- Axios docs: https://axios-http.com/

## 🎯 Next Steps

1. ✅ Cập nhật Login page để sử dụng `useAuth` hook
2. ✅ Cập nhật Courses page để sử dụng `useCourses` hook
3. ✅ Tạo thêm services cho các modules khác (users, cart, etc.)
4. ✅ Test với backend API thực tế
5. ✅ Thêm error boundaries cho better error handling

---

**Happy Coding! 🚀**

