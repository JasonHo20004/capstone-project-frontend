// src/pages/user/account/Cart.tsx
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatVND } from '@/lib/utils';
import PaymentDialog from '@/components/user/payment/PaymentDialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2, ShoppingCart, Ticket, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetUserCart,
  useCheckoutFullCart,
  useCheckoutPartial,
  useRemoveCartItem,
  useClearCart,
} from '@/hooks/api/use-cart';
import {
  couponService,
  type ValidateCouponResult,
} from '@/lib/api/services/admin/coupon-management/coupon.service';

const CartPage = () => {
  const { t } = useTranslation('account');

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

  // ── Coupon state ──────────────────────────────────────────────────────
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<ValidateCouponResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const handleClearCart = () => {
    clearMutation.mutate(undefined, {
      onSuccess: () => {
        setSelectedIds([]);
        setClearConfirmOpen(false);
      },
    });
  };

  // Reset coupon if the selected subtotal changes — server may now reject it
  // (minOrderAmount unmet) and we don't want to send a stale discount.
  const couponMatchesSubtotal = coupon && coupon.subtotal === selectedTotal;
  const appliedDiscount = couponMatchesSubtotal ? coupon!.discount : 0;
  const finalTotal = Math.max(0, selectedTotal - appliedDiscount);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      toast.error(t('cart.toasts.couponRequired'));
      return;
    }
    if (selectedIds.length === 0) {
      toast.error(t('cart.toasts.selectBeforeApply'));
      return;
    }
    setValidating(true);
    try {
      // Validate against the SELECTED items only — the server recomputes the
      // subtotal from those items' trusted prices, so minOrderAmount and the
      // discount match what checkoutPartial will apply.
      const res = await couponService.validate(code, selectedIds);
      if (res.data) {
        setCoupon(res.data);
        toast.success(t('cart.toasts.couponApplied', { code: res.data.code }));
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err instanceof Error ? err.message : t('cart.toasts.couponDefaultError'));
      toast.error(msg);
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponInput('');
  };

  const handleCheckoutClick = () => {
    if (selectedIds.length === 0) return;
    setPayOpen(true);
  };

  const handleConfirmPayment = () => {
    const couponCode = couponMatchesSubtotal ? coupon!.code : undefined;
    if (allSelected) {
      checkoutFullMutation.mutate(couponCode, {
        onSuccess: () => {
          setPayOpen(false);
          setSelectedIds([]);
          handleRemoveCoupon();
        },
      });
    } else {
      checkoutPartialMutation.mutate(
        { cartItemIds: selectedIds, couponCode },
        {
          onSuccess: () => {
            setPayOpen(false);
            setSelectedIds([]);
            handleRemoveCoupon();
          },
        }
      );
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
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">{t('cart.title')}</h1>
            <p className="text-slate-500">{t('cart.subtitle')}</p>
          </div>
        </section>

        <section className="py-6">
          <div className="container mx-auto px-0 grid lg:grid-cols-3 gap-6">
            <Card className="p-6 lg:col-span-2 space-y-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-slate-500">{t('cart.empty')}</p>
                    <p className="text-sm text-slate-500 mt-1">{t('cart.emptyHint')}</p>
                    <Button asChild className="mt-4">
                      <Link to="/courses">{t('cart.exploreCourses')}</Link>
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
                          {t('cart.selectAll', { count: cartItems.length })}
                      </label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={clearMutation.isPending}
                      onClick={() => setClearConfirmOpen(true)}
                    >
                      {clearMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      {t('cart.removeAll')}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b border-slate-200 pb-4 last:border-none last:pb-0">
                        <div className="flex items-start gap-3">
                            <Checkbox
                            checked={isSelected(item.id)}
                            onCheckedChange={(v) => toggleSelect(item.id, Boolean(v))}
                            aria-label={t('cart.selectItem', { title: item.course.title })}
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
                            {t('cart.remove')}
                        </Button>
                        </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            <Card className="p-6 space-y-4 h-fit sticky top-24">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{t('cart.subtotalCount', { count: selectedItems.length })}</span>
                  <span className="font-medium">{formatVND(selectedTotal)}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-600 flex items-center gap-1">
                      <Ticket className="h-3.5 w-3.5" /> {t('cart.discount')}
                    </span>
                    <span className="font-medium text-emerald-600">
                      -{formatVND(appliedDiscount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-slate-500">{t('cart.grandTotal')}</span>
                  <span className="text-xl font-semibold text-primary">
                    {formatVND(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Coupon input */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Ticket className="h-3.5 w-3.5" /> {t('cart.couponLabel')}
                </label>
                {coupon && couponMatchesSubtotal ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-emerald-500/40 bg-white">
                        {coupon.code}
                      </Badge>
                      <span className="text-xs text-emerald-700">
                        {coupon.discountType === 'PERCENT'
                          ? `-${coupon.discountValue}%`
                          : `-${formatVND(coupon.discountValue)}`}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRemoveCoupon}
                      className="h-7 w-7 p-0"
                      title={t('cart.removeCoupon')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={t('cart.couponPlaceholder')}
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="font-mono uppercase"
                      disabled={validating || selectedIds.length === 0}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={validating || selectedIds.length === 0}
                    >
                      {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : t('cart.applyCoupon')}
                    </Button>
                  </div>
                )}
                {!coupon && selectedIds.length === 0 && (
                  <p className="text-[11px] text-slate-400">
                    {t('cart.selectBeforeApply')}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  className="w-full bg-primary shadow-lg shadow-primary/20"
                  disabled={selectedIds.length === 0 || isProcessing}
                  onClick={handleCheckoutClick}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {t('cart.checkout')}
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <PaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        amount={finalTotal}
        title={t('cart.confirmTitle')}
        items={[
          ...selectedItems.map((i) => ({ title: i.course.title, price: i.priceAtTime })),
          ...(appliedDiscount > 0
            ? [{ title: t('cart.couponLineItem', { code: coupon?.code ?? '' }), price: -appliedDiscount }]
            : []),
        ]}
        confirmLabel={isProcessing ? t('cart.processing') : t('cart.confirm')}
        onConfirm={handleConfirmPayment}
      />

      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cart.clearConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cart.clearConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cart.clearConfirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleClearCart(); }}
              disabled={clearMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {clearMutation.isPending
                ? t('cart.clearConfirm.clearing')
                : t('cart.clearConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CartPage;
