import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '@/hooks/api/use-user'; 
import { Loader2 } from 'lucide-react';


export const ProtectedRoute = () => {
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

  // 3. Trạng thái đã đăng nhập (tải xong, có user)
  // <Outlet /> sẽ render bất cứ route con nào (ví dụ: <Profile />)
  return <Outlet />;
};