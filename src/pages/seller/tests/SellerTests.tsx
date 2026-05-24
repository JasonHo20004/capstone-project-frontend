import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ClipboardList, Clock, ListChecks, Trophy, Link2, Trash2,
  Search, RefreshCw, FileWarning, Loader2,
} from "lucide-react";
import { courseService } from "@/lib/api/services/course.service";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { toast } from "sonner";

interface SellerTest {
  id: string;
  title: string;
  status: string;
  testType: string | null;
  durationInMinutes: number | null;
  totalScore: number | null;
  passingScore: number | null;
  practiceCount: number | null;
  createdAt: string;
  updatedAt: string | null;
  englishTestType: { name: string } | null;
  _count: { sections: number; questions: number; courseTests: number };
}

export default function SellerTests() {
  const navigate = useNavigate();

  const [tests, setTests] = useState<SellerTest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<SellerTest | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await courseService.getMyTests();
      setTests(res.data ?? []);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách bài kiểm tra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // One-shot backfill per browser tab — repairs `_count.courseTests` for
    // tests that were linked before course-test sync existed. Idempotent so
    // re-runs are cheap; the flag just avoids the round-trip after the first.
    const KEY = 'courseTestsBackfilled';
    const run = async () => {
      if (!sessionStorage.getItem(KEY)) {
        try {
          await courseService.syncCourseTests();
          sessionStorage.setItem(KEY, '1');
        } catch (err) {
          console.warn('Backfill failed (continuing with stale counts):', err);
        }
      }
      await load();
    };
    run();
  }, []);

  const filtered = (tests ?? []).filter((t) =>
    !search.trim() ? true : t.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await courseService.deleteTest(pendingDelete.id);
      toast.success("Đã xóa bài kiểm tra");
      setTests((prev) => (prev ?? []).filter((t) => t.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      // Most common reason for failure is FK from CourseTest — the test is
      // still linked to a course as a final test.
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Không thể xóa. Có thể bài kiểm tra đang được dùng làm Final Test của một khoá học.";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Bài kiểm tra của tôi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tất cả bài kiểm tra bạn đã tạo. Dùng làm Final Test cho khoá học.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tải lại
          </Button>
          <Button size="sm" onClick={() => navigate('/seller/tests/new')}>
            <ClipboardList className="w-4 h-4 mr-2" />
            Tạo bài kiểm tra
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tiêu đề…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileWarning className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {tests?.length === 0
                ? 'Bạn chưa tạo bài kiểm tra nào. Nhấn "Tạo bài kiểm tra" để bắt đầu.'
                : "Không tìm thấy bài kiểm tra phù hợp với tìm kiếm."}
            </p>
            {tests?.length === 0 && (
              <Button
                size="sm"
                className="mt-4"
                onClick={() => navigate('/seller/tests/new')}
              >
                <ClipboardList className="w-4 h-4 mr-2" /> Tạo bài kiểm tra
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => {
            const linkedCount = t._count?.courseTests ?? 0;
            const isLinked = linkedCount > 0;
            return (
              <Card key={t.id} className="flex flex-col">
                <CardContent className="p-5 space-y-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight line-clamp-2">{t.title}</h3>
                    {t.testType === "FINAL" && (
                      <Badge variant="secondary" className="shrink-0">
                        Final
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="font-normal">
                      <ListChecks className="w-3 h-3 mr-1" />
                      {t._count?.questions ?? 0} câu hỏi
                    </Badge>
                    {t.durationInMinutes ? (
                      <Badge variant="outline" className="font-normal">
                        <Clock className="w-3 h-3 mr-1" />
                        {t.durationInMinutes} phút
                      </Badge>
                    ) : null}
                    {t.passingScore != null && t.totalScore != null && t.totalScore > 0 ? (
                      <Badge variant="outline" className="font-normal">
                        <Trophy className="w-3 h-3 mr-1" />
                        {Math.round((t.passingScore / t.totalScore) * 100)}% đạt
                      </Badge>
                    ) : null}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      Loại:{" "}
                      <span className="text-foreground">
                        {t.englishTestType?.name || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link2 className="w-3 h-3" />
                      {isLinked ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Đang dùng cho {linkedCount} khoá học
                        </span>
                      ) : (
                        <span>Chưa liên kết với khoá học nào</span>
                      )}
                    </div>
                    <div>
                      Trạng thái:{" "}
                      <Badge variant="secondary" className="font-normal">
                        {t.status}
                      </Badge>
                    </div>
                    <div>Tạo: {new Date(t.createdAt).toLocaleDateString("vi-VN")}</div>
                  </div>
                </CardContent>

                <div className="border-t p-3 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/seller/tests/${t.id}`)}
                  >
                    Xem
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setPendingDelete(t)}
                    title={isLinked ? "Phải gỡ khỏi khoá học trước khi xoá" : "Xoá bài kiểm tra"}
                    disabled={isLinked}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Xoá bài kiểm tra?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn sắp xoá <strong className="text-slate-900">"{pendingDelete?.title}"</strong>.
              Hành động này không thể hoàn tác. Toàn bộ câu hỏi và lịch sử luyện tập sẽ mất.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Xoá vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
