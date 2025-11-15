import { useMemo, useState } from 'react';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { mockUsers } from '@/data/mock';
import { User } from '@/types/type';
import CourseSellerApplicationDialog from '@/components/user/account/CourseSellerApplicationDialog';
import type { CourseSellerApplication } from '@/types/type';
import { formatVND } from '@/lib/utils';

const currentUserId = (typeof window !== 'undefined' ? localStorage.getItem('currentUserId') : null) ?? '1';

const englishLevels = ['A1','A2','B1','B2','C1','C2'];

function formatDate(dateIso?: string) {
  if (!dateIso) return '';
  try {
    return new Date(dateIso).toLocaleDateString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
  } catch {
    return '';
  }
}

function formatDateForInput(dateIso?: string) {
  if (!dateIso) return '';
  try {
    return new Date(dateIso).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export default function Profile() {
  const initialUser: User = useMemo(() => {
    return (
      mockUsers.find(u => u.id === currentUserId) || {
        id: currentUserId,
        email: 'user@example.com',
        fullName: 'Người dùng',
        phoneNumber: '',
        profilePicture: '',
        dateOfBirth: new Date('2000-01-01').toISOString(),
        createdAt: new Date().toISOString(),
        englishLevel: 'B1',
        learningGoals: ['Giao tiếp', 'Ngữ pháp'],
      }
    ) as User;
  }, []);

  const [user, setUser] = useState<User>(initialUser);
  const [editing, setEditing] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [form, setForm] = useState({
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber || '',
    profilePicture: user.profilePicture || '',
    dateOfBirth: formatDateForInput(user.dateOfBirth),
    englishLevel: user.englishLevel || 'B1',
    learningGoals: [...(user.learningGoals || [])] as string[],
    bio: '',
  });

  // Course seller application UI states
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [myApplications, setMyApplications] = useState<CourseSellerApplication[]>(() => {
    try {
      const raw = localStorage.getItem('skillboost_course_seller_applications_v1');
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? (arr as CourseSellerApplication[]).filter(a => a.userId === currentUserId) : [];
    } catch {
      return [];
    }
  });

  const handleChange = (key: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const addGoal = () => {
    const v = goalInput.trim();
    if (!v) return;
    if (form.learningGoals.includes(v)) {
      toast.warning('Mục tiêu đã tồn tại');
      return;
    }
    setForm(prev => ({ ...prev, learningGoals: [...prev.learningGoals, v] }));
    setGoalInput('');
  };

  const removeGoal = (goal: string) => {
    setForm(prev => ({ ...prev, learningGoals: prev.learningGoals.filter(g => g !== goal) }));
  };

  const startEdit = () => setEditing(true);
  const cancelEdit = () => {
    setEditing(false);
    setForm({
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      profilePicture: user.profilePicture || '',
      dateOfBirth: formatDateForInput(user.dateOfBirth),
      englishLevel: user.englishLevel || 'B1',
      learningGoals: [...(user.learningGoals || [])],
      bio: '',
    });
  };

  const saveEdit = () => {
    const updated: User = {
      ...user,
      fullName: form.fullName,
      email: form.email,
      phoneNumber: form.phoneNumber || undefined,
      profilePicture: form.profilePicture || undefined,
      dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : user.dateOfBirth,
      englishLevel: form.englishLevel,
      learningGoals: form.learningGoals,
    };
    setUser(updated);
    setEditing(false);
    toast.success('Cập nhật thông tin cá nhân thành công!');
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-20">
        <section className="bg-gradient-hero text-primary-foreground py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.profilePicture} />
                <AvatarFallback>{user.fullName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
        <h1 className="text-4xl font-bold font-['Be Vietnam Pro']">Hồ sơ cá nhân</h1>
                <p className="text-primary-foreground/80">Quản lý và cập nhật thông tin của bạn</p>
              </div>
              <div className="flex-1" />
              {!editing ? (
                <Button variant="secondary" onClick={startEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Chỉnh sửa
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={saveEdit}>
                    <Save className="w-4 h-4 mr-2" />
                    Lưu
                  </Button>
                  <Button variant="outline" onClick={cancelEdit}>
                    <X className="w-4 h-4 mr-2" />
                    Hủy
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 grid lg:grid-cols-3 gap-8">
            {/* Thông tin cơ bản */}
            <Card className="p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold mb-6">Thông tin cơ bản</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên</Label>
                  <Input id="fullName" value={form.fullName} disabled={!editing}
                    onChange={(e) => handleChange('fullName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} disabled={!editing}
                    onChange={(e) => handleChange('email', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" value={form.phoneNumber} disabled={!editing}
                    onChange={(e) => handleChange('phoneNumber', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Ngày sinh</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="dob" type="date" className="pl-10" value={form.dateOfBirth} disabled={!editing}
                      onChange={(e) => handleChange('dateOfBirth', e.target.value)} />
                  </div>
                  {!editing && (
                    <p className="text-xs text-muted-foreground">{formatDate(user.dateOfBirth)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Ảnh đại diện (URL)</Label>
                  <Input id="avatar" value={form.profilePicture} disabled={!editing}
                    onChange={(e) => handleChange('profilePicture', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Trình độ tiếng Anh</Label>
                  <Select value={form.englishLevel} onValueChange={(v) => handleChange('englishLevel', v)} disabled={!editing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trình độ" />
                    </SelectTrigger>
                    <SelectContent>
                      {englishLevels.map((lvl) => (
                        <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 mt-6">
                <Label htmlFor="bio">Giới thiệu</Label>
                <Textarea id="bio" placeholder="Chia sẻ đôi nét về bạn..." disabled={!editing}
                  value={form.bio} onChange={(e) => handleChange('bio', e.target.value)} />
              </div>
            </Card>

            {/* Tài khoản & ví */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Tài khoản</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID người dùng</p>
                  <p className="font-mono text-sm">{user.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày tạo</p>
                  <p className="text-sm">{formatDate(user.createdAt)}</p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Số dư ví</p>
                  <p className="text-lg font-semibold">{user.wallet ? formatVND(user.wallet.allowance) : '—'}</p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Mục tiêu học tập */}
        <section className="py-2">
          <div className="container mx-auto px-4 lg:max-w-4xl">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Mục tiêu học tập</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {form.learningGoals.length > 0 ? (
                  form.learningGoals.map((g) => (
                    <Badge key={g} variant="secondary" className="cursor-pointer" onClick={() => editing && removeGoal(g)}>
                      {g}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa có mục tiêu</p>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Thêm mục tiêu..."
                  value={goalInput}
                  disabled={!editing}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addGoal(); }}
                />
                <Button variant="default" disabled={!editing} onClick={addGoal}>Thêm</Button>
              </div>
            </Card>
          </div>
        </section>

        {/* Course Seller Application */}
        <section className="py-2">
          <div className="container mx-auto px-4 lg:max-w-4xl">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Trở thành người bán khóa học</h2>
                {user.role === 'COURSESELLER' ? (
                  <Badge variant="outline">Bạn đã là giảng viên</Badge>
                ) : null}
              </div>

              <p className="text-sm text-muted-foreground">
                Gửi đơn đăng ký để đội ngũ admin xét duyệt. Bạn nên cung cấp chứng chỉ và chuyên môn liên quan đến giảng dạy.
              </p>

              {user.role !== 'COURSESELLER' ? (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm">Trạng thái đơn mới nhất:</p>
                    {myApplications.length > 0 ? (
                      <div className="mt-2">
                        {(() => {
                          const latest = myApplications[0];
                          const statusLabel = latest.status === 'PENDING' ? 'Đang chờ duyệt' : latest.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối';
                          const statusVariant = latest.status === 'APPROVED' ? 'default' : latest.status === 'REJECTED' ? 'destructive' : 'secondary';
                          return (
                            <div className="flex items-center gap-2">
                              <Badge variant={statusVariant as any}>{statusLabel}</Badge>
                              <span className="text-xs text-muted-foreground">{new Date(latest.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">Chưa có đơn nào</p>
                    )}
                  </div>
                  <div>
                    <Button
                      variant="default"
                      onClick={() => setApplicationOpen(true)}
                      disabled={myApplications.some(a => a.status === 'PENDING')}
                    >
                      {myApplications.some(a => a.status === 'PENDING') ? 'Đang chờ duyệt' : 'Nộp đơn'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Thông tin giảng viên</h3>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Chứng chỉ</p>
                    <div className="flex flex-wrap gap-2">
                      {user.courseSellerProfile?.certification?.map((c) => (
                        <Badge key={c} variant="secondary">{c}</Badge>
                      ))}
                      {(!user.courseSellerProfile?.certification || user.courseSellerProfile?.certification.length === 0) && (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Chuyên môn</p>
                    <div className="flex flex-wrap gap-2">
                      {user.courseSellerProfile?.expertise?.map((e) => (
                        <Badge key={e} variant="secondary">{e}</Badge>
                      ))}
                      {(!user.courseSellerProfile?.expertise || user.courseSellerProfile?.expertise.length === 0) && (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Danh sách đơn đã nộp */}
              {myApplications.length > 0 && user.role !== 'COURSESELLER' && (
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-3">Đơn đã nộp</h3>
                  <div className="space-y-3">
                    {myApplications.map((app) => (
                      <div key={app.id} className="p-3 rounded-md border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={app.status === 'APPROVED' ? 'default' : app.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                              {app.status === 'PENDING' ? 'Đang chờ duyệt' : app.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{new Date(app.createdAt).toLocaleString('vi-VN')}</span>
                          </div>
                        </div>
                        {app.message && (
                          <p className="text-sm text-muted-foreground mt-2">{app.message}</p>
                        )}
                        {app.rejectionReason && (
                          <p className="text-sm text-destructive mt-2">Lý do từ chối: {app.rejectionReason}</p>
                        )}
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Chứng chỉ</p>
                          <div className="flex flex-wrap gap-2">
                            {app.certification.map((c) => (
                              <Badge key={c} variant="outline">{c}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Chuyên môn</p>
                          <div className="flex flex-wrap gap-2">
                            {app.expertise.map((e) => (
                              <Badge key={e} variant="outline">{e}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </section>
      </main>

      {/* Dialog nộp đơn giảng viên */}
      <CourseSellerApplicationDialog
        open={applicationOpen}
        onOpenChange={setApplicationOpen}
        userId={currentUserId}
        onSubmitted={(app) => setMyApplications((prev) => [app, ...prev])}
      />

      <Footer />
    </div>
  );
}