import React, { useState, useMemo } from 'react';
import { Plus, RefreshCw, Edit, Eye, Calendar, User as UserIcon, Package, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import StatCard from '@/components/admin/StatCard';
import DataTable from '@/components/admin/DataTable';
import FilterSection from '@/components/admin/FilterSection';
import { mockSubscriptionContracts, mockSubscriptionPlans, mockUsers } from '@/data/mock';
import { SubscriptionContract, SubscriptionPlan, User } from '@/types/type';

interface ContractFormData {
  courseSellerId: string;
  subscriptionPlanId: string;
  notes?: string;
}

interface ContractUpdateData {
  status: boolean;
  notes?: string;
}

interface RenewalFormData {
  subscriptionPlanId: string;
  notes?: string;
}

const SubscriptionContractsManagement: React.FC = () => {
  const [contracts, setContracts] = useState<SubscriptionContract[]>(mockSubscriptionContracts);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<SubscriptionContract | null>(null);
  const [createFormData, setCreateFormData] = useState<ContractFormData>({
    courseSellerId: '',
    subscriptionPlanId: '',
    notes: ''
  });
  const [updateFormData, setUpdateFormData] = useState<ContractUpdateData>({
    status: true,
    notes: ''
  });
  const [isRenewalDialogOpen, setIsRenewalDialogOpen] = useState(false);
  const [renewalFormData, setRenewalFormData] = useState<RenewalFormData>({
    subscriptionPlanId: '',
    notes: ''
  });

  // Check if contract can be renewed
  const canRenewContract = (contract: SubscriptionContract) => {
    // Always allow renewal at any time
    return true;
  };

  // Get renewal button tooltip
  const getRenewalTooltip = (contract: SubscriptionContract) => {
    const now = new Date();
    const expiryDate = new Date(contract.expiresAt);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry >= 0) {
      return `Gia hạn hợp đồng (còn ${daysUntilExpiry} ngày)`;
    } else {
      return `Gia hạn hợp đồng (đã hết hạn ${Math.abs(daysUntilExpiry)} ngày)`;
    }
  };

  // Filter contracts based on search and filters
  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const matchesSearch = contract.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contract.user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && contract.status) ||
                           (statusFilter === 'expired' && !contract.status);
      const matchesPlan = planFilter === 'all' || contract.subscriptionPlanId === planFilter;
      
      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [contracts, searchTerm, statusFilter, planFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status).length;
    const expiredContracts = contracts.filter(c => !c.status).length;
    const totalRevenue = contracts
      .filter(c => c.status)
      .reduce((sum, c) => sum + c.subscriptionPlan.monthlyFee, 0);

    return {
      totalContracts,
      activeContracts,
      expiredContracts,
      totalRevenue
    };
  }, [contracts]);

  // Handle create contract
  const handleCreateContract = () => {
    if (!createFormData.courseSellerId || !createFormData.subscriptionPlanId) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const selectedUser = mockUsers.find(u => u.id === createFormData.courseSellerId);
    const selectedPlan = mockSubscriptionPlans.find(p => p.id === createFormData.subscriptionPlanId);

    if (!selectedUser || !selectedPlan) {
      toast.error('Không tìm thấy người dùng hoặc gói subscription');
      return;
    }

    const newContract: SubscriptionContract = {
      id: `sc${Date.now()}`,
      courseSellerId: createFormData.courseSellerId,
      status: true,
      subscriptionPlanId: createFormData.subscriptionPlanId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      updatedAt: new Date().toISOString(),
      renewalCount: 0,
      notes: createFormData.notes,
      user: selectedUser,
      subscriptionPlan: selectedPlan
    };

    setContracts([...contracts, newContract]);
    setCreateFormData({ courseSellerId: '', subscriptionPlanId: '', notes: '' });
    setIsCreateDialogOpen(false);
    toast.success('Tạo hợp đồng thành công');
  };

  // Open renewal dialog
  const openRenewalDialog = (contract: SubscriptionContract) => {
    setSelectedContract(contract);
    setRenewalFormData({
      subscriptionPlanId: contract.subscriptionPlanId,
      notes: ''
    });
    setIsRenewalDialogOpen(true);
  };

  // Handle renew contract
  const handleRenewContract = () => {
    if (!selectedContract) return;

    const selectedPlan = mockSubscriptionPlans.find(p => p.id === renewalFormData.subscriptionPlanId);
    if (!selectedPlan) {
      toast.error('Vui lòng chọn gói đăng ký');
      return;
    }

    const updatedContracts = contracts.map(c => {
       if (c.id === selectedContract.id) {
         // Always calculate new expiry date from current expiry date (add 1 month)
         const currentExpiry = new Date(c.expiresAt);
         const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000); // Add 30 days to current expiry
        
        return {
          ...c,
          status: true,
          subscriptionPlanId: renewalFormData.subscriptionPlanId,
          subscriptionPlan: selectedPlan,
          expiresAt: newExpiry.toISOString(),
          updatedAt: new Date().toISOString(),
          renewalCount: c.renewalCount + 1,
          lastRenewalAt: new Date().toISOString(),
          notes: renewalFormData.notes || c.notes
        };
      }
      return c;
    });

    setContracts(updatedContracts);
    setRenewalFormData({ subscriptionPlanId: '', notes: '' });
    setIsRenewalDialogOpen(false);
    setSelectedContract(null);
    toast.success('Gia hạn hợp đồng thành công');
  };

  // Handle update contract
  const handleUpdateContract = () => {
    if (!selectedContract) return;

    const updatedContracts = contracts.map(c => {
      if (c.id === selectedContract.id) {
        return {
          ...c,
          status: updateFormData.status,
          notes: updateFormData.notes || c.notes,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });

    setContracts(updatedContracts);
    setIsUpdateDialogOpen(false);
    setSelectedContract(null);
    toast.success('Cập nhật hợp đồng thành công');
  };

  // Open update dialog
  const openUpdateDialog = (contract: SubscriptionContract) => {
    setSelectedContract(contract);
    setUpdateFormData({
      status: contract.status,
      notes: contract.notes || ''
    });
    setIsUpdateDialogOpen(true);
  };

  // Table columns
  const columns = [
    {
      key: 'user',
      header: 'Người dùng',
      render: (contract: SubscriptionContract) => (
        <div className="flex flex-col">
          <span className="font-medium">{contract.user.fullName}</span>
          <span className="text-sm text-gray-500">{contract.user.email}</span>
        </div>
      )
    },
    {
      key: 'subscriptionPlan',
      header: 'Gói subscription',
      render: (contract: SubscriptionContract) => (
        <div className="flex flex-col">
          <span className="font-medium">{contract.subscriptionPlan.name}</span>
          <span className="text-sm text-gray-500">
            {contract.subscriptionPlan.monthlyFee.toLocaleString('vi-VN')} VND/tháng
          </span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (contract: SubscriptionContract) => (
        <Badge variant={contract.status ? 'default' : 'destructive'}>
          {contract.status ? 'Đang hoạt động' : 'Hết hạn'}
        </Badge>
      )
    },
    {
      key: 'dates',
      header: 'Ngày tạo / Hết hạn',
      render: (contract: SubscriptionContract) => (
        <div className="flex flex-col text-sm">
          <span>Tạo: {new Date(contract.createdAt).toLocaleDateString('vi-VN')}</span>
          <span>Hết hạn: {new Date(contract.expiresAt).toLocaleDateString('vi-VN')}</span>
        </div>
      )
    },
    {
      key: 'renewalCount',
      header: 'Số lần gia hạn',
      render: (contract: SubscriptionContract) => (
        <span className="font-medium">{contract.renewalCount}</span>
      )
    },
    {
      key: 'notes',
      header: 'Ghi chú',
      render: (contract: SubscriptionContract) => (
        <span className="text-sm text-gray-600 max-w-xs truncate">
          {contract.notes || 'Không có ghi chú'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (contract: SubscriptionContract) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openRenewalDialog(contract)}
            disabled={!canRenewContract(contract)}
            title={getRenewalTooltip(contract)}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openUpdateDialog(contract)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  // Filter options
  const filterOptions = [
    {
      key: 'status',
      label: 'Trạng thái',
      value: statusFilter,
      onChange: setStatusFilter,
      placeholder: 'Chọn trạng thái',
      options: [
        { value: 'all', label: 'Tất cả' },
        { value: 'active', label: 'Đang hoạt động' },
        { value: 'expired', label: 'Hết hạn' }
      ]
    },
    {
      key: 'plan',
      label: 'Gói subscription',
      value: planFilter,
      onChange: setPlanFilter,
      placeholder: 'Chọn gói',
      options: [
        { value: 'all', label: 'Tất cả gói' },
        ...mockSubscriptionPlans.map(plan => ({
          value: plan.id,
          label: plan.name
        }))
      ]
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý hợp đồng</h1>
          <p className="text-gray-600 mt-1">Quản lý các hợp đồng của người dùng</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo hợp đồng mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tạo hợp đồng mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="courseSeller">Người dùng *</Label>
                <Select
                  value={createFormData.courseSellerId}
                  onValueChange={(value) => setCreateFormData({...createFormData, courseSellerId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn người dùng" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockUsers.filter(user => user.role === 'COURSESELLER').map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="subscriptionPlan">Gói subscription *</Label>
                <Select
                  value={createFormData.subscriptionPlanId}
                  onValueChange={(value) => setCreateFormData({...createFormData, subscriptionPlanId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn gói subscription" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSubscriptionPlans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {plan.monthlyFee.toLocaleString('vi-VN')} VND/tháng
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  value={createFormData.notes}
                  onChange={(e) => setCreateFormData({...createFormData, notes: e.target.value})}
                  placeholder="Nhập ghi chú (tùy chọn)"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateContract} className="flex-1">
                  Tạo hợp đồng
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng hợp đồng"
          value={stats.totalContracts.toString()}
          icon={FileText}
          trend={{ value: 0, label: "0%", isPositive: true }}
        />
        <StatCard
          title="Đang hoạt động"
          value={stats.activeContracts.toString()}
          icon={UserIcon}
          trend={{ value: 0, label: "0%", isPositive: true }}
        />
        <StatCard
          title="Hết hạn"
          value={stats.expiredContracts.toString()}
          icon={Calendar}
          trend={{ value: 0, label: "0%", isPositive: false }}
        />
        <StatCard
          title="Doanh thu/tháng"
          value={`${(stats.totalRevenue / 1000000).toFixed(1)}M VND`}
          icon={DollarSign}
          trend={{ value: 0, label: "0%", isPositive: true }}
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          
          <FilterSection
            filters={filterOptions}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-lg border">
        <DataTable
          data={filteredContracts}
          columns={columns}
          emptyMessage="Không tìm thấy hợp đồng nào"
        />
      </div>

      {/* Update Contract Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật hợp đồng</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">Thông tin hợp đồng</h4>
                <p className="text-sm text-gray-600">
                  Người dùng: {selectedContract.user.fullName}
                </p>
                <p className="text-sm text-gray-600">
                  Gói: {selectedContract.subscriptionPlan.name}
                </p>
              </div>
              
              <div>
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={updateFormData.status.toString()}
                  onValueChange={(value) => setUpdateFormData({...updateFormData, status: value === 'true'})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Đang hoạt động</SelectItem>
                    <SelectItem value="false">Hết hạn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="updateNotes">Ghi chú</Label>
                <Textarea
                  id="updateNotes"
                  value={updateFormData.notes}
                  onChange={(e) => setUpdateFormData({...updateFormData, notes: e.target.value})}
                  placeholder="Nhập ghi chú"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateContract} className="flex-1">
                  Cập nhật
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsUpdateDialogOpen(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Renewal Dialog */}
      <Dialog open={isRenewalDialogOpen} onOpenChange={setIsRenewalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gia hạn hợp đồng</DialogTitle>
          </DialogHeader>
          
          {selectedContract && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">Thông tin hợp đồng</h4>
                <p className="text-sm text-gray-600">
                  Người dùng: {selectedContract.user.fullName}
                </p>
                <p className="text-sm text-gray-600">
                  Gói hiện tại: {selectedContract.subscriptionPlan.name}
                </p>
                <p className="text-sm text-gray-600">
                  Hết hạn: {new Date(selectedContract.expiresAt).toLocaleDateString('vi-VN')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="renewal-plan">Gói đăng ký mới</Label>
                <Select
                  value={renewalFormData.subscriptionPlanId}
                  onValueChange={(value) => setRenewalFormData(prev => ({ ...prev, subscriptionPlanId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn gói đăng ký" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSubscriptionPlans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {plan.monthlyFee.toLocaleString('vi-VN')} VND/tháng
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="renewal-notes">Ghi chú (tùy chọn)</Label>
                <Textarea
                  id="renewal-notes"
                  placeholder="Nhập ghi chú..."
                  value={renewalFormData.notes}
                  onChange={(e) => setRenewalFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleRenewContract}
                  className="flex-1"
                  disabled={!renewalFormData.subscriptionPlanId}
                >
                  Gia hạn
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsRenewalDialogOpen(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionContractsManagement;