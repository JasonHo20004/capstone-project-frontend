import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Ticket, Percent, DollarSign, PowerOff, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { formatVND } from '@/lib/utils';
import DataTable from '@/components/admin/DataTable';
import FilterSection from '@/components/admin/FilterSection';
import StatCard from '@/components/admin/StatCard';
import {
  adminCouponService,
  type AdminCoupon,
  type CouponStatusFilter,
  type CouponType,
  type CreateCouponPayload,
} from '@/lib/api/services/admin/coupon-management/coupon.service';

const STATUS_OPTIONS: { value: CouponStatusFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Đã tắt' },
  { value: 'expired', label: 'Đã hết hạn' },
];

interface FormState {
  code: string;
  description: string;
  discountType: CouponType;
  discountValue: string;
  maxDiscount: string;
  minOrderAmount: string;
  maxRedemptions: string;
  maxPerUser: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

const emptyForm: FormState = {
  code: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: '',
  maxDiscount: '',
  minOrderAmount: '',
  maxRedemptions: '',
  maxPerUser: '',
  startsAt: '',
  expiresAt: '',
  isActive: true,
};

function toDateTimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toPayload(form: FormState): CreateCouponPayload {
  const value = Number(form.discountValue);
  return {
    code: form.code.trim().toUpperCase(),
    description: form.description.trim() || undefined,
    discountType: form.discountType,
    discountValue: value,
    maxDiscount:
      form.discountType === 'PERCENT' && form.maxDiscount ? Number(form.maxDiscount) : null,
    minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
    maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : null,
    maxPerUser: form.maxPerUser ? Number(form.maxPerUser) : null,
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
    expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    isActive: form.isActive,
  };
}

export default function CouponsManagement() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [status, setStatus] = useState<CouponStatusFilter>(
    (searchParams.get('status') as CouponStatusFilter) ?? 'all'
  );
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminCoupon | null>(null);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (search) next.set('q', search);
    else next.delete('q');
    if (status !== 'all') next.set('status', status);
    else next.delete('status');
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const { data, isLoading } = useQuery({
    queryKey: ['adminCoupons', { search, status, page }],
    queryFn: () =>
      adminCouponService.list({
        page,
        limit: 20,
        search: search || undefined,
        status,
      }),
  });

  const coupons = data?.data ?? [];
  const total = data?.pagination.total ?? 0;

  const stats = useMemo(() => {
    const now = Date.now();
    const active = coupons.filter(
      (c) => c.isActive && (!c.expiresAt || new Date(c.expiresAt).getTime() > now)
    ).length;
    const expired = coupons.filter(
      (c) => c.expiresAt && new Date(c.expiresAt).getTime() < now
    ).length;
    const used = coupons.reduce((sum, c) => sum + c.usedCount, 0);
    return { total: coupons.length, active, expired, used };
  }, [coupons]);

