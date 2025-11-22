import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { mockUsers, mockSubscriptionContracts, mockCourses, mockUserActivities } from '@/data/mock';
import { formatVND } from '@/lib/utils';

export default function SellerProfile() {
  const currentUserId = localStorage.getItem('currentUserId') || '1';
  const user = mockUsers.find((u) => u.id === currentUserId);
  const profile = user?.courseSellerProfile;
  const wallet = user?.wallet;
  const contract = mockSubscriptionContracts.find((c) => c.courseSellerId === currentUserId);

  const myCourses = mockCourses.filter((c) => c.courseSellerId === currentUserId);
  const myCourseIds = new Set(myCourses.map((c) => c.id));
  const learners = Array.from(new Set(mockUserActivities.filter((a) => myCourseIds.has(a.courseId) && a.transaction?.status === 'SUCCESS').map((a) => a.userId)));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Hồ sơ Seller</h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.profilePicture || ''} alt={user?.fullName || 'Seller'} />
              <AvatarFallback>{(user?.fullName || 'SE').slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="space-y-1">
                <div className="text-xl font-semibold">{user?.fullName || 'Seller'}</div>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
                <div className="text-sm">Số điện thoại: {user?.phoneNumber || '-'}</div>
                <div className="text-sm">Ngày sinh: {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm">Trình độ tiếng Anh: {user?.englishLevel || '-'}</div>
                <div className="text-sm">Mục tiêu học: {(user?.learningGoals || []).join(', ') || '-'}</div>
                <div className="text-sm">Số khoá học: {myCourses.length}</div>
                <div className="text-sm">Số người học: {learners.length}</div>
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
              <span className="font-medium">{contract?.subscriptionPlan.name || 'Chưa đăng ký'}</span>
              {contract && (
                <Badge variant={contract.status ? 'default' : 'destructive'}>
                  {contract.status ? 'Đang hoạt động' : 'Hết hạn'}
                </Badge>
              )}
            </div>
            <div className="text-sm">Phí hằng tháng: {formatVND(contract?.subscriptionPlan.monthlyFee || 0)}</div>
            <div className="text-sm">Hết hạn: {contract?.expiresAt ? new Date(contract.expiresAt).toLocaleDateString() : '-'}</div>
            <div className="text-sm">Gia hạn gần nhất: {contract?.lastRenewalAt ? new Date(contract.lastRenewalAt).toLocaleDateString() : '-'}</div>
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