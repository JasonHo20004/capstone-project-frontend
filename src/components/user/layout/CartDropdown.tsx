import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCart } from '@/context/CartContext';
import { formatVND } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface CartDropdownProps {
  triggerClassName?: string;
  onNavigate?: () => void;
}

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200&h=120&fit=crop';

export function CartDropdown({
  triggerClassName,
  onNavigate,
}: CartDropdownProps) {
  const { items, count, total } = useCart();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative h-10 w-10 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-200 cursor-pointer ${triggerClassName ?? ''}`}
          aria-label="Giỏ hàng"
        >
          <ShoppingCart className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 rounded-xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/50 p-0"
        sideOffset={8}
      >
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Giỏ hàng</h3>
          {count > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">{count} khoá học</p>
          )}
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <ShoppingCart className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">Giỏ hàng trống</p>
          </div>
        ) : (
          <>
            <div className="max-h-72 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="h-14 w-20 shrink-0 rounded-lg overflow-hidden bg-slate-100">
                    <img
                      src={
                        item.course?.thumbnailUrl || PLACEHOLDER_IMG
                      }
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 line-clamp-2">
                      {item.title}
                    </p>
                    <p className="text-sm font-semibold text-primary mt-0.5">
                      {formatVND(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500">Tổng cộng</span>
                <span className="font-semibold text-slate-900">
                  {formatVND(total)}
                </span>
              </div>
              <Link
                to="/cart"
                onClick={onNavigate}
                className="flex items-center justify-center w-full h-10 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Xem giỏ hàng
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
