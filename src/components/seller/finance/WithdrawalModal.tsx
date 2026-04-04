import { useState } from 'react';
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
import { useRequestWithdrawal } from '@/hooks/api';
import { toast } from 'sonner';

interface WithdrawalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
}

export function WithdrawalModal({ open, onOpenChange, availableBalance }: WithdrawalModalProps) {
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const requestWithdrawal = useRequestWithdrawal();

  const handleMax = () => {
    setAmount(availableBalance.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Số tiền không hợp lệ');
      return;
    }
    if (amountNum > availableBalance) {
      toast.error('Số dư không đủ');
      return;
    }
    if (!bankName || !accountName || !accountNumber) {
      toast.error('Vui lòng điền đủ thông tin ngân hàng');
      return;
    }

    try {
      await requestWithdrawal.mutateAsync({
        amount: amountNum,
        bankName,
        accountName,
        accountNumber,
      });
      toast.success('Gửi yêu cầu rút tiền thành công');
      onOpenChange(false);
      setAmount('');
    } catch {
      toast.error('Có lỗi xảy ra khi gửi yêu cầu');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Yêu cầu rút tiền</DialogTitle>
            <DialogDescription>
              Tiền sẽ được chuyển vào tài khoản ngân hàng của bạn sau khi Admin duyệt.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="rounded-lg bg-emerald-500/10 p-3 text-center border border-emerald-500/20">
              <p className="text-xs text-muted-foreground">Khả dụng</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-display">
                {formatVND(availableBalance)}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Số tiền muốn rút (VNĐ)</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  max={availableBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Nhập số tiền..."
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
                  Tối đa
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bankName">Tên Ngân hàng</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="VD: Vietcombank, Techcombank..."
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="accountName">Tên chủ tài khoản</Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                placeholder="NGUYEN VAN A"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="accountNumber">Số tài khoản</Label>
              <Input
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Nhập số tài khoản hợp lệ"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={requestWithdrawal.isPending}>
              {requestWithdrawal.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
