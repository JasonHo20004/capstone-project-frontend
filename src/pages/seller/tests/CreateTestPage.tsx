import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from 'sonner';
import { courseService } from '@/lib/api/services/course.service';
import {
  ArrowLeft, Plus, Trash2, ClipboardList, Save, AlertTriangle, Loader2,
  ChevronDown, ChevronRight, Upload, X,
} from 'lucide-react';
import ImportFromFileModal, { type ImportedQuestion } from '@/components/seller/tests/ImportFromFileModal';

interface QuestionDraft {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface SectionDraft {
  instruction: string;
  questions: QuestionDraft[];
}

const emptyQuestion = (): QuestionDraft => ({
  questionText: '',
  options: ['', '', '', ''],
  correctAnswerIndex: 0,
  explanation: '',
});

const emptySection = (): SectionDraft => ({
  instruction: '',
  questions: [emptyQuestion()],
});

export default function CreateTestPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const linkAsFinalCourseId = searchParams.get('linkAsFinalCourseId');
  const isEditMode = !!editId;

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(20);
  const [passingScore, setPassingScore] = useState(60);
  const [sections, setSections] = useState<SectionDraft[]>([emptySection()]);
  const [expanded, setExpanded] = useState<{ si: number; qi: number } | null>({ si: 0, qi: 0 });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [testTypes, setTestTypes] = useState<{ id: string; name: string }[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [existingFinalTest, setExistingFinalTest] = useState<{ id: string } | null>(null);

  useEffect(() => {
    courseService.getTestTypes()
      .then((res) => { if (res.data) setTestTypes(res.data); })
      .catch(() => { /* ignore */ });
  }, []);

  // If seller arrived from a course's Final Test flow and the course already
  // has a final test, offer to redirect them to edit it instead of creating a
  // second one (plan rule: 1 graduation exam per course).
  useEffect(() => {
    if (!linkAsFinalCourseId || isEditMode) return;
    let cancelled = false;
    courseService.getCourseById(linkAsFinalCourseId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        if (cancelled) return;
        const finalTestId: string | null | undefined = res?.data?.finalTestId;
        if (finalTestId) setExistingFinalTest({ id: finalTestId });
      })
      .catch(() => { /* non-blocking */ });
    return () => { cancelled = true; };
  }, [linkAsFinalCourseId, isEditMode]);

