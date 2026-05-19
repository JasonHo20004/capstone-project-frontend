import { useMemo, useState, useCallback, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/api/use-auth";
import { useUser } from "@/hooks/api/use-user";
import { NotificationDropdown } from "./NotificationDropdown";
import { CartDropdown } from "./CartDropdown";
import { AIAdvisorBanner } from "./AIAdvisorBanner";
import { useAIAdvisor } from "@/hooks/use-ai-advisor";
import { useAIInsights } from "@/hooks/use-ai-insights";
import { UserAvatar } from "@/components/ui/user-avatar";

type NavItem = {
  name: string;
  path: string;
  icon: string;
};

const navItems: NavItem[] = [
  { name: "Dashboard", path: "/dashboard", icon: "dashboard" },
  { name: "My Courses", path: "/my-courses", icon: "local_library" },
  { name: "Flashcards", path: "/flashcards", icon: "style" },
  { name: "Cart", path: "/cart", icon: "shopping_cart" },
  { name: "Wallet", path: "/wallet", icon: "account_balance_wallet" },
  { name: "Pricing", path: "/subscription", icon: "workspace_premium" },
  { name: "Notifications", path: "/notifications", icon: "notifications" },
];

const aiNavItems: NavItem[] = [
  { name: "Exam Center", path: "/exam", icon: "history_edu" },
  { name: "My Progress", path: "/my-progress", icon: "analytics" },
  { name: "Skill Tree", path: "/skill-tree", icon: "account_tree" },
  { name: "Dictation", path: "/dictation", icon: "hearing" },
  { name: "Learning Path", path: "/learning-path", icon: "route" },
  { name: "Live Classroom", path: "/live", icon: "cast_for_education" },
];

export default function UserAppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { logout } = useAuth();

  // AI Advisor SSE connection
  const { activeAction, dismiss } = useAIAdvisor({
    userId: user?.id,
    enabled: !!user?.id,
  });

  // Persist every incoming AI action so the Notifications page can display history
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
    return current?.name ?? "Learning Workspace";
  }, [location.pathname, allNavItems]);

  const renderNavLink = (item: NavItem) => (
    <NavLink
      key={item.path}
      to={item.path}
      end={item.path === "/dashboard"}
      onClick={() => setIsMobileMenuOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 mx-3 py-3 rounded-xl transition-all duration-300 overflow-hidden ${
          isActive
            ? "bg-primary/10 text-primary font-semibold"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
        }`
      }
      title={item.name} // Native tooltip for collapsed state
    >
      <div className="flex items-center justify-center w-6 flex-shrink-0 md:ml-[2px]">
        <span
          className={`material-symbols-outlined ${
            item.path === "/dashboard"
              ? location.pathname === "/dashboard" ? "icon-fill" : ""
              : location.pathname.startsWith(item.path) ? "icon-fill" : ""
          }`}
        >
          {item.icon}
        </span>
      </div>
      <span className="text-sm whitespace-nowrap transition-all duration-300 md:opacity-0 md:-translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0 opacity-100">
        {item.name}
      </span>
    </NavLink>
  );

  return (
    <div className="flex h-screen w-full bg-background font-sans overflow-hidden">
      {/* Desktop spacer to push content so overlay sidebar doesn't hide left text */}
      <div className="hidden md:block w-20 flex-shrink-0 border-r border-transparent" />

      <aside
        className={`group fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transform transition-all duration-300 ease-in-out md:translate-x-0 flex flex-col overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] hover:shadow-[4px_0_24px_rgba(0,0,0,0.05)] ${
          isMobileMenuOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:w-20 md:hover:w-64"
        }`}
        onMouseEnter={() => {}} // Could be used to delay expansion if needed
      >
        <div className="flex items-center gap-3 px-6 h-[72px] border-b border-slate-200 flex-shrink-0">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white flex-shrink-0 md:-ml-1">
            <span className="material-symbols-outlined">school</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap transition-all duration-300 md:opacity-0 md:-translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0 opacity-100">
            SkillBoost
          </h1>
          <button
            className="ml-auto md:hidden text-slate-500"
            onClick={() => setIsMobileMenuOpen(false)}
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex flex-col gap-1 mt-4 overflow-y-auto overflow-x-hidden no-scrollbar pb-6" style={{ maxHeight: "calc(100vh - 160px)" }}>
          {navItems.map(renderNavLink)}

          {/* AI Features Section */}
          <div className="mt-3 mb-2 px-6 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap block max-md:opacity-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              AI Features
            </span>
          </div>
          {aiNavItems.map(renderNavLink)}
        </nav>

        <div className="mt-auto p-4 border-t border-slate-100 flex-shrink-0">
          <button
            className="flex items-center gap-3 px-3 py-2 w-full text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors rounded-xl overflow-hidden"
            onClick={() => logout()}
            type="button"
            title="Sign Out"
          >
            <div className="flex items-center justify-center w-6 flex-shrink-0 md:ml-[2px]">
              <span className="material-symbols-outlined">logout</span>
            </div>
            <span className="text-sm font-medium whitespace-nowrap transition-all duration-300 md:opacity-0 md:-translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0 opacity-100">
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Hide layout header for full-bleed pages like skill-tree */}
        {!location.pathname.startsWith("/skill-tree") && (
        <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-slate-600"
              onClick={() => setIsMobileMenuOpen(true)}
              type="button"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-lg font-bold">{pageTitle}</h2>

          </div>

          <div className="flex items-center gap-2">
            <NotificationDropdown userId={user?.id} />
            <CartDropdown />
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />
            <NavLink
              to="/profile"
              className="flex items-center gap-3 pl-2 rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <UserAvatar src={user?.profilePicture} name={user?.fullName} className="size-9" />
              <div className="hidden md:block text-left mr-2">
                <p className="text-sm font-semibold text-slate-900 leading-none">
                  {user?.fullName ?? "Learner"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {user?.role === 'ADMINISTRATOR' ? 'Quản trị viên'
                    : user?.role === 'COURSESELLER' ? 'Giảng viên'
                    : 'Học viên'}
                </p>
              </div>
            </NavLink>
          </div>
        </header>
        )}

        {/* AI Advisor Banner — appears between header and page content */}
        {activeAction && !location.pathname.startsWith("/skill-tree") && (
          <AIAdvisorBanner
            action={activeAction}
            onDismiss={dismiss}
            onCourseClick={handleCourseClick}
          />
        )}

        <div
          className={`flex-1 overflow-y-auto scroll-smooth ${
            location.pathname.startsWith("/skill-tree")
              ? "bg-slate-950 p-0 dark-scrollbar"
              : "bg-background p-6 lg:p-8"
          }`}
        >
          <Outlet />
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
}
