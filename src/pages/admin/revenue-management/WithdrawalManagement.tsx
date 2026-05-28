import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/utils';
import {
  useAdminWithdrawalRequests,
  useAdminWithdrawalSummary,
  useApproveWithdrawal,
  useRejectWithdrawal,
} from '@/hooks/api';
import type { WithdrawalRequest } from '@/lib/api/services/withdrawal.service';
import { withdrawalService } from '@/lib/api/services/withdrawal.service';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import DataTable from '@/components/admin/DataTable';
import { toast } from 'sonner';
import { auditLogService } from '@/lib/api/services/admin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Landmark,
  DollarSign,
  Ban,
  BarChart3,
  Upload,
  ImageIcon,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function WithdrawalManagement() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');

  const { data: requestsData, isLoading, error } = useAdminWithdrawalRequests({
    page,
    limit: 10,
    status: statusFilter !== 'ALL' ? (statusFilter as any) : undefined,
  });

  const { data: summary } = useAdminWithdrawalSummary();
  const approveWithdrawal = useApproveWithdrawal();
  const rejectWithdrawal = useRejectWithdrawal();

  // Modals state
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Không thể tải danh sách yêu cầu. Vui lòng thử lại." />;
  }

  const openApprove = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setProofUrl('');
    setProofPreview(null);
    setIsUploadingProof(false);
    setAdminNote('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsApproveOpen(true);
  };

  const handleProofFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast.error('Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh phải nhỏ hơn 5 MB');
      e.target.value = '';
      return;
    }
    // Local preview shows immediately; URL fills in once S3 acks the upload.
    const localUrl = URL.createObjectURL(file);
    setProofPreview(localUrl);
    setIsUploadingProof(true);
    try {
      const res = await withdrawalService.uploadProofImage(file);
      const url = res.data?.url;
      if (!url) throw new Error('Không nhận được URL ảnh');
      setProofUrl(url);
    } catch (err) {
      console.error('[Withdrawal] proof upload failed:', err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Tải ảnh biên lai thất bại. Vui lòng thử lại.';
      toast.error(message);
      setProofPreview(null);
      setProofUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsUploadingProof(false);
    }
  };

  const clearProof = () => {
    setProofUrl('');
    setProofPreview(null);
    setIsUploadingProof(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openReject = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setAdminNote('');
    setIsRejectOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    if (!proofUrl) {
      toast.error('Vui lòng tải lên ảnh biên lai chuyển khoản');
      return;
    }
    try {
      await approveWithdrawal.mutateAsync({
        id: selectedRequest.id,
        proofImageUrl: proofUrl,
        adminNote: adminNote || undefined,
      });
      auditLogService
        .record({
          action: 'WITHDRAWAL_APPROVE',
          entityType: 'WITHDRAWAL',
          entityId: selectedRequest.id,
          reason: adminNote || undefined,
          metadata: {
            sellerId: selectedRequest.sellerId,
            amount: selectedRequest.amount,
            proofImageUrl: proofUrl || undefined,
          },
        })
        .catch((err) => console.error('[Audit] withdrawal approve log failed:', err));
      toast.success('Đã duyệt yêu cầu rút tiền');
      setIsApproveOpen(false);
    } catch {
      toast.error('Có lỗi xảy ra khi duyệt');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!adminNote.trim()) {
      toast.error('Vui lòng nhập lý do từ chối để seller biết');
      return;
    }
    try {
      await rejectWithdrawal.mutateAsync({
        id: selectedRequest.id,
        adminNote,
      });
      auditLogService
        .record({
          action: 'WITHDRAWAL_REJECT',
          entityType: 'WITHDRAWAL',
          entityId: selectedRequest.id,
          reason: adminNote.trim(),
          metadata: {
            sellerId: selectedRequest.sellerId,
            amount: selectedRequest.amount,
          },
        })
        .catch((err) => console.error('[Audit] withdrawal reject log failed:', err));
      toast.success('Đã từ chối và hoàn tiền lại ví Seller');
      setIsRejectOpen(false);
    } catch {
      toast.error('Có lỗi xảy ra khi từ chối');
    }
  };

  const statCards = [
    {
      label: 'Đang chờ duyệt',
      value: formatVND(summary?.totalPendingAmount ?? 0),
      count: summary?.pendingCount ?? 0,
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
      iconBg: 'bg-amber-500/15',
    },
    {
      label: 'Đã duyệt & Chuyển',
      value: formatVND(summary?.totalApprovedAmount ?? 0),
      count: summary?.approvedCount ?? 0,
      icon: CheckCircle2,
      color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      iconBg: 'bg-emerald-500/15',
    },
    {
      label: 'Đã từ chối',
      value: formatVND(summary?.totalRejectedAmount ?? 0),
      count: summary?.rejectedCount ?? 0,
      icon: Ban,
      color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
      iconBg: 'bg-red-500/15',
    },
    {
      label: 'Tổng yêu cầu',
      value: formatVND((summary?.totalPendingAmount ?? 0) + (summary?.totalApprovedAmount ?? 0) + (summary?.totalRejectedAmount ?? 0)),
      count: summary?.totalCount ?? 0,
      icon: BarChart3,
      color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
      iconBg: 'bg-blue-500/15',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl font-display">
            Quản lý Rút tiền (Payouts)
          </h1>
          <p className="mt-1 text-muted-foreground">
            Xử lý yêu cầu rút tiền từ Seller về tài khoản ngân hàng thực tế
          </p>
        </div>
      </div>

      {/* Flow Breakdown */}
      <Card className="border-dashed border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" />
            Quy trình Duyệt Rút tiền (Manual Payout Flow)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <Badge variant="outline" className="border-amber-500/30 text-amber-600">
              1. Seller tạo Yêu cầu
            </Badge>
            <span>→</span>
            <Badge variant="outline" className="border-blue-500/30 text-blue-600">
              2. Kế toán chuyển khoản (Banking App)
            </Badge>
            <span>→</span>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">
              3. Upload bằng chứng & Duyệt
            </Badge>
            <span className="mx-2">hoặc</span>
            <Badge variant="outline" className="border-red-500/30 text-red-600">
              Từ chối (Hoàn tiền vào ví Seller)
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, count, icon: Icon, color, iconBg }) => (
          <Card key={label} className={`overflow-hidden border ${color}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <div className={`rounded-lg p-2 ${iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">{value}</div>
              <p className="text-xs text-muted-foreground mt-1">{count} yêu cầu</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter + Table */}
      <div className="flex justify-between items-end">
        <div className="w-[200px]">
          <Label className="mb-2 block text-xs font-medium text-muted-foreground">Bộ lọc Trạng thái</Label>
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả yêu cầu</SelectItem>
              <SelectItem value="PENDING">Chờ duyệt (Pending)</SelectItem>
              <SelectItem value="APPROVED">Đã duyệt (Approved)</SelectItem>
              <SelectItem value="REJECTED">Đã từ chối (Rejected)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transaction Table */}
      <DataTable
        title="Danh sách Yêu cầu Rút tiền"
        description="Seller chỉ có thể yêu cầu rút số tiền ≤ số dư khả dụng (Tiền đã mở khoá)"
        data={requestsData?.data ?? []}
        enablePagination={false}
        columns={[
          {
            key: 'createdAt',
            header: 'Ngày tạo',
            render: (r) => (
              <div>
                <p className="font-medium">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
                <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            ),
          },
          {
            key: 'sellerId',
            header: 'Mã Seller',
            render: (r) => (
              <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{r.sellerId.slice(0, 8)}...</span>
            ),
          },
          {
            key: 'amount',
            header: 'Số tiền',
            render: (r) => (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                  {formatVND(r.amount)}
                </span>
              </div>
            ),
          },
          {
            key: 'bankDetails',
            header: 'Thông tin Ngân hàng',
            render: (r) => (
              <div className="bg-muted/50 p-2.5 rounded-md space-y-0.5 border border-border/50">
                <p className="font-semibold text-primary text-sm">{r.bankName}</p>
                <p className="text-sm text-foreground">{r.accountName}</p>
                <p className="text-xs font-mono text-muted-foreground">{r.accountNumber}</p>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Trạng thái',
            render: (r) => {
              if (r.status === 'PENDING') {
                return (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">
                    <Clock className="mr-1 h-3 w-3" /> Chờ duyệt
                  </Badge>
                );
              }
              if (r.status === 'APPROVED') {
                return (
                  <div className="space-y-1">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Đã chuyển khoản
                    </Badge>
                    {r.proofImageUrl && (
                      <a href={r.proofImageUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline block">
                        Xem biên lai
                      </a>
                    )}
                    {r.processedAt && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.processedAt).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                );
              }
              return (
                <div className="space-y-1">
                  <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/30">
                    <XCircle className="mr-1 h-3 w-3" /> Đã từ chối
                  </Badge>
                  {r.adminNote && (
                    <p className="text-xs text-muted-foreground max-w-[180px] truncate" title={r.adminNote}>
                      {r.adminNote}
                    </p>
                  )}
                  {r.processedAt && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.processedAt).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              );
            },
          },
          {
            key: 'actions',
            header: 'Thao tác',
            render: (r) => {
              if (r.status !== 'PENDING') {
                return (
                  <span className="text-xs text-muted-foreground italic">Đã xử lý</span>
                );
              }
              return (
                <div className="flex flex-col gap-2">
                  <Button size="sm" onClick={() => openApprove(r)} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Duyệt & Upload Bill
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => openReject(r)} className="gap-1.5">
                    <XCircle className="h-3.5 w-3.5" />
                    Từ chối
                  </Button>
                </div>
              );
            },
          },
        ]}
      />

      {/* Pagination */}
      {requestsData && requestsData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">Trang {page} / {requestsData.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= requestsData.totalPages} onClick={() => setPage(p => p + 1)}>
            Tiếp
          </Button>
        </div>
      )}

      {/* Empty state */}
      {(!requestsData?.data || requestsData.data.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Landmark className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">Không có yêu cầu nào</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {statusFilter === 'PENDING'
                ? 'Hiện tại không có yêu cầu rút tiền nào đang chờ duyệt.'
                : 'Không tìm thấy yêu cầu với bộ lọc hiện tại.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ─── Approve Dialog ──────────────────────────────────────────────── */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Duyệt Yêu cầu Rút tiền
            </DialogTitle>
            <DialogDescription>
              Kiểm tra lại thông tin và xác nhận bạn đã chuyển khoản cho Seller.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Transfer info summary */}
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Số tiền chuyển:</span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-display">
                      {formatVND(selectedRequest.amount)}
                    </span>
                  </div>
                  <hr className="border-border/50" />
                  <div className="grid gap-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ngân hàng:</span>
                      <span className="font-semibold">{selectedRequest.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chủ TK:</span>
                      <span className="font-semibold">{selectedRequest.accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Số TK:</span>
                      <span className="font-mono font-semibold">{selectedRequest.accountNumber}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-2">
                <Label htmlFor="proofFile" className="flex items-center gap-1">
                  Ảnh biên lai chuyển khoản
                  <span className="text-red-500">*</span>
                </Label>
                <input
                  ref={fileInputRef}
                  id="proofFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleProofFileChange}
                  className="hidden"
                />
                {!proofPreview ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingProof}
                    className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-muted/30 px-4 py-8 text-sm text-muted-foreground transition hover:border-emerald-500/50 hover:bg-emerald-500/5 disabled:opacity-60"
                  >
                    <Upload className="h-6 w-6" />
                    <span className="font-medium">Chọn ảnh biên lai từ máy</span>
                    <span className="text-xs">JPEG, PNG hoặc WebP — tối đa 5 MB</span>
                  </button>
                ) : (
                  <div className="relative overflow-hidden rounded-md border border-input">
                    <img
                      src={proofPreview}
                      alt="Biên lai chuyển khoản"
                      className="block max-h-64 w-full object-contain bg-muted/40"
                    />
                    {isUploadingProof ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tải lên...
                      </div>
                    ) : (
                      <div className="absolute right-2 top-2 flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 bg-background/90"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImageIcon className="h-3.5 w-3.5" /> Đổi ảnh
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="h-7 gap-1"
                          onClick={clearProof}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Xóa
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Bắt buộc — đây là bằng chứng duy nhất chứng minh đã chuyển khoản nếu seller khiếu nại.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="adminNoteApprove">Ghi chú thêm (Tùy chọn)</Label>
                <Input
                  id="adminNoteApprove"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Ghi chú nội bộ..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Hủy</Button>
            <Button
              onClick={handleApprove}
              disabled={approveWithdrawal.isPending || isUploadingProof || !proofUrl}
              className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              {approveWithdrawal.isPending
                ? 'Đang duyệt...'
                : isUploadingProof
                  ? 'Đang tải ảnh...'
                  : 'Xác nhận Đã Chuyển Khoản'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Reject Dialog ───────────────────────────────────────────────── */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Từ chối Yêu cầu Rút tiền
            </DialogTitle>
            <DialogDescription>
              Yêu cầu này sẽ bị hủy và {selectedRequest && formatVND(selectedRequest.amount)} sẽ được hoàn lại vào ví Khả dụng của Seller.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-2">
              <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Hoàn lại:</span>
                    <span className="text-xl font-bold text-red-600 dark:text-red-400 font-display">
                      {formatVND(selectedRequest.amount)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-2">
                <Label htmlFor="rejectReason">
                  Lý do từ chối (Bắt buộc)<span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rejectReason"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="VD: Sai thông tin tài khoản ngân hàng, vui lòng kiểm tra lại..."
                  className="h-24"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Hủy</Button>
            <Button
              onClick={handleReject}
              disabled={rejectWithdrawal.isPending}
              variant="destructive"
              className="gap-1.5"
            >
              <XCircle className="h-4 w-4" />
              {rejectWithdrawal.isPending ? 'Đang xử lý...' : 'Xác nhận Từ chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
