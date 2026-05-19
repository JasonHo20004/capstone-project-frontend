// src/pages/user/account/Cart.tsx
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatVND } from '@/lib/utils';
import PaymentDialog from '@/components/user/payment/PaymentDialog';
import { Trash2, Loader2, ShoppingCart } from 'lucide-react';
import {
  useGetUserCart,
  useCheckoutFullCart,
  useCheckoutPartial,
  useRemoveCartItem,
  useClearCart,
} from '@/hooks/api/use-cart';

const CartPage = () => {
  // 1. Fetch Cart Data
  const { data: cart, isLoading } = useGetUserCart();
  const cartItems = cart?.cartItems || [];

  // 2. Mutations
  const checkoutFullMutation = useCheckoutFullCart();
  const checkoutPartialMutation = useCheckoutPartial();
  const removeMutation = useRemoveCartItem();
  const clearMutation = useClearCart();

  // 3. Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Helper functions
  const isSelected = (id: string) => selectedIds.includes(id);
  
  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const allSelected = cartItems.length > 0 && selectedIds.length === cartItems.length;
  
  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? cartItems.map((i) => i.id) : []);
  };

  // Derived state
  const selectedItems = useMemo(
    () => cartItems.filter((i) => selectedIds.includes(i.id)),
    [cartItems, selectedIds]
  );
  
  const selectedTotal = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.priceAtTime, 0),
    [selectedItems]
  );

  // Payment Dialog State
  const [payOpen, setPayOpen] = useState(false);

  const handleCheckoutClick = () => {
    if (selectedIds.length === 0) return;
    setPayOpen(true);
  };

  const handleConfirmPayment = () => {
    if (allSelected) {
      // Case 1: Full Checkout
      checkoutFullMutation.mutate(undefined, {
        onSuccess: () => {
          setPayOpen(false);
          setSelectedIds([]);
        },
      });
    } else {
      // Case 2: Partial Checkout
      checkoutPartialMutation.mutate(selectedIds, {
        onSuccess: () => {
          setPayOpen(false);
          setSelectedIds([]);
        },
      });
    }
  };

  const isProcessing = checkoutFullMutation.isPending || checkoutPartialMutation.isPending;

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex justify-center items-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <main className="flex-1">
        <section className="bg-white border border-slate-200 rounded-3xl py-8 shadow-sm">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Giỏ hàng</h1>
            <p className="text-slate-500">Xem và quản lý các khoá học đã thêm</p>
          </div>
        </section>

        <section className="py-6">
          <div className="container mx-auto px-0 grid lg:grid-cols-3 gap-6">
            <Card className="p-6 lg:col-span-2 space-y-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-slate-500">Giỏ hàng trống.</p>
                    <p className="text-sm text-slate-500 mt-1">Hãy thêm khoá học từ danh sách khoá học.</p>
                    <Button asChild className="mt-4">
                      <Link to="/courses">Khám phá khoá học</Link>
                    </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                          checked={allSelected}
                          onCheckedChange={(v) => toggleSelectAll(Boolean(v))}
                          id="select-all"
                      />
                      <label htmlFor="select-all" className="text-sm cursor-pointer select-none">
                          Chọn tất cả ({cartItems.length} khóa học)
                      </label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={clearMutation.isPending}
                      onClick={() => {
                        clearMutation.mutate(undefined, {
                          onSuccess: () => setSelectedIds([]),
                        });
                      }}
                    >
                      {clearMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Xoá tất cả
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b border-slate-200 pb-4 last:border-none last:pb-0">
                        <div className="flex items-start gap-3">
                            <Checkbox
                            checked={isSelected(item.id)}
                            onCheckedChange={(v) => toggleSelect(item.id, Boolean(v))}
                            aria-label={`Chọn ${item.course.title}`}
                            />
                            <div>
                            <h3 className="font-semibold line-clamp-1">{item.course.title}</h3>
                            <p className="text-slate-500 text-sm">{formatVND(item.priceAtTime)}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={removeMutation.isPending && removeMutation.variables === item.id}
                            onClick={() => {
                              removeMutation.mutate(item.id, {
                                onSuccess: () => {
                                  setSelectedIds((prev) => prev.filter((x) => x !== item.id));
                                },
                              });
                            }}
                        >
                            {removeMutation.isPending && removeMutation.variables === item.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Xoá
                        </Button>
                        </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            <Card className="p-6 space-y-4 h-fit sticky top-24">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Đã chọn ({selectedItems.length})</span>
                  <span className="text-xl font-semibold text-primary">{formatVND(selectedTotal)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full bg-primary shadow-lg shadow-primary/20"
                  disabled={selectedIds.length === 0 || isProcessing}
                  onClick={handleCheckoutClick}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Thanh toán
                </Button>
                {/* Optional: Add Clear Cart button if you have the API */}
              </div>
            </Card>
          </div>
        </section>
      </main>

      <PaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        amount={selectedTotal}
        title="Xác nhận thanh toán"
        // Map cart items to the format PaymentDialog expects
        items={selectedItems.map((i) => ({ 
            title: i.course.title, 
            price: i.priceAtTime 
        }))}
        confirmLabel={isProcessing ? "Đang xử lý..." : "Xác nhận"}
        onConfirm={handleConfirmPayment}
      />
    </div>
  );
};

export default CartPage;