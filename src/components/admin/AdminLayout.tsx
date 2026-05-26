import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminBreadcrumb from './AdminBreadcrumb';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop: fixed collapsible sidebar (mirrors SellerLayout pattern) */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-40">
        <AdminSidebar />
      </div>
      {/* Spacer keeps content from sliding underneath the collapsed sidebar */}
      <div className="hidden lg:block w-20 flex-shrink-0" />

      {/* Mobile: full-width drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <AdminSidebar onNavigate={() => setMobileOpen(false)} forceExpanded />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader onOpenSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6">
          <div className="mx-auto w-full max-w-screen-xl">
            <AdminBreadcrumb />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
