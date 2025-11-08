import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  MoreHorizontal, 
  Eye, 
  Send, 
  Bell,
  Plus,
  Users,
  MessageCircle,
  UserCheck,
  UserCog
} from 'lucide-react';
import { mockNotifications, mockUsers, mockNotificationTypes } from '@/data/admin-mock';
import { Notification, NotificationType, User } from '@/types/admin';
import StatCard from '@/components/admin/StatCard';
import FilterSection from '@/components/admin/FilterSection';
import DataTable from '@/components/admin/DataTable';

export default function NotificationsManagement() {
  const [notifications] = useState<Notification[]>(mockNotifications);
  const [users] = useState<User[]>(mockUsers);
  const [notificationTypes] = useState<NotificationType[]>(mockNotificationTypes);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    content: '',
    notificationTypeId: '',
    recipientType: 'role', // 'role' or 'individual'
    selectedRoles: [] as string[],
    selectedUserIds: [] as string[]
  });

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || notification.notificationType.name === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'seen' && notification.seen) ||
      (statusFilter === 'unseen' && !notification.seen);
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    totalNotifications: notifications.length,
    unreadNotifications: notifications.filter(n => !n.seen).length,
    systemNotifications: notifications.filter(n => n.notificationType.name === 'SYSTEM').length,
    userNotifications: notifications.filter(n => n.notificationType.name === 'USER').length
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (seen: boolean) => {
    return seen ? 
      <Badge variant="outline">Đã xem</Badge> : 
      <Badge variant="default">Chưa xem</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      'SYSTEM': { label: 'Hệ thống', variant: 'default' as const },
      'USER': { label: 'Người dùng', variant: 'secondary' as const },
      'ADMIN': { label: 'Quản trị', variant: 'destructive' as const }
    };
    
    const typeInfo = typeMap[type as keyof typeof typeMap] || { label: type, variant: 'outline' as const };
    return <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>;
  };

  // Get recipients for a notification
  const getNotificationRecipients = (notification: Notification): User[] => {
    return users.filter(user => notification.userIds.includes(user.id));
  };

  // Get user-friendly label for notification type
  const getNotificationTypeLabel = (typeName: string): string => {
    const typeLabels: { [key: string]: string } = {
      'COURSE_APPROVED': 'Khóa học được duyệt',
      'PAYMENT_SUCCESS': 'Thanh toán thành công',
      'SUBSCRIPTION_REMINDER': 'Nhắc nhở đăng ký',
      'SYSTEM_MAINTENANCE': 'Bảo trì hệ thống'
    };
    return typeLabels[typeName] || typeName;
  };

  const handleCreateNotification = () => {
    // Calculate final recipient list based on selection type
    let finalUserIds: string[] = [];
    
    if (newNotification.recipientType === 'role') {
      // Get users by selected roles
      if (newNotification.selectedRoles.includes('all')) {
        finalUserIds = users.map(user => user.id);
      } else {
        // Support multiple role selection
        const selectedUsers = new Set<string>();
        
        newNotification.selectedRoles.forEach(role => {
          users.forEach(user => {
            if (role === 'student' && (!user.role || (user.role !== 'COURSESELLER' && user.role !== 'ADMINISTRATOR'))) {
              selectedUsers.add(user.id);
            } else if (role === 'courseseller' && user.role === 'COURSESELLER') {
              selectedUsers.add(user.id);
            } else if (role === 'administrator' && user.role === 'ADMINISTRATOR') {
              selectedUsers.add(user.id);
            }
          });
        });
        
        finalUserIds = Array.from(selectedUsers);
      }
    } else {
      // Use individually selected users
      finalUserIds = newNotification.selectedUserIds;
    }

    // In a real app, this would make an API call
    console.log('Creating notification:', {
      ...newNotification,
      userIds: finalUserIds,
      recipientCount: finalUserIds.length
    });
    
    setIsCreateDialogOpen(false);
    setNewNotification({ 
      title: '', 
      content: '', 
      notificationTypeId: '',
      recipientType: 'role',
      selectedRoles: [],
      selectedUserIds: []
    });
  };

  const columns = [
    {
      key: 'notification',
      header: 'Thông báo',
      render: (notification: Notification) => (
        <div className="max-w-xs">
          <div className="font-medium truncate">{notification.title}</div>
          <div className="text-sm text-muted-foreground truncate">
            {notification.content}
          </div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Loại',
      render: (notification: Notification) => getTypeBadge(notification.notificationType.name)
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (notification: Notification) => getStatusBadge(notification.seen)
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (notification: Notification) => (
        <div className="text-sm">{formatDate(notification.createdAt)}</div>
      )
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (notification: Notification) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Mở menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setSelectedNotification(notification)}>
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* <DropdownMenuItem>
              <Send className="mr-2 h-4 w-4" />
              Gửi lại
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const typeOptions = [
    { value: 'all', label: 'Tất cả loại' },
    ...notificationTypes
      .filter(type => !type.isLocked)
      .map(type => ({
        value: type.name,
        label: getNotificationTypeLabel(type.name)
      }))
  ];

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'seen', label: 'Đã xem' },
    { value: 'unseen', label: 'Chưa xem' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý thông báo</h1>
        <p className="text-muted-foreground">
          Quản lý và gửi thông báo đến người dùng
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng thông báo"
          value={stats.totalNotifications.toString()}
          description="Tất cả thông báo"
          icon={Bell}
        />
        <StatCard
          title="Chưa xem"
          value={stats.unreadNotifications.toString()}
          description="Thông báo chưa xem"
          icon={MessageCircle}
        />
        <StatCard
          title="Hệ thống"
          value={stats.systemNotifications.toString()}
          description="Thông báo hệ thống"
          icon={Bell}
        />
        <StatCard
          title="Người dùng"
          value={stats.userNotifications.toString()}
          description="Thông báo người dùng"
          icon={Users}
        />
      </div>

      <FilterSection
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
        filters={[
          {
            value: typeFilter,
            onChange: setTypeFilter,
            options: typeOptions,
            placeholder: "Lọc theo loại"
          },
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: statusOptions,
            placeholder: "Lọc theo trạng thái"
          }
        ]}
        showAddButton={true}
        onAddClick={() => setIsCreateDialogOpen(true)}
        addButtonText="Tạo thông báo"
      />

      <DataTable
        title="Danh sách thông báo"
        description={`Tổng cộng ${notifications.length} thông báo`}
        data={filteredNotifications}
        columns={columns}
        emptyMessage="Không tìm thấy thông báo nào"
      />

      {/* Create Notification Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo thông báo mới</DialogTitle>
            <DialogDescription>
              Tạo và gửi thông báo đến người dùng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tiêu đề</label>
              <input
                type="text"
                value={newNotification.title}
                onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md text-sm mt-1"
                placeholder="Nhập tiêu đề thông báo"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Nội dung</label>
              <Textarea
                value={newNotification.content}
                onChange={(e) => setNewNotification(prev => ({ ...prev, content: e.target.value }))}
                className="mt-1"
                placeholder="Nhập nội dung thông báo"
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Loại thông báo</label>
              <select
                value={newNotification.notificationTypeId}
                onChange={(e) => setNewNotification(prev => ({ ...prev, notificationTypeId: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md text-sm mt-1"
                title="Chọn loại thông báo"
              >
                <option value="">Chọn loại thông báo</option>
                {notificationTypes
                  .filter(type => !type.isLocked)
                  .map((type) => (
                    <option key={type.id} value={type.id}>
                      {getNotificationTypeLabel(type.name)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Recipient Selection */}
            <div className="border-t pt-4">
              <label className="text-sm font-medium mb-3 block">Chọn người nhận</label>
              
              {/* Recipient Type Selection */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setNewNotification(prev => ({ 
                    ...prev, 
                    recipientType: 'role',
                    selectedUserIds: [] 
                  }))}
                  className={`p-3 border rounded-lg text-sm flex items-center space-x-2 transition-colors ${
                    newNotification.recipientType === 'role' 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-input hover:bg-muted/50'
                  }`}
                >
                  <UserCog className="h-4 w-4" />
                  <span>Gửi theo vai trò</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewNotification(prev => ({ 
                    ...prev, 
                    recipientType: 'individual',
                    selectedRoles: [] 
                  }))}
                  className={`p-3 border rounded-lg text-sm flex items-center space-x-2 transition-colors ${
                    newNotification.recipientType === 'individual' 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-input hover:bg-muted/50'
                  }`}
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Chọn cá nhân</span>
                </button>
              </div>

              {/* Role Selection */}
              {newNotification.recipientType === 'role' && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Chọn vai trò người nhận:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'all', label: 'Tất cả người dùng', count: users.length },
                      { value: 'student', label: 'Học viên', count: users.filter(u => !u.role || (u.role !== 'COURSESELLER' && u.role !== 'ADMINISTRATOR')).length },
                      { value: 'courseseller', label: 'Giảng viên', count: users.filter(u => u.role === 'COURSESELLER').length },
                      { value: 'administrator', label: 'Quản trị viên', count: users.filter(u => u.role === 'ADMINISTRATOR').length }
                    ].map((role) => (
                      <label key={role.value} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-muted/50">
                        <input
                          type="checkbox"
                          checked={newNotification.selectedRoles.includes(role.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (role.value === 'all') {
                                // Nếu chọn "Tất cả", clear các role khác và chỉ giữ 'all'
                                setNewNotification(prev => ({
                                  ...prev,
                                  selectedRoles: ['all']
                                }));
                              } else {
                                // Nếu chọn role cụ thể, remove 'all' và thêm role mới
                                setNewNotification(prev => ({
                                  ...prev,
                                  selectedRoles: prev.selectedRoles.filter(r => r !== 'all').concat(role.value)
                                }));
                              }
                            } else {
                              setNewNotification(prev => ({
                                ...prev,
                                selectedRoles: prev.selectedRoles.filter(r => r !== role.value)
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm flex-1">{role.label}</span>
                        <Badge variant="outline" className="text-xs">{role.count}</Badge>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual User Selection */}
              {newNotification.recipientType === 'individual' && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Chọn người dùng cụ thể:</p>
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    {users.map((user) => (
                      <label key={user.id} className="flex items-center space-x-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50">
                        <input
                          type="checkbox"
                          checked={newNotification.selectedUserIds.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewNotification(prev => ({
                                ...prev,
                                selectedUserIds: [...prev.selectedUserIds, user.id]
                              }));
                            } else {
                              setNewNotification(prev => ({
                                ...prev,
                                selectedUserIds: prev.selectedUserIds.filter(id => id !== user.id)
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{user.fullName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <div>
                          {user.role === 'COURSESELLER' && (
                            <Badge variant="secondary" className="text-xs">Course Seller</Badge>
                          )}
                          {user.role === 'ADMINISTRATOR' && (
                            <Badge variant="destructive" className="text-xs">Admin</Badge>
                          )}
                          {(!user.role || (user.role !== 'COURSESELLER' && user.role !== 'ADMINISTRATOR')) && (
                            <Badge variant="outline" className="text-xs">Student</Badge>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Đã chọn: {newNotification.selectedUserIds.length} người dùng
                  </div>
                </div>
              )}

              {/* Recipient Summary */}
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1">Tóm tắt người nhận:</p>
                <p className="text-xs text-muted-foreground">
                  {newNotification.recipientType === 'role' ? (
                    newNotification.selectedRoles.length > 0 ? (
                      newNotification.selectedRoles.includes('all') ? (
                        `Tất cả người dùng (${users.length} người)`
                      ) : (
                        `${newNotification.selectedRoles.map(role => {
                          const roleMap = {
                            student: 'Học viên',
                            courseseller: 'Giảng viên', 
                            administrator: 'Quản trị viên'
                          };
                          return roleMap[role as keyof typeof roleMap];
                        }).join(', ')} (${
                          // Calculate unique users across selected roles
                          Array.from(new Set(
                            users
                              .filter(user => {
                                return newNotification.selectedRoles.some(role => {
                                  if (role === 'student') return !user.role || (user.role !== 'COURSESELLER' && user.role !== 'ADMINISTRATOR');
                                  if (role === 'courseseller') return user.role === 'COURSESELLER';
                                  if (role === 'administrator') return user.role === 'ADMINISTRATOR';
                                  return false;
                                });
                              })
                              .map(user => user.id)
                          )).length
                        } người)`
                      )
                    ) : (
                      'Chưa chọn vai trò nào'
                    )
                  ) : (
                    `${newNotification.selectedUserIds.length} người dùng được chọn`
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button 
                onClick={handleCreateNotification}
                disabled={
                  !newNotification.title || 
                  !newNotification.content || 
                  !newNotification.notificationTypeId ||
                  (newNotification.recipientType === 'role' && newNotification.selectedRoles.length === 0) ||
                  (newNotification.recipientType === 'individual' && newNotification.selectedUserIds.length === 0)
                }
              >
                <Send className="mr-2 h-4 w-4" />
                Tạo và gửi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Detail Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết thông báo</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về thông báo và danh sách người nhận
            </DialogDescription>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tiêu đề</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedNotification.title}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Nội dung</label>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {selectedNotification.content}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Loại thông báo</label>
                    <div className="mt-1">
                      {getTypeBadge(selectedNotification.notificationType.name)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Trạng thái</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedNotification.seen)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Ngày tạo</label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(selectedNotification.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">ID</label>
                    <p className="text-sm text-muted-foreground font-mono mt-1">
                      {selectedNotification.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recipients Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Danh sách người nhận</h3>
                  <Badge variant="outline">
                    {getNotificationRecipients(selectedNotification).length} người nhận
                  </Badge>
                </div>
                
                {getNotificationRecipients(selectedNotification).length > 0 ? (
                  <div className="grid gap-3">
                    {getNotificationRecipients(selectedNotification).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{user.fullName}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {user.role ? (
                            <Badge variant="secondary" className="text-xs">
                              {user.role === 'COURSESELLER' ? 'Course Seller' : 
                               user.role === 'ADMINISTRATOR' ? 'Admin' : 'Student'}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Student
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            ID: {user.id}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Không có người nhận nào</p>
                  </div>
                )}
              </div>

              {/* Summary Statistics */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {getNotificationRecipients(selectedNotification).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Tổng người nhận</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {getNotificationRecipients(selectedNotification).filter(u => u.role === 'COURSESELLER').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Course Sellers</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {getNotificationRecipients(selectedNotification).filter(u => !u.role || (u.role !== 'COURSESELLER' && u.role !== 'ADMINISTRATOR')).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}