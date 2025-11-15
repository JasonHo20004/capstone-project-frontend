import { useState } from 'react';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Wallet, CheckCircle2 } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { formatVND } from '@/lib/utils';

type PaymentMethod = 'MOMO' | 'ZALOPAY' | 'BANKING' | 'APPLEPAY';

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'MOMO', label: 'MOMO' },
  { value: 'ZALOPAY', label: 'ZaloPay' },
  { value: 'BANKING', label: 'Chuyển khoản ngân hàng' },
  { value: 'APPLEPAY', label: 'Apple Pay' },
];

export default function WalletPage() {
  const { balance, deposit } = useWallet();
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>('MOMO');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ (> 0).');
      return;
    }
    setLoading(true);
    // Giả lập xử lý cổng thanh toán
    await new Promise((r) => setTimeout(r, 600));
    deposit(amt, method, 'VND');
    setLoading(false);
    setAmount('');
    toast.success('Nạp tiền thành công vào ví của bạn!');
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-20">
        <section className="bg-gradient-hero text-primary-foreground py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4">
              <Wallet className="h-8 w-8" />
              <div>
                <h1 className="text-4xl font-bold font-['Be Vietnam Pro']">Ví của bạn</h1>
                <p className="text-primary-foreground/80">Nạp tiền để thanh toán khóa học nhanh chóng</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 grid lg:grid-cols-3 gap-8">
            <Card className="p-6 lg:col-span-1">
              <h2 className="text-xl font-semibold mb-4">Số dư hiện tại</h2>
              <p className="text-3xl font-bold">{formatVND(balance)}</p>
              <p className="text-sm text-muted-foreground mt-2">Sử dụng số dư để thanh toán các khóa học.</p>
            </Card>

            <Card className="p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold mb-6">Nạp tiền vào ví</h2>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Số tiền (VND)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min={1}
                      step={1000}
                      placeholder="Ví dụ: 200000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phương thức thanh toán</Label>
                    <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phương thức" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-md border p-4 bg-muted/50">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Lưu ý</p>
                      <p className="text-sm text-muted-foreground">
                        Đây là mô phỏng nạp tiền trên giao diện. Sau khi nạp, số dư sẽ được cập nhật ngay.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Đang xử lý...' : 'Nạp tiền'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setAmount('')}>Làm mới</Button>
                </div>
              </form>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}