import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Users,
  DollarSign,
  Save,
  X as XIcon,
  ShieldCheck,
  ShieldOff,
  Ban,
} from "lucide-react";
import type { User } from "@/domain";
import DataTable from "@/components/admin/DataTable";
import FilterSection from "@/components/admin/FilterSection";
import StatCard from "@/components/admin/StatCard";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userManagementService, auditLogService } from "@/lib/api/services/admin";

export default function UsersManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") ?? "");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>(searchParams.get("role") ?? "all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    user: User;
    newStatus: "ACTIVE" | "SUSPENDED" | "BANNED";
    suspendDays?: number;
  } | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [walletConfirm, setWalletConfirm] = useState<{
    current: number;
    next: number;
    reason: string;
  } | null>(null);
  const queryClient = useQueryClient();
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    dateOfBirth: "",
    englishLevel: "",
    learningGoals: [] as string[],
    role: "",
    certification: [] as string[],
    expertise: [] as string[],
    walletAllowance: "" as number | "",
  });

  // Sync URL ?q= (from AdminHeader global search) into the local search term.
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setSearchTerm(q);
    const r = searchParams.get("role");
    if (r) setRoleFilter(r);
  }, [searchParams]);

  // Mirror current filters back into the URL so refresh/share preserves state.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (searchTerm) next.set("q", searchTerm);
    else next.delete("q");
    if (roleFilter && roleFilter !== "all") next.set("role", roleFilter);
    else next.delete("role");
    // Only update if something changed — avoids infinite loop with searchParams dep.
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, roleFilter]);

  const { data: usersResp, isLoading: isUsersLoading } = useQuery({
    queryKey: ["userManagementUsers"],
    queryFn: () => userManagementService.getUsers(),
  });

  const extractApiError = (err: unknown, fallback: string) => {
    const data = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
    return data?.error ?? data?.message ?? (err instanceof Error ? err.message : fallback);
  };

  const createUserMutation = useMutation({
    mutationFn: (
      payload: Parameters<typeof userManagementService.createUser>[0]
    ) => userManagementService.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userManagementUsers"] });
      setCreatingUser(false);
      toast.success("Tạo người dùng mới thành công!");
    },
    onError: (err) => toast.error(extractApiError(err, "Không thể tạo người dùng")),
  });

  const updateUserMutation = useMutation({
    mutationFn: (
      payload: Parameters<typeof userManagementService.updateUser>[0]
    ) => userManagementService.updateUser(payload),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ["userManagementUsers"] });
      if (resp?.data) {
        setSelectedUser((prev) =>
          prev && prev.id === resp.data.id ? resp.data : prev
        );
      }
      setEditingUser(null);
      toast.success("Cập nhật thông tin người dùng thành công!");
    },
    onError: (err) => toast.error(extractApiError(err, "Không thể cập nhật người dùng")),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => userManagementService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userManagementUsers"] });
      setDeletingUser(null);
      setSelectedUser(null);
      toast.success("Xóa người dùng thành công!");
    },
    onError: (err) => toast.error(extractApiError(err, "Không thể xóa người dùng")),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (vars: {
      userId: string;
      status: "ACTIVE" | "SUSPENDED" | "BANNED";
      reason: string;
      suspendedUntil?: string | null;
    }) =>
      userManagementService.updateUserStatus(vars.userId, {
        status: vars.status,
        reason: vars.reason,
        suspendedUntil: vars.suspendedUntil ?? null,
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["userManagementUsers"] });
      auditLogService
        .record({
          action: "USER_STATUS_CHANGE",
          entityType: "USER",
          entityId: vars.userId,
          reason: vars.reason,
          metadata: { newStatus: vars.status, suspendedUntil: vars.suspendedUntil },
        })
        .catch((err) => console.error("[Audit] user status log failed:", err));
      toast.success("Đã cập nhật trạng thái người dùng");
      setStatusTarget(null);
      setStatusReason("");
    },
    onError: (err) =>
      toast.error(extractApiError(err, "Không thể cập nhật trạng thái")),
  });

  const fetchUserMutation = useMutation({
    mutationFn: (userId: string) => userManagementService.getUserById(userId),
  });

  useEffect(() => {
    if (usersResp) {
      // usersResp = { success, data: User[], total, page, ... }
      // usersResp.data could be an array directly, or wrapped in {users: [...]}
      const raw = usersResp as any;
      let userList: User[] = [];
      
      if (Array.isArray(raw.data)) {
        // Backend returns { success, data: [...users], total }
        userList = raw.data;
      } else if (raw.data?.users && Array.isArray(raw.data.users)) {
        // Backend returns { success, data: { users: [...], userCount } }
        userList = raw.data.users;
      }
      
      setUsers(userList);
    }
  }, [usersResp]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    // Role filter — STUDENT covers users whose role is explicitly USER or absent.
    // Any other known role (COURSESELLER / ADMINISTRATOR) must match exactly.
    const isStudent = !user.role || user.role === "USER" || user.role === "STUDENT";
    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "STUDENT" && isStudent) ||
      (roleFilter !== "STUDENT" && user.role === roleFilter);

    return matchesSearch && matchesRole;
  });

  // Backend total (preferred). Falls back to current array length only when no
  // count is provided — avoids showing "page size" as the total.
  const backendTotal =
    (usersResp as { total?: number })?.total ??
    (usersResp as { data?: { userCount?: number } })?.data?.userCount;
  const hasBackendTotal = typeof backendTotal === "number";
  const backendTotalWallet =
    (usersResp as { data?: { totalWallet?: number } })?.data?.totalWallet;
  const hasBackendWallet = typeof backendTotalWallet === "number";

  const stats = {
    totalUsers: hasBackendTotal ? (backendTotal as number) : users.length,
    totalWalletBalance: hasBackendWallet
      ? (backendTotalWallet as number)
      : users.reduce(
          (sum, u) =>
            sum +
            Number(
              u.wallet?.allowance ??
                (u as { walletBalance?: number }).walletBalance ??
                0
            ),
          0
        ),
    hasBackendTotal,
    hasBackendWallet,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return <Badge className="bg-red-100 text-red-800">Quản trị viên</Badge>;
      case "COURSESELLER":
        return <Badge className="bg-blue-100 text-blue-800">Giảng viên</Badge>;
      default:
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Học viên
          </Badge>
        );
    }
  };

  const formatDate = (date?: string | null) => {
    if (!date) return "—";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateForInput = (date?: string | null) => {
    if (!date) return "";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  const handleViewUser = (userId: string) => {
    fetchUserMutation.mutate(userId, {
      onSuccess: (response) => {
        if (response.data) {
          setSelectedUser(response.data);
        }
      },
    });
  };

  const handleEditUser = (userId: string) => {
    fetchUserMutation.mutate(userId, {
      onSuccess: (response) => {
        if (response.data) {
          const user = response.data;
          setEditingUser(user);
          setEditForm({
            fullName: user.fullName,
            email: user.email,
            password: "",
            phoneNumber: user.phoneNumber || "",
            dateOfBirth: formatDateForInput(user.dateOfBirth),
            englishLevel: user.englishLevel || "",
            learningGoals: user.learningGoals || [],
            role: user.role || "STUDENT",
            certification: user.courseSellerProfile?.certification || [],
            expertise: user.courseSellerProfile?.expertise || [],
            walletAllowance: user.wallet?.allowance || 0,
          });
        }
      },
    });
  };

  const toIsoOrUndefined = (val?: string) => {
    if (!val) return undefined;
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  };

  const buildUpdatePayload = (walletOverride?: number) => {
    if (!editingUser) return null;
    return {
      id: editingUser.id,
      fullName: editForm.fullName,
      email: editForm.email,
      phoneNumber: editForm.phoneNumber || undefined,
      dateOfBirth: toIsoOrUndefined(editForm.dateOfBirth) ?? editingUser.dateOfBirth,
      englishLevel: editForm.englishLevel || undefined,
      learningGoals: editForm.learningGoals,
      // Role is read-only in the edit dialog. Preserve the existing role
      // (set via Application approval, not arbitrary admin edits).
      courseSellerProfile:
        editingUser.role === "COURSESELLER"
          ? {
              id: editingUser.courseSellerProfile?.id,
              certification: editForm.certification,
              expertise: editForm.expertise,
              isActive: editingUser.courseSellerProfile?.isActive ?? true,
            }
          : undefined,
      walletAllowance:
        walletOverride !== undefined
          ? walletOverride
          : editForm.walletAllowance === ""
          ? undefined
          : editForm.walletAllowance,
    };
  };

  const handleSaveUser = () => {
    if (!editingUser) return;
    const currentBalance = editingUser.wallet?.allowance ?? 0;
    const nextBalance =
      editForm.walletAllowance === "" ? currentBalance : Number(editForm.walletAllowance);

    // If admin is changing the wallet balance, force an explicit confirmation
    // with a reason — this is a sensitive financial action.
    if (editingUser.wallet && nextBalance !== currentBalance) {
      setWalletConfirm({ current: currentBalance, next: nextBalance, reason: "" });
      return;
    }

    const payload = buildUpdatePayload();
    if (payload) updateUserMutation.mutate(payload);
  };

  const confirmWalletAdjustment = () => {
    if (!walletConfirm) return;
    if (!walletConfirm.reason.trim()) {
      toast.error("Vui lòng nhập lý do điều chỉnh số dư");
      return;
    }
    const payload = buildUpdatePayload(walletConfirm.next);
    if (payload && editingUser) {
      updateUserMutation.mutate(payload, {
        onSuccess: () => {
          // Audit log is fire-and-forget — the wallet mutation already succeeded.
          auditLogService
            .record({
              action: "WALLET_ADJUST",
              entityType: "WALLET",
              entityId: editingUser.wallet?.id ?? editingUser.id,
              reason: walletConfirm.reason.trim(),
              metadata: {
                userId: editingUser.id,
                userEmail: editingUser.email,
                previousBalance: walletConfirm.current,
                newBalance: walletConfirm.next,
                delta: walletConfirm.next - walletConfirm.current,
              },
            })
            .catch((err) => console.error("[Audit] wallet adjust log failed:", err));
          setWalletConfirm(null);
        },
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({
      fullName: "",
      email: "",
      password: "",
      phoneNumber: "",
      dateOfBirth: "",
      englishLevel: "",
      learningGoals: [],
      role: "",
      certification: [],
      expertise: [],
      walletAllowance: "",
    });
  };

  const handleLearningGoalChange = (value: string) => {
    const goals = value
      .split(",")
      .map((goal) => goal.trim())
      .filter((goal) => goal.length > 0);
    setEditForm({ ...editForm, learningGoals: goals });
  };

  const handleCertificationChange = (value: string) => {
    const certs = value
      .split(",")
      .map((cert) => cert.trim())
      .filter((cert) => cert.length > 0);
    setEditForm({ ...editForm, certification: certs });
  };

  const handleExpertiseChange = (value: string) => {
    const expertise = value
      .split(",")
      .map((exp) => exp.trim())
      .filter((exp) => exp.length > 0);
    setEditForm({ ...editForm, expertise: expertise });
  };

  const handleCreateUser = () => {
    setCreatingUser(true);
    setEditForm({
      fullName: "",
      email: "",
      password: "",
      phoneNumber: "",
      dateOfBirth: "",
      englishLevel: "",
      learningGoals: [],
      role: "STUDENT",
      certification: [],
      expertise: [],
      walletAllowance: "",
    });
  };

  const handleSaveNewUser = () => {
    // Email format guard (UX-only — backend remains source of truth).
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email);
    if (!emailOk) {
      toast.error("Email không hợp lệ");
      return;
    }
    if (editForm.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (editForm.role === "COURSESELLER") {
      toast.error("Không thể tạo trực tiếp giảng viên — hãy duyệt qua Đơn đăng ký");
      return;
    }

    const dob = toIsoOrUndefined(editForm.dateOfBirth);
    if (!dob) {
      toast.error("Ngày sinh không hợp lệ");
      return;
    }
    const payload = {
      fullName: editForm.fullName,
      email: editForm.email,
      password: editForm.password,
      phoneNumber: editForm.phoneNumber || undefined,
      dateOfBirth: dob,
      englishLevel: editForm.englishLevel || undefined,
      learningGoals: editForm.learningGoals,
      ...(editForm.role === "ADMINISTRATOR"
        ? { role: "ADMINISTRATOR" as const }
        : {}),
      walletAllowance: editForm.walletAllowance || undefined,
    };

    createUserMutation.mutate(payload);
  };

  const handleCancelCreate = () => {
    setCreatingUser(false);
    setEditForm({
      fullName: "",
      email: "",
      password: "",
      phoneNumber: "",
      dateOfBirth: "",
      englishLevel: "",
      learningGoals: [],
      role: "",
      certification: [],
      expertise: [],
      walletAllowance: "",
    });
  };

  const roleOptions = [
    { value: "all", label: "Tất cả vai trò" },
    { value: "STUDENT", label: "Học viên" },
    { value: "COURSESELLER", label: "Giảng viên" },
    { value: "ADMINISTRATOR", label: "Admin" },
  ];

  const columns = [
    {
      key: "user",
      header: "Người dùng",
      sortValue: (user: User) => user.fullName?.toLowerCase() ?? "",
      render: (user: User) => (
        <div className="flex items-center space-x-3">
          <UserAvatar src={user.profilePicture} name={user.fullName} className="h-8 w-8" />
          <div>
            <div className="font-medium">{user.fullName}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Vai trò",
      sortValue: (user: User) => user.role ?? "STUDENT",
      render: (user: User) => getRoleBadge(user.role),
    },
    {
      key: "wallet",
      header: "Số dư ví",
      sortValue: (user: User) => user.wallet?.allowance ?? -1,
      render: (user: User) => (
        <div className="font-medium">
          {user.wallet ? formatCurrency(user.wallet.allowance) : "Chưa có ví"}
        </div>
      ),
    },
    {
      key: "userStatus",
      header: "Trạng thái",
      sortValue: (user: User) => user.userStatus ?? "ACTIVE",
      render: (user: User) => {
        const s = user.userStatus ?? "ACTIVE";
        if (s === "SUSPENDED")
          return <Badge className="bg-amber-100 text-amber-800">Tạm khoá</Badge>;
        if (s === "BANNED")
          return <Badge className="bg-red-100 text-red-800">Khoá vĩnh viễn</Badge>;
        return <Badge variant="outline" className="text-green-700">Hoạt động</Badge>;
      },
    },
    {
      key: "createdAt",
      header: "Ngày tạo",
      sortValue: (user: User) => (user.createdAt ? new Date(user.createdAt) : null),
      render: (user: User) => (
        <div className="text-sm">{formatDate(user.createdAt)}</div>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
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
            <DropdownMenuItem onClick={() => handleViewUser(user.id)}>
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleEditUser(user.id)}
              disabled={user.role === "ADMINISTRATOR" || fetchUserMutation.isPending}
            >
              <Edit className="mr-2 h-4 w-4" />
              {fetchUserMutation.isPending ? "Đang tải..." : "Chỉnh sửa"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {(user.userStatus ?? "ACTIVE") === "ACTIVE" ? (
              <>
                <DropdownMenuItem
                  className="text-amber-700"
                  onClick={() => setStatusTarget({ user, newStatus: "SUSPENDED", suspendDays: 7 })}
                  disabled={user.role === "ADMINISTRATOR"}
                >
                  <ShieldOff className="mr-2 h-4 w-4" />
                  Tạm khoá 7 ngày
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-amber-700"
                  onClick={() => setStatusTarget({ user, newStatus: "SUSPENDED", suspendDays: 30 })}
                  disabled={user.role === "ADMINISTRATOR"}
                >
                  <ShieldOff className="mr-2 h-4 w-4" />
                  Tạm khoá 30 ngày
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => setStatusTarget({ user, newStatus: "BANNED" })}
                  disabled={user.role === "ADMINISTRATOR"}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Khoá vĩnh viễn
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem
                className="text-green-700"
                onClick={() => setStatusTarget({ user, newStatus: "ACTIVE" })}
                disabled={user.role === "ADMINISTRATOR"}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Mở khoá tài khoản
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => setDeletingUser(user)}
              disabled={user.role === "ADMINISTRATOR"}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa vĩnh viễn (hard delete)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters = [
    {
      key: "role",
      label: "Vai trò",
      value: roleFilter,
      onChange: setRoleFilter,
      options: roleOptions,
      placeholder: "Chọn vai trò",
    },
  ];

  if (isUsersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[0, 1].map((i) => (
            <Card key={i} className="p-6 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-24" />
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-5 w-48" />
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Quản lý người dùng
          </h1>
          <p className="text-muted-foreground">
            Quản lý tất cả người dùng trong hệ thống
          </p>
        </div>
        <Button
          onClick={handleCreateUser}
          className="bg-primary hover:bg-primary/90"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Thêm người dùng
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng người dùng"
          value={stats.totalUsers.toString()}
          description={
            stats.hasBackendTotal
              ? 'Tất cả người dùng trong hệ thống'
              : 'Số người dùng trên trang hiện tại'
          }
          icon={Users}
        />

        <StatCard
          title="Tổng số dư ví"
          value={formatCurrency(stats.totalWalletBalance)}
          description={
            stats.hasBackendWallet
              ? 'Tổng tiền trong hệ thống'
              : 'Tổng số dư ví của trang hiện tại'
          }
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
                <UserAvatar src={selectedUser.profilePicture} name={selectedUser.fullName} className="h-16 w-16" />
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedUser.fullName}
                  </h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {getRoleBadge(selectedUser.role)}
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
                    {selectedUser.phoneNumber || "Chưa cập nhật"}
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
                        <p className="text-sm font-mono">
                          {selectedUser.wallet.id}
                        </p>
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
                <Button
                  variant="outline"
                  onClick={() => handleEditUser(selectedUser.id)}
                  disabled={selectedUser.role === "ADMINISTRATOR"}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeletingUser(selectedUser)}
                  disabled={selectedUser.role === "ADMINISTRATOR"}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa người dùng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => !open && handleCancelEdit()}
      >
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
                      onChange={(e) =>
                        setEditForm({ ...editForm, fullName: e.target.value })
                      }
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      placeholder="Nhập email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Số điện thoại</Label>
                    <Input
                      id="phoneNumber"
                      value={editForm.phoneNumber}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          phoneNumber: e.target.value,
                        })
                      }
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={editForm.dateOfBirth}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          dateOfBirth: e.target.value,
                        })
                      }
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
                    <Select
                      value={editForm.englishLevel}
                      onValueChange={(value) =>
                        setEditForm({ ...editForm, englishLevel: value })
                      }
                    >
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
                    <Select value={editForm.role} disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STUDENT">Học viên</SelectItem>
                        <SelectItem value="COURSESELLER">Giảng viên</SelectItem>
                        <SelectItem value="ADMINISTRATOR">
                          Quản trị viên
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Không đổi vai trò trực tiếp. Để nâng cấp người dùng thành giảng viên, hãy duyệt đơn ở
                      mục <strong>Đơn đăng ký</strong>.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="learningGoals">Mục tiêu học tập</Label>
                  <Textarea
                    id="learningGoals"
                    value={editForm.learningGoals.join(", ")}
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
              {editForm.role === "COURSESELLER" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Thông tin giảng viên
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="certification">Chứng chỉ</Label>
                      <Textarea
                        id="certification"
                        value={editForm.certification.join(", ")}
                        onChange={(e) =>
                          handleCertificationChange(e.target.value)
                        }
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
                        value={editForm.expertise.join(", ")}
                        onChange={(e) => handleExpertiseChange(e.target.value)}
                        placeholder="Nhập các lĩnh vực chuyên môn, cách nhau bằng dấu phẩy"
                        rows={2}
                      />
                      <p className="text-sm text-muted-foreground">
                        Ví dụ: Business English, IELTS Preparation, Academic
                        Writing
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Wallet Information */}
              {editingUser.wallet && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Thông tin ví</h3>
                  <div className="space-y-2">
                    <Label htmlFor="walletAllowance">Số dư (VND)</Label>
                    <Input
                      id="walletAllowance"
                      type="number"
                      value={editForm.walletAllowance}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          walletAllowance:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      placeholder="Nhập số dư"
                    />
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
            <Button
              onClick={handleSaveUser}
              disabled={updateUserMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog
        open={creatingUser}
        onOpenChange={(open) => !open && handleCancelCreate()}
      >
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
                    onChange={(e) =>
                      setEditForm({ ...editForm, fullName: e.target.value })
                    }
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
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    placeholder="Nhập email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Mật khẩu *</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={editForm.password}
                    onChange={(e) =>
                      setEditForm({ ...editForm, password: e.target.value })
                    }
                    placeholder="Nhập mật khẩu"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPhoneNumber">Số điện thoại</Label>
                  <Input
                    id="newPhoneNumber"
                    value={editForm.phoneNumber}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phoneNumber: e.target.value })
                    }
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newDateOfBirth">Ngày sinh</Label>
                  <Input
                    id="newDateOfBirth"
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={(e) =>
                      setEditForm({ ...editForm, dateOfBirth: e.target.value })
                    }
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
                  <Select
                    value={editForm.englishLevel}
                    onValueChange={(value) =>
                      setEditForm({ ...editForm, englishLevel: value })
                    }
                  >
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
                  <Select
                    value={editForm.role}
                    onValueChange={(value) =>
                      setEditForm({ ...editForm, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Học viên</SelectItem>
                      <SelectItem value="ADMINISTRATOR">
                        Quản trị viên
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Người dùng mới chỉ có thể là Học viên hoặc Quản trị viên. Giảng viên phải qua quy trình duyệt đơn.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newLearningGoals">Mục tiêu học tập</Label>
                <Textarea
                  id="newLearningGoals"
                  value={editForm.learningGoals.join(", ")}
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
            {editForm.role === "COURSESELLER" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Thông tin giảng viên</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newCertification">Chứng chỉ</Label>
                    <Textarea
                      id="newCertification"
                      value={editForm.certification.join(", ")}
                      onChange={(e) =>
                        handleCertificationChange(e.target.value)
                      }
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
                      value={editForm.expertise.join(", ")}
                      onChange={(e) => handleExpertiseChange(e.target.value)}
                      placeholder="Nhập các lĩnh vực chuyên môn, cách nhau bằng dấu phẩy"
                      rows={2}
                    />
                    <p className="text-sm text-muted-foreground">
                      Ví dụ: Business English, IELTS Preparation, Academic
                      Writing
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
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      walletAllowance: Number(e.target.value),
                    })
                  }
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
              disabled={
                !editForm.fullName ||
                !editForm.email ||
                !editForm.role ||
                !editForm.password ||
                createUserMutation.isPending
              }
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Tạo người dùng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status change (ban/suspend/restore) Dialog */}
      <Dialog
        open={!!statusTarget}
        onOpenChange={(open) => {
          if (!open) {
            setStatusTarget(null);
            setStatusReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {statusTarget?.newStatus === "ACTIVE"
                ? "Mở khoá tài khoản"
                : statusTarget?.newStatus === "SUSPENDED"
                ? `Tạm khoá ${statusTarget.suspendDays} ngày`
                : "Khoá vĩnh viễn"}
            </DialogTitle>
            <DialogDescription>
              {statusTarget && (
                <>
                  Đối với <strong>{statusTarget.user.fullName}</strong> ({statusTarget.user.email}).
                  {statusTarget.newStatus !== "ACTIVE" && (
                    <span className="block mt-2 text-amber-600">
                      Người dùng sẽ không thể đăng nhập sau khi bạn xác nhận. Lý do sẽ hiển thị trên màn hình login của họ.
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="statusReason">
              Lý do <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="statusReason"
              rows={3}
              maxLength={500}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="VD: Vi phạm điều khoản, spam quảng cáo, gian lận tài chính..."
            />
            <p className="text-xs text-muted-foreground text-right">
              {statusReason.length}/500
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStatusTarget(null);
                setStatusReason("");
              }}
            >
              Huỷ
            </Button>
            <Button
              variant={statusTarget?.newStatus === "ACTIVE" ? "default" : "destructive"}
              disabled={statusReason.trim().length < 3 || updateStatusMutation.isPending}
              onClick={() => {
                if (!statusTarget) return;
                const suspendedUntil =
                  statusTarget.newStatus === "SUSPENDED" && statusTarget.suspendDays
                    ? new Date(Date.now() + statusTarget.suspendDays * 86_400_000).toISOString()
                    : null;
                updateStatusMutation.mutate({
                  userId: statusTarget.user.id,
                  status: statusTarget.newStatus,
                  reason: statusReason.trim(),
                  suspendedUntil,
                });
              }}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wallet Adjustment Confirmation Dialog */}
      <Dialog
        open={!!walletConfirm}
        onOpenChange={(open) => !open && setWalletConfirm(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận điều chỉnh số dư</DialogTitle>
            <DialogDescription>
              Đây là thao tác tài chính nhạy cảm. Vui lòng nhập lý do để lưu vào lịch sử kiểm toán.
            </DialogDescription>
          </DialogHeader>
          {walletConfirm && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/50 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Số dư hiện tại</p>
                  <p className="text-sm font-medium">{formatCurrency(walletConfirm.current)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Số dư mới</p>
                  <p className={`text-sm font-semibold ${
                    walletConfirm.next > walletConfirm.current ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {formatCurrency(walletConfirm.next)}
                    <span className="ml-1 text-xs">
                      ({walletConfirm.next > walletConfirm.current ? "+" : ""}
                      {formatCurrency(walletConfirm.next - walletConfirm.current)})
                    </span>
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="walletReason">
                  Lý do điều chỉnh <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="walletReason"
                  rows={3}
                  maxLength={500}
                  placeholder="VD: Hoàn tiền cho đơn #abc, bồi thường sự cố, điều chỉnh sai sót..."
                  value={walletConfirm.reason}
                  onChange={(e) =>
                    setWalletConfirm({ ...walletConfirm, reason: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground text-right">
                  {walletConfirm.reason.length}/500
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWalletConfirm(null)}>
              Hủy
            </Button>
            <Button
              onClick={confirmWalletAdjustment}
              disabled={updateUserMutation.isPending || !walletConfirm?.reason.trim()}
              variant="destructive"
            >
              <Save className="mr-2 h-4 w-4" />
              Xác nhận điều chỉnh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa người dùng</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa người
              dùng này?
            </DialogDescription>
          </DialogHeader>
          {deletingUser && (
            <div className="py-4">
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <UserAvatar src={deletingUser.profilePicture} name={deletingUser.fullName} className="h-10 w-10" />
                <div>
                  <div className="font-medium">{deletingUser.fullName}</div>
                  <div className="text-sm text-muted-foreground">
                    {deletingUser.email}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDeletingUser(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deletingUser && deleteUserMutation.mutate(deletingUser.id)
              }
              disabled={deleteUserMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteUserMutation.isPending ? "Đang xóa..." : "Xóa người dùng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
