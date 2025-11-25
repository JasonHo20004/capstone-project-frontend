import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatVND } from '@/lib/utils';
import { useProfile } from '@/hooks/api/use-user';
import { useSellerDashboard } from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';

export default function SellerProfile() {
  const { user, isLoading: isLoadingUser, error: userError } = useProfile();
  const { data: dashboardStats, isLoading: isLoadingStats, error: statsError } = useSellerDashboard();

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
  const subscription = dashboardStats?.subscription;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Hồ sơ Seller</h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.profilePicture || ''} alt={user.fullName || 'Seller'} />
              <AvatarFallback>{(user.fullName || 'SE').slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin gói đăng ký</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{subscription?.planName || 'Chưa đăng ký'}</span>
              {subscription && (
                <Badge variant={subscription.status ? 'default' : 'destructive'}>
                  {subscription.status ? 'Đang hoạt động' : 'Hết hạn'}
                </Badge>
              )}
            </div>
            <div className="text-sm">Phí hằng tháng: {formatVND(subscription?.monthlyFee || 0)}</div>
            <div className="text-sm">Hết hạn: {subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : '-'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ví</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">Mã ví: {wallet?.id || '-'}</div>
            <div className="text-sm">Số dư: {formatVND(wallet?.allowance || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trạng thái Seller</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">Tài khoản</span>
              <Badge variant={profile?.isActive ? 'default' : 'destructive'}>
                {profile?.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Chứng chỉ</div>
              <div className="flex flex-wrap gap-2">
                {(profile?.certification || []).map((c) => (
                  <Badge key={c} variant="outline">{c}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Chuyên môn</div>
              <div className="flex flex-wrap gap-2">
                {(profile?.expertise || []).map((e) => (
                  <Badge key={e} variant="secondary">{e}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}