import { useState } from 'react';
import { Loader2, Edit, Crown, Zap, Package, Settings, Sparkles } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

export default function UserPlansManagement() {
  const { data: plans = [], isLoading } = useAdminUserPlans();
  const updateMutation = useUpdateUserPlan();
  const seedMutation = useSeedUserPlans();
  const [editingPlan, setEditingPlan] = useState<UserPlan | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: 0,
    features: [] as string[],
    isActive: true,
  });

  const openEditDialog = (plan: UserPlan) => {
    setEditingPlan(plan);
    setEditForm({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      features: [...plan.features],
      isActive: plan.isActive,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý gói người dùng</h1>
          <p className="text-muted-foreground">
            Quản lý gói Free & Pro cho người học
          </p>
        </div>
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
    </div>
  );
}
