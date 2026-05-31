import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatVND } from '@/lib/utils';
import { useRequestWithdrawal, useSellerWithdrawalHistory } from '@/hooks/api';
import { toast } from 'sonner';
import { Info, Clock, ShieldCheck } from 'lucide-react';

interface WithdrawalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
}

// Mirror backend limits (apps/payment-service/.../withdrawal.service.ts).
const MIN_WITHDRAW = 50_000;
const MAX_WITHDRAW = 50_000_000;
// Per-withdrawal flat fee — keep in sync with the backend if/when it starts charging.
const WITHDRAWAL_FEE = 0;

export function WithdrawalModal({ open, onOpenChange, availableBalance }: WithdrawalModalProps) {
  const { t, i18n } = useTranslation('seller');
  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-GB';

  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  // Two-step confirmation: form → preview → submit. Prevents typos from
  // being silently approved by admin since admin transfers manually.
  const [showPreview, setShowPreview] = useState(false);

  const requestWithdrawal = useRequestWithdrawal();

  // Pre-fill from the seller's most recent withdrawal — saves them from
  // retyping bank details every time. Only fires when the modal opens.
  const { data: historyResp } = useSellerWithdrawalHistory({ page: 1, limit: 5 });
  const latestSavedAccount = useMemo(() => {
    const list = historyResp?.data ?? [];
    return list.find((w) => w.bankName && w.accountNumber) ?? null;
  }, [historyResp]);

  useEffect(() => {
    if (!open) return;
    if (latestSavedAccount && !bankName && !accountName && !accountNumber) {
      setBankName(latestSavedAccount.bankName);
      setAccountName(latestSavedAccount.accountName);
      setAccountNumber(latestSavedAccount.accountNumber);
    }
  }, [open, latestSavedAccount, bankName, accountName, accountNumber]);

  const amountNum = parseFloat(amount);
  const amountValid =
    !isNaN(amountNum) &&
    amountNum >= MIN_WITHDRAW &&
    amountNum <= Math.min(MAX_WITHDRAW, availableBalance);
  const detailsValid =
    bankName.trim().length >= 2 &&
    accountName.trim().length >= 2 &&
    /^\d{6,20}$/.test(accountNumber.trim());

  const handleMax = () => setAmount(Math.min(availableBalance, MAX_WITHDRAW).toString());

  const reset = () => {
    setAmount('');
    setShowPreview(false);
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountValid) {
      toast.error(
        amountNum < MIN_WITHDRAW
          ? t('withdrawalModal.errors.belowMin', { amount: formatVND(MIN_WITHDRAW) })
          : amountNum > availableBalance
          ? t('withdrawalModal.errors.insufficient')
          : t('withdrawalModal.errors.aboveMax', { amount: formatVND(MAX_WITHDRAW) })
      );
      return;
    }
    if (!detailsValid) {
      toast.error(t('withdrawalModal.errors.bankDetails'));
      return;
    }
    setShowPreview(true);
  };

  const handleConfirm = async () => {
    try {
      const res = await requestWithdrawal.mutateAsync({
        amount: amountNum,
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
      });
      const requestId = res?.data?.id ?? '';
      const shortId = requestId ? requestId.slice(0, 8).toUpperCase() : '';
      toast.success(
        shortId
          ? t('withdrawalModal.toasts.createdWithId', { id: shortId })
          : t('withdrawalModal.toasts.createdGeneric')
      );
      reset();
      onOpenChange(false);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('withdrawalModal.errors.generic');
      toast.error(msg);
      setShowPreview(false);
    }
  };

  const arrivesEstimate = useMemo(() => {
    const eta = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
    return eta.toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  }, [dateLocale]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-[460px]">
        {!showPreview ? (
          <form onSubmit={handleNext}>
            <DialogHeader>
              <DialogTitle>{t('withdrawalModal.title')}</DialogTitle>
              <DialogDescription className="flex items-start gap-2 mt-1">
                <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{t('withdrawalModal.lead')}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="rounded-lg bg-emerald-500/10 p-3 text-center border border-emerald-500/20">
                <p className="text-xs text-muted-foreground">{t('withdrawalModal.available')}</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-display">
                  {formatVND(availableBalance)}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="amount">{t('withdrawalModal.amountLabel')}</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    min={MIN_WITHDRAW}
                    max={Math.min(MAX_WITHDRAW, availableBalance)}
                    step="1000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t('withdrawalModal.amountPlaceholder', { amount: formatVND(MIN_WITHDRAW) })}
                    className="pr-16"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7 text-xs text-primary"
                    onClick={handleMax}
                  >
                    {t('withdrawalModal.max')}
                  </Button>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {t('withdrawalModal.limits', {
                      min: formatVND(MIN_WITHDRAW),
                      max: formatVND(MAX_WITHDRAW),
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="w-3 h-3" />
                    {t('withdrawalModal.feeLabel')}{' '}
                    {WITHDRAWAL_FEE === 0 ? t('withdrawalModal.feeFree') : formatVND(WITHDRAWAL_FEE)}
                  </span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bankName">{t('withdrawalModal.bankNameLabel')}</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder={t('withdrawalModal.bankNamePlaceholder')}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="accountName">{t('withdrawalModal.accountNameLabel')}</Label>
                <Input
                  id="accountName"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  placeholder={t('withdrawalModal.accountNamePlaceholder')}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="accountNumber">{t('withdrawalModal.accountNumberLabel')}</Label>
                <Input
                  id="accountNumber"
                  inputMode="numeric"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('withdrawalModal.accountNumberPlaceholder')}
                  required
                />
              </div>

              {latestSavedAccount && (
                <div className="text-xs text-muted-foreground flex items-start gap-2 rounded-md bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 p-2">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{t('withdrawalModal.autofillHint', { bank: latestSavedAccount.bankName })}</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('withdrawalModal.cancel')}
              </Button>
              <Button type="submit" disabled={!amountValid || !detailsValid}>
                {t('withdrawalModal.preview')}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div>
            <DialogHeader>
              <DialogTitle>{t('withdrawalModal.confirmTitle')}</DialogTitle>
              <DialogDescription>{t('withdrawalModal.confirmLead')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4 text-sm">
              <SummaryRow label={t('withdrawalModal.summary.amount')} value={formatVND(amountNum)} highlight />
              <SummaryRow
                label={t('withdrawalModal.summary.fee')}
                value={WITHDRAWAL_FEE === 0 ? t('withdrawalModal.feeFree') : `- ${formatVND(WITHDRAWAL_FEE)}`}
              />
              <SummaryRow
                label={t('withdrawalModal.summary.receive')}
                value={formatVND(Math.max(0, amountNum - WITHDRAWAL_FEE))}
                highlight
              />
              <div className="border-t my-2" />
              <SummaryRow label={t('withdrawalModal.summary.bank')} value={bankName} />
              <SummaryRow label={t('withdrawalModal.summary.accountName')} value={accountName} />
              <SummaryRow label={t('withdrawalModal.summary.accountNumber')} value={accountNumber} mono />
              <SummaryRow
                label={t('withdrawalModal.summary.eta')}
                value={t('withdrawalModal.summary.etaValue', { date: arrivesEstimate })}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(false)}
                disabled={requestWithdrawal.isPending}
              >
                {t('withdrawalModal.back')}
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={requestWithdrawal.isPending}>
                {requestWithdrawal.isPending
                  ? t('withdrawalModal.submitting')
                  : t('withdrawalModal.submit')}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
  mono,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`text-sm ${highlight ? 'font-bold text-primary' : 'font-medium'} ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}
