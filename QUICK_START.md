# ⚡ Quick Start - API Setup

## 🎯 Đã Hoàn Thành

✅ **Axios** đã được cài đặt  
✅ **Service Pattern** đã được thiết lập  
✅ **TypeScript Interfaces** đã được định nghĩa  
✅ **React Query Hooks** đã được tạo  
✅ **Loading & Error Components** đã sẵn sàng  

## 🚀 Sử Dụng Ngay

### 1. Cấu hình Environment

Tạo file `.env`:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 2. Import và Sử Dụng

```typescript
// Authentication
import { useAuth } from '@/hooks/api';
const { login, isLoggingIn } = useAuth();

// Fetch Data
import { useCourses } from '@/hooks/api';
const { data, isLoading, isError } = useCourses();

// UI Components
import { LoadingSpinner, ErrorMessage } from '@/components/ui/loading-spinner';
```

## 📖 Xem Chi Tiết

- **Hướng dẫn đầy đủ**: `API_SETUP_GUIDE.md`
- **Documentation**: `src/lib/api/README.md`
- **Ví dụ code**: `src/examples/`

## ✨ Tính Năng Tự Động

- ✅ Tự động attach JWT token vào requests
- ✅ Tự động refresh token khi hết hạn
- ✅ Tự động hiển thị toast notifications
- ✅ Tự động xử lý errors
- ✅ Tự động cache data với React Query

---

**Bắt đầu code ngay! 🎉**

