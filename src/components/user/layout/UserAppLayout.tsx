import { useMemo, useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  ShoppingCart,
  Wallet as WalletIcon,
  Bell,
  GraduationCap,
  BarChart3,
  Network,
  Headphones,
  Route as RouteIcon,
  Tv,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/api/use-auth";
import { useUser } from "@/hooks/api/use-user";
import { NotificationDropdown } from "./NotificationDropdown";
import { CartDropdown } from "./CartDropdown";
import { AIAdvisorBanner } from "./AIAdvisorBanner";
import { useAIAdvisor } from "@/hooks/use-ai-advisor";
import { useAIInsights } from "@/hooks/use-ai-insights";
import { UserAvatar } from "@/components/ui/user-avatar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useSubscription } from "@/context/SubscriptionContext";
import { UpgradeToProButton } from "./UpgradeToProButton";
import { ProAvatar, ProBadge } from "./ProAvatar";
import { cn } from "@/lib/utils";

type NavItem = {
  i18nKey: string;
  path: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { i18nKey: "nav.dashboard", path: "/dashboard", icon: LayoutDashboard },
  { i18nKey: "nav.myCourses", path: "/my-courses", icon: BookOpen },
  { i18nKey: "nav.flashcards", path: "/flashcards", icon: Layers },
  { i18nKey: "nav.cart", path: "/cart", icon: ShoppingCart },
  { i18nKey: "nav.wallet", path: "/wallet", icon: WalletIcon },
  { i18nKey: "nav.notifications", path: "/notifications", icon: Bell },
];

const aiNavItems: NavItem[] = [
  { i18nKey: "nav.examCenter", path: "/exam", icon: GraduationCap },
  { i18nKey: "nav.myProgress", path: "/my-progress", icon: BarChart3 },
  { i18nKey: "nav.skillTree", path: "/skill-tree", icon: Network },
  { i18nKey: "nav.dictation", path: "/dictation", icon: Headphones },
  { i18nKey: "nav.learningPath", path: "/learning-path", icon: RouteIcon },
  { i18nKey: "nav.liveClassroom", path: "/live", icon: Tv },
];

export default function UserAppLayout() {
  const { t } = useTranslation(["layout", "common"]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { logout } = useAuth();
  const { isProUser } = useSubscription();

  const { activeAction, dismiss } = useAIAdvisor({
    userId: user?.id,
    enabled: !!user?.id,
  });

  const { add: saveInsight } = useAIInsights();
  useEffect(() => {
    if (activeAction) saveInsight(activeAction);
  }, [activeAction, saveInsight]);

  const handleCourseClick = useCallback((courseId: string) => {
    navigate(`/courses/${courseId}`);
  }, [navigate]);

  const allNavItems = useMemo(() => [...navItems, ...aiNavItems], []);

  const pageTitle = useMemo(() => {
    const current = allNavItems.find((item) =>
      item.path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(item.path)
    );
    return current ? t(current.i18nKey, { ns: "layout" }) : t("header.pageDefault", { ns: "layout" });
  }, [location.pathname, allNavItems, t]);

  const renderNavLink = (item: NavItem) => {
    const label = t(item.i18nKey, { ns: "layout" });
    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.path === "/dashboard"}
        onClick={() => setIsMobileMenuOpen(false)}
        title={label}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )
        }
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <span className="whitespace-nowrap opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 max-md:opacity-100 max-md:translate-x-0">
          {label}
        </span>
      </NavLink>
    );
  };

  const roleLabel = user?.role
    ? t(`roles.${user.role}`, { ns: "common", defaultValue: t("header.learner", { ns: "layout" }) })
    : t("header.learner", { ns: "layout" });

  return (
    <div className="flex h-screen w-full bg-background font-sans overflow-hidden">
      {/* Desktop spacer: matches sidebar collapsed width so content doesn't shift on hover */}
      <div className="hidden md:block w-20 flex-shrink-0" />

      <aside
        className={cn(
          "group fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border/60",
          "overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] hover:shadow-[4px_0_24px_rgba(0,0,0,0.06)]",
          "transition-[width,transform] duration-300 ease-soft",
          isMobileMenuOpen
            ? "w-64 translate-x-0"
            : "w-64 -translate-x-full md:translate-x-0 md:w-20 md:hover:w-64",
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-border/60 px-5 flex-shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="overflow-hidden whitespace-nowrap opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 max-md:opacity-100 max-md:translate-x-0">
            <h2 className="font-semibold font-display tracking-tight leading-tight">{t("app.name", { ns: "common" })}</h2>
            <p className="text-[10px] text-muted-foreground leading-tight">{t("app.tagline", { ns: "common" })}</p>
          </div>
          <button
            type="button"
            className="ml-auto md:hidden text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label={t("header.closeMenu", { ns: "layout" })}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3 overflow-y-auto overflow-x-hidden">
          {navItems.map(renderNavLink)}

          <div className="pt-3 mt-2 border-t border-border/60">
            <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 max-md:opacity-100 transition-opacity duration-300">
              {t("nav.aiFeatures", { ns: "layout" })}
            </div>
            <div className="space-y-1">
              {aiNavItems.map(renderNavLink)}
            </div>
          </div>
        </nav>

        <div className="border-t border-border/60 p-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => logout()}
            title={t("auth.logout", { ns: "layout" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="whitespace-nowrap opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 max-md:opacity-100 max-md:translate-x-0">
              {t("auth.logout", { ns: "layout" })}
            </span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {!location.pathname.startsWith("/skill-tree") && (
          <header className="flex h-16 items-center justify-between px-6 bg-card/80 backdrop-blur-md sticky top-0 z-10 border-b border-border/60">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label={t("header.openMenu", { ns: "layout" })}
              >
                <Menu className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-bold font-display tracking-tight">{pageTitle}</h2>
            </div>

            <div className="flex items-center gap-2">
              {!isProUser && <UpgradeToProButton />}
              <LanguageSwitcher />
              <NotificationDropdown userId={user?.id} />
              <CartDropdown />
              <div className="h-8 w-px bg-border/60 mx-1 hidden sm:block" />
              <NavLink
                to="/profile"
                className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-accent transition-colors cursor-pointer"
              >
                {isProUser ? (
                  <ProAvatar src={user?.profilePicture} name={user?.fullName} />
                ) : (
                  <UserAvatar src={user?.profilePicture} name={user?.fullName} className="size-9" />
                )}
                <div className="hidden md:block text-left mr-2">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground leading-none">
                      {user?.fullName ?? t("header.learner", { ns: "layout" })}
                    </p>
                    {isProUser && <ProBadge />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {roleLabel}
                  </p>
                </div>
              </NavLink>
            </div>
          </header>
        )}

        {activeAction && !location.pathname.startsWith("/skill-tree") && (
          <AIAdvisorBanner
            action={activeAction}
            onDismiss={dismiss}
            onCourseClick={handleCourseClick}
          />
        )}

        <div
          className={cn(
            "flex-1 overflow-y-auto scroll-smooth",
            location.pathname.startsWith("/skill-tree")
              ? "bg-background p-0"
              : "bg-background p-6 lg:p-8",
          )}
        >
          <Outlet />
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
