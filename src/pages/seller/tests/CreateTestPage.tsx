import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { courseService } from '@/lib/api/services/course.service';
import {
  ArrowLeft, Plus, Trash2, ClipboardList, Save, AlertTriangle, Loader2,
  ChevronDown, ChevronRight,
} from 'lucide-react';

interface QuestionDraft {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

const emptyQuestion = (): QuestionDraft => ({
  questionText: '',
  options: ['', '', '', ''],
  correctAnswerIndex: 0,
  explanation: '',
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
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [testTypes, setTestTypes] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    courseService.getTestTypes()
      .then((res) => { if (res.data) setTestTypes(res.data); })
      .catch(() => { /* ignore */ });
  }, []);

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
        setQuestions(mapped.length > 0 ? mapped : [emptyQuestion()]);
        setExpanded(0);
      })
      .catch(() => toast.error('Không thể tải bài kiểm tra'))
      .finally(() => setLoading(false));
  }, [editId, navigate]);

  const addQuestion = () => {
    setQuestions((prev) => {
      const next = [...prev, emptyQuestion()];
      setExpanded(next.length - 1);
      return next;
    });
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error('Phải có ít nhất 1 câu hỏi');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    setExpanded((cur) => (cur === index ? null : cur != null && cur > index ? cur - 1 : cur));
  };

  const updateQuestion = (index: number, field: keyof QuestionDraft, value: unknown) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const opts = [...updated[qIndex].options];
      opts[optIndex] = value;
      updated[qIndex] = { ...updated[qIndex], options: opts };
      return updated;
    });
  };

  const validate = (): boolean => {
    if (!title.trim()) { toast.error('Vui lòng nhập tiêu đề bài kiểm tra'); return false; }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) { toast.error(`Câu ${i + 1}: chưa có nội dung câu hỏi`); return false; }
      if (q.options.some((o) => !o.trim())) { toast.error(`Câu ${i + 1}: điền đầy đủ 4 đáp án`); return false; }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const testTypeId = testTypes[0]?.id;
      if (!testTypeId) { toast.error('Không tìm thấy loại bài kiểm tra'); return; }
      const totalScore = questions.length * 10;
      const payloadQuestions = questions.map((q, i) => ({
        questionText: q.questionText,
        questionType: 'MULTIPLE_CHOICE',
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation || undefined,
        questionOrder: i + 1,
      }));

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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
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
                {questions.length} câu × 10 = {questions.length * 10} điểm
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Danh sách câu hỏi</h3>
              <Button variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-1" /> Thêm câu hỏi
              </Button>
            </div>

            {questions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Chưa có câu hỏi nào.</p>
              </div>
            )}

            {questions.map((q, qi) => {
              const isOpen = expanded === qi;
              const filledOpts = q.options.filter((o) => o.trim()).length;
              return (
                <div key={qi} className="rounded-lg border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : qi)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {qi + 1}
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
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); removeQuestion(qi); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </button>

                  {isOpen && (
                    <div className="p-4 pt-2 space-y-3 border-t bg-slate-50/40">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Nội dung câu hỏi</label>
                        <Textarea rows={2} value={q.questionText} onChange={(e) => updateQuestion(qi, 'questionText', e.target.value)} placeholder="Nhập nội dung câu hỏi..." />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuestion(qi, 'correctAnswerIndex', oi)}
                              className={`flex-shrink-0 w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center border-2 transition-colors ${
                                q.correctAnswerIndex === oi
                                  ? 'border-green-500 bg-green-500 text-white'
                                  : 'border-muted-foreground/30 text-muted-foreground hover:border-green-400'
                              }`}
                            >
                              {String.fromCharCode(65 + oi)}
                            </button>
                            <Input value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`} className="flex-1" />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Giải thích (tùy chọn)</label>
                        <Input value={q.explanation} onChange={(e) => updateQuestion(qi, 'explanation', e.target.value)} placeholder="Giải thích tại sao đáp án đúng..." />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              {saving ? 'Đang lưu...' : saveLabel}
            </Button>
            <Button variant="outline" onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-1" /> Thêm câu hỏi
            </Button>
            <Button variant="ghost" onClick={() => navigate(backTarget)} className="ml-auto">Hủy</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
