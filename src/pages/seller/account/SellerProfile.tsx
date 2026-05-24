import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { useProfile } from '@/hooks/api/use-user';
import { useSellerDashboard } from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import EditSellerProfileDialog from '@/components/seller/account/EditSellerProfileDialog';

export default function SellerProfile() {
  const { user, isLoading: isLoadingUser, error: userError } = useProfile();
  const { data: dashboardStats, isLoading: isLoadingStats, error: statsError } = useSellerDashboard();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoadingUser || isLoadingStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (userError || statsError) {
    return <ErrorMessage message="Không thể tải thông tin hồ sơ. Vui lòng thử lại sau." />;
  }

  if (!user) {
    return <ErrorMessage message="Không tìm thấy thông tin người dùng." />;
  }

  const profile = user.courseSellerProfile;
  const wallet = user.wallet;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Hồ sơ Seller</h1>
        {profile && (
          <Button onClick={() => setEditOpen(true)} variant="outline">
            <Pencil className="w-4 h-4 mr-2" />
            Chỉnh sửa hồ sơ
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <UserAvatar src={user.profilePicture} name={user.fullName} className="h-20 w-20" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="space-y-1">
                <div className="text-xl font-semibold">{user.fullName || 'Seller'}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
                <div className="text-sm">Số điện thoại: {user.phoneNumber || '-'}</div>
                <div className="text-sm">Ngày sinh: {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm">Trình độ tiếng Anh: {user.englishLevel || '-'}</div>
                <div className="text-sm">Mục tiêu học: {(user.learningGoals || []).join(', ') || '-'}</div>
                <div className="text-sm">Số khoá học: {dashboardStats?.coursesCount || 0}</div>
                <div className="text-sm">Số người học: {dashboardStats?.learnersCount || 0}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ví giảng viên</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              Số dư có thể rút:{' '}
              <span className="font-semibold">{formatVND(Number(wallet?.allowance ?? 0))}</span>
            </div>
            <div className="text-sm">
              Đang khoá (chờ clearance):{' '}
              <span className="font-semibold text-amber-600">
                {formatVND(Number(wallet?.pendingBalance ?? 0))}
              </span>
            </div>
            <div className="text-xs text-muted-foreground pt-1">
              Nguồn thu nhập: chia hoa hồng từ học viên mua khoá học.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trạng thái Seller</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">Tài khoản</span>
              <Badge variant={profile?.isActive ? 'default' : 'destructive'}>
                {profile?.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Chuyên môn</div>
              <div className="flex flex-wrap gap-2">
                {(profile?.expertise || []).length > 0 ? (
                  (profile?.expertise || []).map((e) => (
                    <Badge key={e} variant="secondary">{e}</Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">Chưa có</span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Chứng chỉ</div>
              {(profile?.certification || []).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {(profile?.certification || []).map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Nhấn để xem ảnh gốc"
                      className="block aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-white hover:shadow-md transition-all"
                    >
                      <img
                        src={url}
                        alt={`Chứng chỉ ${idx + 1}`}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">Chưa có</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {profile && (
        <EditSellerProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={{
            certification: profile.certification ?? [],
            expertise: profile.expertise ?? [],
          }}
        />
      )}
    </div>
  );
}