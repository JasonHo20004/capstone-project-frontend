import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '@/hooks/api/use-user'; // Import hook useUser
import { Loader2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout'; // Import Admin Layout


export const AdminProtectedRoute = () => {
  const { user, isLoading } = useUser();

  // 1. Trạng thái đang tải
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


  if (!user && !isLoading) {
    return <Navigate to="/login" replace />;
  }

  if (user && user.role !== 'ADMINISTRATOR') {
    return <Navigate to="/" replace />;
  }

  // 4. Trạng thái đã đăng nhập VÀ là Admin
  // Thay vì chỉ dùng <Outlet />, chúng ta dùng <AdminLayout>
  // <AdminLayout> sẽ chứa <Outlet /> bên trong nó
  return <AdminLayout />;
};