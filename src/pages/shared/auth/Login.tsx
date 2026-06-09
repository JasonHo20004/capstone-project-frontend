import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/api/use-auth';
import { InlineLoading } from '@/components/ui/loading-spinner';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const Login = () => {
  const { t } = useTranslation(['auth', 'common']);
  const { login, isLoggingIn } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      email: formData.email,
      password: formData.password,
    });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>
      {/* Left Side */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-800 text-white p-12">
        <div className="max-w-md space-y-8">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt={t('app.name', { ns: 'common' })}
              className="w-16 h-16 rounded-2xl bg-white object-contain p-1.5 shadow-lg shadow-primary/20 transition-transform group-hover:scale-105"
            />
            <span className="text-4xl font-bold font-display">{t('app.name', { ns: 'common' })}</span>
          </Link>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight font-display">
              {t('login.welcomeBack')}
            </h1>
            <p className="text-xl text-white/70">
              {t('login.welcomeSubtitle')}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">50K+</div>
              <div className="text-sm text-white/70">{t('login.stats.learners')}</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">200+</div>
              <div className="text-sm text-white/70">{t('login.stats.courses')}</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">98%</div>
              <div className="text-sm text-white/70">{t('login.stats.satisfaction')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <Link to="/" className="flex lg:hidden items-center gap-2 justify-center">
            <img
              src="/logo.png"
              alt={t('app.name', { ns: 'common' })}
              className="w-12 h-12 rounded-xl bg-white object-contain p-1 shadow-lg shadow-primary/20"
            />
            <span className="text-2xl font-bold bg-primary bg-clip-text text-transparent font-display">
              {t('app.name', { ns: 'common' })}
            </span>
          </Link>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold font-display">{t('login.title')}</h2>
            <p className="text-slate-500">{t('login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">{t('labels.email', { ns: 'common' })}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('login.emailPlaceholder')}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">{t('labels.password', { ns: 'common' })}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('login.passwordPlaceholder')}
                  className="pl-10 pr-10 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <label htmlFor="remember" className="text-sm cursor-pointer">
                  {t('login.rememberMe')}
                </label>
              </div>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                {t('login.forgotPassword')}
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-primary shadow-lg shadow-primary/20 text-lg h-12"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <InlineLoading />
                  <span className="ml-2">{t('login.submitting')}</span>
                </>
              ) : (
                t('login.submit')
              )}
            </Button>
          </form>

          {/* Link to Register */}
          <div className="text-center">
            <span className="text-sm text-slate-500">{t('login.noAccount')} </span>
            <Link to="/register" className="text-sm font-semibold text-primary hover:underline">
              {t('login.registerNow')}
            </Link>
          </div>

          <div className="text-center pt-4">
            <Link to="/" className="text-sm text-slate-500 hover:text-primary">
              {t('login.backHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