  const extractMessage = (err: unknown, fallback: string) =>
    (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ??
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    (err instanceof Error ? err.message : fallback);

  const createMut = useMutation({
    mutationFn: (payload: CreateCouponPayload) => adminCouponService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
      toast.success('Đã tạo mã giảm giá');
      closeDialog();
    },
    onError: (err: unknown) => toast.error(extractMessage(err, 'Tạo thất bại')),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; payload: CreateCouponPayload }) =>
      adminCouponService.update(vars.id, vars.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
      toast.success('Đã cập nhật mã giảm giá');
      closeDialog();
    },
    onError: (err: unknown) => toast.error(extractMessage(err, 'Cập nhật thất bại')),
  });

  const deactivateMut = useMutation({
    mutationFn: (id: string) => adminCouponService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
      toast.success('Đã vô hiệu hóa mã');
      setDeactivateTarget(null);
    },
    onError: () => toast.error('Không thể vô hiệu hóa'),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: AdminCoupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description ?? '',
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      maxDiscount: c.maxDiscount != null ? String(c.maxDiscount) : '',
      minOrderAmount: c.minOrderAmount != null ? String(c.minOrderAmount) : '',
      maxRedemptions: c.maxRedemptions != null ? String(c.maxRedemptions) : '',
      maxPerUser: c.maxPerUser != null ? String(c.maxPerUser) : '',
      startsAt: toDateTimeLocal(c.startsAt),
      expiresAt: toDateTimeLocal(c.expiresAt),
      isActive: c.isActive,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const dateRangeInvalid =
    !!form.startsAt &&
    !!form.expiresAt &&
    new Date(form.startsAt).getTime() >= new Date(form.expiresAt).getTime();

  const handleSubmit = () => {
    if (!form.code.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }
    if (!form.discountValue || Number(form.discountValue) <= 0) {
      toast.error('Giá trị giảm phải lớn hơn 0');
      return;
    }
    if (form.discountType === 'PERCENT' && Number(form.discountValue) > 100) {
      toast.error('Phần trăm giảm tối đa 100%');
      return;
    }
    if (dateRangeInvalid) {
      toast.error('Ngày hết hạn phải sau ngày bắt đầu');
      return;
    }
    const payload = toPayload(form);
    if (editing) updateMut.mutate({ id: editing.id, payload });
    else createMut.mutate(payload);
  };

  const renderType = (c: AdminCoupon) =>
    c.discountType === 'PERCENT' ? (
      <Badge variant="outline" className="gap-1">
        <Percent className="h-3 w-3" /> {Number(c.discountValue)}%
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1">
        <DollarSign className="h-3 w-3" /> {formatVND(Number(c.discountValue))}
      </Badge>
    );

  const renderStatus = (c: AdminCoupon) => {
    if (!c.isActive) return <Badge variant="secondary">Đã tắt</Badge>;
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) {
      return <Badge variant="destructive">Hết hạn</Badge>;
    }
    if (c.maxRedemptions != null && c.usedCount >= c.maxRedemptions) {
      return <Badge variant="destructive">Hết lượt</Badge>;
    }
    return <Badge variant="default">Đang hoạt động</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Ticket className="h-7 w-7 text-primary" />
            Mã giảm giá
          </h1>
          <p className="text-muted-foreground">
            Tạo và quản lý các mã giảm giá để áp dụng vào đơn hàng khóa học.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Tạo mã mới
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tổng mã (trang)" value={stats.total} description="Trên trang hiện tại" icon={Ticket} />
        <StatCard title="Đang hoạt động" value={stats.active} description="Còn dùng được" icon={Percent} />
        <StatCard title="Đã hết hạn" value={stats.expired} description="Cần dọn dẹp" icon={PowerOff} />
        <StatCard title="Tổng lượt dùng" value={stats.used} description="Cộng dồn (trang)" icon={DollarSign} />
      </div>

      <FilterSection
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Tìm theo mã hoặc mô tả..."
        filters={[
          {
            value: status,
            onChange: (v) => {
              setStatus(v as CouponStatusFilter);
              setPage(1);
            },
            options: STATUS_OPTIONS,
            placeholder: 'Lọc theo trạng thái',
          },
        ]}
      />

      <DataTable<AdminCoupon>
        title="Danh sách mã giảm giá"
        description={`Tổng cộng ${total} mã`}
        data={coupons}
        emptyMessage={isLoading ? 'Đang tải...' : 'Chưa có mã nào'}
        columns={[
          {
            key: 'code',
            header: 'Mã',
            render: (c) => (
              <div>
                <div className="font-mono font-semibold">{c.code}</div>
                {c.description && (
                  <div className="text-xs text-muted-foreground truncate max-w-xs">
                    {c.description}
                  </div>
                )}
              </div>
            ),
          },
          { key: 'discount', header: 'Giảm', render: renderType },
          {
            key: 'minOrder',
            header: 'Đơn tối thiểu',
            render: (c) =>
              Number(c.minOrderAmount) > 0 ? (
                <span>{formatVND(Number(c.minOrderAmount))}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          },
          {
            key: 'usage',
            header: 'Lượt dùng',
            render: (c) => (
              <span>
                {c.usedCount}
                {c.maxRedemptions != null && (
                  <span className="text-muted-foreground"> / {c.maxRedemptions}</span>
                )}
              </span>
            ),
          },
          {
            key: 'expiresAt',
            header: 'Hết hạn',
            render: (c) =>
              c.expiresAt ? (
                new Date(c.expiresAt).toLocaleDateString('vi-VN')
              ) : (
                <span className="text-muted-foreground">Không</span>
              ),
          },
          { key: 'status', header: 'Trạng thái', render: renderStatus },
          {
            key: 'actions',
            header: 'Thao tác',
            render: (c) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => openEdit(c)}>
                    <Pencil className="mr-2 h-4 w-4" /> Chỉnh sửa
                  </DropdownMenuItem>
                  {c.isActive && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeactivateTarget(c)}
                      >
                        <PowerOff className="mr-2 h-4 w-4" /> Vô hiệu hóa
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Cập nhật thông tin mã. Không thể đổi mã đã được sử dụng.'
                : 'Khai báo mã, loại giảm, ràng buộc và thời hạn.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="code">Mã <span className="text-destructive">*</span></Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm((s) => ({ ...s, code: e.target.value.toUpperCase() }))}
                placeholder="VD: WELCOME10"
                disabled={!!editing}
                className="font-mono uppercase"
              />
              {editing && (
                <p className="text-xs text-muted-foreground">Không thể đổi mã sau khi tạo.</p>
              )}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Mô tả (nội bộ)</Label>
              <Textarea
                id="description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="Mô tả campaign / ghi chú..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Loại giảm <span className="text-destructive">*</span></Label>
              <Select
                value={form.discountType}
                onValueChange={(v) => setForm((s) => ({ ...s, discountType: v as CouponType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT">Phần trăm (%)</SelectItem>
                  <SelectItem value="FIXED">Số tiền cố định (VNĐ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discountValue">
                Giá trị giảm <span className="text-destructive">*</span>
              </Label>
              <Input
                id="discountValue"
                type="number"
                min="0"
                step={form.discountType === 'PERCENT' ? '1' : '1000'}
                value={form.discountValue}
                onChange={(e) => setForm((s) => ({ ...s, discountValue: e.target.value }))}
                placeholder={form.discountType === 'PERCENT' ? '10' : '50000'}
              />
            </div>
            {form.discountType === 'PERCENT' && (
              <div className="space-y-1.5">
                <Label htmlFor="maxDiscount">Mức giảm tối đa (VNĐ)</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.maxDiscount}
                  onChange={(e) => setForm((s) => ({ ...s, maxDiscount: e.target.value }))}
                  placeholder="Bỏ trống = không giới hạn"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="minOrderAmount">Đơn tối thiểu (VNĐ)</Label>
              <Input
                id="minOrderAmount"
                type="number"
                min="0"
                step="1000"
                value={form.minOrderAmount}
                onChange={(e) => setForm((s) => ({ ...s, minOrderAmount: e.target.value }))}
                placeholder="0 = không yêu cầu"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxRedemptions">Tổng lượt sử dụng</Label>
              <Input
                id="maxRedemptions"
                type="number"
                min="0"
                step="1"
                value={form.maxRedemptions}
                onChange={(e) => setForm((s) => ({ ...s, maxRedemptions: e.target.value }))}
                placeholder="Bỏ trống = không giới hạn"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxPerUser">Lượt/người dùng</Label>
              <Input
                id="maxPerUser"
                type="number"
                min="0"
                step="1"
                value={form.maxPerUser}
                onChange={(e) => setForm((s) => ({ ...s, maxPerUser: e.target.value }))}
                placeholder="Bỏ trống = không giới hạn"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startsAt">Hiệu lực từ</Label>
              <Input
                id="startsAt"
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm((s) => ({ ...s, startsAt: e.target.value }))}
                className={dateRangeInvalid ? 'border-destructive' : ''}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiresAt">Hết hạn</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm((s) => ({ ...s, expiresAt: e.target.value }))}
                className={dateRangeInvalid ? 'border-destructive' : ''}
              />
              {dateRangeInvalid && (
                <p className="text-xs text-destructive">
                  Ngày hết hạn phải sau ngày bắt đầu.
                </p>
              )}
            </div>
            <div className="space-y-1.5 sm:col-span-2 flex items-center gap-3 pt-2">
              <input
                id="isActive"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="isActive">Kích hoạt ngay</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMut.isPending || updateMut.isPending || dateRangeInvalid}
            >
              {createMut.isPending || updateMut.isPending
                ? 'Đang lưu...'
                : editing
                ? 'Lưu thay đổi'
                : 'Tạo mã'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deactivateTarget} onOpenChange={(open) => !open && setDeactivateTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vô hiệu hóa mã {deactivateTarget?.code}?</DialogTitle>
            <DialogDescription>
              Mã này sẽ không thể áp dụng cho các đơn hàng mới. Các đơn đã dùng vẫn giữ lịch sử.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateTarget(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => deactivateTarget && deactivateMut.mutate(deactivateTarget.id)}
              disabled={deactivateMut.isPending}
            >
              {deactivateMut.isPending ? 'Đang xử lý...' : 'Xác nhận vô hiệu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {page} / {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Tiếp
          </Button>
        </div>
      )}
    </div>
  );
}
