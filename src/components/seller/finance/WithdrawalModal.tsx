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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { formatVND, cn } from '@/lib/utils';
import { VIETNAM_BANKS, findBankByBin, findBankByName } from '@/lib/constants/vietnam-banks';
import { useRequestWithdrawal, useSellerWithdrawalHistory } from '@/hooks/api';
import { toast } from 'sonner';
import { Info, Clock, ShieldCheck, ChevronsUpDown, Check } from 'lucide-react';

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
  const [bankBin, setBankBin] = useState('');
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
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
    if (latestSavedAccount && !bankBin && !accountName && !accountNumber) {
      // Recover the BIN from the saved request (new rows store it; older rows
      // only have a free-text bank name we map back to a known bank).
      const matched =
        findBankByBin(latestSavedAccount.bankBin) ?? findBankByName(latestSavedAccount.bankName);
      setBankBin(matched?.bin ?? '');
      setBankName(matched?.shortName ?? latestSavedAccount.bankName);
      setAccountName(latestSavedAccount.accountName);
      setAccountNumber(latestSavedAccount.accountNumber);
    }
  }, [open, latestSavedAccount, bankBin, accountName, accountNumber]);

  const amountNum = parseFloat(amount);
  const amountValid =
    !isNaN(amountNum) &&
    amountNum >= MIN_WITHDRAW &&
    amountNum <= Math.min(MAX_WITHDRAW, availableBalance);
  const selectedBank = findBankByBin(bankBin);
  const detailsValid =
    /^\d{6}$/.test(bankBin) &&
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
        bankBin,
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
      <DialogContent className="sm:max-w-[460px] max-h-[90vh] overflow-y-auto">
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
                <Label>{t('withdrawalModal.bankNameLabel')}</Label>
                {/* Inline picker (not a Popover): a portaled Popover lands
                    outside the Dialog and the Dialog's scroll-lock blocks the
                    mouse wheel on its list. Rendering inline keeps it scrollable. */}
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={bankPickerOpen}
                  className="justify-between font-normal"
                  onClick={() => setBankPickerOpen((o) => !o)}
                >
                  {selectedBank ? (
                    <span className="truncate">
                      {selectedBank.shortName}
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        ({selectedBank.code})
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {t('withdrawalModal.bankSelectPlaceholder')}
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
                {bankPickerOpen && (
                  <Command className="rounded-md border shadow-sm">
                    <CommandInput placeholder={t('withdrawalModal.bankSearchPlaceholder')} />
                    <CommandList className="max-h-52">
                      <CommandEmpty>{t('withdrawalModal.bankSearchEmpty')}</CommandEmpty>
                      <CommandGroup>
                        {VIETNAM_BANKS.map((bank) => (
                          <CommandItem
                            key={bank.bin}
                            value={`${bank.shortName} ${bank.code} ${bank.name}`}
                            onSelect={() => {
                              setBankBin(bank.bin);
                              setBankName(bank.shortName);
                              setBankPickerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                bankBin === bank.bin ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <span className="flex-1 truncate">{bank.shortName}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{bank.code}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                )}
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
