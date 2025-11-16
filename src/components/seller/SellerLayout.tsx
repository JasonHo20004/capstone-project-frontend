import { Outlet } from 'react-router-dom';
import SellerSidebar from './SellerSidebar';
import SellerHeader from './SellerHeader';

export default function SellerLayout() {
  return (
    <div className="flex h-screen bg-background">
      <SellerSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <SellerHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-screen-xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
