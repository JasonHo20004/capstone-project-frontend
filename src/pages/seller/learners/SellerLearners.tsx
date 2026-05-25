import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useSellerLearners, useSellerCourses } from '@/hooks/api';
import {
  Users,
  Search,
  BookOpen,
  TrendingUp,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Copy,
  ExternalLink,
  Download,
  ArrowUpDown,
} from 'lucide-react';
import type { Course } from '@/domain';

type SortKey = 'date-desc' | 'date-asc' | 'course-asc' | 'course-desc';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

function getInitials(name: string) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60_000) return 'Vừa xong';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;
  const years = Math.floor(months / 12);
  return `${years} năm trước`;
}

function parseSortKey(k: SortKey): { sortBy: 'date' | 'course'; sortOrder: 'asc' | 'desc' } {
  switch (k) {
    case 'date-asc':
      return { sortBy: 'date', sortOrder: 'asc' };
    case 'course-asc':
      return { sortBy: 'course', sortOrder: 'asc' };
    case 'course-desc':
      return { sortBy: 'course', sortOrder: 'desc' };
    default:
      return { sortBy: 'date', sortOrder: 'desc' };
  }
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export default function SellerLearners() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState<string>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('date-desc');
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  // Debounce the search input so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { sortBy, sortOrder } = parseSortKey(sortKey);

  const { data: learnersData, isLoading, error } = useSellerLearners({
    search: search || undefined,
    courseId: courseId === 'ALL' ? undefined : courseId,
    page,
    limit: pageSize,
    sortBy,
    sortOrder,
  });

  const { data: myCoursesResp } = useSellerCourses('', { limit: 100 });
  const myCourses: Course[] = useMemo(() => {
    if (!myCoursesResp) return [];
    return Array.isArray(myCoursesResp)
      ? (myCoursesResp as Course[])
      : ((myCoursesResp as { data?: Course[] })?.data ?? []);
  }, [myCoursesResp]);

  const learners = learnersData?.learners ?? [];
  const pagination = learnersData?.pagination;
  const stats = learnersData?.stats;
  const totalPages = pagination?.totalPages ?? 1;
  const totalLearners = pagination?.total ?? 0;
  const uniqueCoursesCount = stats?.uniqueCoursesCount ?? 0;
  const newThisWeekCount = stats?.newThisWeekCount ?? 0;

  const handleCourseFilter = (val: string) => {
    setCourseId(val);
    setPage(1);
  };

  const handlePageSize = (val: string) => {
    const n = parseInt(val, 10);
    if (Number.isFinite(n)) {
      setPageSize(n);
      setPage(1);
    }
  };

  const copyEmail = async (email: string) => {
    if (!email) {
      toast.error('Người học chưa có email');
      return;
    }
    try {
      await navigator.clipboard.writeText(email);
      toast.success('Đã sao chép email');
    } catch {
      toast.error('Không thể sao chép');
    }
  };

  // Export the current filtered set (up to 1000 rows) to CSV. Client-side via
  // a one-shot fetch with a large limit so the export honors the active
  // search/course/sort filters without paginating in the UI.
  const exportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { sellerService } = await import('@/lib/api/services');
      const resp = await sellerService.getLearners({
        search: search || undefined,
        courseId: courseId === 'ALL' ? undefined : courseId,
        sortBy,
        sortOrder,
        page: 1,
        limit: 1000,
      });
      const rows = resp.data?.learners ?? [];
      if (rows.length === 0) {
        toast.info('Không có dữ liệu để xuất');
        return;
      }
      const header = ['Tên người học', 'Email', 'Khoá học', 'Ngày đăng ký'];
      const csv = [
        header.join(','),
        ...rows.map((r) =>
          [
            escapeCsv(r.userName),
            escapeCsv(r.email || ''),
            escapeCsv(r.courseTitle),
            escapeCsv(new Date(r.purchasedAt).toISOString()),
          ].join(',')
        ),
      ].join('\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nguoi-hoc-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Đã xuất ${rows.length} người học`);
    } catch (e) {
      console.error(e);
      toast.error('Xuất CSV thất bại');
    } finally {
      setExporting(false);
    }
  };

  const hasActiveFilter = !!search || courseId !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl font-display flex items-center gap-2">
          <Users className="h-7 w-7 text-primary" />
          Quản lý người học
        </h1>
        <p className="mt-1 text-muted-foreground">
          Theo dõi và quản lý người học trên các khóa học của bạn
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng lượt đăng ký</CardTitle>
            <div className="rounded-lg bg-primary/15 p-2">
              <UserCheck className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">
              {isLoading ? '—' : totalLearners.toLocaleString('vi-VN')}
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Khoá học có người học</CardTitle>
            <div className="rounded-lg bg-emerald-500/15 p-2">
              <BookOpen className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">
              {isLoading ? '—' : uniqueCoursesCount.toLocaleString('vi-VN')}
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đăng ký 7 ngày qua</CardTitle>
            <div className="rounded-lg bg-amber-500/15 p-2">
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">
              {isLoading ? '—' : newThisWeekCount.toLocaleString('vi-VN')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar: search, course filter, sort, page size, export */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên hoặc email người học..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={courseId} onValueChange={handleCourseFilter}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder="Lọc theo khoá học" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả khoá học</SelectItem>
              {myCourses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Ngày đăng ký: mới nhất</SelectItem>
                <SelectItem value="date-asc">Ngày đăng ký: cũ nhất</SelectItem>
                <SelectItem value="course-asc">Khoá học: A → Z</SelectItem>
                <SelectItem value="course-desc">Khoá học: Z → A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select value={pageSize.toString()} onValueChange={handlePageSize}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n} / trang
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="sm:ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={exporting || isLoading || totalLearners === 0}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Đang xuất...' : 'Xuất CSV'}
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Danh sách người học</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: pageSize }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="h-3.5 bg-muted rounded w-2/5" />
                    <div className="h-3 bg-muted rounded w-3/5" />
                  </div>
                  <div className="h-6 bg-muted rounded-full w-32 hidden sm:block" />
                  <div className="h-3 bg-muted rounded w-20 shrink-0" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center text-destructive">
              <p className="font-medium">Không thể tải danh sách người học</p>
              <p className="text-sm mt-1">Vui lòng thử lại sau.</p>
            </div>
          ) : learners.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-3 font-medium text-muted-foreground">
                {hasActiveFilter ? 'Không tìm thấy kết quả' : 'Chưa có người học nào'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilter
                  ? 'Thử thay đổi từ khoá tìm kiếm hoặc bỏ lọc khoá học'
                  : 'Người học sẽ xuất hiện ở đây khi họ đăng ký khoá học của bạn'}
              </p>
              {!hasActiveFilter && (
                <div className="mt-4">
                  <Button asChild size="sm">
                    <Link to="/seller/courses">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Quản lý khoá học
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table Header */}
              <div className="hidden sm:grid grid-cols-[2fr_2fr_1fr_auto] gap-4 px-6 py-3 border-b bg-muted/30 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                <span>Người học</span>
                <span>Khoá học</span>
                <span className="text-right">Ngày đăng ký</span>
                <span className="w-9" />
              </div>

              {/* Rows */}
              <div className="divide-y">
                {learners.map((l) => (
                  <div
                    key={l.id}
                    className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[2fr_2fr_1fr_auto] items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group"
                  >
                    {/* User info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {l.profilePicture ? (
                        <img
                          src={l.profilePicture}
                          alt={l.userName}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-sm font-bold border border-primary/20">
                          {getInitials(l.userName)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{l.userName}</p>
                        {l.email && (
                          <p className="text-xs text-muted-foreground truncate">{l.email}</p>
                        )}
                        {/* Mobile-only course chip — desktop shows it as its own column */}
                        <Link
                          to={`/seller/courses/${l.courseId}`}
                          className="sm:hidden mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          title={l.courseTitle}
                        >
                          <BookOpen className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[180px]">{l.courseTitle}</span>
                        </Link>
                      </div>
                    </div>

                    {/* Course (desktop only) */}
                    <div className="hidden sm:flex items-center gap-2 min-w-0">
                      <Link
                        to={`/seller/courses/${l.courseId}`}
                        title={l.courseTitle}
                        className="inline-flex items-center max-w-full"
                      >
                        <Badge
                          variant="secondary"
                          className="truncate font-normal hover:bg-primary/15 hover:text-primary transition-colors cursor-pointer gap-1.5 pl-1"
                        >
                          {l.courseThumbnail ? (
                            <img
                              src={l.courseThumbnail}
                              alt=""
                              className="h-5 w-5 rounded object-cover shrink-0"
                            />
                          ) : (
                            <BookOpen className="h-3 w-3 shrink-0" />
                          )}
                          <span className="truncate">{l.courseTitle}</span>
                        </Badge>
                      </Link>
                    </div>

                    {/* Date */}
                    <div className="text-right shrink-0">
                      <p
                        className="text-xs text-muted-foreground"
                        title={new Date(l.purchasedAt).toLocaleString('vi-VN')}
                      >
                        {timeAgo(l.purchasedAt)}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 hidden sm:block">
                        {new Date(l.purchasedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-60 group-hover:opacity-100"
                            aria-label="Tác vụ"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => copyEmail(l.email)} disabled={!l.email}>
                            <Copy className="h-4 w-4 mr-2" />
                            Sao chép email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link to={`/seller/courses/${l.courseId}`}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Xem khoá học
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Trang {page} / {totalPages} · {totalLearners.toLocaleString('vi-VN')} kết quả
          </p>
          <div className="flex items-center gap-1">
            <button
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border text-sm hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    pageNum === page
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border text-sm hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
