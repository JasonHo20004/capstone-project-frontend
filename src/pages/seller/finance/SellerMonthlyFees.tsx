import { useMemo } from 'react';
import DataTable from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { mockTransactions, mockSubscriptionContracts } from '@/data/mock';
import { formatVND } from '@/lib/utils';

type FeeRow = {
  id: string;
  createdAt: string;
  amount: number;
  status: string;
  planName: string;
  description?: string;
};

export default function SellerMonthlyFees() {
  const currentUserId = localStorage.getItem('currentUserId') || '1';

  const rows: FeeRow[] = useMemo(() => {
    const byId = new Map(mockSubscriptionContracts.map((c) => [c.id, c]));
    return mockTransactions
      .filter((t) => t.transactionType === 'MONTHLYFEE' && t.subscriptionContractId)
      .filter((t) => {
        const sc = byId.get(t.subscriptionContractId!);
        return sc?.courseSellerId === currentUserId;
      })
      .map((t) => {
        const sc = byId.get(t.subscriptionContractId!);
        return {
          id: t.id,
          createdAt: t.createdAt,
          amount: t.amount,
          status: t.status,
          planName: sc ? sc.subscriptionPlan.name : '-',
          description: t.description,
        } as FeeRow;
      });
  }, [currentUserId]);

  const statusBadge = (s: string) => {
    switch (s) {
      case 'SUCCESS':
        return <Badge className="bg-green-600">Thành công</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-600">Đang xử lý</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Thất bại</Badge>;
      default:
        return <Badge variant="outline">Khác</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Phí đăng ký hằng tháng</h1>
      <DataTable
        title="Thanh toán phí"
        description="Lịch sử phí đăng ký theo gói"
        data={rows}
        columns={[
          { key: 'createdAt', header: 'Thời gian', render: (r) => new Date(r.createdAt).toLocaleString() },
          { key: 'planName', header: 'Gói' },
          { key: 'amount', header: 'Số tiền', render: (r) => formatVND(r.amount) },
          { key: 'status', header: 'Trạng thái', render: (r) => statusBadge(r.status) },
          { key: 'description', header: 'Mô tả' },
        ]}
      />
    </div>
  );
}