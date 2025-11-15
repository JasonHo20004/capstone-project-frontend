/**
 * EXAMPLE: Cách sử dụng Auth Service với Loading và Error Handling
 * 
 * File này minh họa cách sử dụng API service pattern trong Component
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner, InlineLoading } from '@/components/ui/loading-spinner';
import { useAuth } from '@/hooks/api';

const LoginExample = () => {
  const { login, isLoggingIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(formData);
    // Toast và redirect đã được xử lý trong useAuth hook
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, email: e.target.value }))
        }
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, password: e.target.value }))
        }
        required
      />
      <Button type="submit" disabled={isLoggingIn}>
        {isLoggingIn ? (
          <>
            <InlineLoading />
            <span className="ml-2">Đang đăng nhập...</span>
          </>
        ) : (
          'Đăng nhập'
        )}
      </Button>
    </form>
  );
};

export default LoginExample;

