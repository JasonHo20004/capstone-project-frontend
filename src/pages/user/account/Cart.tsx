import { useMemo, useState } from 'react';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatVND } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import PaymentDialog from '@/components/user/payment/PaymentDialog';
import { Trash2 } from 'lucide-react';
// import { toast } from 'sonner';
import { usePurchases } from '@/context/PurchasesContext';

const CartPage = () => {
  const { items, removeItem, clear, total } = useCart();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isSelected = (id: string) => selectedIds.includes(id);
  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? items.map((i) => i.id) : []);
  };

  const selectedItems = useMemo(() => items.filter((i) => selectedIds.includes(i.id)), [items, selectedIds]);
  const selectedTotal = useMemo(
    () => selectedItems.reduce((sum, i) => sum + (i.price || 0), 0),
    [selectedItems]
  );

  const [payOpen, setPayOpen] = useState(false);
  const handleCheckoutSelected = () => {
    if (selectedIds.length === 0) return;
    setPayOpen(true);
  };

  const { addCourses } = usePurchases();
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        <section className="bg-gradient-hero text-primary-foreground py-12">
          <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold font-['Be Vietnam Pro']">Giỏ hàng</h1>
            <p className="text-primary-foreground/80">Xem và quản lý các khoá học đã thêm</p>
          </div>
        </section>

        <section className="py-10">
          <div className="container mx-auto px-4 grid lg:grid-cols-3 gap-8">
            <Card className="p-6 lg:col-span-2 space-y-4">
              {items.length === 0 ? (
                <p className="text-muted-foreground">Giỏ hàng trống. Hãy thêm khoá học từ danh sách khoá học.</p>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={allSelected} onCheckedChange={(v) => toggleSelectAll(Boolean(v))} />
                    <span className="text-sm">Chọn tất cả</span>
                  </div>
                  {items.map((i) => (
                    <div key={i.id} className="flex items-center justify-between border-b border-border pb-4 last:border-none last:pb-0">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected(i.id)}
                          onCheckedChange={(v) => toggleSelect(i.id, Boolean(v))}
                          aria-label={`Chọn ${i.title}`}
                        />
                        <div>
                          <h3 className="font-semibold">{i.title}</h3>
                          <p className="text-muted-foreground">{formatVND(i.price)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          removeItem(i.id);
                          setSelectedIds((prev) => prev.filter((x) => x !== i.id));
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xoá
                      </Button>
                    </div>
                  ))}
                </>
              )}
            </Card>

            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tổng đã chọn</span>
                  <span className="text-xl font-semibold text-primary">{formatVND(selectedTotal)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={clear} disabled={items.length === 0}>
                  Xoá giỏ hàng
                </Button>
                <Button
                  className="flex-1 bg-gradient-primary shadow-accent"
                  disabled={selectedIds.length === 0}
                  onClick={handleCheckoutSelected}
                >
                  Thanh toán mục đã chọn
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>
      <PaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        amount={selectedTotal}
        title="Xác nhận đơn hàng"
        items={selectedItems.map((i) => ({ title: i.title, price: i.price }))}
        confirmLabel="Xác nhận"
        onConfirm={() => {
          // Lưu các khoá học đã chọn vào thư viện
          const coursesToAdd = selectedItems
            .map((i) => i.course)
            .filter((c): c is NonNullable<typeof c> => Boolean(c));
          addCourses(coursesToAdd);
          // Xoá khỏi giỏ
          selectedIds.forEach((id) => removeItem(id));
          setSelectedIds([]);
        }}
      />
      <Footer />
    </div>
  );
};

export default CartPage;