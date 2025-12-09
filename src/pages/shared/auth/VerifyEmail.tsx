import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Mail } from "lucide-react";
import apiClient from "@/lib/api/config";
import { Button } from "@/components/ui/button";

type Status = "idle" | "loading" | "success" | "error" | "pending";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");
    const pending = searchParams.get("pending");

    // Nếu có pending=true, hiển thị trang yêu cầu kiểm tra email
    if (pending === "true") {
      setStatus("pending");
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage("Mã xác thực không hợp lệ hoặc đã hết hạn.");
      return;
    }

    const verify = async () => {
      try {
        setStatus("loading");
        setMessage("");

        const response = await apiClient.get("/auth/verify", {
          params: { token },
        });

        const apiMessage =
          (response.data as { message?: string }).message ??
          "Xác thực email thành công.";

        setStatus("success");
        setMessage(apiMessage);
      } catch (error: any) {
        const apiMessage =
          error?.response?.data?.message ||
          "Mã xác thực không hợp lệ hoặc đã hết hạn.";
        setStatus("error");
        setMessage(apiMessage);
      }
    };

    void verify();
  }, [searchParams]);

  const handleGoToLogin = () => {
    navigate("/login");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl shadow-black/40">
        <div className="flex flex-col items-center text-center space-y-4">
          {status === "loading" && (
            <>
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              <h1 className="text-xl font-semibold text-slate-50">
                Đang xác thực email...
              </h1>
              <p className="text-sm text-slate-400">
                Vui lòng đợi trong giây lát trong khi chúng tôi kiểm tra mã xác
                thực của bạn.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <h1 className="text-xl font-semibold text-slate-50">
                Email đã được xác thực!
              </h1>
              <p className="text-sm text-slate-400">{message}</p>
              <Button
                className="mt-2 w-full"
                onClick={handleGoToLogin}
                variant="default"
              >
                Đến trang đăng nhập
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-red-400" />
              <h1 className="text-xl font-semibold text-slate-50">
                Xác thực email thất bại
              </h1>
              <p className="text-sm text-slate-400">{message}</p>
              <div className="mt-2 flex w-full flex-col gap-2">
                <Button className="w-full" onClick={handleGoHome}>
                  Về trang chủ
                </Button>
                <Button
                  className="w-full"
                  onClick={handleGoToLogin}
                  variant="outline"
                >
                  Đến trang đăng nhập
                </Button>
              </div>
            </>
          )}

          {status === "pending" && (
            <>
              <Mail className="h-12 w-12 text-sky-400" />
              <h1 className="text-xl font-semibold text-slate-50">
                Vui lòng kiểm tra email của bạn
              </h1>
              <p className="text-sm text-slate-400">
                Chúng tôi đã gửi một liên kết xác thực đến email của bạn. Vui
                lòng kiểm tra hộp thư và nhấp vào liên kết để kích hoạt tài
                khoản.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Không thấy email? Vui lòng kiểm tra thư mục spam.
              </p>
              <div className="mt-4 flex w-full flex-col gap-2">
                <Button className="w-full" onClick={handleGoToLogin}>
                  Đến trang đăng nhập
                </Button>
                <Button
                  className="w-full"
                  onClick={handleGoHome}
                  variant="outline"
                >
                  Về trang chủ
                </Button>
              </div>
            </>
          )}

          {status === "idle" && (
            <>
              <h1 className="text-xl font-semibold text-slate-50">
                Đang chuẩn bị xác thực email...
              </h1>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;


