import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Mail, Lock, User, Phone, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/api/use-auth';
import { InlineLoading } from '@/components/ui/loading-spinner';
import { z } from 'zod'; // 1. Import Zod

// 2. Định nghĩa Schema Validation (Dựa trên Backend DTO)
const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, "Họ và tên là bắt buộc")
    .min(8, "Họ và tên phải có ít nhất 8 ký tự") // Khớp với Backend
    .max(255, "Họ và tên quá dài"),
  email: z
    .string()
    .min(1, "Email là bắt buộc")
    .email("Email không hợp lệ"), // Khớp với Backend
  phoneNumber: z
    .string()
    .max(20, "Số điện thoại quá dài") // Khớp với Backend
    .optional()
    .or(z.literal('')), // Cho phép rỗng
  dateOfBirth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Ngày sinh không hợp lệ"), // Kiểm tra ngày
  password: z
    .string()
    .min(1, "Mật khẩu là bắt buộc")
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự") // Khớp với Backend
    .max(255),
  confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu nhập lại không khớp",
  path: ["confirmPassword"], // Gán lỗi vào trường confirmPassword
});

// Tạo type từ schema
type RegisterFormData = z.infer<typeof registerSchema>;

const Register = () => {
  const { register, isRegistering } = useAuth();
  // State form dữ liệu
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '', 
    phoneNumber: '',
    dateOfBirth: '',
  });

  // 3. State lưu lỗi (Key là tên trường, Value là câu thông báo)
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // (Optional) Xóa lỗi của trường đó khi người dùng bắt đầu gõ lại
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 4. Thực hiện Validate
    const result = registerSchema.safeParse(formData);

    if (!result.success) {
      // Nếu có lỗi, map lỗi từ Zod sang state errors
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        newErrors[fieldName] = issue.message;
      });
      setErrors(newErrors);
      return; // Dừng lại, không gọi API
    }

    // Nếu validate thành công -> Xóa hết lỗi cũ
    setErrors({});

    // Gọi API Register
 register({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      phoneNumber: formData.phoneNumber || undefined,
      dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
    }, {
      // ✅ BẮT LỖI TỪ BACKEND TẠI ĐÂY
      onError: (error: any) => { // Dùng 'any' hoặc AxiosError<ApiError>
        const message = error.response?.data?.message || "";
        
        // Kiểm tra thông báo lỗi từ Backend để gán vào đúng ô input
        // (Giả sử backend trả về "Email already exists" hoặc "Email is taken")
        if (message.toLowerCase().includes("email")) {
          setErrors((prev) => ({
            ...prev,
            email: "Email này đã được sử dụng. Vui lòng chọn email khác.",
          }));
        } 
        // Kiểm tra lỗi số điện thoại (nếu backend trả về)
        else if (message.toLowerCase().includes("phone")) {
          setErrors((prev) => ({
            ...prev,
            phoneNumber: "Số điện thoại này đã được sử dụng.",
          }));
        }
        else {
          // Lỗi chung chung thì hiện Toast (Hook useAuth đã xử lý toast rồi, 
          // nhưng nếu muốn custom thêm thì làm ở đây)
        }
      }
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

      {/* Right Side - Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
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
            <h2 className="text-3xl font-bold font-['Be Vietnam Pro']">Tạo tài khoản</h2>
            <p className="text-muted-foreground">Nhập thông tin cá nhân của bạn</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Họ và tên */}
            <div>
              <label className="block text-sm font-medium mb-1">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A (tối thiểu 8 ký tự)"
                  className={`pl-9 ${errors.fullName ? 'border-destructive' : ''}`}
                />
              </div>
              {/* Hiển thị lỗi */}
              {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  className={`pl-9 ${errors.email ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-sm font-medium mb-1">Số điện thoại</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    // Chỉ cho phép nhập số
                    const val = e.target.value.replace(/[^0-9+]/g, '');
                    handleChange({ target: { name: 'phoneNumber', value: val } } as any);
                  }}
                  placeholder="0912345678"
                  className={`pl-9 ${errors.phoneNumber ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.phoneNumber && <p className="text-xs text-destructive mt-1">{errors.phoneNumber}</p>}
            </div>

            {/* Ngày sinh */}
            <div>
              <label className="block text-sm font-medium mb-1">Ngày sinh</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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

            {/* Mật khẩu */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="•••••• (min 8)"
                    className={`pl-9 ${errors.password ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nhập lại</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••"
                    className={`pl-9 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                  />
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
                  <span className="ml-2">Đang xử lý...</span>
                </>
              ) : (
                'Đăng ký'
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Đã có tài khoản? </span>
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Đăng nhập
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

export default Register;