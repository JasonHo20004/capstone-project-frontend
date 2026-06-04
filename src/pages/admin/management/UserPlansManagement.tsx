import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Loader2,
  Edit,
  Crown,
  Zap,
  Settings,
  Sparkles,
  Plus,
  Trash2,
  Check,
  Users,
  DollarSign,
  TrendingUp,
  ListChecks,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import StatCard from '@/components/admin/StatCard';
import type { UserPlan } from '@/domain';
import {
  useAdminUserPlans,
  useUpdateUserPlan,
  useSeedUserPlans,
  useCreateUserPlan,
  useDeleteUserPlan,
  useAdminPlanStats,
  usePlanFeatures,
  useCreatePlanFeature,
  useUpdatePlanFeature,
  useDeletePlanFeature,
} from '@/hooks/api/use-admin-user-plans';
import type { PlanFeatureDefinition } from '@/lib/api/services/admin/user-plans/user-plan.service';

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatVNDCompact = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(amount);

const EMPTY_FORM = {
  name: '',
  description: '',
  price: 0,
  features: [] as string[],
  isActive: true,
  type: 'FREE' as 'FREE' | 'PRO',
};

const EMPTY_FEATURE = { key: '', label: '', isPremium: false, displayOrder: 0 };

export default function UserPlansManagement() {
  const { data: plans = [], isLoading } = useAdminUserPlans();
  const { data: stats } = useAdminPlanStats();
  const { data: featureDefs = [] } = usePlanFeatures();
  const updateMutation = useUpdateUserPlan();
  const seedMutation = useSeedUserPlans();
  const createMutation = useCreateUserPlan();
  const deleteMutation = useDeleteUserPlan();
  const createFeatureMutation = useCreatePlanFeature();
  const updateFeatureMutation = useUpdatePlanFeature();
  const deleteFeatureMutation = useDeletePlanFeature();

  const [editingPlan, setEditingPlan] = useState<UserPlan | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<UserPlan | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  // Local raw string for the price input so admin can clear it without
  // the value snapping back to 0 mid-typing.
  const [priceRaw, setPriceRaw] = useState('');

  // Features management dialog
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<PlanFeatureDefinition | null>(null);
  const [featureForm, setFeatureForm] = useState(EMPTY_FEATURE);
  const featureListRef = useRef<HTMLDivElement | null>(null);
  const prevFeatureCount = useRef(0);

  // After a successful create, scroll the feature list to the bottom so the
  // newly added row is visible (toast alone is easy to miss).
  useEffect(() => {
    if (
      featureDefs.length > prevFeatureCount.current &&
      featureListRef.current
    ) {
      featureListRef.current.scrollTo({
        top: featureListRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
    prevFeatureCount.current = featureDefs.length;
  }, [featureDefs.length]);

  const usedTypes = useMemo(() => new Set(plans.map((p) => p.type)), [plans]);
  const availableTypes = (['FREE', 'PRO'] as const).filter((t) => !usedTypes.has(t));
  const canCreate = availableTypes.length > 0;

  // Subscriber count map for the active plan list — used by the delete
  // preflight and the pricing card footer.
  const subscriberCountByPlan = useMemo(() => {
    const map = new Map<string, number>();
    stats?.perPlan.forEach((row) => map.set(row.planId, row.activeCount));
    return map;
  }, [stats]);

  const openEditDialog = (plan: UserPlan) => {
    setEditingPlan(plan);
    setEditForm({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      features: [...plan.features],
      isActive: plan.isActive,
      type: plan.type,
    });
    setPriceRaw(String(plan.price));
  };

  const openCreateDialog = () => {
    if (!canCreate) return;
    setEditForm({ ...EMPTY_FORM, type: availableTypes[0] });
    setPriceRaw('0');
    setCreatingPlan(true);
  };

  const commitPrice = () => {
    const parsed = priceRaw.trim() === '' ? 0 : Number(priceRaw.replace(/[^\d.]/g, ''));
    const safe = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    setEditForm((prev) => ({ ...prev, price: safe }));
    setPriceRaw(String(safe));
  };

  const handleCreate = () => {
    if (!editForm.name.trim()) return;
    createMutation.mutate(
      {
        name: editForm.name.trim(),
        type: editForm.type,
        price: editForm.price,
        description: editForm.description || undefined,
        features: editForm.features,
        isActive: editForm.isActive,
      },
      {
        onSuccess: () => {
          setCreatingPlan(false);
          setEditForm(EMPTY_FORM);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deletingPlan) return;
    deleteMutation.mutate(deletingPlan.id, {
      onSuccess: () => setDeletingPlan(null),
    });
  };

  const toggleFeature = (featureKey: string) => {
    setEditForm((prev) => ({
      ...prev,
      features: prev.features.includes(featureKey)
        ? prev.features.filter((f) => f !== featureKey)
        : [...prev.features, featureKey],
    }));
  };

  const handleSave = () => {
    if (!editingPlan) return;
    updateMutation.mutate(
      {
        id: editingPlan.id,
        data: {
          name: editForm.name,
          description: editForm.description,
          price: editForm.price,
          features: editForm.features,
          isActive: editForm.isActive,
        },
      },
      { onSuccess: () => setEditingPlan(null) }
    );
  };

  // ── Feature CRUD handlers ────────────────────────────────────────────
  const openCreateFeature = () => {
    setEditingFeature(null);
    setFeatureForm({ ...EMPTY_FEATURE, displayOrder: featureDefs.length });
  };

  const openEditFeature = (f: PlanFeatureDefinition) => {
    setEditingFeature(f);
    setFeatureForm({
      key: f.key,
      label: f.label,
      isPremium: f.isPremium,
      displayOrder: f.displayOrder,
    });
  };

  const submitFeature = () => {
    const trimmedKey = featureForm.key.trim();
    const trimmedLabel = featureForm.label.trim();
    if (!trimmedLabel) return;
    if (editingFeature) {
      updateFeatureMutation.mutate(
        {
          id: editingFeature.id,
          data: {
            label: trimmedLabel,
            isPremium: featureForm.isPremium,
            displayOrder: featureForm.displayOrder,
          },
        },
        { onSuccess: () => setEditingFeature(null) }
      );
    } else {
      if (!trimmedKey) return;
      createFeatureMutation.mutate(
        {
          key: trimmedKey,
          label: trimmedLabel,
          isPremium: featureForm.isPremium,
          displayOrder: featureForm.displayOrder,
        },
        { onSuccess: () => setFeatureForm(EMPTY_FEATURE) }
      );
    }
  };

  const removeFeature = (f: PlanFeatureDefinition) => {
    if (
      !window.confirm(
        `Xóa feature "${f.label}"? Các plan đang reference key này sẽ giữ key trong DB nhưng admin/learner sẽ không thấy label nữa.`
      )
    ) {
      return;
    }
    deleteFeatureMutation.mutate(f.id);
  };

  // Reset form state when dialogs close
  useEffect(() => {
    if (!editingPlan && !creatingPlan) {
      setEditForm(EMPTY_FORM);
      setPriceRaw('');
    }
  }, [editingPlan, creatingPlan]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // ── Sorted plans: FREE first, then PRO ───────────────────────────────
  const sortedPlans = [...plans].sort((a, b) => {
    if (a.type === b.type) return Number(a.price) - Number(b.price);
    return a.type === 'FREE' ? -1 : 1;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý gói người dùng</h1>
          <p className="text-muted-foreground">Quản lý gói Free & Pro cho người học</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFeaturesOpen(true)}>
            <ListChecks className="w-4 h-4 mr-2" />
            Quản lý feature
          </Button>
          {plans.length === 0 && (
            <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
              {seedMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Tạo gói mặc định
            </Button>
          )}
          <Button
            variant={plans.length === 0 ? 'outline' : 'default'}
            onClick={openCreateDialog}
            disabled={!canCreate}
            title={!canCreate ? 'Đã tạo cả hai gói FREE và PRO' : undefined}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo gói mới
          </Button>
        </div>
      </div>

      {/* Business Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Tổng subscriber"
          value={(stats?.totals.activeCount ?? 0).toLocaleString('vi-VN')}
          description="Đang active trên mọi gói"
          icon={Users}
        />
        <StatCard
          title="MRR (Monthly Recurring Revenue)"
          value={formatVND(stats?.totals.mrr ?? 0)}
          description="Doanh thu định kỳ / tháng từ gói trả phí"
          icon={DollarSign}
        />
        <StatCard
          title="Subscribe 30 ngày qua"
          value={(stats?.totals.last30dCount ?? 0).toLocaleString('vi-VN')}
          description="Leading indicator của growth"
          icon={TrendingUp}
        />
      </div>

      {/* Pricing Cards */}
      {sortedPlans.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Crown className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">Chưa có gói nào</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Nhấn "Tạo gói mặc định" để khởi tạo Free & Pro.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto w-full">
          {sortedPlans.map((plan) => {
            const subscriberCount = subscriberCountByPlan.get(plan.id) ?? 0;
            const mrr = stats?.perPlan.find((p) => p.planId === plan.id)?.mrr ?? 0;
            const isPro = plan.type === 'PRO';
            return (
              <PlanPricingCard
                key={plan.id}
                plan={plan}
                isPro={isPro}
                subscriberCount={subscriberCount}
                mrr={mrr}
                featureDefs={featureDefs}
                onEdit={() => openEditDialog(plan)}
                onDelete={() => setDeletingPlan(plan)}
              />
            );
          })}
        </div>
      )}

      {/* Edit Plan Dialog (with live preview) */}
      <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Chỉnh sửa gói {editingPlan?.name}
            </DialogTitle>
            <DialogDescription>
              Cập nhật thông tin và tính năng. Bên phải là preview learner sẽ thấy.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 md:grid-cols-[1fr_320px]">
            <PlanFormFields
              form={editForm}
              priceRaw={priceRaw}
              setPriceRaw={setPriceRaw}
              commitPrice={commitPrice}
              setForm={setEditForm}
              featureDefs={featureDefs}
              toggleFeature={toggleFeature}
              mode="edit"
              availableTypes={availableTypes}
            />
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Preview (learner sẽ thấy)
              </Label>
              <PlanPreviewCard
                name={editForm.name}
                description={editForm.description}
                price={editForm.price}
                features={editForm.features}
                isActive={editForm.isActive}
                type={editForm.type}
                featureDefs={featureDefs}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setEditingPlan(null)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Edit className="w-4 h-4 mr-2" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Plan Dialog (with live preview + isActive toggle) */}
      <Dialog open={creatingPlan} onOpenChange={(open) => !open && setCreatingPlan(false)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Tạo gói mới
            </DialogTitle>
            <DialogDescription>
              Hệ thống chỉ hỗ trợ tối đa 2 loại gói: FREE và PRO. Mỗi loại chỉ có 1 gói.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 md:grid-cols-[1fr_320px]">
            <PlanFormFields
              form={editForm}
              priceRaw={priceRaw}
              setPriceRaw={setPriceRaw}
              commitPrice={commitPrice}
              setForm={setEditForm}
              featureDefs={featureDefs}
              toggleFeature={toggleFeature}
              mode="create"
              availableTypes={availableTypes}
            />
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
              <PlanPreviewCard
                name={editForm.name || 'Tên gói'}
                description={editForm.description}
                price={editForm.price}
                features={editForm.features}
                isActive={editForm.isActive}
                type={editForm.type}
                featureDefs={featureDefs}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setCreatingPlan(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !editForm.name.trim()}
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Tạo gói
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Confirmation — shows subscriber count up front */}
      <AlertDialog
        open={!!deletingPlan}
        onOpenChange={(open) => !open && setDeletingPlan(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa gói</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Gói <strong>{deletingPlan?.name}</strong> ({deletingPlan?.type}) sẽ bị xóa.
                </p>
                {deletingPlan && (() => {
                  const count = subscriberCountByPlan.get(deletingPlan.id) ?? 0;
                  if (count > 0) {
                    return (
                      <p className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-destructive">
                        Hiện có <strong>{count.toLocaleString('vi-VN')}</strong> subscriber
                        đang active trên gói này. Backend sẽ chặn — di chuyển/đợi user hủy
                        đăng ký trước.
                      </p>
                    );
                  }
                  return (
                    <p className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-emerald-700 dark:text-emerald-400">
                      Không còn subscriber active — an toàn để xóa.
                    </p>
                  );
                })()}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Features Management Dialog */}
      <Dialog open={featuresOpen} onOpenChange={setFeaturesOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="w-5 h-5" />
              Quản lý feature
            </DialogTitle>
            <DialogDescription>
              Master list các feature mà plan có thể opt-in. Sửa ở đây không cần deploy FE.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Create/Edit form */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Key (không đổi sau khi tạo)</Label>
                    <Input
                      placeholder="ai_speaking"
                      value={featureForm.key}
                      disabled={!!editingFeature}
                      onChange={(e) =>
                        setFeatureForm((p) => ({ ...p, key: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Label hiển thị</Label>
                    <Input
                      placeholder="AI chấm Speaking"
                      value={featureForm.label}
                      onChange={(e) =>
                        setFeatureForm((p) => ({ ...p, label: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={featureForm.isPremium}
                      onCheckedChange={(c) =>
                        setFeatureForm((p) => ({ ...p, isPremium: c }))
                      }
                    />
                    <span>Premium (chỉ gói PRO)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Thứ tự</Label>
                    <Input
                      type="number"
                      min={0}
                      className="w-20"
                      value={featureForm.displayOrder}
                      onChange={(e) => {
                        const raw = parseInt(e.target.value, 10);
                        setFeatureForm((p) => ({
                          ...p,
                          // Clamp to non-negative — display order is a sort key,
                          // negative values don't make sense.
                          displayOrder: Number.isFinite(raw) ? Math.max(0, raw) : 0,
                        }));
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  {editingFeature && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingFeature(null);
                        setFeatureForm(EMPTY_FEATURE);
                      }}
                    >
                      Hủy
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={submitFeature}
                    disabled={
                      createFeatureMutation.isPending ||
                      updateFeatureMutation.isPending ||
                      !featureForm.label.trim() ||
                      (!editingFeature && !featureForm.key.trim())
                    }
                  >
                    {editingFeature ? 'Cập nhật' : 'Tạo'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* List */}
            <div
              ref={featureListRef}
              className="max-h-72 overflow-y-auto rounded-md border"
            >
              {featureDefs.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Chưa có feature nào. Tạo feature đầu tiên ở form trên.
                </p>
              ) : (
                featureDefs.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between border-b last:border-b-0 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{f.label}</p>
                      <p className="text-xs font-mono text-muted-foreground truncate">
                        {f.key}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {f.isPremium && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 border-amber-300 text-amber-600"
                        >
                          PREMIUM
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openEditFeature(f)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => removeFeature(f)}
                        disabled={deleteFeatureMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

interface PlanPricingCardProps {
  plan: UserPlan;
  isPro: boolean;
  subscriberCount: number;
  mrr: number;
  featureDefs: PlanFeatureDefinition[];
  onEdit: () => void;
  onDelete: () => void;
}

function PlanPricingCard({
  plan,
  isPro,
  subscriberCount,
  mrr,
  featureDefs,
  onEdit,
  onDelete,
}: PlanPricingCardProps) {
  return (
    <Card
      className={
        isPro
          ? 'relative overflow-hidden border-2 border-amber-400/40 shadow-lg'
          : 'relative overflow-hidden'
      }
    >
      {isPro && (
        <div className="absolute right-0 top-0 bg-gradient-to-br from-amber-400 to-orange-500 px-3 py-1 text-xs font-semibold text-white rounded-bl-md">
          POPULAR
        </div>
      )}
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isPro
                ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                : 'bg-gradient-to-br from-blue-400 to-blue-600'
            }`}
          >
            {isPro ? (
              <Crown className="w-6 h-6 text-white" />
            ) : (
              <Zap className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="text-sm text-muted-foreground">{plan.type}</p>
          </div>
          {!plan.isActive && (
            <Badge variant="destructive" className="text-xs">
              Tắt
            </Badge>
          )}
        </div>

        {plan.description && (
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        )}

        <div className="border-t border-b py-3">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">
              {plan.price === 0 ? 'Miễn phí' : formatVND(plan.price)}
            </span>
            {plan.price > 0 && (
              <span className="text-sm text-muted-foreground">/tháng</span>
            )}
          </div>
        </div>

        <ul className="space-y-2">
          {plan.features.map((featureKey) => {
            const def = featureDefs.find((d) => d.key === featureKey);
            const label = def?.label ?? featureKey;
            return (
              <li key={featureKey} className="flex items-start gap-2 text-sm">
                <Check
                  className={`h-4 w-4 mt-0.5 shrink-0 ${
                    isPro ? 'text-amber-500' : 'text-emerald-500'
                  }`}
                />
                <span>{label}</span>
                {def?.isPremium && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1 border-amber-300 text-amber-600 ml-auto"
                  >
                    PRO
                  </Badge>
                )}
              </li>
            );
          })}
          {plan.features.length === 0 && (
            <li className="text-sm text-muted-foreground italic">
              Chưa cấu hình feature
            </li>
          )}
        </ul>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
          <div>
            <p className="text-muted-foreground">Subscriber</p>
            <p className="text-lg font-semibold">
              {subscriberCount.toLocaleString('vi-VN')}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">MRR đóng góp</p>
            <p className="text-lg font-semibold text-emerald-600">
              {mrr > 0 ? formatVNDCompact(mrr) : '—'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Sửa
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface PlanPreviewCardProps {
  name: string;
  description: string;
  price: number;
  features: string[];
  isActive: boolean;
  type: 'FREE' | 'PRO';
  featureDefs: PlanFeatureDefinition[];
}

function PlanPreviewCard({
  name,
  description,
  price,
  features,
  isActive,
  type,
  featureDefs,
}: PlanPreviewCardProps) {
  const isPro = type === 'PRO';
  return (
    <Card
      className={
        isPro
          ? 'border-2 border-amber-400/40 shadow-sm sticky top-0'
          : 'border sticky top-0'
      }
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          {isPro ? (
            <Crown className="w-4 h-4 text-amber-500" />
          ) : (
            <Zap className="w-4 h-4 text-blue-500" />
          )}
          <h3 className="font-semibold">{name || 'Tên gói'}</h3>
          {!isActive && (
            <Badge variant="destructive" className="text-[10px] ml-auto">
              Tắt
            </Badge>
          )}
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        <div className="border-t border-b py-2">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold">
              {price === 0 ? 'Miễn phí' : formatVND(price)}
            </span>
            {price > 0 && (
              <span className="text-xs text-muted-foreground">/tháng</span>
            )}
          </div>
        </div>
        <ul className="space-y-1.5">
          {features.length === 0 && (
            <li className="text-xs italic text-muted-foreground">Chưa có feature</li>
          )}
          {features.map((key) => {
            const def = featureDefs.find((d) => d.key === key);
            return (
              <li key={key} className="flex items-start gap-1.5 text-xs">
                <Check
                  className={`h-3 w-3 mt-0.5 shrink-0 ${
                    isPro ? 'text-amber-500' : 'text-emerald-500'
                  }`}
                />
                <span>{def?.label ?? key}</span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

interface PlanFormFieldsProps {
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  priceRaw: string;
  setPriceRaw: (s: string) => void;
  commitPrice: () => void;
  featureDefs: PlanFeatureDefinition[];
  toggleFeature: (key: string) => void;
  mode: 'create' | 'edit';
  availableTypes: readonly ('FREE' | 'PRO')[];
}

function PlanFormFields({
  form,
  setForm,
  priceRaw,
  setPriceRaw,
  commitPrice,
  featureDefs,
  toggleFeature,
  mode,
  availableTypes,
}: PlanFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Loại gói</Label>
        {mode === 'create' ? (
          <Select
            value={form.type}
            onValueChange={(v) =>
              setForm((prev) => ({ ...prev, type: v as 'FREE' | 'PRO' }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          // Loại không đổi được sau khi tạo — show disabled để admin thấy rõ.
          <Input value={form.type} disabled />
        )}
      </div>
      <div className="space-y-2">
        <Label>Tên gói *</Label>
        <Input
          placeholder="VD: Pro Annual"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label>Mô tả</Label>
        <Input
          placeholder="Mô tả ngắn về gói"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label>Giá / tháng (VND)</Label>
        <Input
          inputMode="numeric"
          placeholder="0"
          value={priceRaw}
          onChange={(e) => setPriceRaw(e.target.value)}
          onBlur={commitPrice}
        />
        {priceRaw && Number(priceRaw) > 0 && (
          <p className="text-xs text-muted-foreground">
            {formatVND(Number(priceRaw))}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
        <span className="text-sm font-medium">Kích hoạt gói</span>
        <Switch
          checked={form.isActive}
          onCheckedChange={(checked) =>
            setForm((prev) => ({ ...prev, isActive: checked }))
          }
        />
      </div>
      <div>
        <Label className="text-sm font-medium mb-3 block">Feature</Label>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {(() => {
            // Render union of (master feature defs ∪ keys the plan already
            // has). Legacy keys without a definition still show up so admin
            // can toggle them off — plus a hint to seed the master list.
            const defByKey = new Map(featureDefs.map((d) => [d.key, d]));
            const allKeys = Array.from(
              new Set([
                ...featureDefs.map((d) => d.key),
                ...form.features,
              ])
            );
            if (allKeys.length === 0) {
              return (
                <p className="text-xs text-muted-foreground italic">
                  Chưa có feature nào. Tạo trong dialog "Quản lý feature".
                </p>
              );
            }
            return allKeys.map((key) => {
              const def = defByKey.get(key);
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm truncate">{def?.label ?? key}</span>
                    {def?.isPremium && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 border-amber-300 text-amber-600"
                      >
                        PREMIUM
                      </Badge>
                    )}
                    {!def && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 border-orange-300 text-orange-600"
                        title="Chưa có definition trong bảng plan_feature_definitions"
                      >
                        LEGACY
                      </Badge>
                    )}
                  </div>
                  <Switch
                    checked={form.features.includes(key)}
                    onCheckedChange={() => toggleFeature(key)}
                  />
                </div>
              );
            });
          })()}
        </div>
        {featureDefs.length === 0 && form.features.length > 0 && (
          <p className="mt-2 text-xs text-orange-600">
            Plan đang dùng feature chưa có định nghĩa. Vào "Quản lý feature" để
            seed master list (key, label, premium) — learner sẽ thấy label thay
            vì key.
          </p>
        )}
      </div>
    </div>
  );
}
