import { useMemo, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/utils';
import { useSellerMonthlyFees } from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import type { SellerMonthlyFee } from '@/lib/api/services';

export default function SellerMonthlyFees() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const { data: feesData, isLoading, error } = useSellerMonthlyFees({ year });

  const totals = useMemo(() => {
    const fees = feesData?.fees ?? [];
    return fees.reduce(
      (acc, f) => ({
        gross: acc.gross + f.grossAmount,
        platform: acc.platform + f.platformFee,
        net: acc.net + f.netAmount,
      }),
      { gross: 0, platform: 0, net: 0 }
    );
  }, [feesData?.fees]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Không thể tải dữ liệu doanh thu. Vui lòng thử lại sau." />;
  }

  const rows: SellerMonthlyFee[] = feesData?.fees ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Doanh thu theo tháng</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tổng hợp doanh thu, phí nền tảng và số tiền nhận theo từng tháng trong năm.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setYear(year - 1)}>
            ← {year - 1}
          </Button>
          <span className="text-lg font-semibold tabular-nums px-3">{year}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setYear(year + 1)}
            disabled={year >= new Date().getFullYear()}
          >
            {year + 1} →
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Tổng doanh thu</p>
          <p className="text-xl font-bold mt-1">{formatVND(totals.gross)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Phí nền tảng</p>
          <p className="text-xl font-bold mt-1 text-rose-600">−{formatVND(totals.platform)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Số tiền nhận</p>
          <p className="text-xl font-bold mt-1 text-emerald-600">{formatVND(totals.net)}</p>
        </div>
      </div>

      <DataTable<SellerMonthlyFee>
        title={`Chi tiết theo tháng — ${year}`}
        description="Doanh thu trừ phí nền tảng (commission) cho mỗi tháng"
        data={rows}
        columns={[
          { key: 'month', header: 'Tháng', render: (r) => `Tháng ${r.month}` },
          { key: 'grossAmount', header: 'Doanh thu gộp', render: (r) => formatVND(r.grossAmount) },
          {
            key: 'platformFee',
            header: 'Phí nền tảng',
            render: (r) => (r.platformFee > 0 ? `−${formatVND(r.platformFee)}` : formatVND(0)),
          },
          {
            key: 'netAmount',
            header: 'Số tiền nhận',
            render: (r) => formatVND(r.netAmount),
          },
        ]}
      />
    </div>
  );
}