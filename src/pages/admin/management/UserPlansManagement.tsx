import { useState } from 'react';
import { Loader2, Edit, Crown, Zap, Package, Settings, Sparkles, Plus, Trash2 } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import DataTable from '@/components/admin/DataTable';
import type { UserPlan } from '@/domain';
import {
  useAdminUserPlans,
  useUpdateUserPlan,
  useSeedUserPlans,
  useCreateUserPlan,
  useDeleteUserPlan,
} from '@/hooks/api/use-admin-user-plans';

const AVAILABLE_FEATURES = [
  { key: 'course_access', label: 'Truy cập khóa học' },
  { key: 'flashcards', label: 'Flashcard học từ vựng' },
  { key: 'basic_tests', label: 'Bài test cơ bản' },
  { key: 'ai_speaking', label: 'AI chấm Speaking', premium: true },
  { key: 'ai_writing', label: 'AI chấm Writing', premium: true },
  { key: 'dictation', label: 'Luyện Dictation', premium: true },
  { key: 'learning_path', label: 'Lộ trình học cá nhân', premium: true },
  { key: 'skill_tree', label: 'Cây kỹ năng', premium: true },
];

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const EMPTY_FORM = {
  name: '',
  description: '',
  price: 0,
  features: [] as string[],
  isActive: true,
  type: 'FREE' as 'FREE' | 'PRO',
};

export default function UserPlansManagement() {
  const { data: plans = [], isLoading } = useAdminUserPlans();
  const updateMutation = useUpdateUserPlan();
  const seedMutation = useSeedUserPlans();
  const createMutation = useCreateUserPlan();
  const deleteMutation = useDeleteUserPlan();
  const [editingPlan, setEditingPlan] = useState<UserPlan | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<UserPlan | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const usedTypes = new Set(plans.map((p) => p.type));
  const availableTypes = (['FREE', 'PRO'] as const).filter((t) => !usedTypes.has(t));
  const canCreate = availableTypes.length > 0;

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
  };

  const openCreateDialog = () => {
    if (!canCreate) return;
    setEditForm({
      ...EMPTY_FORM,
      type: availableTypes[0],
    });
    setCreatingPlan(true);
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
      { id: editingPlan.id, data: editForm },
      { onSuccess: () => setEditingPlan(null) }
    );
  };

  const columns = [
    {
      key: 'plan',
      header: 'Gói',
      render: (plan: UserPlan) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            plan.type === 'PRO'
              ? 'bg-gradient-to-br from-amber-400 to-orange-500'
              : 'bg-gradient-to-br from-blue-400 to-blue-600'
          }`}>
            {plan.type === 'PRO' ? (
              <Crown className="w-5 h-5 text-white" />
            ) : (
              <Zap className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <div className="font-medium">{plan.name}</div>
            <div className="text-sm text-muted-foreground">{plan.type}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Giá/tháng',
      render: (plan: UserPlan) => (
        <span className="font-medium">
          {plan.price === 0 ? (
            <Badge variant="outline" className="text-green-600 border-green-200">Miễn phí</Badge>
          ) : (
            formatVND(plan.price)
          )}
        </span>
      ),
    },
    {
      key: 'features',
      header: 'Tính năng',
      render: (plan: UserPlan) => (
        <div className="flex flex-wrap gap-1">
          {plan.features.map((f) => (
            <Badge key={f} variant="secondary" className="text-xs">
              {AVAILABLE_FEATURES.find((af) => af.key === f)?.label || f}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (plan: UserPlan) => (
        <Badge variant={plan.isActive ? 'default' : 'destructive'}>
          {plan.isActive ? 'Hoạt động' : 'Tắt'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (plan: UserPlan) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => openEditDialog(plan)}>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => setDeletingPlan(plan)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý gói người dùng</h1>
          <p className="text-muted-foreground">
            Quản lý gói Free & Pro cho người học
          </p>
        </div>
        <div className="flex gap-2">
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Tổng gói"
          value={plans.length.toString()}
          description="Số gói đã tạo"
          icon={Package}
        />
        <StatCard
          title="Gói miễn phí"
          value={plans.filter((p) => p.type === 'FREE').length.toString()}
          description="Free plans"
          icon={Zap}
        />
        <StatCard
          title="Gói Pro"
          value={plans.filter((p) => p.type === 'PRO').length.toString()}
          description="Premium plans"
          icon={Crown}
        />
      </div>

      <DataTable
        title="Danh sách gói người dùng"
        description={`Tổng cộng ${plans.length} gói`}
        data={plans}
        columns={columns}
        emptyMessage="Chưa có gói nào. Nhấn 'Tạo gói mặc định' để bắt đầu."
      />

      {/* Edit Plan Dialog */}
      <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Chỉnh sửa gói {editingPlan?.name}
            </DialogTitle>
            <DialogDescription>
              Cập nhật thông tin và tính năng của gói
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tên gói</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mô tả</label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Giá/tháng (VND)</label>
              <Input
                type="number"
                value={editForm.price}
                onChange={(e) => setEditForm((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="mt-1"
              />
            </div>

            {/* Feature Toggles */}
            <div>
              <label className="text-sm font-medium mb-3 block">Tính năng</label>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {AVAILABLE_FEATURES.map((feature) => (
                  <div key={feature.key} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{feature.label}</span>
                      {feature.premium && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-300 text-amber-600">
                          PREMIUM
                        </Badge>
                      )}
                    </div>
                    <Switch
                      checked={editForm.features.includes(feature.key)}
                      onCheckedChange={() => toggleFeature(feature.key)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">Kích hoạt gói</span>
              <Switch
                checked={editForm.isActive}
                onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, isActive: checked }))}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Plan Dialog */}
      <Dialog open={creatingPlan} onOpenChange={(open) => !open && setCreatingPlan(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Tạo gói mới
            </DialogTitle>
            <DialogDescription>
              Hệ thống chỉ hỗ trợ tối đa 2 loại gói: FREE và PRO. Mỗi loại chỉ có 1 gói.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Loại gói</Label>
              <Select
                value={editForm.type}
                onValueChange={(v) =>
                  setEditForm((prev) => ({ ...prev, type: v as 'FREE' | 'PRO' }))
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
            </div>
            <div className="space-y-2">
              <Label>Tên gói *</Label>
              <Input
                placeholder="VD: Pro Annual"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Input
                placeholder="Mô tả ngắn về gói"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Giá / tháng (VND)</Label>
              <Input
                type="number"
                min="0"
                value={editForm.price}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
            <div>
              <Label className="mb-3 block">Tính năng</Label>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {AVAILABLE_FEATURES.map((feature) => (
                  <div
                    key={feature.key}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                  >
                    <span className="text-sm">{feature.label}</span>
                    <Switch
                      checked={editForm.features.includes(feature.key)}
                      onCheckedChange={() => toggleFeature(feature.key)}
                    />
                  </div>
                ))}
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Confirmation */}
      <AlertDialog open={!!deletingPlan} onOpenChange={(open) => !open && setDeletingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa gói</AlertDialogTitle>
            <AlertDialogDescription>
              Gói <strong>{deletingPlan?.name}</strong> ({deletingPlan?.type}) sẽ bị xóa.
              Hành động này chỉ thành công khi <strong>không còn subscription active</strong>;
              ngược lại backend sẽ chặn và yêu cầu di chuyển/đợi user hủy đăng ký.
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
    </div>
  );
}
