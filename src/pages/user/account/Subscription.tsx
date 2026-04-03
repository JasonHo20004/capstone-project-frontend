import { useState } from 'react';
import { Check, Crown, Zap, Loader2, Sparkles, History, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUserPlans, useMySubscription, useSubscribe, useCancelSubscription, useSubscriptionHistory } from '@/hooks/api/use-user-subscription';
import { useWallet } from '@/hooks/api/use-wallet';
import type { UserPlan } from '@/domain';

const featureDisplayMap: Record<string, string> = {
  course_access: 'Truy cập khóa học',
  flashcards: 'Flashcard học từ vựng',
  basic_tests: 'Bài test cơ bản',
  ai_speaking: 'AI chấm Speaking',
  ai_writing: 'AI chấm Writing',
  dictation: 'Luyện Dictation',
  learning_path: 'Lộ trình học cá nhân',
  skill_tree: 'Cây kỹ năng',
};

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export default function Subscription() {
  const { data: plans = [], isLoading: plansLoading } = useUserPlans();
  const { data: subscriptionStatus, isLoading: subLoading } = useMySubscription();
  const subscribeMutation = useSubscribe();
  const cancelMutation = useCancelSubscription();
  const { data: history = [] } = useSubscriptionHistory();
  const { data: walletData } = useWallet();
  const balance = Number(walletData?.balance ?? walletData?.allowance ?? 0);
  const [confirmPlan, setConfirmPlan] = useState<UserPlan | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const currentPlanType = subscriptionStatus?.plan?.type;
  const isProUser = subscriptionStatus?.isProUser ?? false;

  const handleSubscribe = () => {
    if (!confirmPlan) return;
    subscribeMutation.mutate(confirmPlan.id, {
      onSuccess: () => setConfirmPlan(null),
    });
  };

  if (plansLoading || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const freePlan = plans.find((p) => p.type === 'FREE');
  const proPlan = plans.find((p) => p.type === 'PRO');

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/30 px-4 py-1.5 rounded-full">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Nâng cấp trải nghiệm học
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Chọn gói phù hợp với bạn
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Mở khóa toàn bộ tính năng AI chấm Speaking, Writing và nhiều công cụ premium khác
        </p>
      </div>

      {/* Current Plan Badge */}
      {currentPlanType && (
        <div className="flex justify-center">
          <Badge variant="outline" className="px-4 py-2 text-sm gap-2">
            {isProUser ? <Crown className="w-4 h-4 text-amber-500" /> : <Zap className="w-4 h-4" />}
            Gói hiện tại: <span className="font-semibold">{subscriptionStatus?.plan?.name}</span>
            {subscriptionStatus?.subscription?.endDate && (
              <span className="text-muted-foreground ml-1">
                · hết hạn {new Date(subscriptionStatus.subscription.endDate).toLocaleDateString('vi-VN')}
              </span>
            )}
          </Badge>
        </div>
      )}

      {/* Wallet Balance */}
      <div className="flex justify-center">
        <div className="bg-muted/50 rounded-lg px-6 py-3 text-center">
          <p className="text-sm text-muted-foreground">Số dư ví</p>
          <p className="text-xl font-bold">{formatVND(balance)}</p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free Plan */}
        {freePlan && (
          <div className={`relative rounded-2xl border-2 p-6 space-y-5 transition-all ${
            currentPlanType === 'FREE'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground/30'
          }`}>
            {currentPlanType === 'FREE' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3">Gói hiện tại</Badge>
              </div>
            )}

            <div className="space-y-1">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                {freePlan.name}
              </h3>
              <p className="text-sm text-muted-foreground">{freePlan.description}</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">Miễn phí</span>
            </div>

            <ul className="space-y-3">
              {freePlan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {featureDisplayMap[f] || f}
                </li>
              ))}
              {/* Show Pro-only features as disabled */}
              {proPlan?.features
                .filter((f) => !freePlan.features.includes(f))
                .map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground/50 line-through">
                    {featureDisplayMap[f] || f}
                  </li>
                ))}
            </ul>

            <Button
              variant="outline"
              className="w-full"
              disabled={currentPlanType === 'FREE'}
            >
              {currentPlanType === 'FREE' ? 'Đang sử dụng' : 'Chuyển về Free'}
            </Button>
          </div>
        )}

        {/* Pro Plan */}
        {proPlan && (
          <div className={`relative rounded-2xl border-2 p-6 space-y-5 transition-all ${
            currentPlanType === 'PRO'
              ? 'border-amber-400 bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20'
              : 'border-amber-200 hover:border-amber-400 bg-gradient-to-br from-amber-50/30 to-orange-50/30 dark:from-amber-950/10 dark:to-orange-950/10'
          }`}>
            {currentPlanType === 'PRO' ? (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 border-0">
                  Gói hiện tại
                </Badge>
              </div>
            ) : (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 border-0">
                  Phổ biến nhất
                </Badge>
              </div>
            )}

            <div className="space-y-1">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                {proPlan.name}
              </h3>
              <p className="text-sm text-muted-foreground">{proPlan.description}</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{formatVND(proPlan.price)}</span>
              <span className="text-muted-foreground">/tháng</span>
            </div>

            <ul className="space-y-3">
              {proPlan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className={!freePlan?.features.includes(f) ? 'font-medium' : ''}>
                    {featureDisplayMap[f] || f}
                  </span>
                  {!freePlan?.features.includes(f) && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-300 text-amber-600">
                      PRO
                    </Badge>
                  )}
                </li>
              ))}
            </ul>

            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-200/50"
              disabled={currentPlanType === 'PRO'}
              onClick={() => setConfirmPlan(proPlan)}
            >
              {currentPlanType === 'PRO' ? (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Đang sử dụng
                </>
              ) : (
                'Nâng cấp lên Pro'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmPlan} onOpenChange={() => setConfirmPlan(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Xác nhận đăng ký gói {confirmPlan?.name}
            </DialogTitle>
            <DialogDescription>
              Thanh toán sẽ được trừ trực tiếp từ ví của bạn.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Gói {confirmPlan?.name}</span>
                <span className="font-medium">{formatVND(confirmPlan?.price || 0)}/tháng</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Số dư ví hiện tại</span>
                <span className={`font-medium ${balance < (confirmPlan?.price || 0) ? 'text-red-500' : 'text-green-600'}`}>
                  {formatVND(balance)}
                </span>
              </div>
              {balance < (confirmPlan?.price || 0) && (
                <p className="text-xs text-red-500 mt-1">
                  Số dư không đủ. Vui lòng nạp thêm tiền vào ví.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmPlan(null)}
              >
                Hủy
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                disabled={balance < (confirmPlan?.price || 0) || subscribeMutation.isPending}
                onClick={handleSubscribe}
              >
                {subscribeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Xác nhận'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Hủy gói đăng ký
            </DialogTitle>
            <DialogDescription>
              Bạn sẽ được hoàn tiền theo số ngày còn lại. Tất cả tính năng premium sẽ bị khóa.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowCancelDialog(false)}>
              Giữ lại
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={cancelMutation.isPending}
              onClick={() => {
                cancelMutation.mutate(undefined, {
                  onSuccess: () => setShowCancelDialog(false),
                });
              }}
            >
              {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận hủy'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel button for Pro users */}
      {isProUser && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-red-600"
            onClick={() => setShowCancelDialog(true)}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Hủy gói Pro
          </Button>
        </div>
      )}

      {/* Auto-renewal notice */}
      {isProUser && subscriptionStatus?.subscription?.endDate && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm">
            <RefreshCw className="w-4 h-4" />
            <span>
              Gói sẽ tự động gia hạn vào{' '}
              {new Date(subscriptionStatus.subscription.endDate).toLocaleDateString('vi-VN')}{' '}
              nếu đủ số dư ví.
            </span>
          </div>
        </div>
      )}

      {/* Subscription History */}
      {history.length > 0 && (
        <div className="max-w-3xl mx-auto mt-8 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="w-5 h-5" />
            Lịch sử đăng ký
          </h2>
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Gói</th>
                  <th className="px-4 py-3 text-left font-medium">Ngày bắt đầu</th>
                  <th className="px-4 py-3 text-left font-medium">Ngày kết thúc</th>
                  <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {sub.plan?.type === 'PRO' ? (
                          <Crown className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Zap className="w-4 h-4 text-blue-500" />
                        )}
                        {sub.plan?.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(sub.startDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sub.endDate ? new Date(sub.endDate).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {sub.isActive ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-0">
                          Đang hoạt động
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Đã kết thúc
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
