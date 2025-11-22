import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/api/use-auth';
import { InlineLoading } from '@/components/ui/loading-spinner';

const Login = () => {
  const { login, isLoggingIn } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Gọi API Login thông qua hook
    login({
      email: formData.email,
      password: formData.password,
    });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-hero text-primary-foreground p-12">
        <div className="max-w-md space-y-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center shadow-accent transition-transform group-hover:scale-105">
              <BookOpen className="w-8 h-8" />
            </div>
            <span className="text-4xl font-bold font-['Be Vietnam Pro']">SkillBoost</span>
          </Link>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight font-['Be Vietnam Pro']">
              Chào mừng trở lại!
            </h1>
            <p className="text-xl text-primary-foreground/80">
              Tiếp tục lộ trình học tập của bạn và chinh phục các thử thách mới.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-secondary">50K+</div>
              <div className="text-sm text-primary-foreground/70">Học viên</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-secondary">200+</div>
              <div className="text-sm text-primary-foreground/70">Khóa học</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-secondary">98%</div>
              <div className="text-sm text-primary-foreground/70">Hài lòng</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <Link to="/" className="flex lg:hidden items-center gap-2 justify-center">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-accent">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent font-['Be Vietnam Pro']">
              SkillBoost
            </span>
          </Link>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold font-['Be Vietnam Pro']">Đăng nhập</h2>
            <p className="text-muted-foreground">Nhập email và mật khẩu của bạn</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ten@example.com"
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <label htmlFor="remember" className="text-sm cursor-pointer">
                  Ghi nhớ
                </label>
              </div>
              <a href="#" className="text-sm text-primary hover:underline">
                Quên mật khẩu?
              </a>
            </div>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full bg-gradient-primary shadow-accent text-lg h-12"
              disabled={isLoggingIn}
            >
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

          {/* Link chuyển qua Register */}
          <div className="text-center">
            <span className="text-sm text-muted-foreground">Chưa có tài khoản? </span>
            <Link to="/register" className="text-sm font-semibold text-primary hover:underline">
              Đăng ký ngay
            </Link>
          </div>

          <div className="text-center pt-4">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
              ← Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;