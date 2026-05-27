import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Save,
  Loader2,
  PenTool,
  BarChart3,
  FileText,
  Check,
  ImagePlus,
  X,
  Info,
  Settings,
  Link,
  Upload,
  Camera,
  Timer,
} from 'lucide-react';
import apiClient from '@/lib/api/config';

interface WritingFormData {
  title: string;
  durationInMinutes: number;
  status: string;
  englishTestTypeId: string;
  // Task 1
  task1ImageUrl: string;
  task1Description: string;
  task1WordCountMin: number;
  task1WordCountMax: number;
  task1SampleAnswer: string;
  // Task 2
  task2EssayPrompt: string;
  task2WordCountMin: number;
  task2WordCountMax: number;
  task2SampleAnswer: string;
  // Shared
  rubricNotes: string;
}

const STEPS = [
  { id: 1, label: 'Thông tin', icon: FileText },
  { id: 2, label: 'Task 1', icon: BarChart3 },
  { id: 3, label: 'Task 2', icon: PenTool },
  { id: 4, label: 'Cấu hình', icon: Settings },
];

export default function WritingTestForm() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditing = !!editId;
  const queryClient = useQueryClient();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<'file' | 'url'>('file');
  const [step, setStep] = useState(1);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);

  const [form, setForm] = useState<WritingFormData>({
    title: '',
    durationInMinutes: 60,
    status: 'DRAFT',
    englishTestTypeId: '',
    task1ImageUrl: '',
    task1Description: '',
    task1WordCountMin: 150,
    task1WordCountMax: 200,
    task1SampleAnswer: '',
    task2EssayPrompt: '',
    task2WordCountMin: 250,
    task2WordCountMax: 300,
    task2SampleAnswer: '',
    rubricNotes: '',
  });

  const { data: testTypes = [] } = useQuery({
    queryKey: ['englishTestTypes'],
    queryFn: async () => {
      try { const resp = await apiClient.get('/tests/types'); return resp.data?.data || []; }
      catch { return []; }
    },
  });

  useEffect(() => {
    if (testTypes.length > 0 && !form.englishTestTypeId) {
      const ielts = testTypes.find((t: any) => t.name?.toUpperCase() === 'IELTS') || testTypes[0];
      if (ielts) setForm(prev => ({ ...prev, englishTestTypeId: ielts.id }));
    }
  }, [testTypes]);

  // Load existing test for editing
  useEffect(() => {
    if (editId) {
      setLoadingEdit(true);
      apiClient.get(`/tests/${editId}?includeAnswers=true`).then((resp) => {
        const test = resp.data?.data;
        if (test) {
          const sections = test.sections || [];
          const t1Section = sections.find((s: any) => s.questions?.some((q: any) => q.questionType === 'IELTS_WRITING_TASK1'));
          const t2Section = sections.find((s: any) => s.questions?.some((q: any) => q.questionType === 'IELTS_WRITING_TASK2'));
          const t1Q = t1Section?.questions?.[0];
          const t2Q = t2Section?.questions?.[0];

          setForm({
            title: test.title,
            durationInMinutes: test.durationInMinutes || 60,
            status: test.status,
            englishTestTypeId: test.englishTestTypeId || '',
            task1ImageUrl: t1Section?.imageUrl || t1Q?.imageUrl || '',
            task1Description: t1Q?.content?.description || t1Q?.questionText || '',
            task1WordCountMin: t1Q?.content?.wordCountMin || 150,
            task1WordCountMax: t1Q?.content?.wordCountMax || 200,
            task1SampleAnswer: t1Q?.answer?.sampleAnswer || '',
            task2EssayPrompt: t2Q?.questionText || t2Q?.content?.prompt || '',
            task2WordCountMin: t2Q?.content?.wordCountMin || 250,
            task2WordCountMax: t2Q?.content?.wordCountMax || 300,
            task2SampleAnswer: t2Q?.answer?.sampleAnswer || '',
            rubricNotes: t1Q?.content?.rubricNotes || t2Q?.content?.rubricNotes || '',
          });
        }
      }).finally(() => setLoadingEdit(false));
    }
  }, [editId]);

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const resp = await apiClient.post('/tests/upload-image', fd);
      const url = resp.data?.data?.url;
      if (url) setForm(prev => ({ ...prev, task1ImageUrl: url }));
    } catch (err) { console.error('Image upload failed:', err); }
    finally { setUploadingImage(false); }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const resp = await apiClient.post('/tests', data); return resp.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminTests'] }); navigate('/admin/exams'); },
  });
  const updateMutation = useMutation({
    mutationFn: async (data: any) => { const resp = await apiClient.put(`/tests/${editId}`, data); return resp.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminTests'] }); navigate('/admin/exams'); },
  });

  const handleSubmit = () => {
    const payload = {
      title: form.title,
      durationInMinutes: form.durationInMinutes,
      status: form.status,
      englishTestTypeId: form.englishTestTypeId || testTypes[0]?.id,
      testSkills: ['WRITING'],
      sections: [
        {
          title: 'Writing Task 1',
          skill: 'WRITING',
          imageUrl: form.task1ImageUrl || undefined,
          questions: [{
            questionText: form.task1Description,
            questionType: 'IELTS_WRITING_TASK1',
            questionOrder: 1,
            imageUrl: form.task1ImageUrl || undefined,
            content: {
              prompt: form.task1Description, taskType: 'TASK1',
              description: form.task1Description, imageUrl: form.task1ImageUrl || undefined,
              wordCountMin: form.task1WordCountMin, wordCountMax: form.task1WordCountMax,
              rubricNotes: form.rubricNotes || undefined,
            },
            answer: { sampleAnswer: form.task1SampleAnswer || undefined, gradingType: 'AI_EVALUATION' },
          }],
        },
        {
          title: 'Writing Task 2',
          skill: 'WRITING',
          questions: [{
            questionText: form.task2EssayPrompt,
            questionType: 'IELTS_WRITING_TASK2',
            questionOrder: 1,
            content: {
              prompt: form.task2EssayPrompt, taskType: 'TASK2',
              wordCountMin: form.task2WordCountMin, wordCountMax: form.task2WordCountMax,
              rubricNotes: form.rubricNotes || undefined,
            },
            answer: { sampleAnswer: form.task2SampleAnswer || undefined, gradingType: 'AI_EVALUATION' },
          }],
        },
      ],
    };
    isEditing ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const canNext = step === 1 ? !!form.title
    : step === 2 ? !!form.task1Description
    : step === 3 ? !!form.task2EssayPrompt
    : true;

  if (loadingEdit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <input type="file" ref={imageInputRef} className="hidden" accept="image/*"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />

      {/* Header */}
      <div className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/exams')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{isEditing ? 'Chỉnh sửa đề Writing' : 'Tạo đề Writing mới'}</h1>
              <p className="text-xs text-muted-foreground">{form.title || 'Chưa đặt tên'} · Full Test (Task 1 + Task 2)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={form.status === 'PUBLISHED' ? 'default' : 'outline'} className="cursor-pointer"
              onClick={() => setForm(prev => ({ ...prev, status: prev.status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT' }))}>
              {form.status === 'PUBLISHED' ? '● Đã xuất bản' : '○ Bản nháp'}
            </Badge>
            <Button onClick={handleSubmit} disabled={isSaving || !form.title} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEditing ? 'Lưu' : 'Tạo đề'}
            </Button>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s) => {
            const active = step === s.id;
            const done = step > s.id;
            return (
              <button key={s.id} onClick={() => setStep(s.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  active ? 'bg-primary text-primary-foreground shadow-md' :
                  done ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}>
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  active ? 'bg-primary-foreground/20' : done ? 'bg-primary/20' : 'bg-background'
                }`}>{done ? <Check className="h-3.5 w-3.5" /> : s.id}</div>
                {s.label}
              </button>
            );
          })}
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">Bước {step}/4</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-24">
        {/* ── STEP 1: Info ── */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold mb-1">Thông tin đề Writing</h2>
              <p className="text-muted-foreground">Đề thi gồm Task 1 + Task 2. Học viên sẽ tự chọn làm task nào khi vào thi.</p>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <Label className="text-sm font-medium">Tên đề thi <span className="text-destructive">*</span></Label>
                  <Input className="mt-1.5 text-lg h-12"
                    placeholder="VD: IELTS Writing — Cambridge 16 Test 3"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Thời gian (phút)</Label>
                    <Input type="number" className="mt-1.5" value={form.durationInMinutes}
                      onChange={(e) => setForm(prev => ({ ...prev, durationInMinutes: parseInt(e.target.value) || 0 }))} />
                    <p className="text-xs text-muted-foreground mt-1">IELTS Writing: 60 phút (20' Task 1 + 40' Task 2)</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Loại bài thi</Label>
                    <div className="mt-1.5 flex items-center h-10 px-3 rounded-md border bg-muted/50">
                      <Badge variant="secondary" className="text-sm">IELTS</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-xs">
                    <strong>Full Test:</strong> Admin tạo cả Task 1 (biểu đồ) + Task 2 (essay).
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── STEP 2: Task 1 ── */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Task 1 — Biểu đồ / Bảng / Quy trình</h2>
                <p className="text-muted-foreground text-sm">Upload hình ảnh và mô tả yêu cầu · 150+ từ · 20 phút</p>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <Label className="text-sm font-medium">Hình ảnh biểu đồ</Label>

                  {/* Already has image — show preview */}
                  {form.task1ImageUrl ? (
                    <div className="mt-2 space-y-2">
                      <div className="relative inline-block">
                        <img src={form.task1ImageUrl} alt="Task 1" className="max-h-64 rounded-lg border object-contain" />
                        <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md"
                          onClick={() => setForm(prev => ({ ...prev, task1ImageUrl: '' }))}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-md">{form.task1ImageUrl}</p>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-3">
                      {/* Tab toggle */}
                      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
                        <button
                          onClick={() => setImageInputMode('file')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            imageInputMode === 'file' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                          }`}>
                          <Upload className="h-3.5 w-3.5" /> Upload file
                        </button>
                        <button
                          onClick={() => setImageInputMode('url')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            imageInputMode === 'url' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                          }`}>
                          <Link className="h-3.5 w-3.5" /> Dán link URL
                        </button>
                      </div>

                      {imageInputMode === 'file' ? (
                        <div className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
                          hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all group"
                          onClick={() => imageInputRef.current?.click()}>
                          {uploadingImage ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                              <span className="text-sm text-muted-foreground">Đang upload...</span>
                            </div>
                          ) : (
                            <>
                              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100">
                                <ImagePlus className="h-6 w-6 text-blue-500" />
                              </div>
                              <p className="text-sm font-medium">Click để upload hình ảnh biểu đồ</p>
                              <p className="text-xs text-muted-foreground mt-1">PNG, JPG · Tối đa 10MB</p>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            placeholder="https://example.com/chart.png"
                            value={form.task1ImageUrl}
                            onChange={(e) => setForm(prev => ({ ...prev, task1ImageUrl: e.target.value }))}
                          />
                          <p className="text-xs text-muted-foreground">Dán link trực tiếp đến hình ảnh (PNG, JPG, WebP)</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium">Mô tả / Yêu cầu <span className="text-destructive">*</span></Label>
                  <Textarea className="mt-1.5 min-h-[120px] leading-relaxed"
                    placeholder="VD: The bar chart below shows the number of students enrolled in three different courses at a university between 2015 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant."
                    value={form.task1Description}
                    onChange={(e) => setForm(prev => ({ ...prev, task1Description: e.target.value }))} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Số từ tối thiểu</Label>
                    <Input type="number" className="mt-1.5" value={form.task1WordCountMin}
                      onChange={(e) => setForm(prev => ({ ...prev, task1WordCountMin: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Số từ tối đa</Label>
                    <Input type="number" className="mt-1.5" value={form.task1WordCountMax}
                      onChange={(e) => setForm(prev => ({ ...prev, task1WordCountMax: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Bài mẫu Task 1 (tùy chọn)</Label>
                  <Textarea className="mt-1.5 min-h-[80px]" placeholder="Nhập bài mẫu band 7-9..."
                    value={form.task1SampleAnswer}
                    onChange={(e) => setForm(prev => ({ ...prev, task1SampleAnswer: e.target.value }))} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── STEP 3: Task 2 ── */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900">
                <PenTool className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Task 2 — Essay</h2>
                <p className="text-muted-foreground text-sm">Đề essay về chủ đề xã hội · 250+ từ · 40 phút</p>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <Label className="text-sm font-medium">Đề bài Essay <span className="text-destructive">*</span></Label>
                  <Textarea className="mt-1.5 min-h-[180px] leading-relaxed font-serif"
                    placeholder="VD: Some people believe that universities should focus on providing academic skills, while others think they should prepare students for employment. Discuss both views and give your own opinion."
                    value={form.task2EssayPrompt}
                    onChange={(e) => setForm(prev => ({ ...prev, task2EssayPrompt: e.target.value }))} />
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-xs">
                    Đề Task 2 nên là câu hỏi mở, yêu cầu thí sinh thảo luận, phân tích, hoặc đưa ra ý kiến cá nhân.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Số từ tối thiểu</Label>
                    <Input type="number" className="mt-1.5" value={form.task2WordCountMin}
                      onChange={(e) => setForm(prev => ({ ...prev, task2WordCountMin: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Số từ tối đa</Label>
                    <Input type="number" className="mt-1.5" value={form.task2WordCountMax}
                      onChange={(e) => setForm(prev => ({ ...prev, task2WordCountMax: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Bài mẫu Task 2 (tùy chọn)</Label>
                  <Textarea className="mt-1.5 min-h-[80px]" placeholder="Nhập bài mẫu band 7-9..."
                    value={form.task2SampleAnswer}
                    onChange={(e) => setForm(prev => ({ ...prev, task2SampleAnswer: e.target.value }))} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── STEP 4: Config ── */}
        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold mb-1">Cấu hình & Xác nhận</h2>
              <p className="text-muted-foreground">Kiểm tra lại và thêm ghi chú rubric cho AI chấm</p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Summary */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Tóm tắt đề thi</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Task 1</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {form.task1Description || 'Chưa nhập mô tả'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {form.task1WordCountMin}–{form.task1WordCountMax} từ {form.task1ImageUrl && <span className="inline-flex items-center gap-0.5">· <Camera size={16} className="inline" /> Có ảnh</span>}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border bg-orange-50/50 dark:bg-orange-950/20">
                      <div className="flex items-center gap-2 mb-1">
                        <PenTool className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Task 2</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {form.task2EssayPrompt || 'Chưa nhập đề'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {form.task2WordCountMin}–{form.task2WordCountMax} từ
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <Timer size={16} className="inline mr-1" /> Tổng thời gian: {form.durationInMinutes} phút · <FileText size={16} className="inline mr-1" /> Học viên tự chọn làm Task 1, Task 2, hoặc Full Test
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Ghi chú rubric cho AI</Label>
                  <p className="text-xs text-muted-foreground mb-1.5">Hướng dẫn chấm bổ sung (tùy chọn — áp dụng cho cả 2 task)</p>
                  <Textarea className="min-h-[100px]"
                    placeholder="VD: Chú ý đánh giá Task Response — cần address cả hai views. Coherence & Cohesion cần có clear progression..."
                    value={form.rubricNotes}
                    onChange={(e) => setForm(prev => ({ ...prev, rubricNotes: e.target.value }))} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
            </Button>
          ) : <div />}
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              Tiếp theo <Check className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSaving || !form.title} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEditing ? 'Lưu thay đổi' : 'Tạo đề Writing'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
