import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, Wallet, LogOut, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/api/use-auth';
import { useUser } from '@/hooks/api/use-user';
import { NotificationDropdown } from './NotificationDropdown';
import { CartDropdown } from './CartDropdown';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { cn } from '@/lib/utils';

const scrollToSection = (hash: string) => {
  const el = document.getElementById(hash);
  el?.scrollIntoView({ behavior: 'smooth' });
};

const Navbar = () => {
  const { t } = useTranslation(['layout', 'common']);
  const [isOpen, setIsOpen] = useState(false);
  const { count } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { user } = useUser();
  const isLoggedIn = !!user;
  const isHomePage = location.pathname === '/';

  const scrollLinks = [
    { to: '/', hash: '', i18nKey: 'publicNav.home' },
    { to: '/#about', hash: 'about', i18nKey: 'publicNav.about' },
    { to: '/#services', hash: 'services', i18nKey: 'publicNav.services' },
    { to: '/#courses', hash: 'courses', i18nKey: 'publicNav.courses' },
    { to: '/#pricing', hash: 'pricing', i18nKey: 'publicNav.pricing' },
  ];

  const pageLinks = [
    ...(isLoggedIn ? [{ to: '/dashboard', i18nKey: 'publicNav.workspace', highlight: false }] : []),
    { to: '/flashcards', i18nKey: 'publicNav.flashcards', highlight: true },
  ];

  const handleScrollNavClick = (to: string, hash: string) => {
    setIsOpen(false);
    if (isHomePage && hash) {
      scrollToSection(hash);
    } else if (isHomePage && !hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(to);
    }
  };

  const isScrollLinkActive = (hash: string) => {
    if (!hash) return location.pathname === '/' && !location.hash;
    return location.pathname === '/' && location.hash === `#${hash}`;
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <header className="glass fixed left-0 right-0 top-0 z-50 border-b border-border/15">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2.5 shrink-0 cursor-pointer group"
        >
          <img
            src="/logo.png"
            alt={t('app.name', { ns: 'common' })}
            className="h-9 w-9 object-contain transition-all duration-200 group-hover:scale-[1.02]"
          />
          <span className="text-lg font-bold tracking-tight text-slate-900 font-display sm:text-xl">
            {t('app.name', { ns: 'common' })}
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          <div className="flex items-center gap-1">
            {scrollLinks.map((link) => (
              <button
                key={link.to}
                type="button"
                onClick={() => handleScrollNavClick(link.to, link.hash)}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer',
                  isScrollLinkActive(link.hash)
                    ? 'text-primary'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                {t(link.i18nKey, { ns: 'layout' })}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-1">
            {pageLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer',
                    link.highlight
                      ? 'text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20'
                      : isActive
                        ? 'text-primary'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )
                }
              >
                {link.highlight && (
                  <Layers className="inline-block w-3.5 h-3.5 mr-1.5 -mt-0.5 align-middle" />
                )}
                {t(link.i18nKey, { ns: 'layout' })}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-1">
          <LanguageSwitcher />
          {isLoggedIn ? (
            <>
              <NotificationDropdown userId={user?.id} />
              <Link to="/wallet">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-200 cursor-pointer"
                >
                  <Wallet className="h-5 w-5" />
                </Button>
              </Link>
              <CartDropdown />
              <Link to="/profile">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-200 cursor-pointer"
                >
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <div className="ml-2 h-6 w-px bg-slate-200" />
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                {t('auth.logout', { ns: 'layout' })}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button
                  variant="ghost"
                  className="h-9 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium cursor-pointer"
                >
                  {t('publicNav.login', { ns: 'layout' })}
                </Button>
              </Link>
              <Link to="/login?register=1">
                <Button
                  className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold px-5 cursor-pointer"
                >
                  {t('publicNav.getStarted', { ns: 'layout' })}
                </Button>
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          aria-label={isOpen ? t('header.closeMenu', { ns: 'layout' }) : t('header.openMenu', { ns: 'layout' })}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {isOpen && (
        <div className="lg:hidden border-t border-slate-200/80 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
              {t('publicNav.sectionHome', { ns: 'layout' })}
            </div>
            {scrollLinks.map((link) => (
              <button
                key={link.to}
                type="button"
                onClick={() => handleScrollNavClick(link.to, link.hash)}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                  isScrollLinkActive(link.hash)
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                {t(link.i18nKey, { ns: 'layout' })}
              </button>
            ))}
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2 mt-2">
              {t('publicNav.sectionSystem', { ns: 'layout' })}
            </div>
            {pageLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                    link.highlight
                      ? 'bg-primary/10 text-primary'
                      : isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )
                }
              >
                {link.highlight && <Layers className="h-4 w-4" />}
                {t(link.i18nKey, { ns: 'layout' })}
              </NavLink>
            ))}
            <div className="pt-3 mt-3 border-t border-slate-200 space-y-1">
              <div className="flex items-center gap-2 px-3 py-2">
                <LanguageSwitcher variant="default" />
              </div>
              {isLoggedIn ? (
                <>
                  <Link
                    to="/notifications"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100"
                  >
                    <span className="text-sm font-medium">{t('publicNav.notifications', { ns: 'layout' })}</span>
                  </Link>
                  <Link
                    to="/wallet"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100"
                  >
                    <span className="text-sm font-medium">{t('publicNav.wallet', { ns: 'layout' })}</span>
                  </Link>
                  <Link
                    to="/cart"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100"
                  >
                    <span className="text-sm font-medium">{t('publicNav.cart', { ns: 'layout' })}</span>
                    {count > 0 && (
                      <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                        {count}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100"
                  >
                    <span className="text-sm font-medium">{t('publicNav.profile', { ns: 'layout' })}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 text-left cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('auth.logout', { ns: 'layout' })}</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full h-11 rounded-lg" size="lg">
                      {t('publicNav.login', { ns: 'layout' })}
                    </Button>
                  </Link>
                  <Link to="/login?register=1" onClick={() => setIsOpen(false)}>
                    <Button className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90" size="lg">
                      {t('publicNav.getStarted', { ns: 'layout' })}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
