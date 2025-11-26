import DataTable from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { formatVND } from '@/lib/utils';
import { useSellerMonthlyFees } from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';

type FeeRow = {
  id: string;
  createdAt: string;
  amount: number;
  status: string;
  planName: string;
  description?: string;
};

export default function SellerMonthlyFees() {
  const { data: feesData, isLoading, error } = useSellerMonthlyFees();

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Không thể tải dữ liệu phí hằng tháng. Vui lòng thử lại sau." />;
  }

  const rows: FeeRow[] = feesData?.fees || [];

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