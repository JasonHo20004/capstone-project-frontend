import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  UserPlus,
  Users,
  UserCheck,
  UserX,
  DollarSign,
  Save,
  X as XIcon
} from 'lucide-react';
import { mockUsers } from '@/data/mock';
import { User } from '@/types/type';
import DataTable from '@/components/admin/DataTable';
import FilterSection from '@/components/admin/FilterSection';
import StatCard from '@/components/admin/StatCard';
import { toast } from 'sonner';

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    englishLevel: '',
    learningGoals: [] as string[],
    role: '',
    isActive: true,
    certification: [] as string[],
    expertise: [] as string[],
    walletAllowance: 0
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.courseSellerProfile?.isActive) ||
      (statusFilter === 'inactive' && !user.courseSellerProfile?.isActive);
    
    const matchesRole = roleFilter === 'all' || 
      (roleFilter === 'STUDENT' && user.role !== 'COURSESELLER' && user.role !== 'ADMINISTRATOR') ||
      (roleFilter !== 'STUDENT' && user.role === roleFilter);
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(user => user.courseSellerProfile?.isActive).length,
    inactiveUsers: users.filter(user => !user.courseSellerProfile?.isActive).length,
    totalWalletBalance: users.reduce((sum, user) => sum + (user.wallet?.allowance || 0), 0)
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMINISTRATOR':
        return <Badge className="bg-red-100 text-red-800">Quản trị viên</Badge>;
      case 'COURSESELLER':
        return <Badge className="bg-blue-100 text-blue-800">Giảng viên</Badge>;
      default:
        return <Badge variant="outline" className="bg-green-100 text-green-800">Học viên</Badge>;
    }
  };

  const getStatusBadge = (user: User) => {
    const isActive = user.courseSellerProfile?.isActive;
    return isActive ? 
      <Badge className="bg-green-100 text-green-800">Hoạt động</Badge> :
      <Badge className="bg-gray-100 text-gray-800">Không hoạt động</Badge>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateForInput = (date: string) => {
    return new Date(date).toISOString().split('T')[0];
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      dateOfBirth: formatDateForInput(user.dateOfBirth),
      englishLevel: user.englishLevel || '',
      learningGoals: user.learningGoals || [],
      role: user.role || 'STUDENT',
      isActive: user.courseSellerProfile?.isActive ?? true,
      certification: user.courseSellerProfile?.certification || [],
      expertise: user.courseSellerProfile?.expertise || [],
      walletAllowance: user.wallet?.allowance || 0
    });
  };

  const handleSaveUser = () => {
    if (!editingUser) return;

    const updatedUser: User = {
      ...editingUser,
      fullName: editForm.fullName,
      email: editForm.email,
      phoneNumber: editForm.phoneNumber || undefined,
      dateOfBirth: new Date(editForm.dateOfBirth).toISOString(),
      englishLevel: editForm.englishLevel || undefined,
      learningGoals: editForm.learningGoals,
      role: editForm.role === 'STUDENT' ? undefined : (editForm.role as 'ADMINISTRATOR' | 'COURSESELLER'),
      wallet: editingUser.wallet ? {
        ...editingUser.wallet,
        allowance: editForm.walletAllowance
      } : undefined,
      courseSellerProfile: editForm.role === 'COURSESELLER' ? {
        id: editingUser.courseSellerProfile?.id || `csp_${editingUser.id}`,
        certification: editForm.certification,
        expertise: editForm.expertise,
        isActive: editForm.isActive,
        userId: editingUser.id
      } : undefined,
      administratorProfile: editForm.role === 'ADMINISTRATOR' ? {
        id: editingUser.administratorProfile?.id || `ap_${editingUser.id}`,
        userId: editingUser.id
      } : undefined
    };

    setUsers(users.map(user => user.id === editingUser.id ? updatedUser : user));
    setEditingUser(null);
    toast.success('Cập nhật thông tin người dùng thành công!');
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({
      fullName: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: '',
      englishLevel: '',
      learningGoals: [],
      role: '',
      isActive: true,
      certification: [],
      expertise: [],
      walletAllowance: 0
    });
  };

  const handleLearningGoalChange = (value: string) => {
    const goals = value.split(',').map(goal => goal.trim()).filter(goal => goal.length > 0);
    setEditForm({ ...editForm, learningGoals: goals });
  };

  const handleCertificationChange = (value: string) => {
    const certs = value.split(',').map(cert => cert.trim()).filter(cert => cert.length > 0);
    setEditForm({ ...editForm, certification: certs });
  };

  const handleExpertiseChange = (value: string) => {
    const expertise = value.split(',').map(exp => exp.trim()).filter(exp => exp.length > 0);
    setEditForm({ ...editForm, expertise: expertise });
  };

  const handleCreateUser = () => {
    setCreatingUser(true);
    setEditForm({
      fullName: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: '',
      englishLevel: '',
      learningGoals: [],
      role: 'STUDENT',
      isActive: true,
      certification: [],
      expertise: [],
      walletAllowance: 0
    });
  };

  const handleSaveNewUser = () => {
    // Generate new user ID
    const newUserId = `user_${Date.now()}`;
    
    const newUser: User = {
      id: newUserId,
      email: editForm.email,
      fullName: editForm.fullName,
      phoneNumber: editForm.phoneNumber || undefined,
      dateOfBirth: new Date(editForm.dateOfBirth).toISOString(),
      createdAt: new Date().toISOString(),
      englishLevel: editForm.englishLevel || undefined,
      learningGoals: editForm.learningGoals,
      role: editForm.role === 'STUDENT' ? undefined : (editForm.role as 'ADMINISTRATOR' | 'COURSESELLER'),
      wallet: editForm.walletAllowance > 0 ? {
        id: `wallet_${newUserId}`,
        allowance: editForm.walletAllowance,
        userId: newUserId
      } : undefined,
      courseSellerProfile: editForm.role === 'COURSESELLER' ? {
        id: `csp_${newUserId}`,
        certification: editForm.certification,
        expertise: editForm.expertise,
        isActive: editForm.isActive,
        userId: newUserId
      } : undefined,
      administratorProfile: editForm.role === 'ADMINISTRATOR' ? {
        id: `ap_${newUserId}`,
        userId: newUserId
      } : undefined
    };

    setUsers([...users, newUser]);
    setCreatingUser(false);
    toast.success('Tạo người dùng mới thành công!');
  };

  const handleCancelCreate = () => {
    setCreatingUser(false);
    setEditForm({
      fullName: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: '',
      englishLevel: '',
      learningGoals: [],
      role: '',
      isActive: true,
      certification: [],
      expertise: [],
      walletAllowance: 0
    });
  };

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Không hoạt động' }
  ];

  const roleOptions = [
    { value: 'all', label: 'Tất cả vai trò' },
    { value: 'STUDENT', label: 'Học viên' },
    { value: 'COURSESELLER', label: 'Giảng viên' },
    { value: 'ADMINISTRATOR', label: 'Admin' }
  ];

  const columns = [
    {
      key: 'user',
      header: 'Người dùng',
      render: (user: User) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profilePicture} />
            <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.fullName}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Vai trò',
      render: (user: User) => getRoleBadge(user.role)
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (user: User) => getStatusBadge(user)
    },
    {
      key: 'wallet',
      header: 'Số dư ví',
      render: (user: User) => (
        <div className="font-medium">
          {user.wallet ? formatCurrency(user.wallet.allowance) : 'Chưa có ví'}
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (user: User) => (
        <div className="text-sm">{formatDate(user.createdAt)}</div>
      )
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (user: User) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Mở menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setSelectedUser(user)}>
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleEditUser(user)}>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa người dùng
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const filters = [
    {
      key: 'status',
      label: 'Trạng thái',
      value: statusFilter,
      onChange: setStatusFilter,
      options: statusOptions,
      placeholder: 'Chọn trạng thái'
    },
    {
      key: 'role',
      label: 'Vai trò',
      value: roleFilter,
      onChange: setRoleFilter,
      options: roleOptions,
      placeholder: 'Chọn vai trò'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý người dùng</h1>
          <p className="text-muted-foreground">
            Quản lý tất cả người dùng trong hệ thống
          </p>
        </div>
        <Button onClick={handleCreateUser} className="bg-primary hover:bg-primary/90">
          <UserPlus className="mr-2 h-4 w-4" />
          Thêm người dùng
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng người dùng"
          value={stats.totalUsers.toString()}
          description="Tất cả người dùng"
          icon={Users}
        />
        <StatCard
          title="Đang hoạt động"
          value={stats.activeUsers.toString()}
          description="Người dùng hoạt động"
          icon={UserCheck}
          trend={{
            value: Math.round((stats.activeUsers / stats.totalUsers) * 100),
            label: "% tổng số",
            isPositive: true
          }}
        />
        <StatCard
          title="Không hoạt động"
          value={stats.inactiveUsers.toString()}
          description="Người dùng không hoạt động"
          icon={UserX}
        />
        <StatCard
          title="Tổng số dư ví"
          value={formatCurrency(stats.totalWalletBalance)}
          description="Tổng tiền trong hệ thống"
          icon={DollarSign}
        />
      </div>

      <FilterSection
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm kiếm theo tên hoặc email..."
        filters={filters}
        showAddButton={true}
        // onAddClick={() => console.log('Add user')}
        // addButtonText="Thêm người dùng"
      />

      <DataTable
        title="Danh sách người dùng"
        description={`Hiển thị ${filteredUsers.length} trong tổng số ${users.length} người dùng`}
        data={filteredUsers}
        columns={columns}
        emptyMessage="Không tìm thấy người dùng nào"
      />

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết người dùng</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về người dùng
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.profilePicture} />
                  <AvatarFallback className="text-lg">
                    {selectedUser.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.fullName}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">ID người dùng</label>
                  <p className="text-sm text-muted-foreground font-mono mt-1">
                    {selectedUser.id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Số điện thoại</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedUser.phoneNumber || 'Chưa cập nhật'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Ngày tạo</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(selectedUser.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Ngày sinh</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(selectedUser.dateOfBirth)}
                  </p>
                </div>
              </div>

              {selectedUser.wallet && (
                <div>
                  <label className="text-sm font-medium">Thông tin ví</label>
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">ID ví</p>
                        <p className="text-sm font-mono">{selectedUser.wallet.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Số dư</p>
                        <p className="text-sm font-medium">
                          {formatCurrency(selectedUser.wallet.allowance)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => handleEditUser(selectedUser)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </Button>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa người dùng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin người dùng</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin chi tiết của người dùng trong hệ thống
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Thông tin cơ bản</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Họ và tên *</Label>
                    <Input
                      id="fullName"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Nhập email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Số điện thoại</Label>
                    <Input
                      id="phoneNumber"
                      value={editForm.phoneNumber}
                      onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={editForm.dateOfBirth}
                      onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Learning Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Thông tin học tập</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="englishLevel">Trình độ tiếng Anh</Label>
                    <Select value={editForm.englishLevel} onValueChange={(value) => setEditForm({ ...editForm, englishLevel: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trình độ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A1">A1 - Sơ cấp</SelectItem>
                        <SelectItem value="A2">A2 - Cơ bản</SelectItem>
                        <SelectItem value="B1">B1 - Trung cấp thấp</SelectItem>
                        <SelectItem value="B2">B2 - Trung cấp cao</SelectItem>
                        <SelectItem value="C1">C1 - Cao cấp</SelectItem>
                        <SelectItem value="C2">C2 - Thành thạo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Vai trò</Label>
                    <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STUDENT">Học viên</SelectItem>
                        <SelectItem value="COURSESELLER">Giảng viên</SelectItem>
                        <SelectItem value="ADMINISTRATOR">Quản trị viên</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="learningGoals">Mục tiêu học tập</Label>
                  <Textarea
                    id="learningGoals"
                    value={editForm.learningGoals.join(', ')}
                    onChange={(e) => handleLearningGoalChange(e.target.value)}
                    placeholder="Nhập các mục tiêu học tập, cách nhau bằng dấu phẩy"
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    Ví dụ: Business English, IELTS Preparation, Academic Writing
                  </p>
                </div>
              </div>

              {/* Course Seller Information */}
              {editForm.role === 'COURSESELLER' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Thông tin giảng viên</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={editForm.isActive}
                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                        className="rounded"
                        title="Tài khoản hoạt động"
                      />
                      <Label htmlFor="isActive">Tài khoản hoạt động</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="certification">Chứng chỉ</Label>
                      <Textarea
                        id="certification"
                        value={editForm.certification.join(', ')}
                        onChange={(e) => handleCertificationChange(e.target.value)}
                        placeholder="Nhập các chứng chỉ, cách nhau bằng dấu phẩy"
                        rows={2}
                      />
                      <p className="text-sm text-muted-foreground">
                        Ví dụ: TESOL, CELTA, IELTS 8.5
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expertise">Chuyên môn</Label>
                      <Textarea
                        id="expertise"
                        value={editForm.expertise.join(', ')}
                        onChange={(e) => handleExpertiseChange(e.target.value)}
                        placeholder="Nhập các lĩnh vực chuyên môn, cách nhau bằng dấu phẩy"
                        rows={2}
                      />
                      <p className="text-sm text-muted-foreground">
                        Ví dụ: Business English, IELTS Preparation, Academic Writing
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Wallet Information */}
              {editingUser.wallet && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Thông tin ví</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="walletId">ID ví</Label>
                      <Input
                        id="walletId"
                        value={editingUser.wallet.id}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="walletAllowance">Số dư (VND)</Label>
                      <Input
                        id="walletAllowance"
                        type="number"
                        value={editForm.walletAllowance}
                        onChange={(e) => setEditForm({ ...editForm, walletAllowance: Number(e.target.value) })}
                        placeholder="Nhập số dư"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-end space-x-2 pt-6 border-t">
            <Button variant="outline" onClick={handleCancelEdit}>
              <XIcon className="mr-2 h-4 w-4" />
              Hủy
            </Button>
            <Button onClick={handleSaveUser}>
              <Save className="mr-2 h-4 w-4" />
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={creatingUser} onOpenChange={(open) => !open && handleCancelCreate()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo người dùng mới</DialogTitle>
            <DialogDescription>
              Thêm người dùng mới vào hệ thống với thông tin chi tiết
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Thông tin cơ bản</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newFullName">Họ và tên *</Label>
                  <Input
                    id="newFullName"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newEmail">Email *</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="Nhập email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPhoneNumber">Số điện thoại</Label>
                  <Input
                    id="newPhoneNumber"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newDateOfBirth">Ngày sinh</Label>
                  <Input
                    id="newDateOfBirth"
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Learning Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Thông tin học tập</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newEnglishLevel">Trình độ tiếng Anh</Label>
                  <Select value={editForm.englishLevel} onValueChange={(value) => setEditForm({ ...editForm, englishLevel: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trình độ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1 - Sơ cấp</SelectItem>
                      <SelectItem value="A2">A2 - Cơ bản</SelectItem>
                      <SelectItem value="B1">B1 - Trung cấp thấp</SelectItem>
                      <SelectItem value="B2">B2 - Trung cấp cao</SelectItem>
                      <SelectItem value="C1">C1 - Cao cấp</SelectItem>
                      <SelectItem value="C2">C2 - Thành thạo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newRole">Vai trò *</Label>
                  <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Học viên</SelectItem>
                      <SelectItem value="COURSESELLER">Giảng viên</SelectItem>
                      <SelectItem value="ADMINISTRATOR">Quản trị viên</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newLearningGoals">Mục tiêu học tập</Label>
                <Textarea
                  id="newLearningGoals"
                  value={editForm.learningGoals.join(', ')}
                  onChange={(e) => handleLearningGoalChange(e.target.value)}
                  placeholder="Nhập các mục tiêu học tập, cách nhau bằng dấu phẩy"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Ví dụ: Business English, IELTS Preparation, Academic Writing
                </p>
              </div>
            </div>

            {/* Course Seller Information */}
            {editForm.role === 'COURSESELLER' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Thông tin giảng viên</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="newIsActive"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                      className="rounded"
                      title="Tài khoản đang hoạt động"
                    />
                    <Label htmlFor="newIsActive">Tài khoản đang hoạt động</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newCertification">Chứng chỉ</Label>
                    <Textarea
                      id="newCertification"
                      value={editForm.certification.join(', ')}
                      onChange={(e) => handleCertificationChange(e.target.value)}
                      placeholder="Nhập các chứng chỉ, cách nhau bằng dấu phẩy"
                      rows={2}
                    />
                    <p className="text-sm text-muted-foreground">
                      Ví dụ: TESOL, CELTA, IELTS 8.5
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newExpertise">Chuyên môn</Label>
                    <Textarea
                      id="newExpertise"
                      value={editForm.expertise.join(', ')}
                      onChange={(e) => handleExpertiseChange(e.target.value)}
                      placeholder="Nhập các lĩnh vực chuyên môn, cách nhau bằng dấu phẩy"
                      rows={2}
                    />
                    <p className="text-sm text-muted-foreground">
                      Ví dụ: Business English, IELTS Preparation, Academic Writing
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Thông tin ví (tùy chọn)</h3>
              <div className="space-y-2">
                <Label htmlFor="newWalletAllowance">Số dư ban đầu (VND)</Label>
                <Input
                  id="newWalletAllowance"
                  type="number"
                  value={editForm.walletAllowance}
                  onChange={(e) => setEditForm({ ...editForm, walletAllowance: Number(e.target.value) })}
                  placeholder="Nhập số dư ban đầu (0 nếu không tạo ví)"
                  min="0"
                />
                <p className="text-sm text-muted-foreground">
                  Để trống hoặc nhập 0 nếu không muốn tạo ví ngay
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-end space-x-2 pt-6 border-t">
            <Button variant="outline" onClick={handleCancelCreate}>
              <XIcon className="mr-2 h-4 w-4" />
              Hủy
            </Button>
            <Button 
              onClick={handleSaveNewUser}
              disabled={!editForm.fullName || !editForm.email || !editForm.role}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Tạo người dùng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}