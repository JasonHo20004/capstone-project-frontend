import { useMemo } from 'react';
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
  title = 'Xác nhận thanh toán',
  items = [],
  purchaseDate,
  confirmLabel = 'Xác nhận',
  onConfirm,
}: PaymentDialogProps) {
  const dateText = useMemo(() => (purchaseDate ?? new Date()).toLocaleString('vi-VN'), [purchaseDate]);

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Vui lòng kiểm tra thông tin đơn hàng trước khi xác nhận.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ngày mua</Label>
              <div className="text-lg font-semibold">{dateText}</div>
            </div>
            <div>
              <Label>Tổng tiền</Label>
              <div className="text-lg font-semibold text-primary">{formatVND(amount)}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sản phẩm</Label>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không có sản phẩm hiển thị.</p>
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
            Huỷ
          </Button>
          <Button onClick={handleConfirm} className="bg-gradient-primary">
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}