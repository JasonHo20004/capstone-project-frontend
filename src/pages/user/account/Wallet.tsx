import { useState } from 'react';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { formatVND } from '@/lib/utils';

// Hooks
import { useProfile } from '@/hooks/api/use-user'; // Hook lấy thông tin user & ví
import { useCreateTopupOrder, useConfirmTopup } from '@/hooks/api/use-topup'; // Hooks nạp tiền

type PaymentMethod = 'MOMO' | 'ZALOPAY' | 'BANKING' | 'APPLEPAY';

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'MOMO', label: 'MOMO' },
  { value: 'ZALOPAY', label: 'ZaloPay' },
  { value: 'BANKING', label: 'Chuyển khoản ngân hàng' },
  { value: 'APPLEPAY', label: 'Apple Pay' },
];

export default function WalletPage() {
  // 1. Lấy số dư từ Profile
  const { user, isLoading: isLoadingProfile } = useProfile();
  
  // 2. Hooks nạp tiền
  const createOrderMutation = useCreateTopupOrder();
  const confirmPaymentMutation = useConfirmTopup();

  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>('MOMO');
  
  // State giả lập quá trình thanh toán
  const [isProcessing, setIsProcessing] = useState(false);

  // Số dư hiện tại (lấy từ user.wallet.allowance)
  // Lưu ý: user?.wallet có thể null nếu user chưa có ví hoặc chưa load xong
  const currentBalance = Number(user?.wallet?.allowance) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const realMoney = Number(amount);
    if (Number.isNaN(realMoney) || realMoney <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ (> 0).');
      return;
    }

    setIsProcessing(true);

    try {
      // BƯỚC 1: Gọi API tạo Order (Backend)
      const createRes = await createOrderMutation.mutateAsync({ realMoney });
      const orderId = createRes.data; // Backend trả về orderId

      // BƯỚC 2: Giả lập chuyển hướng sang cổng thanh toán (Momo/Bank...)
      // Trong thực tế, đây là lúc redirect user sang trang thanh toán
      await new Promise((r) => setTimeout(r, 2000)); 

      // BƯỚC 3: Gọi API xác nhận thanh toán (Backend)
      // (Trong thực tế, bước này thường được gọi qua Webhook hoặc khi user quay lại trang web)
      await confirmPaymentMutation.mutateAsync({ orderId });

      // Reset form
      setAmount('');
    } catch (error) {
      // Lỗi đã được xử lý trong onError của hook
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingProfile) {
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
            {/* Card Số dư */}
            <Card className="p-6 lg:col-span-1 h-fit">
              <h2 className="text-xl font-semibold mb-4">Số dư hiện tại</h2>
              <p className="text-4xl font-bold text-primary mb-2">
                {formatVND(currentBalance)}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>Sử dụng số dư để mua khóa học ngay lập tức.</span>
              </div>
            </Card>

            {/* Form Nạp tiền */}
            <Card className="p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold mb-6">Nạp tiền vào ví</h2>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Số tiền muốn nạp (VND)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min={1000}
                      step={1000}
                      placeholder="Ví dụ: 200000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={isProcessing}
                      className="text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phương thức thanh toán</Label>
                    <Select 
                      value={method} 
                      onValueChange={(v) => setMethod(v as PaymentMethod)}
                      disabled={isProcessing}
                    >
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

                {/* Thông báo giả lập */}
                <div className="rounded-md border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">Mô phỏng thanh toán</p>
                      <p className="text-sm text-green-700">
                        Hệ thống sẽ tự động xác nhận thanh toán sau 2 giây để cộng tiền vào ví.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    disabled={isProcessing || !amount} 
                    className="w-full md:w-auto min-w-[150px] bg-primary"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      'Nạp tiền ngay'
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setAmount('')}
                    disabled={isProcessing}
                  >
                    Làm mới
                  </Button>
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