  // Edit mode — load the existing test once.
  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    courseService.getTestById(editId, { includeAnswers: true })
      .then((res) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const test = res.data as any;
        if (!test) {
          toast.error('Không tìm thấy bài kiểm tra');
          navigate('/seller/tests');
          return;
        }
        setTitle(test.title || '');
        setDuration(test.durationInMinutes || 20);
        const pct = test.totalScore > 0
          ? Math.round((test.passingScore / test.totalScore) * 100)
          : 60;
        setPassingScore(pct);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sourceQuestions: any[] =
          (Array.isArray(test.questions) && test.questions.length > 0
            ? test.questions
            : test.sections?.[0]?.questions) ?? [];
        const mapped: QuestionDraft[] = sourceQuestions.map((q) => {
          const idx =
            typeof q.correctAnswerIndex === 'number'
              ? q.correctAnswerIndex
              : q?.answer && typeof q.answer === 'object' && typeof q.answer.correctIndex === 'number'
              ? q.answer.correctIndex
              : 0;
          const opts = (q.options as string[] | undefined) ?? [];
          const padded = opts.length === 4 ? opts : [...opts, ...Array(Math.max(0, 4 - opts.length)).fill('')].slice(0, 4);
          return {
            questionText: q.questionText || '',
            options: padded,
            correctAnswerIndex: idx,
            explanation: q.explanation || '',
          };
        });
        setSections([{ instruction: '', questions: mapped.length > 0 ? mapped : [emptyQuestion()] }]);
        setExpanded({ si: 0, qi: 0 });
      })
      .catch(() => toast.error('Không thể tải bài kiểm tra'))
      .finally(() => setLoading(false));
  }, [editId, navigate]);

  const addQuestionToSection = (si: number) => {
    setSections((prev) => {
      const next = prev.map((s, i) => i === si ? { ...s, questions: [...s.questions, emptyQuestion()] } : s);
      setExpanded({ si, qi: next[si].questions.length - 1 });
      return next;
    });
  };

  const removeQuestion = (si: number, qi: number) => {
    setSections((prev) => {
      const section = prev[si];
      if (section.questions.length === 1) {
        if (prev.length === 1) { toast.error('Phải có ít nhất 1 câu hỏi'); return prev; }
        const next = prev.filter((_, i) => i !== si);
        setExpanded(null);
        return next;
      }
      const next = prev.map((s, i) => i === si ? { ...s, questions: s.questions.filter((_, j) => j !== qi) } : s);
      setExpanded((cur) => cur?.si === si && cur.qi === qi ? null : cur);
      return next;
    });
  };

  const updateQuestion = (si: number, qi: number, field: keyof QuestionDraft, value: unknown) => {
    setSections((prev) => prev.map((s, i) => i !== si ? s : {
      ...s,
      questions: s.questions.map((q, j) => j !== qi ? q : { ...q, [field]: value }),
    }));
  };

  const updateOption = (si: number, qi: number, oi: number, value: string) => {
    setSections((prev) => prev.map((s, i) => i !== si ? s : {
      ...s,
      questions: s.questions.map((q, j) => {
        if (j !== qi) return q;
        const opts = [...q.options];
        opts[oi] = value;
        return { ...q, options: opts };
      }),
    }));
  };

  const updateSectionInstruction = (si: number, value: string) => {
    setSections((prev) => prev.map((s, i) => i !== si ? s : { ...s, instruction: value }));
  };

  const addSection = () => {
    setSections((prev) => {
      const next = [...prev, emptySection()];
      setExpanded({ si: next.length - 1, qi: 0 });
      return next;
    });
  };

  const removeSection = (si: number) => {
    if (sections.length === 1) { toast.error('Phải có ít nhất 1 phần'); return; }
    setSections((prev) => prev.filter((_, i) => i !== si));
    setExpanded(null);
  };

  const groupImportedIntoSections = (imported: ImportedQuestion[]): SectionDraft[] => {
    if (imported.length === 0) return [emptySection()];
    const result: SectionDraft[] = [];
    let current: SectionDraft | null = null;
    for (const q of imported) {
      if (q.sectionInstruction !== undefined) {
        current = { instruction: q.sectionInstruction, questions: [] };
        result.push(current);
      } else if (current === null) {
        current = { instruction: '', questions: [] };
        result.push(current);
      }
      current.questions.push({
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation,
      });
    }
    return result;
  };

  const handleImportReplace = (imported: ImportedQuestion[]) => {
    if (imported.length === 0) return;
    setSections(groupImportedIntoSections(imported));
    setExpanded({ si: 0, qi: 0 });
  };

  const handleImportAppend = (imported: ImportedQuestion[]) => {
    if (imported.length === 0) return;
    setSections((prev) => {
      const isPristine = prev.length === 1 && !prev[0].instruction && prev[0].questions.length === 1 && !prev[0].questions[0].questionText.trim() && prev[0].questions[0].options.every((o) => !o.trim());
      const incoming = groupImportedIntoSections(imported);
      if (isPristine) {
        setExpanded({ si: 0, qi: 0 });
        return incoming;
      }
      const base = [...prev];
      const [first, ...rest] = incoming;
      if (!base[base.length - 1].instruction && !first.instruction) {
        base[base.length - 1] = { ...base[base.length - 1], questions: [...base[base.length - 1].questions, ...first.questions] };
        return [...base, ...rest];
      }
      return [...base, ...incoming];
    });
  };

  const validate = (): boolean => {
    if (!title.trim()) { toast.error('Vui lòng nhập tiêu đề bài kiểm tra'); return false; }
    let globalIdx = 0;
    for (const s of sections) {
      for (const q of s.questions) {
        globalIdx++;
        if (!q.questionText.trim()) { toast.error(`Câu ${globalIdx}: chưa có nội dung câu hỏi`); return false; }
        if (q.options.some((o) => !o.trim())) { toast.error(`Câu ${globalIdx}: điền đầy đủ 4 đáp án`); return false; }
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const testTypeId = testTypes[0]?.id;
      if (!testTypeId) { toast.error('Không tìm thấy loại bài kiểm tra'); return; }
      const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
      const totalScore = totalQuestions * 10;
      let order = 0;
      const payloadQuestions = sections.flatMap((s) =>
        s.questions.map((q) => ({
          questionText: q.questionText,
          questionType: 'MULTIPLE_CHOICE',
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex,
          explanation: q.explanation || undefined,
          questionOrder: ++order,
        }))
      );

      // Edit mode: PUT to /tests/:id and done.
      if (isEditMode && editId) {
        await courseService.updateFinalTest(editId, {
          title: title.trim(),
          durationInMinutes: duration,
          passingScore: (passingScore / 100) * totalScore,
          totalScore,
          englishTestTypeId: testTypeId,
          status: 'PUBLISHED',
          questions: payloadQuestions,
        });
        toast.success('Đã cập nhật bài kiểm tra!');
        navigate(`/seller/tests/${editId}`);
        return;
      }

      // Create mode. testType decides if this becomes a course's Final Test.
      const res = await courseService.createFinalTest({
        title: title.trim(),
        durationInMinutes: duration,
        passingScore: (passingScore / 100) * totalScore,
        totalScore,
        englishTestTypeId: testTypeId,
        // testType set to FINAL when seller is coming from a course's Final Test flow.
        ...(linkAsFinalCourseId ? { testType: 'FINAL' } : {}),
        status: 'PUBLISHED',
        questions: payloadQuestions,
      });
      const newTestId = res.data?.id;
      if (!newTestId) { toast.error('Tạo bài kiểm tra thất bại'); return; }

      // Auto-link: if seller arrived from a course's Final Test tab, link now.
      // Rollback orphan if link fails.
      if (linkAsFinalCourseId) {
        try {
          await courseService.setFinalTest(linkAsFinalCourseId, newTestId);
          toast.success('Đã tạo và liên kết làm bài kiểm tra cuối khoá!');
          navigate(`/seller/courses/${linkAsFinalCourseId}`);
          return;
        } catch (linkErr) {
          try {
            await courseService.deleteTest(newTestId);
          } catch (cleanupErr) {
            console.warn('Rollback delete failed; orphan test left in DB:', cleanupErr);
          }
          throw linkErr;
        }
      }

      toast.success('Đã tạo bài kiểm tra thành công!');
      navigate(`/seller/tests/${newTestId}`);
    } catch (err) {
      console.error('Failed to save test:', err);
      type ApiErr = { response?: { status?: number; data?: { code?: string; error?: string; message?: string; data?: { finalTestId?: string } } } };
      const apiErr = err as ApiErr;

      // If the course already has a final test (server-side guard), surface the
      // same redirect AlertDialog that the pre-check useEffect would have shown.
      if (
        apiErr.response?.status === 409 &&
        apiErr.response?.data?.code === 'FINAL_TEST_EXISTS'
      ) {
        const existingId = apiErr.response.data?.data?.finalTestId;
        if (existingId) {
          setExistingFinalTest({ id: existingId });
          return;
        }
      }

      const msg = apiErr?.response?.data?.message
        ?? apiErr?.response?.data?.error
        ?? 'Lỗi khi lưu bài kiểm tra';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Đang tải bài kiểm tra…</span>
      </div>
    );
  }

  const headerTitle = isEditMode
    ? 'Chỉnh sửa bài kiểm tra'
    : linkAsFinalCourseId
    ? 'Tạo bài kiểm tra cuối khoá'
    : 'Tạo bài kiểm tra mới';
  const headerDescription = isEditMode
    ? 'Cập nhật nội dung. Câu trả lời cũ của học viên không bị ảnh hưởng.'
    : linkAsFinalCourseId
    ? 'Tạo xong sẽ tự liên kết làm bài kiểm tra cuối khoá của khoá học đang chọn.'
    : 'Bài kiểm tra này có thể dùng làm bài kiểm tra giữa module hoặc cuối khoá. Gắn vào khoá học sau khi tạo xong.';
  const saveLabel = isEditMode
    ? 'Lưu thay đổi'
    : linkAsFinalCourseId
    ? 'Tạo và liên kết'
    : 'Tạo bài kiểm tra';
  const backLabel = linkAsFinalCourseId
    ? 'Quay lại khoá học'
    : 'Quay lại danh sách';
  const backTarget = linkAsFinalCourseId
    ? `/seller/courses/${linkAsFinalCourseId}`
    : '/seller/tests';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(backTarget)} className="-ml-2">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> {backLabel}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            {headerTitle}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{headerDescription}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-3">
              <label className="text-sm font-medium">Tiêu đề bài kiểm tra</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Bài kiểm tra Module 1 - Vocabulary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Thời gian (phút)</label>
              <Input type="number" min={1} max={180} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Điểm đạt (%)</label>
              <Input type="number" min={0} max={100} value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tổng điểm</label>
              <div className="h-10 flex items-center text-sm font-semibold px-3 bg-muted rounded-md">
                {sections.reduce((sum, s) => sum + s.questions.length, 0)} câu × 10 = {sections.reduce((sum, s) => sum + s.questions.length, 0) * 10} điểm
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-semibold">Danh sách câu hỏi</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                  <Upload className="h-4 w-4 mr-1" /> Import từ file
                </Button>
                <Button variant="outline" size="sm" onClick={addSection}>
                  <Plus className="h-4 w-4 mr-1" /> Thêm phần mới
                </Button>
              </div>
            </div>

            {sections.map((section, si) => {
              const globalOffset = sections.slice(0, si).reduce((sum, s) => sum + s.questions.length, 0);
              return (
                <div key={si} className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-50 border-b px-4 py-2 flex items-start gap-3">
                    <div className="flex items-center gap-2 shrink-0 mt-1">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phần {si + 1}</span>
                    </div>
                    <Textarea
                      rows={2}
                      value={section.instruction}
                      onChange={(e) => updateSectionInstruction(si, e.target.value)}
                      placeholder="Instruction cho phần này (có thể để trống)..."
                      className="flex-1 text-sm bg-white resize-none min-h-[2.5rem]"
                    />
                    <button
                      type="button"
                      title="Xóa phần này"
                      disabled={sections.length === 1}
                      onClick={() => removeSection(si)}
                      className="shrink-0 mt-1 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="divide-y">
                    {section.questions.map((q, qi) => {
                      const globalQi = globalOffset + qi;
                      const isOpen = expanded?.si === si && expanded?.qi === qi;
                      const filledOpts = q.options.filter((o) => o.trim()).length;
                      return (
                        <div key={qi}>
                          <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : { si, qi })}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                          >
                            {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                              {globalQi + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {q.questionText.trim() || <span className="italic text-muted-foreground">(chưa có nội dung)</span>}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {filledOpts}/4 đáp án • Đúng: {String.fromCharCode(65 + q.correctAnswerIndex)}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive shrink-0"
                              onClick={(e) => { e.stopPropagation(); removeQuestion(si, qi); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </button>

                          {isOpen && (
                            <div className="p-4 pt-2 space-y-3 border-t bg-slate-50/40">
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Nội dung câu hỏi</label>
                                <Textarea rows={2} value={q.questionText} onChange={(e) => updateQuestion(si, qi, 'questionText', e.target.value)} placeholder="Nhập nội dung câu hỏi..." />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {q.options.map((opt, oi) => (
                                  <div key={oi} className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => updateQuestion(si, qi, 'correctAnswerIndex', oi)}
                                      className={`flex-shrink-0 w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center border-2 transition-colors ${
                                        q.correctAnswerIndex === oi
                                          ? 'border-green-500 bg-green-500 text-white'
                                          : 'border-muted-foreground/30 text-muted-foreground hover:border-green-400'
                                      }`}
                                    >
                                      {String.fromCharCode(65 + oi)}
                                    </button>
                                    <Input value={opt} onChange={(e) => updateOption(si, qi, oi, e.target.value)} placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`} className="flex-1" />
                                  </div>
                                ))}
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Giải thích (tùy chọn)</label>
                                <Input value={q.explanation} onChange={(e) => updateQuestion(si, qi, 'explanation', e.target.value)} placeholder="Giải thích tại sao đáp án đúng..." />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-4 py-2 bg-slate-50/60 border-t">
                    <button
                      type="button"
                      onClick={() => addQuestionToSection(si)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Thêm câu hỏi vào phần này
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              {saving ? 'Đang lưu...' : saveLabel}
            </Button>
            <Button variant="ghost" onClick={() => navigate(backTarget)} className="ml-auto">Hủy</Button>
          </div>
        </CardContent>
      </Card>

      <ImportFromFileModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onReplace={handleImportReplace}
        onAppend={handleImportAppend}
      />

      <AlertDialog
        open={!!existingFinalTest}
        onOpenChange={(open) => { if (!open) setExistingFinalTest(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Khoá học đã có đề tốt nghiệp</AlertDialogTitle>
            <AlertDialogDescription>
              Mỗi khoá học chỉ có một đề tốt nghiệp. Bạn muốn chỉnh sửa đề hiện có?
              Học viên đã làm bài trên đề cũ vẫn được giữ kết quả.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => navigate(`/seller/courses/${linkAsFinalCourseId}`)}>
              Quay lại khoá học
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (existingFinalTest) navigate(`/seller/tests/${existingFinalTest.id}/edit`);
              }}
            >
              Chỉnh sửa đề hiện có
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
