import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, Loader2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/api/use-auth";

const MIN_PASSWORD_LENGTH = 8;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword, isResettingPassword } = useAuth();
  const { t } = useTranslation("auth");

  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t("resetPassword.errors.tooShort", { min: MIN_PASSWORD_LENGTH }));
      return;
    }
    if (password !== confirm) {
      setError(t("resetPassword.errors.mismatch"));
      return;
    }
    setError("");
    resetPassword(
      { token, password },
      {
        onSuccess: () => {
          toast.success(t("resetPassword.successToast"), {
            description: t("resetPassword.successDesc"),
          });
          navigate("/login", { replace: true });
        },
        onError: (err: unknown) => {
          const axiosError = err as AxiosError<{ error?: string }>;
          setError(
            axiosError?.response?.data?.error ??
              t("resetPassword.errors.invalidOrExpired"),
          );
        },
      },
    );
  };

  // No token in the URL — the link is malformed or was opened directly.
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
          <div className="flex flex-col items-center text-center space-y-4">
            <XCircle className="h-12 w-12 text-destructive" />
            <h1 className="text-xl font-semibold text-foreground">
              {t("resetPassword.invalidLink.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("resetPassword.invalidLink.desc")}
            </p>
            <Link to="/forgot-password" className="w-full">
              <Button className="w-full">{t("resetPassword.invalidLink.requestNew")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="text-center space-y-1.5">
            <h1 className="text-xl font-semibold text-foreground">
              {t("resetPassword.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("resetPassword.subtitle")}
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-muted-foreground">
              {t("resetPassword.newPasswordLabel")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="pl-10 pr-10"
                placeholder={t("resetPassword.newPasswordPlaceholder")}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? t("resetPassword.hidePassword") : t("resetPassword.showPassword")}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm" className="text-xs font-medium text-muted-foreground">
              {t("resetPassword.confirmPasswordLabel")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="confirm"
                type={showPassword ? "text" : "password"}
                className="pl-10"
                placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (error) setError("");
                }}
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isResettingPassword}>
            {isResettingPassword ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                {t("resetPassword.submitting")}
              </>
            ) : (
              t("resetPassword.submit")
            )}
          </Button>

          <Link
            to="/login"
            className="block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {t("resetPassword.backToLogin")}
          </Link>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
