import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/hooks/api';
import { InlineLoading } from '@/components/ui/loading-spinner';

const Login = () => {
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const location = useLocation();

  const computeIsLoginFromLocation = useCallback(() => {
    const params = new URLSearchParams(location.search);
    const registerParam = params.get('register');
    const modeParam = params.get('mode');
    const hashLower = (location.hash || '').toLowerCase();
    const wantsRegister = (
      (registerParam !== null && registerParam !== '0' && registerParam !== 'false') ||
      modeParam === 'register' ||
      hashLower.includes('register')
    );
    return !wantsRegister;
  }, [location.search, location.hash]);

  const [isLogin, setIsLogin] = useState(computeIsLoginFromLocation());
  useEffect(() => {
    setIsLogin(computeIsLoginFromLocation());
  }, [computeIsLoginFromLocation]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      // Gọi API login
      login({
        email: formData.email,
        password: formData.password,
      });
    } else {
      // Gọi API register
      register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Branding */}
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
              Nâng cấp kỹ năng tiếng Anh của bạn
            </h1>
            <p className="text-xl text-primary-foreground/80">
              Tham gia cùng hàng ngàn học viên chinh phục tiếng Anh với các khóa học chất lượng
            </p>
          </div>

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
              <div className="text-sm text-primary-foreground/70">Tỷ lệ thành công</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
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

          {/* Form Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold font-['Be Vietnam Pro']">
              {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản'}
            </h2>
            <p className="text-muted-foreground">
              {isLogin ? 'Đăng nhập để tiếp tục lộ trình học' : 'Bắt đầu hành trình chinh phục tiếng Anh'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Họ và tên
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                    className="pl-10 h-12"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Địa chỉ email
              </label>
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Mật khẩu
              </label>
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

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" />
                  <label htmlFor="remember" className="text-sm cursor-pointer">
                    Ghi nhớ đăng nhập
                  </label>
                </div>
                <a href="#" className="text-sm text-primary hover:underline">
                  Quên mật khẩu?
                </a>
              </div>
            )}

            <Button 
              type="submit" 
              size="lg" 
              className="w-full bg-gradient-primary shadow-accent text-lg h-12"
              disabled={isLoggingIn || isRegistering}
            >
              {(isLoggingIn || isRegistering) ? (
                <>
                  <InlineLoading />
                  <span className="ml-2">{isLogin ? 'Đang đăng nhập...' : 'Đang tạo tài khoản...'}</span>
                </>
              ) : (
                isLogin ? 'Đăng nhập' : 'Tạo tài khoản'
              )}
            </Button>
          </form>

          {/* Toggle Form */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
              <span className="font-semibold text-primary">
                {isLogin ? 'Đăng ký' : 'Đăng nhập'}
              </span>
            </button>
          </div>

          {/* Back to Home */}
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
