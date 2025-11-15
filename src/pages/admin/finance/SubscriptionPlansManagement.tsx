import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Plus,
  CreditCard,
  Users,
  Calendar,
  Package
} from 'lucide-react';
import { mockSubscriptionPlans } from '@/data/mock';
import { SubscriptionPlan } from '@/types/type';
import StatCard from '@/components/admin/StatCard';
import FilterSection from '@/components/admin/FilterSection';
import DataTable from '@/components/admin/DataTable';

export default function SubscriptionPlansManagement() {
  const [plans] = useState<SubscriptionPlan[]>(mockSubscriptionPlans);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    maxCourses: 0,
    monthlyFee: 0
  });

  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (plan.description && plan.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    totalPlans: plans.length,
    averageFee: plans.reduce((sum, plan) => sum + plan.monthlyFee, 0) / plans.length,
    maxCourses: Math.max(...plans.map(plan => plan.maxCourses)),
    minFee: Math.min(...plans.map(plan => plan.monthlyFee))
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleCreatePlan = () => {
    console.log('Creating plan:', newPlan);
    setIsCreateDialogOpen(false);
    setNewPlan({ name: '', description: '', maxCourses: 0, monthlyFee: 0 });
  };

  const handleEditPlan = () => {
    console.log('Editing plan:', selectedPlan?.id, newPlan);
    setIsEditDialogOpen(false);
    setSelectedPlan(null);
    setNewPlan({ name: '', description: '', maxCourses: 0, monthlyFee: 0 });
  };

  const openEditDialog = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setNewPlan({
      name: plan.name,
      description: plan.description || '',
      maxCourses: plan.maxCourses,
      monthlyFee: plan.monthlyFee
    });
    setIsEditDialogOpen(true);
  };

  const columns = [
    {
      key: 'plan',
      header: 'Gói đăng ký',
      render: (plan: SubscriptionPlan) => (
        <div>
          <div className="font-medium">{plan.name}</div>
          <div className="text-sm text-muted-foreground">
            {plan.description || 'Không có mô tả'}
          </div>
        </div>
      )
    },
    {
      key: 'maxCourses',
      header: 'Số khóa học tối đa',
      render: (plan: SubscriptionPlan) => (
        <div className="text-center">
          <Badge variant="outline">{plan.maxCourses} khóa học</Badge>
        </div>
      )
    },
    {
      key: 'monthlyFee',
      header: 'Phí hàng tháng',
      render: (plan: SubscriptionPlan) => (
        <div className="font-medium text-green-600">
          {formatCurrency(plan.monthlyFee)}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (plan: SubscriptionPlan) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Mở menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setSelectedPlan(plan)}>
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openEditDialog(plan)}>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý gói đăng ký</h1>
        <p className="text-muted-foreground">
          Quản lý các gói đăng ký cho giảng viên
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng gói"
          value={stats.totalPlans.toString()}
          description="Số gói đăng ký"
          icon={Package}
        />
        <StatCard
          title="Phí trung bình"
          value={formatCurrency(stats.averageFee)}
          description="Phí hàng tháng TB"
          icon={CreditCard}
        />
        <StatCard
          title="Khóa học tối đa"
          value={stats.maxCourses.toString()}
          description="Gói cao nhất"
          icon={Users}
        />
        <StatCard
          title="Phí thấp nhất"
          value={formatCurrency(stats.minFee)}
          description="Gói cơ bản"
          icon={Calendar}
        />
      </div>

      <FilterSection
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm kiếm theo tên gói hoặc mô tả..."
        showAddButton={true}
        onAddClick={() => setIsCreateDialogOpen(true)}
        addButtonText="Tạo gói mới"
      />

      <DataTable
        title="Danh sách gói đăng ký"
        description={`Tổng cộng ${plans.length} gói đăng ký`}
        data={filteredPlans}
        columns={columns}
        emptyMessage="Không tìm thấy gói đăng ký nào"
      />

      {/* Create Plan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo gói đăng ký mới</DialogTitle>
            <DialogDescription>
              Tạo gói đăng ký mới cho giảng viên
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tên gói</label>
              <Input
                value={newPlan.name}
                onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập tên gói đăng ký"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mô tả</label>
              <Input
                value={newPlan.description}
                onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Nhập mô tả gói đăng ký"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Số khóa học tối đa</label>
              <Input
                type="number"
                value={newPlan.maxCourses}
                onChange={(e) => setNewPlan(prev => ({ ...prev, maxCourses: parseInt(e.target.value) || 0 }))}
                placeholder="Nhập số khóa học tối đa"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phí hàng tháng (VND)</label>
              <Input
                type="number"
                value={newPlan.monthlyFee}
                onChange={(e) => setNewPlan(prev => ({ ...prev, monthlyFee: parseFloat(e.target.value) || 0 }))}
                placeholder="Nhập phí hàng tháng"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreatePlan}>
                <Plus className="mr-2 h-4 w-4" />
                Tạo gói
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa gói đăng ký</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin gói đăng ký
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tên gói</label>
              <Input
                value={newPlan.name}
                onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập tên gói đăng ký"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mô tả</label>
              <Input
                value={newPlan.description}
                onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Nhập mô tả gói đăng ký"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Số khóa học tối đa</label>
              <Input
                type="number"
                value={newPlan.maxCourses}
                onChange={(e) => setNewPlan(prev => ({ ...prev, maxCourses: parseInt(e.target.value) || 0 }))}
                placeholder="Nhập số khóa học tối đa"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phí hàng tháng (VND)</label>
              <Input
                type="number"
                value={newPlan.monthlyFee}
                onChange={(e) => setNewPlan(prev => ({ ...prev, monthlyFee: parseFloat(e.target.value) || 0 }))}
                placeholder="Nhập phí hàng tháng"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleEditPlan}>
                <Edit className="mr-2 h-4 w-4" />
                Cập nhật
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan Detail Dialog */}
      <Dialog open={!!selectedPlan && !isEditDialogOpen} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết gói đăng ký</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về gói đăng ký
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tên gói</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedPlan.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">ID</label>
                  <p className="text-sm text-muted-foreground font-mono mt-1">
                    {selectedPlan.id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Số khóa học tối đa</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedPlan.maxCourses} khóa học
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phí hàng tháng</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatCurrency(selectedPlan.monthlyFee)}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Mô tả</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedPlan.description || 'Không có mô tả'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}