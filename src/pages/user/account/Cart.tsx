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
    <div className="space-y-8 pb-12">
      <main className="flex-1">
        {/* Enhanced Hero Section matching MyCourses / Flashcards */}
        <section className="relative overflow-hidden rounded-3xl bg-hero-gradient p-8 text-white md:p-10 mb-8 shadow-md">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
          <div aria-hidden className="absolute -right-16 top-0 h-80 w-80 rounded-full bg-secondary/30 blur-3xl pointer-events-none" />
          <div aria-hidden className="absolute -left-16 bottom-0 h-60 w-60 rounded-full bg-primary-light/40 blur-3xl pointer-events-none" />

          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4">
             <ShoppingCart className="w-48 h-48 text-white" />
          </div>

          <div className="relative z-10">
            <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl mb-3 text-white">
              {t('cart.title')}
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-white/80">
              {t('cart.subtitle')}
            </p>
          </div>
        </section>

        <section>
          <div className="container mx-auto px-0 grid lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-6">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-20 px-4 bg-surface-low/50 rounded-3xl border border-dashed border-border">
                    <div className="w-24 h-24 bg-surface-lowest rounded-full flex items-center justify-center shadow-sm border border-border/60 mb-6 hover:scale-110 transition-transform duration-500">
                      <ShoppingCart className="w-10 h-10 text-primary/40" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">{t('cart.empty')}</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">{t('cart.emptyHint')}</p>
                    <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1">
                      <Link to="/courses">{t('cart.exploreCourses')}</Link>
                    </Button>
                </div>
              ) : (
                <Card className="p-6 md:p-8 rounded-3xl border-border shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 pb-6 mb-6 gap-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                          checked={allSelected}
                          onCheckedChange={(v) => toggleSelectAll(Boolean(v))}
                          id="select-all"
                          className="w-5 h-5 rounded data-[state=checked]:bg-primary"
                      />
                      <label htmlFor="select-all" className="text-base font-medium text-foreground cursor-pointer select-none">
                          {t('cart.selectAll', { count: cartItems.length })}
                      </label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full px-4 h-9"
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
                        <div key={item.id} className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-300 ${isSelected(item.id) ? 'border-primary/40 bg-primary/5 shadow-sm' : 'border-border/60 bg-surface-lowest hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md'}`}>
                          <div className="flex items-start gap-4 flex-1">
                              <div className="pt-2 sm:pt-6">
                                <Checkbox
                                  checked={isSelected(item.id)}
                                  onCheckedChange={(v) => toggleSelect(item.id, Boolean(v))}
                                  aria-label={t('cart.selectItem', { title: item.course.title })}
                                  className="w-5 h-5 rounded data-[state=checked]:bg-primary"
                                />
                              </div>
                              <div className="flex flex-1 gap-4 items-center">
                                {item.course.thumbnailUrl ? (
                                  <div className="w-24 h-16 sm:w-36 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-border shadow-sm relative">
                                    <img src={item.course.thumbnailUrl} alt={item.course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                  </div>
                                ) : (
                                  <div className="w-24 h-16 sm:w-36 sm:h-24 rounded-xl bg-surface-low shrink-0 border border-border shadow-sm flex items-center justify-center">
                                    <ShoppingCart className="w-6 h-6 text-muted-foreground/40" />
                                  </div>
                                )}
                                <div className="flex flex-col justify-center gap-1.5 flex-1 pr-2">
                                  <h3 className="font-semibold text-base sm:text-lg text-foreground line-clamp-2 leading-tight">{item.course.title}</h3>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-primary/10 text-primary font-medium border-0 px-2.5 py-0.5">{formatVND(item.priceAtTime)}</Badge>
                                  </div>
                                </div>
                              </div>
                          </div>
                          
                          <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 self-end sm:self-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-10 w-10 sm:w-auto sm:px-4"
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
                                <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 sm:mr-1.5" />
                              )}
                              <span className="hidden sm:inline font-medium">{t('cart.remove')}</span>
                          </Button>
                        </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Elevated Summary Sidebar */}
            <div className="lg:col-span-1 h-fit sticky top-24">
              <Card className="p-6 sm:p-8 space-y-6 bg-surface-lowest/80 backdrop-blur-xl border-border shadow-xl shadow-foreground/5 rounded-3xl overflow-hidden relative">
                {/* Decorative blob */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div aria-hidden className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 space-y-6">
                  <h3 className="text-xl font-bold text-foreground">{t('cart.summary')}</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>{t('cart.subtotalCount', { count: selectedItems.length })}</span>
                      <span className="font-semibold text-foreground">{formatVND(selectedTotal)}</span>
                    </div>
                    {appliedDiscount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-600 flex items-center gap-1.5 font-medium bg-emerald-50 px-2.5 py-1 rounded-md text-sm border border-emerald-100">
                          <Ticket className="h-3.5 w-3.5" /> {t('cart.discount')}
                        </span>
                        <span className="font-bold text-emerald-600">
                          -{formatVND(appliedDiscount)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-5 border-t border-border/60">
                    <div className="flex items-end justify-between mb-1.5">
                      <span className="text-muted-foreground font-medium">{t('cart.grandTotal')}</span>
                      <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light tracking-tight">
                        {formatVND(finalTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Redesigned Coupon input */}
                  <div className="space-y-3 pt-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-primary" /> {t('cart.couponLabel')}
                    </label>
                    {coupon && couponMatchesSubtotal ? (
                      <div className="flex items-center justify-between rounded-xl border-2 border-emerald-500/30 bg-emerald-50/50 px-4 py-3 transition-all">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="border-emerald-500/40 bg-surface-lowest font-mono text-emerald-700 text-sm py-1 shadow-sm">
                            {coupon.code}
                          </Badge>
                          <span className="text-sm font-semibold text-emerald-700">
                            {coupon.discountType === 'PERCENT'
                              ? `-${coupon.discountValue}%`
                              : `-${formatVND(coupon.discountValue)}`}
                          </span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleRemoveCoupon}
                          className="h-8 w-8 rounded-full text-emerald-700 hover:text-destructive hover:bg-destructive/10"
                          title={t('cart.removeCoupon')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative flex items-center">
                        <Input
                          placeholder={t('cart.couponPlaceholder')}
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          className="font-mono uppercase h-12 pr-24 rounded-xl border-border focus-visible:ring-primary/20 bg-surface-low/50 focus:bg-surface-lowest transition-colors"
                          disabled={validating || selectedIds.length === 0}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleApplyCoupon}
                          disabled={validating || selectedIds.length === 0 || !couponInput.trim()}
                          className="absolute right-1.5 h-9 rounded-lg px-4 bg-foreground hover:bg-foreground/90 text-background font-medium disabled:opacity-50 transition-all"
                        >
                          {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : t('cart.applyCoupon')}
                        </Button>
                      </div>
                    )}
                    {!coupon && selectedIds.length === 0 && (
                      <p className="text-xs text-muted-foreground pl-1">
                        {t('cart.selectBeforeApply')}
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      size="lg"
                      className="w-full h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-primary to-primary-light shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                      disabled={selectedIds.length === 0 || isProcessing}
                      onClick={handleCheckoutClick}
                    >
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <ShoppingCart className="w-5 h-5 mr-3" />}
                      {t('cart.checkout')}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
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
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">{t('cart.clearConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              {t('cart.clearConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="rounded-xl border-border">{t('cart.clearConfirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleClearCart(); }}
              disabled={clearMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl shadow-sm"
            >
              {clearMutation.isPending
                ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('cart.clearConfirm.clearing')}
                    </>
                )
                : t('cart.clearConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CartPage;
