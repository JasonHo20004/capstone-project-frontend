import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AvatarCropModal } from '@/components/ui/AvatarCropModal';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Calendar, Edit, Save, X, Loader2, Camera,
  LayoutDashboard, User, Mail, Phone, Clock, Target, Wallet, KeyRound, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import CourseSellerApplicationDialog from '@/components/user/account/CourseSellerApplicationDialog';
import { formatVND, formatDate, formatDateForInput } from '@/lib/utils';
import { useProfile, useUpdateProfile } from '@/hooks/api/use-user';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { walletService } from '@/lib/api/services/user/wallet/wallet.service';

const ENGLISH_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-slate-500  border-slate-500',
  A2: 'bg-blue-500   border-blue-500',
  B1: 'bg-cyan-500   border-cyan-500',
  B2: 'bg-indigo-500 border-indigo-500',
  C1: 'bg-violet-500 border-violet-500',
  C2: 'bg-purple-600 border-purple-600',
};

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRATOR: 'Quản trị viên',
  COURSESELLER: 'Giảng viên',
  STUDENT: 'Học viên',
};

export default function Profile() {
  const { user, myApplications, isLoading, isError, error } = useProfile();
  const queryClient = useQueryClient();
  const updateProfileMutation = useUpdateProfile();

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet', 'me'],
    queryFn: () => walletService.getWallet(),
    staleTime: 1000 * 60 * 2,
    retry: false,
  });
  const walletBalance = walletData?.data?.balance ?? walletData?.data?.allowance ?? 0;

  const [editing, setEditing] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar crop state
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  // Email change dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    profilePicture: '',
    dateOfBirth: '',
    englishLevel: 'B1',
    learningGoals: [] as string[],
  });

  const [applicationOpen, setApplicationOpen] = useState(false);

  useEffect(() => {
    if (user && !editing) {
      setForm({
        fullName: user.fullName,
        phoneNumber: user.phoneNumber || '',
        profilePicture: user.profilePicture || '',
        dateOfBirth: formatDateForInput(user.dateOfBirth),
        englishLevel: user.englishLevel || 'B1',
        learningGoals: [...(user.learningGoals || [])],
      });
    }
  }, [user, editing]);

  const handleChange = (key: keyof typeof form, value: string | string[]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addGoal = () => {
    const v = goalInput.trim();
    if (!v) return;
    if (form.learningGoals.includes(v)) { toast.warning('Mục tiêu đã tồn tại'); return; }
    setForm((prev) => ({ ...prev, learningGoals: [...prev.learningGoals, v] }));
    setGoalInput('');
  };

  const removeGoal = (goal: string) =>
    setForm((prev) => ({ ...prev, learningGoals: prev.learningGoals.filter((g) => g !== goal) }));

  const cancelEdit = () => { setEditing(false); };

  // File → open crop modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File quá lớn. Vui lòng chọn ảnh dưới 5MB.'); return; }
    const objectUrl = URL.createObjectURL(file);
    setRawImageSrc(objectUrl);
    setCropOpen(true);
    e.target.value = '';
  };

  const handleCropConfirm = useCallback((dataUrl: string) => {
    setForm((prev) => ({ ...prev, profilePicture: dataUrl }));
    setCropOpen(false);
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    setRawImageSrc(null);
  }, [rawImageSrc]);

  const handleCropClose = useCallback(() => {
    setCropOpen(false);
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    setRawImageSrc(null);
  }, [rawImageSrc]);

  // Save profile — always JSON, never FormData
  const saveEdit = () => {
    if (!user) return;
    const payload: Record<string, unknown> = {
      fullName: form.fullName,
      phoneNumber: form.phoneNumber,
      englishLevel: form.englishLevel,
      learningGoals: form.learningGoals,
    };
    if (form.dateOfBirth) {
      payload.dateOfBirth = new Date(form.dateOfBirth).toISOString();
    }
    if (form.profilePicture && form.profilePicture !== (user.profilePicture ?? '')) {
      payload.profilePicture = form.profilePicture;
    }
    updateProfileMutation.mutate(payload as any, {
      onSuccess: () => {
        toast.success('Cập nhật hồ sơ thành công!');
        setEditing(false);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message
          || err?.response?.data?.error
          || err?.message
          || 'Cập nhật thất bại. Vui lòng thử lại.';
        toast.error(msg);
      },
    });
  };

  // Email change handlers
  const handleEmailChangeSend = () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Email không hợp lệ');
      return;
    }
    setEmailSent(true);
    toast.success(`Email xác thực đã được gửi đến ${newEmail}`);
  };

  const handleEmailDialogClose = () => {
    setEmailDialogOpen(false);
    setEmailSent(false);
    setNewEmail('');
  };

  // ── Loading / Error ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="container mx-auto px-4 pt-16 text-center space-y-4">
        <p className="text-xl font-semibold text-destructive">Không thể tải thông tin cá nhân.</p>
        <p className="text-slate-500 text-sm">{String(error ?? '')}</p>
        <Button onClick={() => window.location.reload()}>Tải lại trang</Button>
      </div>
    );
  }

  const userRole = localStorage.getItem('role') || user?.role || 'STUDENT';
  const isSeller = userRole === 'COURSESELLER';
  const isAdmin  = userRole === 'ADMINISTRATOR';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 shadow-sm">
        <div className="h-36 rounded-t-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
          <div className="absolute top-4 left-14 w-16 h-16 bg-white/5 rounded-full" />
          <div className="absolute -bottom-16 left-1/3 w-64 h-64 bg-indigo-700/30 rounded-full blur-2xl" />
        </div>

        <div className="bg-white rounded-b-3xl px-6 pb-5">
          <div className="flex items-start gap-4">
            {/* Avatar — larger, with crop trigger */}
            <div className="relative -mt-14 shrink-0 group">
              <UserAvatar
                src={form.profilePicture}
                name={user.fullName}
                className="h-28 w-28 border-4 border-white shadow-xl"
              />
              {editing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            {/* Name + role + badges + actions */}
            <div className="flex-1 min-w-0 pt-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-slate-900 leading-tight truncate">{user.fullName}</h1>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.englishLevel && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white border ${LEVEL_COLORS[form.englishLevel] ?? 'bg-indigo-500 border-indigo-500'}`}>
                        {form.englishLevel}
                      </span>
                    )}
                    {isSeller && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-semibold">Giảng viên</Badge>}
                    {isAdmin  && <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-xs font-semibold">Quản trị viên</Badge>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                  {isAdmin && (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/admin"><LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />Quản trị</Link>
                    </Button>
                  )}
                  {isSeller && (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/seller"><LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />Khóa học</Link>
                    </Button>
                  )}
                  {!editing ? (
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                      <Edit className="w-3.5 h-3.5 mr-1.5" />Chỉnh sửa
                    </Button>
                  ) : (
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={saveEdit} disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <><Save className="w-3.5 h-3.5 mr-1.5" />Lưu</>}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ───────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Personal info — 2/3 */}
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
            <div className="w-1 h-4 bg-indigo-500 rounded-full" />
            Thông tin cá nhân
          </h2>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-medium text-slate-500">Họ và tên</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input id="fullName" className="pl-10" value={form.fullName} disabled={!editing}
                  onChange={(e) => handleChange('fullName', e.target.value)} />
              </div>
            </div>

            {/* Email — locked, change via dialog */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                Email
                {(user as any).isEmailVerified
                  ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  : <AlertCircle className="w-3 h-3 text-amber-500" />}
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input id="email" type="email" className="pl-10 bg-slate-50 text-slate-500" value={user.email} disabled />
                </div>
                {editing && (
                  <Button size="icon" variant="outline" className="shrink-0 h-10 w-10" type="button"
                    onClick={() => setEmailDialogOpen(true)} title="Đổi email">
                    <KeyRound className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {!(user as any).isEmailVerified && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />Email chưa được xác thực
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium text-slate-500">Số điện thoại</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input id="phone" type="tel" className="pl-10" value={form.phoneNumber} disabled={!editing}
                  onChange={(e) => handleChange('phoneNumber', e.target.value.replace(/[^0-9+]/g, ''))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dob" className="text-xs font-medium text-slate-500">Ngày sinh</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input id="dob" type="date" className="pl-10" value={form.dateOfBirth} disabled={!editing}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)} />
              </div>
            </div>

            {/* English level */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-medium text-slate-500">Trình độ tiếng Anh</Label>
              <div className="flex flex-wrap gap-2">
                {ENGLISH_LEVELS.map((lvl) => {
                  const active = form.englishLevel === lvl;
                  return (
                    <button key={lvl} type="button"
                      disabled={!editing}
                      onClick={() => editing && handleChange('englishLevel', lvl)}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 transition-all duration-150
                        ${active
                          ? `${LEVEL_COLORS[lvl] ?? 'bg-indigo-500 border-indigo-500'} text-white shadow-sm`
                          : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}
                        disabled:cursor-default`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Account sidebar — 1/3 */}
        <Card className="p-6 flex flex-col gap-5">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1 h-4 bg-violet-500 rounded-full" />
            Tài khoản
          </h2>

          {/* Wallet */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
              <Wallet className="w-3.5 h-3.5" />Số dư ví
            </div>
            {walletLoading ? (
              <div className="flex justify-center py-1">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              </div>
            ) : (
              <p className="text-2xl font-bold text-indigo-600">
                {formatVND(walletBalance)}
              </p>
            )}
            <Link to="/wallet"
              className="text-xs text-indigo-400 hover:text-indigo-600 hover:underline mt-1 inline-block transition-colors">
              Nạp tiền →
            </Link>
          </div>

          {/* Meta */}
          <div className="space-y-0 text-sm divide-y divide-slate-100">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400 flex items-center gap-1.5 text-xs">
                <Clock className="w-3.5 h-3.5" />Tham gia
              </span>
              <span className="font-medium text-slate-700 text-xs text-right">{formatDate(user.createdAt)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── LEARNING GOALS ──────────────────────────────────────────────── */}
      <Card className="p-6">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <div className="w-1 h-4 bg-emerald-500 rounded-full" />
          Mục tiêu học tập
        </h2>

        <div className="flex flex-wrap gap-2 mb-4 min-h-[2.25rem]">
          {form.learningGoals.length > 0 ? (
            form.learningGoals.map((g) => (
              <div key={g}
                onClick={() => editing && removeGoal(g)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium select-none
                  bg-emerald-50 text-emerald-700 border border-emerald-200
                  ${editing ? 'cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors' : ''}`}
              >
                <Target className="w-3 h-3 shrink-0" />
                {g}
                {editing && <X className="w-3 h-3 opacity-60 shrink-0" />}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 italic self-center">Chưa có mục tiêu nào.</p>
          )}
        </div>

        {editing ? (
          <div className="flex gap-2">
            <Input className="flex-1"
              placeholder="Ví dụ: Đạt IELTS 7.0, Giao tiếp trôi chảy..."
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addGoal(); } }}
            />
            <Button type="button" onClick={addGoal} className="shrink-0">+ Thêm</Button>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Nhấn "Chỉnh sửa" ở trên để thêm hoặc xóa mục tiêu.</p>
        )}
      </Card>

      {/* ── SELLER APPLICATION ──────────────────────────────────────────── */}
      {!isAdmin && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1 h-4 bg-amber-500 rounded-full" />
              Trở thành giảng viên
            </h2>
            {isSeller && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-semibold">
                Đã là giảng viên
              </Badge>
            )}
          </div>

          <p className="text-sm text-slate-500">
            Gửi đơn đăng ký để đội ngũ admin xét duyệt. Cung cấp chứng chỉ và chuyên môn liên quan đến giảng dạy.
          </p>

          {!isSeller && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Trạng thái mới nhất</p>
                {myApplications.length > 0 ? (() => {
                  const latest = [...myApplications].sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                  return (
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        latest.status === 'APPROVED' ? 'default' :
                        latest.status === 'REJECTED' ? 'destructive' : 'secondary'
                      }>
                        {latest.status === 'PENDING' ? 'Đang chờ duyệt' :
                         latest.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {new Date(latest.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  );
                })() : (
                  <p className="text-sm text-slate-400 italic">Chưa có đơn nào</p>
                )}
              </div>
              <Button
                onClick={() => setApplicationOpen(true)}
                disabled={myApplications.some((a) => a.status === 'PENDING')}
                className="shrink-0"
              >
                {myApplications.some((a) => a.status === 'PENDING') ? 'Đang chờ duyệt' : 'Nộp đơn'}
              </Button>
            </div>
          )}

          {myApplications.length > 0 && !isSeller && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Lịch sử đơn đã nộp</p>
              {[...myApplications]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((app) => (
                  <div key={app.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        app.status === 'APPROVED' ? 'default' :
                        app.status === 'REJECTED' ? 'destructive' : 'secondary'
                      }>
                        {app.status === 'PENDING' ? 'Đang chờ duyệt' :
                         app.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    {app.message && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Lời nhắn</p>
                        <p className="text-sm bg-white p-2.5 rounded-lg border border-slate-200">{app.message}</p>
                      </div>
                    )}

                    {app.rejectionReason && (
                      <div>
                        <p className="text-xs font-medium text-destructive mb-1">Lý do từ chối</p>
                        <p className="text-sm text-destructive bg-destructive/5 p-2.5 rounded-lg border border-destructive/20">
                          {app.rejectionReason}
                        </p>
                      </div>
                    )}

                    {app.expertise && app.expertise.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1.5">Chuyên môn</p>
                        <div className="flex flex-wrap gap-1.5">
                          {app.expertise.map((exp, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs font-normal">{exp}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {app.certification && app.certification.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1.5">Chứng chỉ</p>
                        <div className="flex flex-wrap gap-2">
                          {app.certification.map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                              className="block w-16 h-16 rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity">
                              <img src={url} alt={`Cert ${idx + 1}`} className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </Card>
      )}

      <CourseSellerApplicationDialog
        open={applicationOpen}
        onOpenChange={setApplicationOpen}
        userId={user.id}
        onSubmitted={() => {
          toast.success('Nộp đơn thành công!');
          queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
        }}
      />

      {/* ── AVATAR CROP MODAL ───────────────────────────────────────────── */}
      {rawImageSrc && (
        <AvatarCropModal
          imageSrc={rawImageSrc}
          open={cropOpen}
          onClose={handleCropClose}
          onConfirm={handleCropConfirm}
        />
      )}

      {/* ── EMAIL CHANGE DIALOG ─────────────────────────────────────────── */}
      <Dialog open={emailDialogOpen} onOpenChange={(o) => !o && handleEmailDialogClose()}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-500" />
              Đổi địa chỉ email
            </DialogTitle>
          </DialogHeader>

          {!emailSent ? (
            <div className="space-y-4 py-1">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
                Email hiện tại <strong>{user.email}</strong> sẽ được giữ nguyên cho đến khi bạn xác nhận địa chỉ mới.
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500">Email mới</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    type="email"
                    className="pl-10"
                    placeholder="email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailChangeSend()}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 space-y-3 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Email xác thực đã được gửi!</p>
                <p className="text-xs text-slate-500 mt-1">
                  Kiểm tra hộp thư của <strong>{newEmail}</strong> và nhấn vào liên kết xác nhận để hoàn tất.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 flex-row justify-end pt-1">
            <Button variant="outline" size="sm" onClick={handleEmailDialogClose}>
              {emailSent ? 'Đóng' : 'Hủy'}
            </Button>
            {!emailSent && (
              <Button size="sm" onClick={handleEmailChangeSend}>
                Gửi email xác thực
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
