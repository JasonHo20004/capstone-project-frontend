import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, BookOpen, User, ShoppingCart, Wallet, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { mockNotifications } from '@/data/mock';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { count } = useCart();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const navLinks = [
    { to: '/', label: 'Trang chủ' },
    { to: '/courses', label: 'Khóa học' },
    { to: '/flashcards', label: 'Thẻ ghi nhớ' },
    { to: '/about', label: 'Giới thiệu' },
    { to: '/blog', label: 'Blog' },
    { to: '/contact', label: 'Liên hệ' },
  ];

  // Tính số thông báo chưa đọc cho người dùng hiện tại
  useEffect(() => {
    try {
      const uid = (typeof window !== 'undefined' ? localStorage.getItem('currentUserId') : null) ?? '1';
      const seenRaw = typeof window !== 'undefined'
        ? localStorage.getItem(`skillboost_user_notifications_seen_v1_${uid}`)
        : null;
      const seenMap = seenRaw ? JSON.parse(seenRaw) : {};
      const countUnread = mockNotifications
        .filter(n => n.userIds?.includes(uid))
        .reduce((acc, n) => {
          const isSeen = (seenMap[n.id] ?? n.seen ?? false);
          return acc + (isSeen ? 0 : 1);
        }, 0);
      setUnreadNotifications(countUnread);
    } catch {
      setUnreadNotifications(mockNotifications.filter(n => !n.seen).length);
    }
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
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

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/notifications">
              <Button variant="ghost" size="default" className="relative">
                <Bell className="w-4 h-4 mr-2" />
                Thông báo
                {unreadNotifications > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {unreadNotifications}
                  </span>
                )}
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
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {count}
                  </span>
                )}
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost" size="default">
                <User className="w-4 h-4 mr-2" />
                Hồ sơ
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="default">
                <User className="w-4 h-4 mr-2" />
                Đăng nhập
              </Button>
            </Link>
            <Link to="/login?register=1">
              <Button className="bg-gradient-primary shadow-accent hover:opacity-90 transition-opacity">
                Bắt đầu
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-in slide-in-from-top-2">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'text-primary bg-primary/5'
                        : 'text-foreground hover:bg-muted'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border mt-2">
                <Link to="/notifications" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" size="lg" className="w-full relative">
                    <Bell className="w-4 h-4 mr-2" />
                    Thông báo
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1 right-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                        {unreadNotifications}
                      </span>
                    )}
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
                    {count > 0 && (
                      <span className="absolute top-1 right-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                        {count}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link to="/profile" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" size="lg" className="w-full">
                    <User className="w-4 h-4 mr-2" />
                    Hồ sơ
                  </Button>
                </Link>
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" size="lg" className="w-full">
                    <User className="w-4 h-4 mr-2" />
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/login?register=1" onClick={() => setIsOpen(false)}>
                  <Button size="lg" className="w-full bg-gradient-primary shadow-accent">
                    Bắt đầu
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
