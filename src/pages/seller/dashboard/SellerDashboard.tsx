import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatVND } from '@/lib/utils';
import { useSellerDashboard } from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';

export default function SellerDashboard() {
  const { data: dashboardStats, isLoading, error } = useSellerDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Không thể tải dữ liệu dashboard. Vui lòng thử lại sau." />;
  }

  if (!dashboardStats) {
    return <ErrorMessage message="Không có dữ liệu dashboard." />;
  }

  const { coursesCount, learnersCount, commentsCount, subscription } = dashboardStats;
  const contractStatus = subscription.status ? 'Đang hoạt động' : 'Hết hạn';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tổng quan Seller</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Khoá học</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{coursesCount}</div>
            <p className="text-sm text-muted-foreground">Tổng số khoá học bạn đang có</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Người học</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{learnersCount}</div>
            <p className="text-sm text-muted-foreground">Số người đã mua khoá học của bạn</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bình luận</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{commentsCount}</div>
            <p className="text-sm text-muted-foreground">Bình luận trên bài học của bạn</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gói đăng ký</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{subscription.planName}</span>
              <Badge variant={subscription.status ? 'default' : 'destructive'}>{contractStatus}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Phí hằng tháng: {formatVND(subscription.monthlyFee)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}