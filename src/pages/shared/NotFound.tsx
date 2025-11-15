import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("Lỗi 404: Người dùng truy cập đường dẫn không tồn tại:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-gray-600">Rất tiếc! Không tìm thấy trang</p>
        <a href="/" className="text-blue-500 underline hover:text-blue-700">
          Về Trang chủ
        </a>
      </div>
    </div>
  );
};

export default NotFound;
