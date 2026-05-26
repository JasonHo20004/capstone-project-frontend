import { Outlet } from 'react-router-dom';
import SellerSidebar from './SellerSidebar';
import SellerHeader from './SellerHeader';

export default function SellerLayout() {
  return (
    <div className="flex h-screen bg-background">
      <SellerSidebar />
      {/* Spacer: matches sidebar collapsed width so content doesn't shift on hover */}
      <div className="w-20 flex-shrink-0" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <SellerHeader />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="mx-auto w-full max-w-screen-xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
