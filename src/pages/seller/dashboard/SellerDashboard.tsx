import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockCourses, mockUserActivities, mockComments, mockLessons, mockSubscriptionContracts } from '@/data/mock';
import { formatVND } from '@/lib/utils';

export default function SellerDashboard() {
  const currentUserId = localStorage.getItem('currentUserId') || '1';

  const myCourses = mockCourses.filter((c) => c.courseSellerId === currentUserId);
  const myCourseIds = new Set(myCourses.map((c) => c.id));

  const myLearners = Array.from(
    new Set(
      mockUserActivities
        .filter((a) => myCourseIds.has(a.courseId) && a.transaction?.status === 'SUCCESS')
        .map((a) => a.userId)
    )
  );

  const myLessons = mockLessons.filter((l) => myCourseIds.has(l.courseId));
  const myLessonIds = new Set(myLessons.map((l) => l.id));
  const myComments = mockComments.filter((c) => myLessonIds.has(c.lessonId));

  const myContract = mockSubscriptionContracts.find((sc) => sc.courseSellerId === currentUserId);

  const monthlyFee = myContract?.subscriptionPlan.monthlyFee || 0;
  const planName = myContract?.subscriptionPlan.name || 'Chưa đăng ký';
  const contractStatus = myContract?.status ? 'Đang hoạt động' : 'Hết hạn';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tổng quan Seller</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Khoá học</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{myCourses.length}</div>
            <p className="text-sm text-muted-foreground">Tổng số khoá học bạn đang có</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Người học</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{myLearners.length}</div>
            <p className="text-sm text-muted-foreground">Số người đã mua khoá học của bạn</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bình luận</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{myComments.length}</div>
            <p className="text-sm text-muted-foreground">Bình luận trên bài học của bạn</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gói đăng ký</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{planName}</span>
              {myContract && (
                <Badge variant={myContract.status ? 'default' : 'destructive'}>{contractStatus}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Phí hằng tháng: {formatVND(monthlyFee)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}