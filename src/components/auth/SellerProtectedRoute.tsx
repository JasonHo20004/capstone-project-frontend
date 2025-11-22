import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/api/use-user';

export const SellerProtectedRoute = () => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'COURSESELLER') {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
};

