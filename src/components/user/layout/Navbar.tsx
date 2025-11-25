// Navbar.tsx (Đã-sửa-lỗi)

import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, BookOpen, User, ShoppingCart, Wallet, Bell, LogOut } from 'lucide-react'; // THÊM: icon LogOut
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';

// SỬA Ở ĐÂY: Import hook để-lấy-user-và-đăng-xuất
import { useAuth } from '@/hooks/api/use-auth'; // Giả-sử-đường-dẫn-này-đúng
import { useUser } from '@/hooks/api/use-user'; // Đây-là-hook-mới-chúng-ta-sẽ-tạo

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { count } = useCart();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // SỬA Ở ĐÂY: Lấy-trạng-thái-xác-thực
  const { logout } = useAuth();
  const { user } = useUser(); // Hook này sẽ-trả-về-`user` nếu-đã-đăng-nhập,-hoặc-`null`/`undefined` nếu-chưa
  const isLoggedIn = !!user; // Tạo-biến-boolean-đơn-giản

  const navLinks = [
    { to: '/', label: 'Trang chủ' },
    { to: '/courses', label: 'Khóa học' },
    { to: '/flashcards', label: 'Thẻ ghi nhớ' },
    { to: '/about', label: 'Giới thiệu' },
    // { to: '/blog', label: 'Blog' },
    // { to: '/contact', label: 'Liên hệ' },
  ];

  // SỬA Ở ĐÂY: Logic-thông-báo-dựa-trên-người-dùng-thật
  useEffect(() => {
    // Chúng-ta-sẽ-chuyển-sang-lấy-thông-báo-từ-API-thay-vì-mock-data
    // Tạm-thời-ẩn-logic-cũ-đi
    // if (isLoggedIn && user) {
    //   // TODO: Fetch real notifications from API based on user.id
    //   // Tạm-thời-dùng-logic-cũ-nhưng-với-user.id
    //   try {
    //     const uid = user.id; 
    //     // ... logic-lấy-từ-localStorage-của-bạn...
    //   } catch {
    //     setUnreadNotifications(0);
    //   }
    // } else {
    //   setUnreadNotifications(0); // Không-đăng-nhập,-không-có-thông-báo
    // }
    
    // Tạm-thời-giữ-logic-mock-của-bạn-cho-đến-khi-có-API
    // ... logic-useEffect-cũ-của-bạn-có-thể-để-ở-đây...
  }, [user]); // Chạy-lại-khi-user-thay-đổi

  const handleLogout = () => {
    logout(); // Gọi-hàm-logout-từ-useAuth
    setIsOpen(false); // Đóng-menu-mobile-nếu-đang-mở
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-accent transition-transform group-hover:scale-105">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent font-['Be Vietnam Pro']">
              SkillBoost
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'text-primary bg-primary/5'
                      : 'text-foreground hover:text-primary hover:bg-muted'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* SỬA Ở ĐÂY: Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              // === NẾU ĐÃ ĐĂNG NHẬP ===
              <>
                <Link to="/notifications">
                  <Button variant="ghost" size="default" className="relative">
                    <Bell className="w-4 h-4 mr-2" />
                    Thông báo
                    {/* ... badge thông-báo ... */}
                  </Button>
                </Link>
                <Link to="/wallet">
                  <Button variant="ghost" size="default">
                    <Wallet className="w-4 h-4 mr-2" />
                    Ví
                  </Button>
                </Link>
                <Link to="/cart">
                  <Button variant="ghost" size="default" className="relative">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Giỏ hàng
                    {/* ... badge giỏ-hàng ... */}
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" size="default">
                    <User className="w-4 h-4 mr-2" />
                    Hồ sơ
                  </Button>
                </Link>
                <Button variant="ghost" size="default" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </Button>
              </>
            ) : (
              // === NẾU CHƯA ĐĂNG NHẬP (KHÁCH) ===
              <>
                <Link to="/login">
                  <Button variant="ghost" size="default">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/login?register=1">
                  <Button className="bg-gradient-primary shadow-accent hover:opacity-90 transition-opacity">
                    Bắt đầu
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* SỬA Ở ĐÂY: Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-in slide-in-from-top-2">
            <div className="flex flex-col gap-2">
              {/* ... navLinks (giữ-nguyên) ... */}
              <div className="flex flex-col gap-2 pt-4 border-t border-border mt-2">
                {isLoggedIn ? (
                  // === NẾU ĐÃ ĐĂNG NHẬP (MOBILE) ===
                  <>
                    <Link to="/notifications" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" size="lg" className="w-full relative">
                        <Bell className="w-4 h-4 mr-2" />
                        Thông báo
                      </Button>
                    </Link>
                    <Link to="/wallet" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" size="lg" className="w-full">
                        <Wallet className="w-4 h-4 mr-2" />
                        Ví
                      </Button>
                    </Link>
                    <Link to="/cart" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" size="lg" className="w-full relative">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Giỏ hàng
                      </Button>
                    </Link>
                    <Link to="/profile" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" size="lg" className="w-full">
                        <User className="w-4 h-4 mr-2" />
                        Hồ sơ
                      </Button>
                    </Link>
                    <Button variant="ghost" size="lg" className="w-full" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Đăng xuất
                    </Button>
                  </>
                ) : (
                  // === NẾU CHƯA ĐĂNG NHẬP (MOBILE) ===
                  <>
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" size="lg" className="w-full">
                        Đăng nhập
                      </Button>
                    </Link>
                    <Link to="/login?register=1" onClick={() => setIsOpen(false)}>
                      <Button size="lg" className="w-full bg-gradient-primary shadow-accent">
                        Bắt đầu
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;