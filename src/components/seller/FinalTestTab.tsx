import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { courseService } from '@/lib/api/services/course.service';
import {
  Plus,
  Trash2,
  CheckCircle2,
  ClipboardList,
  Save,
  AlertTriangle,
  Loader2,
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

interface FinalTestTabProps {
  courseId: string;
  finalTestId: string | null | undefined;
  onTestLinked: () => void;
}

export default function FinalTestTab({ courseId, finalTestId, onTestLinked }: FinalTestTabProps) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [passingScore, setPassingScore] = useState(60);
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [testTypes, setTestTypes] = useState<{ id: string; name: string }[]>([]);
  const [existingTest, setExistingTest] = useState<{
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
  } | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Load test types on mount
  useEffect(() => {
    courseService.getTestTypes().then((res) => {
      if (res.data) setTestTypes(res.data);
    }).catch(() => {/* ignore */});
  }, []);

  // Load existing test details if finalTestId exists
  useEffect(() => {
    if (!finalTestId) {
      setExistingTest(null);
      return;
    }
    setLoadingExisting(true);
    courseService.getTestById(finalTestId).then((res) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const test = res.data as any;
      if (test) {
        setExistingTest({
          id: test.id,
          title: test.title,
          durationInMinutes: test.durationInMinutes || 30,
          passingScore: test.passingScore || 60,
          totalScore: test.totalScore || 100,
          questions: test.questions?.map((q: {
            questionText?: string;
            options?: string[];
            correctAnswerIndex?: number;
            explanation?: string;
          }) => ({
            questionText: q.questionText || '',
            options: q.options || [],
            correctAnswerIndex: q.correctAnswerIndex ?? 0,
            explanation: q.explanation || '',
          })),
        });
      }
    }).catch(() => {
      toast.error('Không thể tải thông tin bài kiểm tra');
    }).finally(() => setLoadingExisting(false));
  }, [finalTestId]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error('Phải có ít nhất 1 câu hỏi');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
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
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài kiểm tra');
      return false;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Câu ${i + 1}: Vui lòng nhập nội dung câu hỏi`);
        return false;
      }
      const emptyOpts = q.options.filter((o) => !o.trim());
      if (emptyOpts.length > 0) {
        toast.error(`Câu ${i + 1}: Vui lòng điền đầy đủ các đáp án`);
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      // Find the first available test type or use a fallback
      const testTypeId = testTypes[0]?.id;
      if (!testTypeId) {
        toast.error('Không tìm thấy loại bài kiểm tra. Vui lòng thử lại sau.');
        return;
      }

      // 1. Create the test in assessment-service
      const totalScore = questions.length * 10; // 10 points per question
      const res = await courseService.createFinalTest({
        title,
        durationInMinutes: duration,
        passingScore: (passingScore / 100) * totalScore,
        totalScore,
        englishTestTypeId: testTypeId,
        testType: 'FINAL',
        questions: questions.map((q, i) => ({
          questionText: q.questionText,
          questionType: 'MULTIPLE_CHOICE',
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex,
          explanation: q.explanation || undefined,
          questionOrder: i + 1,
        })),
      });

      const testId = res.data?.id;
      if (!testId) {
        toast.error('Tạo bài kiểm tra thất bại');
        return;
      }

      // 2. Link test to course
      await courseService.setFinalTest(courseId, testId);
      toast.success('Đã tạo và liên kết bài kiểm tra cuối khóa thành công!');
      onTestLinked();
    } catch (err) {
      console.error('Failed to save final test:', err);
      toast.error('Lỗi khi tạo bài kiểm tra. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Bạn có chắc muốn xóa bài kiểm tra cuối khóa?')) return;
    setRemoving(true);
    try {
      await courseService.removeFinalTest(courseId);
      toast.success('Đã xóa bài kiểm tra cuối khóa');
      setExistingTest(null);
      onTestLinked();
    } catch {
      toast.error('Lỗi khi xóa bài kiểm tra');
    } finally {
      setRemoving(false);
    }
  };

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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <CardTitle>Bài kiểm tra cuối khóa</CardTitle>
            </div>
            <Button variant="destructive" size="sm" onClick={handleRemove} disabled={removing}>
              {removing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Xóa bài kiểm tra
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold">{existingTest.questions?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Câu hỏi</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold">{existingTest.durationInMinutes}</div>
              <div className="text-xs text-muted-foreground">Phút</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold">{existingTest.totalScore}</div>
              <div className="text-xs text-muted-foreground">Tổng điểm</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold">{existingTest.passingScore}</div>
              <div className="text-xs text-muted-foreground">Điểm đạt</div>
            </div>
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
                  <div className="font-medium text-sm">
                    Câu {i + 1}: {q.questionText}
                  </div>
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
    );
  }

  // ── Create new test form ──────────────────────────────────
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <CardTitle>Tạo bài kiểm tra cuối khóa</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Tạo bài kiểm tra trắc nghiệm để đánh giá kiến thức đầu ra của học viên.
          Học viên phải hoàn thành tất cả bài học trước khi được làm bài kiểm tra.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-3">
            <label className="text-sm font-medium">Tiêu đề bài kiểm tra</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Bài kiểm tra cuối khóa - IELTS Basics"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Thời gian (phút)</label>
            <Input
              type="number"
              min={5}
              max={180}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Điểm đạt (%)</label>
            <Input
              type="number"
              min={0}
              max={100}
              value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tổng câu hỏi</label>
            <div className="h-10 flex items-center text-sm font-semibold px-3 bg-muted rounded-md">
              {questions.length} câu × 10 điểm = {questions.length * 10} điểm
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Danh sách câu hỏi</h3>
            <Button variant="outline" size="sm" onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-1" />
              Thêm câu hỏi
            </Button>
          </div>

          {questions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
              <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.
              </p>
            </div>
          )}

          {questions.map((q, qi) => (
            <div key={qi} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Câu {qi + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeQuestion(qi)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Nội dung câu hỏi</label>
                <Textarea
                  rows={2}
                  value={q.questionText}
                  onChange={(e) => updateQuestion(qi, 'questionText', e.target.value)}
                  placeholder="Nhập nội dung câu hỏi..."
                />
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
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Giải thích (tùy chọn)
                </label>
                <Input
                  value={q.explanation}
                  onChange={(e) => updateQuestion(qi, 'explanation', e.target.value)}
                  placeholder="Giải thích tại sao đáp án đúng..."
                />
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {saving ? 'Đang lưu...' : 'Lưu bài kiểm tra'}
          </Button>
          <Button variant="outline" onClick={addQuestion}>
            <Plus className="h-4 w-4 mr-1" />
            Thêm câu hỏi
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
