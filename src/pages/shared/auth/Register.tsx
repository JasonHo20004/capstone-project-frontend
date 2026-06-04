import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Mail, Lock, User, Phone, Calendar, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/api/use-auth';
import { InlineLoading } from '@/components/ui/loading-spinner';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { z } from 'zod';

type RegisterFormData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  dateOfBirth: string;
};

const Register = () => {
  const { t } = useTranslation(['auth', 'common']);
  const { register, isRegistering, registerError } = useAuth();

  const registerSchema = useMemo(
    () =>
      z
        .object({
          fullName: z
            .string()
            .min(1, t('register.errors.fullNameRequired'))
            .min(8, t('register.errors.fullNameMin'))
            .max(255, t('register.errors.fullNameMax')),
          email: z
            .string()
            .min(1, t('register.errors.emailRequired'))
            .email(t('register.errors.emailInvalid')),
          phoneNumber: z
            .string()
            .max(20, t('register.errors.phoneMax'))
            .optional()
            .or(z.literal('')),
          dateOfBirth: z
            .string()
            .refine((val) => !isNaN(Date.parse(val)), t('register.errors.dobInvalid')),
          password: z
            .string()
            .min(1, t('register.errors.passwordRequired'))
            .min(8, t('register.errors.passwordMin'))
            .max(255),
          confirmPassword: z.string().min(1, t('register.errors.confirmPasswordRequired')),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t('register.errors.passwordMismatch'),
          path: ['confirmPassword'],
        }),
    [t],
  );

  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    dateOfBirth: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!registerError) return;
    const message = (registerError as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
    if (message.toLowerCase().includes('email')) {
      setErrors((prev) => ({ ...prev, email: t('register.errors.emailTaken') }));
    } else if (message.toLowerCase().includes('phone')) {
      setErrors((prev) => ({ ...prev, phoneNumber: t('register.errors.phoneTaken') }));
    }
  }, [registerError, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateEmailField = (email: string) => {
    const emailSchema = z
      .string()
      .min(1, t('register.errors.emailRequired'))
      .email(t('register.errors.emailInvalid'));
    const result = emailSchema.safeParse(email);

    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message || t('register.errors.emailInvalid');
      setErrors((prev) => ({ ...prev, email: errorMessage }));
      return false;
    }
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.email;
      return newErrors;
    });
    return true;
  };

  const handleEmailBlur = () => {
    validateEmailField(formData.email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = registerSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        newErrors[fieldName] = issue.message;
      });
      setErrors(newErrors);
      return;
    }

    setErrors({});

    register({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      phoneNumber: formData.phoneNumber || undefined,
      dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
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
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <BookOpen className="w-8 h-8" />
            </div>
            <span className="text-4xl font-bold font-display">{t('app.name', { ns: 'common' })}</span>
          </Link>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight font-display">
              {t('register.welcomeTitle')}
            </h1>
            <p className="text-xl text-white/70">
              {t('register.welcomeSubtitle')}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">50K+</div>
              <div className="text-sm text-white/70">{t('register.stats.learners')}</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">200+</div>
              <div className="text-sm text-white/70">{t('register.stats.courses')}</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">98%</div>
              <div className="text-sm text-white/70">{t('register.stats.satisfaction')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <Link to="/" className="flex lg:hidden items-center gap-2 justify-center">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-primary bg-clip-text text-transparent font-display">
              {t('app.name', { ns: 'common' })}
            </span>
          </Link>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold font-display">{t('register.title')}</h2>
            <p className="text-slate-500">{t('register.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('register.fields.fullName')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder={t('register.fields.fullNamePlaceholder')}
                  className={`pl-9 ${errors.fullName ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('register.fields.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleEmailBlur}
                  placeholder={t('register.fields.emailPlaceholder')}
                  className={`pl-9 ${errors.email ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('register.fields.phone')}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9+]/g, '');
                    handleChange({ target: { name: 'phoneNumber', value: val } } as React.ChangeEvent<HTMLInputElement>);
                  }}
                  placeholder={t('register.fields.phonePlaceholder')}
                  className={`pl-9 ${errors.phoneNumber ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.phoneNumber && <p className="text-xs text-destructive mt-1">{errors.phoneNumber}</p>}
            </div>

            {/* Date of birth */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('register.fields.dob')}</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`pl-9 ${errors.dateOfBirth ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.dateOfBirth && <p className="text-xs text-destructive mt-1">{errors.dateOfBirth}</p>}
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('register.fields.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t('register.fields.passwordPlaceholder')}
                    className={`pl-9 pr-9 ${errors.password ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('register.fields.confirmPassword')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder={t('register.fields.confirmPasswordPlaceholder')}
                    className={`pl-9 pr-9 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary mt-4"
              disabled={isRegistering}
            >
              {isRegistering ? (
                <>
                  <InlineLoading />
                  <span className="ml-2">{t('register.submitting')}</span>
                </>
              ) : (
                t('register.submit')
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-slate-500">{t('register.haveAccount')} </span>
            <Link to="/login" className="font-semibold text-primary hover:underline">
              {t('register.loginNow')}
            </Link>
          </div>

          <div className="text-center pt-4">
            <Link to="/" className="text-sm text-slate-500 hover:text-primary">
              {t('register.backHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
