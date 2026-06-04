import { useMemo, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import ChartCard from '@/components/admin/ChartCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatVND } from '@/lib/utils';
import {
  useSellerMonthlyFees,
  useSellerMonthlyFeeDetail,
  useSellerDashboard,
} from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Download, BarChart3, Wallet, Clock,
  FileSpreadsheet, Calendar,
} from 'lucide-react';
import type { SellerMonthlyFee } from '@/lib/api/services';
import { useTranslation } from 'react-i18next';

function escapeCsv(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escapeCsv(r[h])).join(',')),
  ].join('\n');
  // BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  AVAILABLE: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  RELEASED: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  REFUNDED: 'bg-red-500/10 text-red-700 border-red-500/30',
};

export default function SellerMonthlyFees() {
  const { t, i18n } = useTranslation('seller');
  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-GB';
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [drillMonth, setDrillMonth] = useState<number | null>(null);

  const { data: feesData, isLoading, error } = useSellerMonthlyFees({ year });
  // Year-over-year compare: fetch previous year's totals in parallel.
  const { data: prevFeesData } = useSellerMonthlyFees({ year: year - 1 });
  const { data: dashboard } = useSellerDashboard();

  const totals = useMemo(() => {
    const fees = feesData?.fees ?? [];
    return fees.reduce(
      (acc, f) => ({
        gross: acc.gross + f.grossAmount,
        gateway: acc.gateway + (f.gatewayFee ?? 0),
        platform: acc.platform + f.platformFee,
        net: acc.net + f.netAmount,
        sales: acc.sales + (f.salesCount ?? 0),
      }),
      { gross: 0, gateway: 0, platform: 0, net: 0, sales: 0 }
    );
  }, [feesData?.fees]);

  const prevTotals = useMemo(() => {
    const fees = prevFeesData?.fees ?? [];
    return fees.reduce(
      (acc, f) => ({ net: acc.net + f.netAmount }),
      { net: 0 }
    );
  }, [prevFeesData?.fees]);

  const yoyGrowthPct = useMemo(() => {
    if (prevTotals.net <= 0) return totals.net > 0 ? 100 : 0;
    return ((totals.net - prevTotals.net) / prevTotals.net) * 100;
  }, [totals.net, prevTotals.net]);

  const chartData = useMemo(
    () =>
      (feesData?.fees ?? []).map((f) => ({
        name: `T${f.month}`,
        net: f.netAmount,
        gross: f.grossAmount,
      })),
    [feesData?.fees]
  );

  const rows: SellerMonthlyFee[] = feesData?.fees ?? [];
  const hasAnyRevenue = totals.gross > 0;

  // Drill-down: only fired when drillMonth set, keeping mount cheap.
  const {
    data: detailRows,
    isLoading: isLoadingDetail,
  } = useSellerMonthlyFeeDetail(year, drillMonth ?? undefined, drillMonth !== null);

  const handleExportYear = () => {
    const yearRows = rows.map((r) => ({
      [t('monthlyFees.csv.month')]: t('monthlyFees.table.monthLabel', { month: r.month }),
      [t('monthlyFees.csv.year')]: r.year,
      [t('monthlyFees.csv.gross')]: r.grossAmount,
      [t('monthlyFees.csv.gatewayFee')]: r.gatewayFee ?? 0,
      [t('monthlyFees.csv.platformFee')]: r.platformFee,
      [t('monthlyFees.csv.netReceived')]: r.netAmount,
      [t('monthlyFees.csv.sales')]: r.salesCount ?? 0,
    }));
    downloadCsv(`fees-${year}.csv`, yearRows);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }
  if (error) {
    return <ErrorMessage message={t('earningsPage.loadError')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header + year nav */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t('monthlyFees.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('monthlyFees.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setYear(year - 1)}>
            ← {year - 1}
          </Button>
          <span className="text-lg font-semibold tabular-nums px-3 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            {year}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setYear(year + 1)}
            disabled={year >= currentYear}
          >
            {year + 1} →
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportYear} disabled={!hasAnyRevenue}>
            <Download className="w-4 h-4 mr-1.5" /> {t('monthlyFees.exportCsv')}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('monthlyFees.summary.totalRevenue', { year })}</p>
            <p className="text-xl font-bold mt-1 font-display">{formatVND(totals.gross)}</p>
            {totals.sales > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{t('monthlyFees.summary.salesCount', { count: totals.sales })}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('monthlyFees.summary.fees')}</p>
            <p className="text-xl font-bold mt-1 text-rose-600 font-display">
              −{formatVND(totals.gateway + totals.platform)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('monthlyFees.summary.feesBreakdown', { gateway: formatVND(totals.gateway), platform: formatVND(totals.platform) })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('monthlyFees.summary.netReceived')}</p>
            <p className="text-xl font-bold mt-1 text-emerald-600 font-display">
              {formatVND(totals.net)}
            </p>
            <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
              {yoyGrowthPct >= 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
              {t('monthlyFees.summary.yoy', { pct: `${yoyGrowthPct >= 0 ? '+' : ''}${yoyGrowthPct.toFixed(1)}`, year: year - 1 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Wallet className="w-3 h-3" />
              {t('monthlyFees.summary.available')}
            </p>
            <p className="text-xl font-bold mt-1 text-primary font-display">
              {formatVND(dashboard?.financial?.allowance ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t('monthlyFees.summary.locked', { amount: formatVND(dashboard?.financial?.pendingBalance ?? 0) })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <ChartCard
        title={t('monthlyFees.chart.title', { year })}
        description={t('monthlyFees.chart.description')}
      >
        <div className="h-[260px] w-full">
          {hasAnyRevenue ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                  formatter={(value: number, key) => [
                    formatVND(value),
                    key === 'net' ? t('monthlyFees.chart.net') : t('monthlyFees.chart.gross'),
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="net"
                  stroke="hsl(142, 71%, 45%)"
                  fill="url(#netGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <BarChart3 className="w-10 h-10 mx-auto opacity-30" />
                <p className="mt-2 text-sm font-medium">{t('monthlyFees.chart.emptyTitle', { year })}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('monthlyFees.chart.emptyHint')}
                </p>
              </div>
            </div>
          )}
        </div>
      </ChartCard>

      {/* Table */}
      <DataTable<SellerMonthlyFee>
        title={t('monthlyFees.table.title', { year })}
        description={t('monthlyFees.table.description')}
        data={rows}
        columns={[
          {
            key: 'month',
            header: t('monthlyFees.table.month'),
            render: (r) => (
              <button
                className="font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                disabled={(r.salesCount ?? 0) === 0}
                onClick={() => setDrillMonth(r.month)}
                title={(r.salesCount ?? 0) === 0 ? t('monthlyFees.table.monthNoSales') : t('monthlyFees.table.monthView')}
              >
                {t('monthlyFees.table.monthLabel', { month: r.month })}
              </button>
            ),
          },
          { key: 'grossAmount', header: t('monthlyFees.table.gross'), render: (r) => formatVND(r.grossAmount) },
          {
            key: 'gatewayFee',
            header: t('monthlyFees.table.gatewayFee'),
            render: (r) => (
              <span className="text-rose-600 text-xs">
                {(r.gatewayFee ?? 0) > 0 ? `−${formatVND(r.gatewayFee ?? 0)}` : formatVND(0)}
              </span>
            ),
          },
          {
            key: 'platformFee',
            header: t('monthlyFees.table.platformFee'),
            render: (r) => (
              <span className="text-muted-foreground text-xs">
                {r.platformFee > 0 ? `−${formatVND(r.platformFee)}` : formatVND(0)}
              </span>
            ),
          },
          {
            key: 'netAmount',
            header: t('monthlyFees.table.net'),
            render: (r) => (
              <span className={r.netAmount > 0 ? 'font-semibold text-emerald-600' : 'text-muted-foreground'}>
                {formatVND(r.netAmount)}
              </span>
            ),
          },
          {
            key: 'salesCount',
            header: t('monthlyFees.table.sales'),
            render: (r) =>
              (r.salesCount ?? 0) > 0 ? (
                <Badge variant="secondary" className="text-xs">{r.salesCount}</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              ),
          },
        ]}
      />

      {!hasAnyRevenue && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <FileSpreadsheet className="w-10 h-10 opacity-30 mx-auto" />
            <p className="mt-3 text-sm font-medium">{t('monthlyFees.empty.title', { year })}</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
              {year < currentYear
                ? t('monthlyFees.empty.hintPast', { year, current: currentYear })
                : t('monthlyFees.empty.hintCurrent')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Drill-down modal */}
      <Dialog open={drillMonth !== null} onOpenChange={(o) => !o && setDrillMonth(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('monthlyFees.drill.title', { month: drillMonth, year })}</DialogTitle>
            <DialogDescription>
              {t('monthlyFees.drill.description')}
            </DialogDescription>
          </DialogHeader>
          {isLoadingDetail ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : (detailRows ?? []).length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t('monthlyFees.drill.empty')}
            </div>
          ) : (
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2 px-2">{t('monthlyFees.drill.date')}</th>
                    <th className="text-left py-2 px-2">{t('monthlyFees.drill.course')}</th>
                    <th className="text-right py-2 px-2">{t('monthlyFees.drill.learnerPaid')}</th>
                    <th className="text-right py-2 px-2">{t('monthlyFees.drill.youReceive')}</th>
                    <th className="text-left py-2 px-2">{t('monthlyFees.drill.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(detailRows ?? []).map((r) => {
                    const statusCls = STATUS_CLASS[r.status] ?? '';
                    const statusLabel = t(`monthlyFees.status.${r.status}`, { defaultValue: r.status });
                    return (
                      <tr key={r.id} className="border-b last:border-b-0 hover:bg-slate-50">
                        <td className="py-2 px-2 whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString(dateLocale)}
                        </td>
                        <td className="py-2 px-2">
                          <a
                            href={`/seller/courses/${r.courseId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            {r.courseTitle}
                          </a>
                        </td>
                        <td className="py-2 px-2 text-right tabular-nums">
                          {formatVND(r.totalAmount)}
                        </td>
                        <td className="py-2 px-2 text-right tabular-nums">
                          <span
                            className={
                              r.status === 'REFUNDED'
                                ? 'text-red-600 line-through'
                                : 'text-emerald-600 font-semibold'
                            }
                          >
                            {r.status === 'REFUNDED' ? '' : '+'}{formatVND(r.sellerAmount)}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <Badge variant="outline" className={`${statusCls} text-xs`}>
                            {statusLabel}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="text-xs">
                  <tr className="border-t">
                    <td colSpan={2} className="py-2 px-2 font-semibold">
                      {t('monthlyFees.drill.totalOrders', { count: detailRows?.length ?? 0 })}
                    </td>
                    <td className="py-2 px-2 text-right font-semibold tabular-nums">
                      {formatVND((detailRows ?? []).reduce((s, r) => s + r.totalAmount, 0))}
                    </td>
                    <td className="py-2 px-2 text-right font-semibold text-emerald-600 tabular-nums">
                      {formatVND(
                        (detailRows ?? [])
                          .filter((r) => r.status !== 'REFUNDED')
                          .reduce((s, r) => s + r.sellerAmount, 0)
                      )}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
