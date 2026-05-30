import { useState } from "react";
import { Link } from "react-router-dom";
import { AxiosError } from "axios";
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/api/use-auth";

const ForgotPassword = () => {
  const { forgotPassword, isRequestingReset } = useAuth();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Vui lòng nhập email hợp lệ.");
      return;
    }
    setError("");
    forgotPassword(email, {
      // Always show the same confirmation — backend doesn't reveal whether the
      // email exists, so neither do we.
      onSuccess: () => setSent(true),
      onError: (err: unknown) => {
        const axiosError = err as AxiosError<{ error?: string; retryAfterSeconds?: number }>;
        if (axiosError?.response?.status === 429) {
          const seconds = axiosError.response.data?.retryAfterSeconds;
          setError(
            seconds
              ? `Bạn vừa yêu cầu rồi. Vui lòng thử lại sau ${seconds}s.`
              : "Bạn yêu cầu quá nhanh. Vui lòng thử lại sau ít phút.",
          );
          return;
        }
        setError(
          axiosError?.response?.data?.error ??
            "Không gửi được email. Vui lòng thử lại.",
        );
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        {sent ? (
          <div className="flex flex-col items-center text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <h1 className="text-xl font-semibold text-foreground">
              Kiểm tra email của bạn
            </h1>
            <p className="text-sm text-muted-foreground">
              Nếu <span className="text-foreground">{email}</span> có tài khoản,
              chúng tôi đã gửi một liên kết đặt lại mật khẩu. Liên kết sẽ hết hạn
              sau 30 phút.
            </p>
            <p className="text-xs text-muted-foreground">
              Không thấy email? Hãy kiểm tra mục spam.
            </p>
            <Link to="/login" className="w-full">
              <Button className="w-full" variant="outline">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Về trang đăng nhập
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center space-y-1.5">
              <h1 className="text-xl font-semibold text-foreground">
                Quên mật khẩu?
              </h1>
              <p className="text-sm text-muted-foreground">
                Nhập email tài khoản, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10"
                  placeholder="ban@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isRequestingReset}>
              {isRequestingReset ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Gửi liên kết đặt lại"
              )}
            </Button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Về trang đăng nhập
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
