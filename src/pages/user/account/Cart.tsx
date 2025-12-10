// src/pages/user/account/Cart.tsx
import { useMemo, useState, useEffect } from 'react';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatVND } from '@/lib/utils';
import PaymentDialog from '@/components/user/payment/PaymentDialog';
import { Trash2, Loader2 } from 'lucide-react';
import { useGetUserCart, useCheckoutFullCart, useCheckoutPartial } from '@/hooks/api/use-cart';
// Note: You might still need CartContext for 'removeItem' if you implement delete endpoint, 
// or implement a delete mutation in use-cart.ts similar to checkout.
// For now, I'll assume you only want fetch & checkout.

const CartPage = () => {
  // 1. Fetch Cart Data
  const { data: cart, isLoading } = useGetUserCart();
  const cartItems = cart?.cartItems || [];

  // 2. Mutations
  const checkoutFullMutation = useCheckoutFullCart();
  const checkoutPartialMutation = useCheckoutPartial();

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
        onError: (error: any) => {
            toast.error(error.response?.data?.message);
        }
      });
    } else {
      // Case 2: Partial Checkout
      checkoutPartialMutation.mutate(selectedIds, {
        onSuccess: () => {
            setPayOpen(false);
            setSelectedIds([]);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message);
        }
      });
    }
  };

  const isProcessing = checkoutFullMutation.isPending || checkoutPartialMutation.isPending;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="pt-20 flex-1">
        <section className="bg-gradient-hero text-primary-foreground py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold font-['Be Vietnam Pro']">Giỏ hàng</h1>
            <p className="text-primary-foreground/80">Xem và quản lý các khoá học đã thêm</p>
          </div>
        </section>

        <section className="py-10">
          <div className="container mx-auto px-4 grid lg:grid-cols-3 gap-8">
            <Card className="p-6 lg:col-span-2 space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">Giỏ hàng trống.</p>
                    <p className="text-sm text-muted-foreground mt-1">Hãy thêm khoá học từ danh sách khoá học.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 border-b border-border pb-4">
                    <Checkbox 
                        checked={allSelected} 
                        onCheckedChange={(v) => toggleSelectAll(Boolean(v))} 
                        id="select-all"
                    />
                    <label htmlFor="select-all" className="text-sm cursor-pointer select-none">
                        Chọn tất cả ({cartItems.length} khóa học)
                    </label>
                  </div>
                  
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b border-border pb-4 last:border-none last:pb-0">
                        <div className="flex items-start gap-3">
                            <Checkbox
                            checked={isSelected(item.id)}
                            onCheckedChange={(v) => toggleSelect(item.id, Boolean(v))}
                            aria-label={`Chọn ${item.course.title}`}
                            />
                            <div>
                            <h3 className="font-semibold line-clamp-1">{item.course.title}</h3>
                            <p className="text-muted-foreground text-sm">{formatVND(item.priceAtTime)}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            // You need to implement useRemoveCartItem mutation if you want this to work with backend
                            onClick={() => {
                                // Implement remove logic here
                                console.log("Remove item", item.id);
                            }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
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
                  <span className="text-muted-foreground">Đã chọn ({selectedItems.length})</span>
                  <span className="text-xl font-semibold text-primary">{formatVND(selectedTotal)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full bg-gradient-primary shadow-accent"
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
      
      <Footer />
    </div>
  );
};

export default CartPage;