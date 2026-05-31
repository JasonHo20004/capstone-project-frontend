import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatVND } from '@/lib/utils';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  title?: string;
  items?: { title: string; price: number }[];
  purchaseDate?: Date;
  confirmLabel?: string;
  onConfirm?: () => void;
}

export default function PaymentDialog({
  open,
  onOpenChange,
  amount,
  title,
  items = [],
  purchaseDate,
  confirmLabel,
  onConfirm,
}: PaymentDialogProps) {
  const { t, i18n } = useTranslation('account');
  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-GB';
  const dateText = useMemo(
    () => (purchaseDate ?? new Date()).toLocaleString(dateLocale),
    [purchaseDate, dateLocale],
  );

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title ?? t('paymentDialog.title')}</DialogTitle>
          <DialogDescription>{t('paymentDialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('paymentDialog.purchaseDate')}</Label>
              <div className="text-lg font-semibold">{dateText}</div>
            </div>
            <div>
              <Label>{t('paymentDialog.total')}</Label>
              <div className="text-lg font-semibold text-primary">{formatVND(amount)}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('paymentDialog.items')}</Label>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('paymentDialog.empty')}</p>
            ) : (
              <ul className="space-y-2">
                {items.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between border-b border-border pb-2 last:border-none last:pb-0">
                    <span className="text-sm">{item.title}</span>
                    <span className="text-sm font-medium">{formatVND(item.price)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('paymentDialog.cancel')}
          </Button>
          <Button onClick={handleConfirm} className="bg-gradient-primary">
            {confirmLabel ?? t('paymentDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}