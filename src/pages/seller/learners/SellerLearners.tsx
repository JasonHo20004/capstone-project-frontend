import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSellerLearners, useSellerCourses } from '@/hooks/api';
import { Users, Search, BookOpen, Calendar, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Course } from '@/domain';

const ROWS_PER_PAGE = 10;

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  return `${months} tháng trước`;
}

export default function SellerLearners() {
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  const { data: learnersData, isLoading, error } = useSellerLearners({
    search: search || undefined,
    courseId: courseId === 'ALL' ? undefined : courseId,
    page,
    limit: ROWS_PER_PAGE,
  });

  // Pull the seller's own courses to populate the per-course filter dropdown.
  const { data: myCoursesResp } = useSellerCourses('', { limit: 100 });
  const myCourses: Course[] = useMemo(() => {
    if (!myCoursesResp) return [];
    return Array.isArray(myCoursesResp)
      ? (myCoursesResp as Course[])
      : ((myCoursesResp as { data?: Course[] })?.data ?? []);
  }, [myCoursesResp]);

  const learners = learnersData?.learners ?? [];
  const pagination = learnersData?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const totalLearners = pagination?.total ?? 0;

  const uniqueCourses = useMemo(() => new Set(learners.map((l) => l.courseId)).size, [learners]);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleCourseFilter = (val: string) => {
    setCourseId(val);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl font-display flex items-center gap-2">
          <Users className="h-7 w-7 text-primary" />
          Quản lý người học
        </h1>
        <p className="mt-1 text-muted-foreground">Theo dõi và quản lý người học trên các khóa học của bạn</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng lượt đăng ký</CardTitle>
            <div className="rounded-lg bg-primary/15 p-2"><UserCheck className="h-4 w-4 text-primary" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{isLoading ? '—' : totalLearners}</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Khóa học có người học</CardTitle>
            <div className="rounded-lg bg-emerald-500/15 p-2"><BookOpen className="h-4 w-4 text-emerald-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{isLoading ? '—' : uniqueCourses}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trang hiện tại</CardTitle>
            <div className="rounded-lg bg-amber-500/15 p-2"><Calendar className="h-4 w-4 text-amber-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{page} <span className="text-sm font-normal text-muted-foreground">/ {totalPages}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Course filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên khoá học..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={courseId} onValueChange={handleCourseFilter}>
          <SelectTrigger className="w-full sm:w-[260px]">
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

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Danh sách người học</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: ROWS_PER_PAGE }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-muted rounded w-32" />
                    <div className="h-3 bg-muted rounded w-48" />
                  </div>
                  <div className="h-6 bg-muted rounded-full w-28" />
                  <div className="h-3 bg-muted rounded w-20" />
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
                {search ? 'Không tìm thấy kết quả' : 'Chưa có người học nào'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? 'Thử tìm kiếm với từ khóa khác' : 'Người học sẽ xuất hiện ở đây khi họ đăng ký khóa học của bạn'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table Header */}
              <div className="hidden sm:grid grid-cols-[2fr_2fr_1fr] gap-4 px-6 py-3 border-b bg-muted/30 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                <span>Người học</span>
                <span>Khóa học</span>
                <span className="text-right">Ngày đăng ký</span>
              </div>

              {/* Rows */}
              <div className="divide-y">
                {learners.map((l) => (
                  <div key={l.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group">
                    {/* Avatar */}
                    {l.profilePicture ? (
                      <img src={l.profilePicture} alt={l.userName} className="w-10 h-10 rounded-full object-cover shrink-0 border" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-sm font-bold border border-primary/20">
                        {getInitials(l.userName)}
                      </div>
                    )}

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{l.userName}</p>
                      {l.email && <p className="text-xs text-muted-foreground truncate">{l.email}</p>}
                    </div>

                    {/* Course — clickable to open course detail */}
                    <div className="hidden sm:flex items-center gap-2 flex-1 min-w-0">
                      <Link
                        to={`/seller/courses/${l.courseId}`}
                        title={l.courseTitle}
                        className="inline-flex items-center max-w-[260px]"
                      >
                        <Badge
                          variant="secondary"
                          className="truncate font-normal hover:bg-primary/15 hover:text-primary transition-colors cursor-pointer"
                        >
                          <BookOpen className="h-3 w-3 mr-1 shrink-0" />
                          <span className="truncate">{l.courseTitle}</span>
                        </Badge>
                      </Link>
                    </div>

                    {/* Date */}
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{timeAgo(l.purchasedAt)}</p>
                      <p className="text-[10px] text-muted-foreground/60 hidden sm:block">
                        {new Date(l.purchasedAt).toLocaleDateString('vi-VN')}
                      </p>
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Trang {page} / {totalPages} · {totalLearners} kết quả
          </p>
          <div className="flex items-center gap-1">
            <button
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border text-sm hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
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
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}