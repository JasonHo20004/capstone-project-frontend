import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/api/use-auth";
import { useUser } from "@/hooks/api/use-user";
import { NotificationDropdown } from "./NotificationDropdown";
import { CartDropdown } from "./CartDropdown";

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
  { name: "Notifications", path: "/notifications", icon: "notifications" },
  { name: "Profile", path: "/profile", icon: "person" },
];

const aiNavItems: NavItem[] = [
  { name: "Exam Center", path: "/exam", icon: "history_edu" },
  { name: "My Progress", path: "/my-progress", icon: "analytics" },
  { name: "Skill Tree", path: "/skill-tree", icon: "account_tree" },
  { name: "Dictation", path: "/dictation", icon: "hearing" },
  { name: "Learning Path", path: "/learning-path", icon: "route" },
];

export default function UserAppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useUser();
  const { logout } = useAuth();

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
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? "bg-primary/10 text-primary font-semibold"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
        }`
      }
    >
      <span
        className={`material-symbols-outlined ${
          item.path === "/dashboard"
            ? location.pathname === "/dashboard" ? "icon-fill" : ""
            : location.pathname.startsWith(item.path) ? "icon-fill" : ""
        }`}
      >
        {item.icon}
      </span>
      <span className="text-sm">{item.name}</span>
    </NavLink>
  );

  return (
    <div className="flex h-screen w-full bg-background font-sans">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-200">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined">school</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">SkillBoost</h1>
          <button
            className="ml-auto md:hidden text-slate-500"
            onClick={() => setIsMobileMenuOpen(false)}
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-4 mt-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 160px)" }}>
          {navItems.map(renderNavLink)}

          {/* AI Features Section */}
          <div className="mt-3 mb-1 px-4 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Features</span>
          </div>
          {aiNavItems.map(renderNavLink)}
        </nav>

        <div className="mt-auto p-4 border-t border-slate-100">
          <button
            className="flex items-center gap-3 px-4 py-2 w-full text-slate-600 hover:text-slate-900 transition-colors"
            onClick={() => logout()}
            type="button"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-medium">Sign Out</span>
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
              <div className="size-9 rounded-full bg-slate-200 overflow-hidden bg-cover bg-center">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="hidden md:block text-left mr-2">
                <p className="text-sm font-semibold text-slate-900 leading-none">
                  {user?.fullName ?? "Learner"}
                </p>
                <p className="text-xs text-slate-500 mt-1">{user?.englishLevel ?? "Student"}</p>
              </div>
            </NavLink>
          </div>
        </header>
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
