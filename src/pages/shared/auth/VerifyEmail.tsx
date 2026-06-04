import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Mail, Loader2 } from "lucide-react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/api/use-auth";

type Status = "idle" | "loading" | "success" | "error" | "pending";

const RESEND_COOLDOWN_SECONDS = 60;

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const { verifyEmail, resendVerification, isResending } = useAuth();

  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const cooldownIntervalRef = useRef<number | null>(null);
  const verifyRanRef = useRef(false);

  // The email is included in the verification URL so we can auto-resend
  // without asking the user to type it again.
  const emailFromUrl = searchParams.get("email") ?? "";

  // Run verification once when token is present. Guarded against React 18
  // strict-mode double-invocation so the single-use token isn't burned twice.
  useEffect(() => {
    const token = searchParams.get("token");
    const pending = searchParams.get("pending");

    if (pending === "true") {
      setStatus("pending");
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage(t("verifyEmail.tokenInvalid"));
      return;
    }

    if (verifyRanRef.current) return;
    verifyRanRef.current = true;

    let cancelled = false;
    const verify = async () => {
      try {
        setStatus("loading");
        setMessage("");
        await verifyEmail(token);
        if (cancelled) return;
        setStatus("success");
        setMessage(t("verifyEmail.successRedirect"));
        window.setTimeout(() => {
          if (!cancelled) navigate("/", { replace: true });
        }, 1500);
      } catch (error: unknown) {
        if (cancelled) return;
        const axiosError = error as AxiosError<{ error?: string }>;
        const apiMessage =
          axiosError?.response?.data?.error ||
          t("verifyEmail.failedDesc");
        setStatus("error");
        setMessage(apiMessage);
      }
    };

    void verify();
    return () => {
      cancelled = true;
    };
  }, [searchParams, verifyEmail, navigate, t]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldownRemaining <= 0) {
      if (cooldownIntervalRef.current) {
        window.clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = null;
      }
      return;
    }
    if (cooldownIntervalRef.current) return;
    cooldownIntervalRef.current = window.setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      if (cooldownIntervalRef.current) {
        window.clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = null;
      }
    };
  }, [cooldownRemaining]);

  const handleResend = () => {
    if (!emailFromUrl || cooldownRemaining > 0) return;
    resendVerification(emailFromUrl, {
      onSuccess: () => setCooldownRemaining(RESEND_COOLDOWN_SECONDS),
      onError: (error: unknown) => {
        const axiosError = error as AxiosError<{ retryAfterSeconds?: number }>;
        const seconds = axiosError?.response?.data?.retryAfterSeconds;
        if (
          axiosError?.response?.status === 429 &&
          typeof seconds === "number"
        ) {
          setCooldownRemaining(seconds);
        }
      },
    });
  };

  const resendDisabled = isResending || cooldownRemaining > 0 || !emailFromUrl;
  const resendLabel = isResending
    ? t("verifyEmail.resending")
    : cooldownRemaining > 0
    ? t("verifyEmail.resendWait", { seconds: cooldownRemaining })
    : t("verifyEmail.resend");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center text-center space-y-4">
          {status === "idle" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h1 className="text-xl font-semibold text-foreground">
                {t("verifyEmail.preparing")}
              </h1>
            </>
          )}

          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h1 className="text-xl font-semibold text-foreground">
                {t("verifyEmail.checking")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("verifyEmail.checkingDesc")}
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <h1 className="text-xl font-semibold text-foreground">
                {t("verifyEmail.success")}
              </h1>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Button
                className="mt-2 w-full"
                onClick={() => navigate("/", { replace: true })}
              >
                {t("verifyEmail.goHome")}
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <h1 className="text-xl font-semibold text-foreground">
                {t("verifyEmail.failed")}
              </h1>
              <p className="text-sm text-muted-foreground">{message}</p>

              {emailFromUrl && (
                <p className="text-xs text-muted-foreground">
                  {t("verifyEmail.emailLabel")}: <span className="text-foreground">{emailFromUrl}</span>
                </p>
              )}

              <div className="mt-2 flex w-full flex-col gap-2">
                {emailFromUrl ? (
                  <Button
                    className="w-full"
                    onClick={handleResend}
                    disabled={resendDisabled}
                  >
                    {resendLabel}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => navigate("/register")}
                  >
                    {t("verifyEmail.registerAgain")}
                  </Button>
                )}
                <Button
                  className="w-full"
                  onClick={() => navigate("/login")}
                  variant="outline"
                >
                  {t("verifyEmail.goLogin")}
                </Button>
                <Button
                  className="w-full"
                  onClick={() => navigate("/")}
                  variant="secondary"
                >
                  {t("verifyEmail.backHome")}
                </Button>
              </div>
            </>
          )}

          {status === "pending" && (
            <>
              <Mail className="h-12 w-12 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">
                {t("verifyEmail.pendingTitle")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("verifyEmail.pendingDesc")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("verifyEmail.checkSpam")}
              </p>

              {emailFromUrl && (
                <p className="text-xs text-muted-foreground">
                  {t("verifyEmail.emailLabel")}: <span className="text-foreground">{emailFromUrl}</span>
                </p>
              )}

              <div className="mt-4 flex w-full flex-col gap-2">
                {emailFromUrl && (
                  <Button
                    className="w-full"
                    onClick={handleResend}
                    disabled={resendDisabled}
                  >
                    {resendLabel}
                  </Button>
                )}
                <Button
                  className="w-full"
                  onClick={() => navigate("/login")}
                  variant="outline"
                >
                  {t("verifyEmail.goLogin")}
                </Button>
                <Button
                  className="w-full"
                  onClick={() => navigate("/")}
                  variant="secondary"
                >
                  {t("verifyEmail.backHome")}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
