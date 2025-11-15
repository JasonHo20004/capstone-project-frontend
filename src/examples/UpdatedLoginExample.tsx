/**
 * EXAMPLE: Cách cập nhật Login page hiện tại để sử dụng API service
 * 
 * So sánh với Login.tsx hiện tại để thấy sự khác biệt
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Mail, Lock, User } from 'lucide-react';
import { InlineLoading } from '@/components/ui/loading-spinner';
import { useAuth } from '@/hooks/api';

const UpdatedLogin = () => {
  const { login, isLoggingIn } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      // Login - chỉ cần email và password
      login({
        email: formData.email,
        password: formData.password,
      });
      // Toast và redirect đã được xử lý tự động trong useAuth hook
    } else {
      // Register - có thể tạo useRegister hook tương tự
      // Ví dụ: register({ name: formData.name, email: formData.email, password: formData.password });
      console.log('Register functionality - implement useRegister hook');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-primary/20 to-primary/5 p-12">
        <div className="max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">Chào mừng trở lại!</h1>
          <p className="text-muted-foreground text-lg">
            Đăng nhập để tiếp tục học tập và phát triển kỹ năng của bạn
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-col justify-center p-8 lg:p-12">
        <div className="max-w-md mx-auto w-full space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold">
              {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
            </h2>
            <p className="text-muted-foreground">
              {isLogin
                ? 'Nhập thông tin để đăng nhập vào tài khoản của bạn'
                : 'Tạo tài khoản mới để bắt đầu học tập'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Họ và tên
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Ghi nhớ đăng nhập
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <InlineLoading />
                  <span className="ml-2">Đang xử lý...</span>
                </>
              ) : (
                isLogin ? 'Đăng nhập' : 'Tạo tài khoản'
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            </span>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatedLogin;

