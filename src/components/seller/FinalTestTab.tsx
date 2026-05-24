import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { courseService } from '@/lib/api/services/course.service';
import {
  Trash2, CheckCircle2, ClipboardList, Loader2, Pencil, Link2, Search,
  AlertTriangle, Plus,
} from 'lucide-react';

interface FinalTestTabProps {
  courseId: string;
  finalTestId: string | null | undefined;
  onTestLinked: () => void;
}

interface ExistingTest {
  id: string;
  title: string;
  durationInMinutes: number;
  passingScore: number;
  totalScore: number;
  questions?: Array<{
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
    explanation?: string;
  }>;
}

interface PickerTest {
  id: string;
  title: string;
  testType: string | null;
  durationInMinutes: number | null;
  _count?: { questions: number; courseTests: number };
}

export default function FinalTestTab({ courseId, finalTestId, onTestLinked }: FinalTestTabProps) {
  const navigate = useNavigate();
  const [existingTest, setExistingTest] = useState<ExistingTest | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  // Picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTests, setPickerTests] = useState<PickerTest[] | null>(null);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerSelectedId, setPickerSelectedId] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (!finalTestId) {
      setExistingTest(null);
      return;
    }
    setLoadingExisting(true);
    courseService.getTestById(finalTestId, { includeAnswers: true })
      .then((res) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const test = res.data as any;
        if (!test) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sourceQuestions: any[] =
          (Array.isArray(test.questions) && test.questions.length > 0
            ? test.questions
            : test.sections?.[0]?.questions) ?? [];
        const mapped = sourceQuestions.map((q) => {
          const idx =
            typeof q.correctAnswerIndex === 'number'
              ? q.correctAnswerIndex
              : q?.answer && typeof q.answer === 'object' && typeof q.answer.correctIndex === 'number'
              ? q.answer.correctIndex
              : 0;
          return {
            questionText: q.questionText || '',
            options: q.options || [],
            correctAnswerIndex: idx,
            explanation: q.explanation || '',
          };
        });
        setExistingTest({
          id: test.id,
          title: test.title,
          durationInMinutes: test.durationInMinutes || 30,
          passingScore: test.passingScore || 60,
          totalScore: test.totalScore || 100,
          questions: mapped,
        });
      })
      .catch(() => toast.error('Không thể tải thông tin bài kiểm tra'))
      .finally(() => setLoadingExisting(false));
  }, [finalTestId]);

  const openPicker = () => {
    setPickerOpen(true);
    setPickerSelectedId(null);
    setPickerSearch('');
    setPickerLoading(true);
    courseService.getMyTests()
      .then((res) => setPickerTests((res.data as PickerTest[]) ?? []))
      .catch(() => toast.error('Không thể tải danh sách bài kiểm tra'))
      .finally(() => setPickerLoading(false));
  };

  const handleLinkExisting = async () => {
    if (!pickerSelectedId) {
      toast.error('Hãy chọn 1 bài kiểm tra');
      return;
    }
    setLinking(true);
    try {
      await courseService.setFinalTest(courseId, pickerSelectedId);
      toast.success('Đã liên kết bài kiểm tra cuối khoá!');
      setPickerOpen(false);
      onTestLinked();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Không thể liên kết bài kiểm tra';
      toast.error(msg);
    } finally {
      setLinking(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    const testIdToDelete = existingTest?.id;
    try {
      await courseService.removeFinalTest(courseId);
      if (testIdToDelete) {
        try {
          await courseService.deleteTest(testIdToDelete);
        } catch (err) {
          console.warn('removeFinalTest succeeded but deleteTest failed:', err);
        }
      }
      toast.success('Đã xóa bài kiểm tra cuối khóa');
      setExistingTest(null);
      setConfirmRemoveOpen(false);
      onTestLinked();
    } catch {
      toast.error('Lỗi khi xóa bài kiểm tra');
    } finally {
      setRemoving(false);
    }
  };

  const filteredPickerTests = (pickerTests ?? []).filter((t) =>
    !pickerSearch.trim() ? true : t.title.toLowerCase().includes(pickerSearch.trim().toLowerCase())
  );

  if (loadingExisting) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Đang tải...</span>
      </div>
    );
  }

  // ── Existing test view ──────────────────────────────────
  if (existingTest) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <CardTitle>Bài kiểm tra cuối khóa</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/seller/tests/${existingTest.id}/edit`)}
                >
                  <Pencil className="h-4 w-4 mr-1" /> Chỉnh sửa
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setConfirmRemoveOpen(true)} disabled={removing}>
                  {removing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
                  Xóa bài kiểm tra
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Câu hỏi" value={existingTest.questions?.length ?? 0} />
              <Stat label="Phút" value={existingTest.durationInMinutes} />
              <Stat label="Tổng điểm" value={existingTest.totalScore} />
              <Stat label="Điểm đạt" value={existingTest.passingScore} />
            </div>

            <div>
              <h3 className="font-semibold mb-2">{existingTest.title}</h3>
              <Badge variant="secondary">Trắc nghiệm</Badge>
            </div>

            {existingTest.questions && existingTest.questions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Danh sách câu hỏi</h4>
                {existingTest.questions.map((q, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="font-medium text-sm">Câu {i + 1}: {q.questionText}</div>
                    <div className="mt-2 space-y-1">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={`text-sm px-2 py-1 rounded ${
                            oi === q.correctAnswerIndex
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-medium'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {String.fromCharCode(65 + oi)}. {opt}
                          {oi === q.correctAnswerIndex && ' ✓'}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="mt-2 text-xs text-muted-foreground italic">
                        Giải thích: {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={confirmRemoveOpen} onOpenChange={(o) => !removing && setConfirmRemoveOpen(o)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" /> Xoá bài kiểm tra cuối khoá?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Bạn sắp xoá <strong className="text-slate-900">"{existingTest.title}"</strong>.
                Hành động này không thể hoàn tác. Toàn bộ câu hỏi sẽ bị xoá vĩnh viễn,
                và khoá học sẽ không còn bài kiểm tra cuối khoá.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={removing}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                disabled={removing}
                onClick={(e) => { e.preventDefault(); handleRemove(); }}
              >
                {removing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Xoá vĩnh viễn
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // ── Empty state — picker-first ──────────────────────────────────
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Bài kiểm tra cuối khoá
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Bài kiểm tra cuối khoá đánh giá đầu ra của học viên. Học viên phải hoàn thành tất cả
            bài học trước khi được làm bài kiểm tra.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={openPicker}
              className="text-left rounded-xl border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 transition-colors p-5 group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors">
                  <Link2 className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900">Chọn từ test có sẵn</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Dùng bài kiểm tra bạn đã tạo trước đó trong <strong>Bài kiểm tra của tôi</strong>.
              </p>
            </button>

            <button
              onClick={() => navigate(`/seller/tests/new?linkAsFinalCourseId=${courseId}`)}
              className="text-left rounded-xl border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 transition-colors p-5 group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900">Tạo bài kiểm tra mới</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Mở trình soạn bài kiểm tra. Sau khi lưu sẽ tự liên kết vào khoá học.
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={pickerOpen} onOpenChange={(o) => !linking && setPickerOpen(o)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Chọn bài kiểm tra làm Final Test
            </DialogTitle>
            <DialogDescription>
              Liên kết một bài kiểm tra đã có trong "Bài kiểm tra của tôi" làm bài kiểm tra cuối khoá.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tiêu đề…"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="pl-9"
                disabled={linking}
              />
            </div>

            {pickerLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredPickerTests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <AlertTriangle className="w-8 h-8 mb-2" />
                <p className="text-sm">
                  {(pickerTests?.length ?? 0) === 0
                    ? 'Bạn chưa có bài kiểm tra nào. Đóng dialog này và bấm "Tạo bài kiểm tra mới".'
                    : 'Không tìm thấy bài kiểm tra phù hợp.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {filteredPickerTests.map((t) => {
                  const active = pickerSelectedId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPickerSelectedId(t.id)}
                      disabled={linking}
                      className={`w-full text-left rounded-lg border p-3 flex items-start gap-3 transition-colors ${
                        active ? 'border-primary bg-primary/5' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 ${
                          active ? 'border-primary bg-primary' : 'border-slate-300'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{t.title}</div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {t.testType === 'FINAL' && (
                            <Badge variant="secondary" className="font-normal">Final</Badge>
                          )}
                          <Badge variant="outline" className="font-normal">
                            {t._count?.questions ?? 0} câu
                          </Badge>
                          {t.durationInMinutes ? (
                            <Badge variant="outline" className="font-normal">
                              {t.durationInMinutes} phút
                            </Badge>
                          ) : null}
                          {(t._count?.courseTests ?? 0) > 0 && (
                            <Badge variant="outline" className="font-normal text-amber-700 border-amber-200">
                              Đang dùng ở {t._count?.courseTests} khoá khác
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPickerOpen(false)} disabled={linking}>
              Hủy
            </Button>
            <Button onClick={handleLinkExisting} disabled={!pickerSelectedId || linking}>
              {linking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Liên kết làm Final Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
