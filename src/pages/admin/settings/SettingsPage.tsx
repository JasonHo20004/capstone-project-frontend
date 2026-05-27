import { useSearchParams, Link } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Percent,
  Landmark,
  Wallet,
  BookOpen,
  Bell,
  Ticket,
  ExternalLink,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/utils';
import { useCommissionConfig } from '@/hooks/api';
import CommissionManagement from '@/pages/admin/revenue-management/CommissionManagement';

// Withdrawal limits live in payment-service env (MIN/MAX_WITHDRAWAL_AMOUNT).
// Mirror the fallbacks so admins see the active values without a BE call.
const WITHDRAWAL_MIN_FALLBACK = 50_000;
const WITHDRAWAL_MAX_FALLBACK = 50_000_000;

const TAB_KEYS = ['overview', 'commission', 'withdrawal', 'seller-fees', 'courses', 'coupons', 'notifications'] as const;
type TabKey = (typeof TAB_KEYS)[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: TabKey = isTabKey(tabParam) ? tabParam : 'overview';

  const handleTabChange = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  const { data: commissionConfig } = useCommissionConfig();
  const globalRate = commissionConfig?.globalRate ?? 0.3;
  const gatewayFeeRate = commissionConfig?.gatewayFeeRate ?? 0.03;
  const gatewayFeeFixed = commissionConfig?.gatewayFeeFixed ?? 2000;
  const clearanceDays = commissionConfig?.clearanceDays ?? 7;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-7 w-7 text-primary" />
          Cài đặt hệ thống
        </h1>
        <p className="text-muted-foreground">
          Tập trung các tham số vận hành: phí, hoa hồng, giới hạn rút tiền, mã giảm giá...
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <SettingsIcon className="h-4 w-4" /> Tổng quan
          </TabsTrigger>
          <TabsTrigger value="commission" className="gap-1.5">
            <Percent className="h-4 w-4" /> Hoa hồng & Phí cổng
          </TabsTrigger>
          <TabsTrigger value="withdrawal" className="gap-1.5">
            <Landmark className="h-4 w-4" /> Rút tiền
          </TabsTrigger>
          <TabsTrigger value="seller-fees" className="gap-1.5">
            <Wallet className="h-4 w-4" /> Phí giảng viên
          </TabsTrigger>
          <TabsTrigger value="courses" className="gap-1.5">
            <BookOpen className="h-4 w-4" /> Khóa học
          </TabsTrigger>
          <TabsTrigger value="coupons" className="gap-1.5">
            <Ticket className="h-4 w-4" /> Mã giảm giá
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-4 w-4" /> Thông báo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SettingCard
              title="Hoa hồng & Phí cổng"
              description="Tỷ lệ chia doanh thu, phí cổng thanh toán, thời gian khoá tiền."
              icon={Percent}
              value={`${Math.round(globalRate * 100)}% / ${(gatewayFeeRate * 100).toFixed(1)}% + ${formatVND(gatewayFeeFixed)}`}
              caption={`Khoá ${clearanceDays} ngày`}
              onOpen={() => handleTabChange('commission')}
            />
            <SettingCard
              title="Giới hạn rút tiền"
              description="Số tiền tối thiểu / tối đa cho mỗi yêu cầu rút."
              icon={Landmark}
              value={`${formatVND(WITHDRAWAL_MIN_FALLBACK)} – ${formatVND(WITHDRAWAL_MAX_FALLBACK)}`}
              caption="Mỗi yêu cầu"
              onOpen={() => handleTabChange('withdrawal')}
            />
            <SettingCard
              title="Phí hằng tháng giảng viên"
              description="Quản lý phí duy trì subscription của seller."
              icon={Wallet}
              value="Theo gói đăng ký"
              caption="Mỗi tháng"
              onOpen={() => handleTabChange('seller-fees')}
            />
            <SettingCard
              title="Khóa học"
              description="Auto-approve, ngưỡng giá kiểm duyệt, quy tắc xét duyệt."
              icon={BookOpen}
              value="Thủ công"
              caption="Hiện tại tất cả phải duyệt"
              onOpen={() => handleTabChange('courses')}
            />
            <SettingCard
              title="Mã giảm giá (Coupon)"
              description="Tạo / quản lý / vô hiệu hóa các mã giảm giá."
              icon={Ticket}
              value="Có sẵn"
              caption="Áp dụng vào đơn hàng"
              onOpen={() => handleTabChange('coupons')}
            />
            <SettingCard
              title="Thông báo hệ thống"
              description="Gửi thông báo theo phân khúc người dùng (campaign)."
              icon={Bell}
              value="Theo vai trò / hành vi"
              caption="Targeted notification"
              onOpen={() => handleTabChange('notifications')}
            />
          </div>
        </TabsContent>

        <TabsContent value="commission" className="mt-6">
          <CommissionManagement embedded />
        </TabsContent>

        <TabsContent value="withdrawal" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                Giới hạn rút tiền
              </CardTitle>
              <CardDescription>
                Hai giá trị này hiện được cấu hình qua biến môi trường ở <code>payment-service</code>.
                Sửa file <code>.env</code> rồi restart dịch vụ để thay đổi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <ReadOnlyField
                  label="Số tiền tối thiểu / yêu cầu"
                  value={formatVND(WITHDRAWAL_MIN_FALLBACK)}
                  envKey="MIN_WITHDRAWAL_AMOUNT"
                />
                <ReadOnlyField
                  label="Số tiền tối đa / yêu cầu"
                  value={formatVND(WITHDRAWAL_MAX_FALLBACK)}
                  envKey="MAX_WITHDRAWAL_AMOUNT"
                />
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
                <strong>Lưu ý:</strong> Đổi giới hạn nên đi kèm thông báo cho seller trước ít nhất
                24h để tránh phàn nàn về việc bị từ chối rút.
              </div>
              <Button asChild variant="outline">
                <Link to="/admin/withdrawals">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Xem yêu cầu rút tiền đang chờ
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seller-fees" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Phí hằng tháng giảng viên
              </CardTitle>
              <CardDescription>
                Subscription mà mỗi seller phải đóng để duy trì trạng thái giảng viên. Cấu hình
                từng gói được quản lý ở mục Gói người dùng.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                Mỗi seller có thể xem hóa đơn hằng tháng và lịch sử thanh toán tại trang
                <code className="mx-1 rounded bg-muted px-1.5 py-0.5">/seller/fees</code>.
                Admin tạo / chỉnh sửa các gói (giá, kỳ hạn, ưu đãi) ở mục bên dưới.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/admin/user-plans">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Quản lý gói người dùng
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/admin/transactions?type=seller_fee">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Lịch sử giao dịch phí
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Cấu hình kiểm duyệt khóa học
              </CardTitle>
              <CardDescription>
                Hiện tại tất cả khóa học mới đều phải qua admin duyệt thủ công. Mục này gom các
                tùy chỉnh liên quan đến quy trình duyệt khóa học.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ReadOnlyField
                label="Auto-approve khóa học dưới giá"
                value="Tắt"
                envKey="(chưa triển khai)"
              />
              <ReadOnlyField
                label="Yêu cầu lý do khi từ chối"
                value="Bật"
                envKey="(cứng trong code)"
              />
              <Button asChild variant="outline">
                <Link to="/admin/courses?status=PENDING">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Xem khóa học đang chờ duyệt
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coupons" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                Mã giảm giá (Coupon)
              </CardTitle>
              <CardDescription>
                Tạo và quản lý các mã giảm giá để áp dụng vào đơn hàng khóa học.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/admin/coupons">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Mở trang quản lý mã giảm giá
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Thông báo theo phân khúc
              </CardTitle>
              <CardDescription>
                Gửi thông báo cho nhóm người dùng theo vai trò hoặc hành vi (đã mua / chưa hoàn
                thành / doanh thu thấp...).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/admin/notifications">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Mở trang gửi thông báo
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface SettingCardProps {
  title: string;
  description: string;
  icon: typeof SettingsIcon;
  value: string;
  caption: string;
  onOpen: () => void;
}

function SettingCard({ title, description, icon: Icon, value, caption, onOpen }: SettingCardProps) {
  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-semibold font-display">{value}</div>
        <Badge variant="outline" className="mt-1 text-xs">{caption}</Badge>
        <Button
          size="sm"
          variant="ghost"
          className="mt-3 w-full justify-start"
          onClick={onOpen}
        >
          Mở cấu hình →
        </Button>
      </CardContent>
    </Card>
  );
}

interface ReadOnlyFieldProps {
  label: string;
  value: string;
  envKey: string;
}

function ReadOnlyField({ label, value, envKey }: ReadOnlyFieldProps) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold font-display">{value}</div>
      <div className="text-xs text-muted-foreground">
        Cấu hình bằng <code className="rounded bg-muted px-1 py-0.5">{envKey}</code>
      </div>
    </div>
  );
}
