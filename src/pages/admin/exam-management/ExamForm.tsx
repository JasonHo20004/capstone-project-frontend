import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ExamPreviewModal from '@/components/ExamPreviewModal';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  Trash2,
  Upload,
  Music,
  Loader2,
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  BookOpen,
  Headphones,
  FileText,
  Save,
  ChevronDown,
  ChevronRight,
  GripVertical,
  ImagePlus,
  Image as ImageIcon,
  Link2 as LinkIcon,
} from 'lucide-react';
import apiClient from '@/lib/api/config';
import { ragService } from '@/lib/api/services/rag.service';
import type { GeneratedQuestion } from '@/lib/api/services/rag.service';

type SkillType = 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING';
type QuestionType = 'MULTIPLE_CHOICE' | 'MULTIPLE_CHOICE_MULTI_ANSWER' | 'GAP_FILL' | 'SHORT_ANSWER' | 'TRUE_FALSE_NOT_GIVEN' | 'YES_NO_NOT_GIVEN' | 'MATCHING';

interface QuestionData {
  questionText: string;
  questionType: QuestionType;
  options: string[];
  content: Record<string, any>;
  answer: Record<string, any>;
  explanation: string;
  questionOrder: number;
  imageUrl: string;
}

interface SectionData {
  title: string;
  skill?: SkillType;
  passageContent: string;
  mediaUrl: string;
  imageUrl: string;
  questions: QuestionData[];
  collapsed: boolean;
}

interface TestFormData {
  title: string;
  durationInMinutes: number;
  status: string;
  englishTestTypeId: string;
  testSkills: SkillType[];
  sections: SectionData[];
}

const STEPS = [
  { id: 1, label: 'Thông tin', icon: FileText },
  { id: 2, label: 'Nội dung', icon: BookOpen },
  { id: 3, label: 'Câu hỏi', icon: Check },
];

const QUESTION_TYPES: { label: string; value: QuestionType; desc: string }[] = [
  { label: 'Trắc nghiệm (MCQ)', value: 'MULTIPLE_CHOICE', desc: 'Chọn 1 đáp án đúng' },
  { label: 'Trắc nghiệm nhiều đáp án', value: 'MULTIPLE_CHOICE_MULTI_ANSWER', desc: 'Chọn nhiều đáp án đúng' },
  { label: 'Điền vào chỗ trống (Gap Fill)', value: 'GAP_FILL', desc: 'Summary Completion / Sentence Completion' },
  { label: 'Trả lời ngắn', value: 'SHORT_ANSWER', desc: 'Trả lời ngắn gọn' },
  { label: 'True / False / Not Given', value: 'TRUE_FALSE_NOT_GIVEN', desc: 'Đúng / Sai / Không có thông tin' },
  { label: 'Yes / No / Not Given', value: 'YES_NO_NOT_GIVEN', desc: 'Có / Không / Không có thông tin' },
  { label: 'Nối (Matching)', value: 'MATCHING', desc: 'Matching Headings / Information' },
];

/** Parse {{N}} placeholders from summary text */
const parseGapPlaceholders = (text: string): number[] => {
  const matches = text.match(/\{\{(\d+)\}\}/g) || [];
  return matches.map(m => parseInt(m.replace(/[{}]/g, '')));
};

const emptyQuestion = (order: number): QuestionData => ({
  questionText: '',
  questionType: 'MULTIPLE_CHOICE',
  options: ['', '', '', ''],
  content: {},
  answer: { correctIndex: 0 },
  explanation: '',
  questionOrder: order,
  imageUrl: '',
});

const emptySection = (idx: number): SectionData => ({
  title: `Section ${idx + 1}`,
  passageContent: '',
  mediaUrl: '',
  imageUrl: '',
  questions: [emptyQuestion(1)],
  collapsed: false,
});

export default function ExamFormPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditing = !!editId;

  const [step, setStep] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillType | ''>('');
  const [uploading, setUploading] = useState(false);
  const [uploadingSectionIdx, setUploadingSectionIdx] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadTarget, setImageUploadTarget] = useState<{ type: 'section' | 'question'; sIdx: number; qIdx?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);

  // ── AI Question Generation State ─────────────────────────────────────────
  const [aiGenerating, setAiGenerating] = useState<number | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNumQuestions, setAiNumQuestions] = useState(10);
  const [aiDifficulty, setAiDifficulty] = useState('intermediate');
  const [aiTypes, setAiTypes] = useState(['MULTIPLE_CHOICE', 'TRUE_FALSE_NOT_GIVEN', 'GAP_FILL']);
  const [showAiConfig, setShowAiConfig] = useState<number | null>(null);
  const [form, setForm] = useState<TestFormData>({
    title: '',
    durationInMinutes: 60,
    status: 'DRAFT',
    englishTestTypeId: '',
    testSkills: [],
    sections: [emptySection(0)],
  });

  // Fetch test types from dedicated endpoint
  const { data: testTypes = [] } = useQuery({
    queryKey: ['englishTestTypes'],
    queryFn: async () => {
      try {
        const resp = await apiClient.get('/tests/types');
        return resp.data?.data || [];
      } catch { return []; }
    },
  });

  // Auto-select IELTS type when loaded
  useEffect(() => {
    if (testTypes.length > 0 && !form.englishTestTypeId) {
      const ielts = testTypes.find((t: any) => t.name?.toUpperCase() === 'IELTS') || testTypes[0];
      if (ielts) setForm(prev => ({ ...prev, englishTestTypeId: ielts.id }));
    }
  }, [testTypes]);

  // If editing, load existing test
  useEffect(() => {
    if (editId) {
      setLoadingEdit(true);
      apiClient.get(`/tests/${editId}?includeAnswers=true`).then((resp) => {
        const test = resp.data?.data;
        if (test) {
          console.log('[ExamForm] Loaded test data:', JSON.stringify(test.sections?.[0]?.questions?.slice(0, 3), null, 2));
          setForm({
            title: test.title,
            durationInMinutes: test.durationInMinutes || 60,
            status: test.status,
            englishTestTypeId: test.englishTestTypeId || '',
            testSkills: test.testSkills?.map((s: any) => s.skill) || [],
            sections: test.sections?.map((s: any, i: number) => ({
              title: s.title,
              passageContent: s.passages?.[0]?.content || '',
              mediaUrl: s.mediaUrl || '',
              imageUrl: s.imageUrl || '',
              questions: s.questions?.map((q: any) => ({
                questionText: q.questionText || '',
                questionType: q.questionType,
                options: q.options || ['', '', '', ''],
                content: q.content || {},
                answer: q.answer || {},
                explanation: q.explanation || '',
                questionOrder: q.questionOrder || i + 1,
                imageUrl: q.imageUrl || '',
              })) || [emptyQuestion(1)],
              collapsed: false,
            })) || [emptySection(0)],
          });
          // Detect skill: testSkills → section.skill → mediaUrl fallback
          const detectedSkill =
            test.testSkills?.[0]?.skill
            || test.sections?.find((s: any) => s.skill)?.skill
            || (test.sections?.some((s: any) => s.mediaUrl) ? 'LISTENING' : 'READING');
          setSelectedSkill(detectedSkill);
        }
      }).finally(() => setLoadingEdit(false));
    }
  }, [editId]);

  const isListening = selectedSkill === 'LISTENING';
  const totalQuestions = form.sections.reduce((sum, s) => sum + s.questions.length, 0);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const resp = await apiClient.post('/tests', data); return resp.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminTests'] }); navigate('/admin/exams'); },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => { const resp = await apiClient.put(`/tests/${editId}`, data); return resp.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminTests'] }); navigate('/admin/exams'); },
  });

  // Section handlers
  const updateSection = (idx: number, key: keyof SectionData, value: any) => {
    setForm((prev) => {
      const sections = [...prev.sections];
      sections[idx] = { ...sections[idx], [key]: value };
      return { ...prev, sections };
    });
  };

  const addSection = () => setForm((prev) => ({ ...prev, sections: [...prev.sections, emptySection(prev.sections.length)] }));

  const removeSection = (idx: number) => {
    if (form.sections.length <= 1) return;
    setForm((prev) => ({ ...prev, sections: prev.sections.filter((_, i) => i !== idx) }));
  };

  const toggleCollapse = (idx: number) => updateSection(idx, 'collapsed', !form.sections[idx].collapsed);

  // Question handlers
  const addQuestion = (sIdx: number) => {
    setForm((prev) => {
      const sections = [...prev.sections];
      const qs = [...sections[sIdx].questions];
      qs.push(emptyQuestion(qs.length + 1));
      sections[sIdx] = { ...sections[sIdx], questions: qs };
      return { ...prev, sections };
    });
  };

  const removeQuestion = (sIdx: number, qIdx: number) => {
    setForm((prev) => {
      const sections = [...prev.sections];
      sections[sIdx] = {
        ...sections[sIdx],
        questions: sections[sIdx].questions.filter((_, i) => i !== qIdx).map((q, i) => ({ ...q, questionOrder: i + 1 })),
      };
      return { ...prev, sections };
    });
  };

  const updateQuestion = (sIdx: number, qIdx: number, key: keyof QuestionData, value: any) => {
    setForm((prev) => {
      const sections = [...prev.sections];
      const qs = [...sections[sIdx].questions];
      qs[qIdx] = { ...qs[qIdx], [key]: value };
      sections[sIdx] = { ...sections[sIdx], questions: qs };
      return { ...prev, sections };
    });
  };

  const updateOption = (sIdx: number, qIdx: number, optIdx: number, value: string) => {
    setForm((prev) => {
      const sections = [...prev.sections];
      const qs = [...sections[sIdx].questions];
      const opts = [...qs[qIdx].options];
      opts[optIdx] = value;
      qs[qIdx] = { ...qs[qIdx], options: opts };
      sections[sIdx] = { ...sections[sIdx], questions: qs };
      return { ...prev, sections };
    });
  };

  const handleAudioUpload = async (file: File, sectionIdx: number) => {
    setUploading(true);
    setUploadingSectionIdx(sectionIdx);
    try {
      const fd = new FormData();
      fd.append('audio', file);
      const resp = await apiClient.post('/tests/upload-audio', fd);
      const url = resp.data?.data?.url;
      if (url) updateSection(sectionIdx, 'mediaUrl', url);
    } catch (err) { console.error('Upload failed:', err); }
    finally { setUploading(false); setUploadingSectionIdx(null); }
  };

  // ── AI Question Generation Handler ──────────────────────────────────────
  const handleAiGenerate = async (sIdx: number) => {
    const passage = form.sections[sIdx]?.passageContent;
    if (!passage || passage.length < 50) {
      setAiError('Passage quá ngắn. Vui lòng nhập đoạn văn ở Step 2 trước (tối thiểu 50 ký tự).');
      return;
    }
    setAiGenerating(sIdx);
    setAiError(null);
    try {
      const resp = await ragService.generateReadingQuestions({
        passage,
        question_types: aiTypes,
        num_questions: aiNumQuestions,
        difficulty: aiDifficulty,
      });
      if (resp.success && resp.questions.length > 0) {
        const existingCount = form.sections[sIdx].questions.length;
        const newQuestions: QuestionData[] = resp.questions.map((q, i) => ({
          questionText: q.questionText,
          questionType: (q.questionType as QuestionType) || 'MULTIPLE_CHOICE',
          options: q.options || [],
          content: q.content || {},
          answer: q.answer || {},
          explanation: q.explanation || '',
          questionOrder: existingCount + i + 1,
          imageUrl: '',
        }));
        setForm(prev => {
          const sections = [...prev.sections];
          sections[sIdx] = {
            ...sections[sIdx],
            questions: [...sections[sIdx].questions, ...newQuestions],
          };
          return { ...prev, sections };
        });
        setShowAiConfig(null);
      } else {
        setAiError('AI không tạo được câu hỏi. Vui lòng thử lại.');
      }
    } catch (err: any) {
      console.error('AI Generate error:', err);
      setAiError(err?.response?.data?.detail || err?.message || 'Lỗi kết nối tới AI service. Kiểm tra Colab tunnel.');
    } finally {
      setAiGenerating(null);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!imageUploadTarget) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const resp = await apiClient.post('/tests/upload-image', fd);
      const url = resp.data?.data?.url;
      if (url) {
        if (imageUploadTarget.type === 'section') {
          updateSection(imageUploadTarget.sIdx, 'imageUrl', url);
        } else if (imageUploadTarget.type === 'question' && imageUploadTarget.qIdx !== undefined) {
          updateQuestion(imageUploadTarget.sIdx, imageUploadTarget.qIdx, 'imageUrl', url);
        }
      }
    } catch (err) { console.error('Image upload failed:', err); }
    finally { setUploadingImage(false); setImageUploadTarget(null); }
  };

  const triggerImageUpload = (type: 'section' | 'question', sIdx: number, qIdx?: number) => {
    setImageUploadTarget({ type, sIdx, qIdx });
    setTimeout(() => imageInputRef.current?.click(), 0);
  };

  const handleSubmit = () => {
    const payload: any = {
      title: form.title,
      durationInMinutes: form.durationInMinutes,
      status: form.status,
      testSkills: form.testSkills,
      englishTestTypeId: form.englishTestTypeId || testTypes[0]?.id,
      sections: form.sections.map((section, idx) => ({
        title: section.title || `Section ${idx + 1}`,
        skill: selectedSkill || undefined,
        mediaUrl: section.mediaUrl || undefined,
        imageUrl: section.imageUrl || undefined,
        passageContent: section.passageContent || undefined,
        questions: section.questions.map((q) => {
          const item: any = {
            questionText: q.questionText, questionType: q.questionType,
            options: q.options.filter(Boolean), explanation: q.explanation || undefined,
            questionOrder: q.questionOrder,
            imageUrl: q.imageUrl || undefined,
          };
          if (q.questionType === 'MULTIPLE_CHOICE') {
            item.content = { options: q.options.filter(Boolean), text: q.questionText };
            item.answer = { correctIndex: (q.answer as any)?.correctIndex ?? 0 };
          } else if (q.questionType === 'MULTIPLE_CHOICE_MULTI_ANSWER') {
            item.content = { options: q.options.filter(Boolean), text: q.questionText };
            item.answer = { correctIndices: (q.answer as any)?.correctIndices || [] };
          } else if (q.questionType === 'GAP_FILL') {
            // Summary Completion: content has summaryText + instruction
            // answer is multi-gap format: { "1": ["ans1"], "2": ["ans2"] }
            const summaryText = (q.content as any)?.summaryText || '';
            const instruction = (q.content as any)?.instruction || '';
            const gapAnswers = (q.answer as any)?.gaps || {};
            if (summaryText && Object.keys(gapAnswers).length > 0) {
              // Multi-gap Summary Completion
              item.content = { text: q.questionText, summaryText, instruction };
              item.answer = gapAnswers; // { "9": ["Ridgeway"], "10": ["manuscript"] }
            } else {
              // Single gap (legacy / simple fill-in)
              item.content = { text: q.questionText };
              item.answer = { text: [(q.answer as any)?.text?.[0] || ''] };
            }
          } else if (q.questionType === 'SHORT_ANSWER') {
            item.content = { text: q.questionText };
            item.answer = { text: [(q.answer as any)?.text?.[0] || ''] };
          } else if (q.questionType === 'TRUE_FALSE_NOT_GIVEN') {
            item.content = { text: q.questionText };
            item.answer = { correctAnswer: (q.answer as any)?.correctAnswer || 'TRUE' };
          } else if (q.questionType === 'YES_NO_NOT_GIVEN') {
            item.content = { text: q.questionText };
            item.answer = { correctAnswer: (q.answer as any)?.correctAnswer || 'YES' };
          } else if (q.questionType === 'MATCHING') {
            // Matching: options are the headings/items to match from
            // answer is the correct option letter/text per question
            item.content = { text: q.questionText, options: q.options.filter(Boolean), instruction: (q.content as any)?.instruction || '' };
            item.answer = { correctOption: (q.answer as any)?.correctOption || (q.answer as any)?.text?.[0] || '' };
          }
          return item;
        }),
      })),
    };
    console.log('[ExamForm] Submit payload:', JSON.stringify(payload, null, 2));
    isEditing ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const canNext = step === 1 ? form.title && selectedSkill : step === 2 ? form.sections.every(s => s.title) : true;

  // ─── RENDER ────────────────────────────────────────────────
  if (loadingEdit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">Đang tải dữ liệu bài test...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <div className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/exams')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                {isEditing ? 'Chỉnh sửa bài thi' : 'Tạo bài thi mới'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {form.title || 'Chưa đặt tên'} · {totalQuestions} câu hỏi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={form.status === 'PUBLISHED' ? 'default' : 'outline'} className="cursor-pointer"
              onClick={() => setForm(prev => ({ ...prev, status: prev.status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT' }))}>
              {form.status === 'PUBLISHED' ? '● Đã xuất bản' : '○ Bản nháp'}
            </Badge>
            <Button variant="outline" onClick={() => setPreviewOpen(true)} className="gap-2" disabled={form.sections.every(s => s.questions.length === 0)}>
              <BookOpen className="h-4 w-4" />
              Preview
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving || !form.title} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEditing ? 'Lưu' : 'Tạo bài thi'}
            </Button>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="max-w-5xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, idx) => {
            const active = step === s.id;
            const done = step > s.id;
            return (
              <button key={s.id}
                onClick={() => setStep(s.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  active ? 'bg-primary text-primary-foreground shadow-md' :
                  done ? 'bg-primary/10 text-primary' :
                  'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  active ? 'bg-primary-foreground/20' : done ? 'bg-primary/20' : 'bg-background'
                }`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : s.id}
                </div>
                {s.label}
              </button>
            );
          })}
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">Bước {step}/3</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
        {/* ── STEP 1: Basic Info ── */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold mb-1">Thông tin bài thi</h2>
              <p className="text-muted-foreground">Cấu hình tổng thể cho bài thi</p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <Label className="text-sm font-medium">Tên bài thi <span className="text-destructive">*</span></Label>
                  <Input
                    className="mt-1.5 text-lg h-12"
                    placeholder="VD: Cambridge IELTS 16 - Test 4"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                {/* Skill Picker Cards */}
                <div>
                  <Label className="text-sm font-medium">Kỹ năng <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {([
                      { skill: 'READING' as SkillType, icon: BookOpen, label: 'Reading', color: 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
                      { skill: 'LISTENING' as SkillType, icon: Headphones, label: 'Listening', color: 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
                    ]).map(({ skill, icon: Icon, label, color }) => (
                      <button key={skill}
                        disabled={!!editId}
                        onClick={() => { if (!editId) { setSelectedSkill(skill); setForm(prev => ({ ...prev, testSkills: [skill] })); } }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          selectedSkill === skill
                            ? `${color} border-current shadow-sm`
                            : 'border-border hover:border-muted-foreground/30'
                        } ${editId ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{label}</span>
                        {editId && selectedSkill === skill && (
                          <span className="text-[10px] text-muted-foreground">Không thể thay đổi</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Thời gian (phút)</Label>
                    <Input type="number" className="mt-1.5" value={form.durationInMinutes}
                      onChange={(e) => setForm(prev => ({ ...prev, durationInMinutes: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Loại bài thi</Label>
                    <div className="mt-1.5 flex items-center h-10 px-3 rounded-md border bg-muted/50">
                      <Badge variant="secondary" className="text-sm">IELTS</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── STEP 2: Sections & Content ── */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {isListening ? 'Sections & Audio' : 'Sections & Passages'}
                </h2>
                <p className="text-muted-foreground">
                  {isListening ? 'Upload audio cho từng section' : 'Thêm nội dung bài đọc cho từng section'}
                </p>
              </div>
              <Button onClick={addSection} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> Thêm Section
              </Button>
            </div>

            {form.sections.map((section, sIdx) => (
              <Card key={sIdx} className={`transition-all ${section.collapsed ? '' : 'ring-1 ring-border'}`}>
                <div className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-muted/50 rounded-t-lg"
                  onClick={() => toggleCollapse(sIdx)}>
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    {section.collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <div>
                      <span className="font-semibold text-sm">{section.title || `Section ${sIdx + 1}`}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {section.questions.length} câu hỏi
                        {section.mediaUrl && ' · 🎵 Audio'}
                        {section.imageUrl && ' · 🖼️ Ảnh'}
                      </span>
                    </div>
                  </div>
                  {form.sections.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); removeSection(sIdx); }}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>

                {!section.collapsed && (
                  <CardContent className="pt-0 pb-5 space-y-4">
                    <div className="border-t pt-4" />
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tiêu đề</Label>
                      <Input className="mt-1" placeholder="VD: Reading Passage 1"
                        value={section.title} onChange={(e) => updateSection(sIdx, 'title', e.target.value)} />
                    </div>

                    {isListening ? (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Audio file</Label>
                        {section.mediaUrl ? (
                          <div className="mt-1 space-y-2">
                            <div className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 p-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Music className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{section.mediaUrl.split('/').pop()}</p>
                                <p className="text-xs text-muted-foreground">Audio đã được thiết lập</p>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                                onClick={() => updateSection(sIdx, 'mediaUrl', '')}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <audio controls className="w-full h-9" src={section.mediaUrl} preload="metadata">
                              Your browser does not support audio.
                            </audio>
                          </div>
                        ) : (
                          <div className="mt-1">
                            {/* Tab switcher */}
                            <div className="flex gap-1 p-1 bg-muted rounded-lg mb-3">
                              <button
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, _audioTab: (prev as any)._audioTab === 'url' ? 'upload' : 'upload' }))}
                                className={`flex-1 text-xs font-medium py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                                  (form as any)._audioTab !== 'url'
                                    ? 'bg-background shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                <Upload className="h-3.5 w-3.5" /> Upload file
                              </button>
                              <button
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, _audioTab: 'url' }))}
                                className={`flex-1 text-xs font-medium py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                                  (form as any)._audioTab === 'url'
                                    ? 'bg-background shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                <LinkIcon className="h-3.5 w-3.5" /> Dán URL
                              </button>
                            </div>

                            {(form as any)._audioTab === 'url' ? (
                              /* URL Input */
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    id={`audio-url-${sIdx}`}
                                    placeholder="https://example.com/audio.mp3"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const val = (e.target as HTMLInputElement).value.trim();
                                        if (val) updateSection(sIdx, 'mediaUrl', val);
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="shrink-0 gap-1.5"
                                    onClick={() => {
                                      const input = document.getElementById(`audio-url-${sIdx}`) as HTMLInputElement;
                                      const val = input?.value?.trim();
                                      if (val) updateSection(sIdx, 'mediaUrl', val);
                                    }}
                                  >
                                    <Check className="h-3.5 w-3.5" /> Xác nhận
                                  </Button>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                  Dán URL audio (MP3, WAV) rồi nhấn Xác nhận hoặc Enter
                                </p>
                              </div>
                            ) : (
                              /* File Upload */
                              <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                                hover:border-primary/40 hover:bg-primary/5 transition-all group"
                                onClick={() => { setUploadingSectionIdx(sIdx); fileInputRef.current?.click(); }}
                              >
                                {uploading && uploadingSectionIdx === sIdx ? (
                                  <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <span className="text-sm text-muted-foreground">Đang upload lên AWS...</span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 transition-colors">
                                      <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <p className="text-sm font-medium">Kéo thả hoặc click để upload</p>
                                    <p className="text-xs text-muted-foreground mt-1">MP3, WAV · Tối đa 50MB</p>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Transcript / script */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Transcript (script audio)
                            </Label>
                            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              Tuỳ chọn — dùng cho AI Tutor giải thích
                            </span>
                          </div>
                          <Textarea
                            className="mt-1 min-h-[140px] font-serif leading-relaxed text-sm"
                            placeholder="Dán nội dung transcript / script audio vào đây để AI Tutor có thể cite cụ thể câu trong audio khi giải thích cho học sinh..."
                            value={section.passageContent}
                            onChange={(e) => updateSection(sIdx, 'passageContent', e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nội dung passage</Label>
                        <Textarea className="mt-1 min-h-[160px] font-serif leading-relaxed"
                          placeholder="Dán nội dung bài đọc vào đây..."
                          value={section.passageContent}
                          onChange={(e) => updateSection(sIdx, 'passageContent', e.target.value)} />
                      </div>
                    )}

                    {/* Section Image Upload */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hình ảnh (Maps, Diagrams)</Label>
                      {section.imageUrl ? (
                        <div className="mt-2 relative inline-block">
                          <img src={section.imageUrl} alt="Section" className="max-h-48 rounded-lg border object-contain" />
                          <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md"
                            onClick={() => updateSection(sIdx, 'imageUrl', '')}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="mt-1 gap-2"
                          disabled={uploadingImage && imageUploadTarget?.sIdx === sIdx && imageUploadTarget?.type === 'section'}
                          onClick={() => triggerImageUpload('section', sIdx)}>
                          {uploadingImage && imageUploadTarget?.sIdx === sIdx && imageUploadTarget?.type === 'section'
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang upload...</>
                            : <><ImagePlus className="h-4 w-4" /> Thêm ảnh</>}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* ── STEP 3: Questions ── */}
        {step === 3 && (() => {
          // Calculate continuous question offset for each section
          const sectionOffsets: number[] = [];
          let offset = 0;
          form.sections.forEach((s) => { sectionOffsets.push(offset); offset += s.questions.length; });

          const SECTION_COLORS = [
            { border: 'border-l-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', sidebar: 'bg-blue-50 dark:bg-blue-950/50' },
            { border: 'border-l-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300', sidebar: 'bg-emerald-50 dark:bg-emerald-950/50' },
            { border: 'border-l-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', sidebar: 'bg-amber-50 dark:bg-amber-950/50' },
            { border: 'border-l-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300', sidebar: 'bg-rose-50 dark:bg-rose-950/50' },
          ];

          return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold mb-1">Câu hỏi</h2>
              <p className="text-muted-foreground">Tổng cộng {totalQuestions} câu hỏi cho {form.sections.length} section</p>
            </div>

            {form.sections.map((section, sIdx) => {
              const colors = SECTION_COLORS[sIdx % SECTION_COLORS.length];
              const qStart = sectionOffsets[sIdx] + 1;
              const qEnd = qStart + section.questions.length - 1;

              return (
              <div key={sIdx} className={`rounded-xl border-l-4 ${colors.border} bg-card shadow-sm overflow-hidden`}>
                {/* Section Header */}
                <div className={`${colors.bg} px-5 py-4 flex items-center justify-between border-b`}>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${colors.badge}`}>
                      {sIdx + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-base">{section.title || `Section ${sIdx + 1}`}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Câu {qStart}–{qEnd} · {section.questions.length} câu hỏi
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowAiConfig(showAiConfig === sIdx ? null : sIdx)}
                      disabled={aiGenerating !== null}
                      className="gap-1.5 h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300">
                      {aiGenerating === sIdx ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> AI đang tạo...</>
                      ) : (
                        <><span className="text-base">🤖</span> AI Tạo câu hỏi</>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addQuestion(sIdx)} className="gap-1.5 h-8">
                      <Plus className="h-3.5 w-3.5" /> Thêm câu
                    </Button>
                  </div>
                </div>

                {/* AI Config Panel */}
                {showAiConfig === sIdx && (
                  <div className="px-5 py-4 border-b bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">🤖</span>
                      <h4 className="font-semibold text-sm text-indigo-800 dark:text-indigo-300">AI Tự động tạo câu hỏi từ Passage</h4>
                    </div>
                    {!form.sections[sIdx]?.passageContent && (
                      <div className="mb-3 px-3 py-2 bg-amber-100 border border-amber-200 rounded-lg text-xs text-amber-800">
                        ⚠️ Vui lòng nhập nội dung passage ở Step 2 trước khi dùng AI.
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Số câu hỏi</Label>
                        <Input type="number" min={1} max={40} value={aiNumQuestions}
                          onChange={(e) => setAiNumQuestions(Number(e.target.value))}
                          className="mt-1 h-8" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Độ khó</Label>
                        <Select value={aiDifficulty} onValueChange={setAiDifficulty}>
                          <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Dễ (Band 4-5)</SelectItem>
                            <SelectItem value="intermediate">Trung bình (Band 5-6.5)</SelectItem>
                            <SelectItem value="hard">Khó (Band 7+)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Loại câu</Label>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {['MULTIPLE_CHOICE', 'TRUE_FALSE_NOT_GIVEN', 'GAP_FILL', 'MATCHING', 'SHORT_ANSWER'].map(t => (
                            <button key={t}
                              onClick={() => setAiTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                aiTypes.includes(t)
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white border text-muted-foreground hover:border-indigo-300'
                              }`}>
                              {t.replace(/_/g, ' ').slice(0, 12)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {aiError && (
                      <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                        ❌ {aiError}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                        disabled={aiGenerating !== null || !form.sections[sIdx]?.passageContent}
                        onClick={() => handleAiGenerate(sIdx)}>
                        {aiGenerating === sIdx
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tạo... (có thể mất 30-60s)</>
                          : <><span className="text-sm">✨</span> Tạo {aiNumQuestions} câu hỏi</>
                        }
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowAiConfig(null)}>Hủy</Button>
                    </div>
                  </div>
                )}

                {/* Questions inside section */}
                <div className="p-4 space-y-3">
                  {section.questions.map((q, qIdx) => {
                    const globalQ = sectionOffsets[sIdx] + qIdx + 1;
                    return (
                    <Card key={qIdx} className="overflow-hidden">
                      <div className="flex items-stretch">
                        {/* Question number sidebar */}
                        <div className={`w-14 ${colors.sidebar} flex flex-col items-center justify-start pt-4 shrink-0 border-r`}>
                          <span className="text-sm font-bold text-foreground">Q{globalQ}</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">#{qIdx + 1}</span>
                        </div>

                        <CardContent className="flex-1 py-4 pr-4 pl-4 space-y-3">
                          {/* Question text */}
                          <Input placeholder="Nội dung câu hỏi..."
                            value={q.questionText}
                            onChange={(e) => updateQuestion(sIdx, qIdx, 'questionText', e.target.value)} />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Question type */}
                            <div>
                              <Label className="text-xs text-muted-foreground">Loại câu hỏi</Label>
                              <Select value={q.questionType}
                                onValueChange={(v) => {
                                  updateQuestion(sIdx, qIdx, 'questionType', v);
                                  if (v === 'TRUE_FALSE_NOT_GIVEN') updateQuestion(sIdx, qIdx, 'answer', { correctAnswer: 'TRUE' });
                                  if (v === 'YES_NO_NOT_GIVEN') updateQuestion(sIdx, qIdx, 'answer', { correctAnswer: 'YES' });
                                  if (v === 'GAP_FILL' || v === 'MATCHING' || v === 'SHORT_ANSWER') updateQuestion(sIdx, qIdx, 'answer', { text: [''] });
                                  if (v === 'MULTIPLE_CHOICE') updateQuestion(sIdx, qIdx, 'answer', { correctIndex: 0 });
                                  if (v === 'MULTIPLE_CHOICE_MULTI_ANSWER') updateQuestion(sIdx, qIdx, 'answer', { correctIndices: [] });
                                }}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {QUESTION_TYPES.map((qt) => (
                                    <SelectItem key={qt.value} value={qt.value}>
                                      <div>
                                        <div className="font-medium">{qt.label}</div>
                                        <div className="text-xs text-muted-foreground">{qt.desc}</div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Answer based on type */}
                            <div>
                              <Label className="text-xs text-muted-foreground">Đáp án đúng</Label>
                              {q.questionType === 'TRUE_FALSE_NOT_GIVEN' && (
                                <Select value={(q.answer as any)?.correctAnswer || 'TRUE'}
                                  onValueChange={(v) => updateQuestion(sIdx, qIdx, 'answer', { correctAnswer: v })}>
                                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="TRUE">TRUE</SelectItem>
                                    <SelectItem value="FALSE">FALSE</SelectItem>
                                    <SelectItem value="NOT GIVEN">NOT GIVEN</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                              {q.questionType === 'YES_NO_NOT_GIVEN' && (
                                <Select value={(q.answer as any)?.correctAnswer || 'YES'}
                                  onValueChange={(v) => updateQuestion(sIdx, qIdx, 'answer', { correctAnswer: v })}>
                                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="YES">YES</SelectItem>
                                    <SelectItem value="NO">NO</SelectItem>
                                    <SelectItem value="NOT GIVEN">NOT GIVEN</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                              {q.questionType === 'SHORT_ANSWER' && (
                                <Input className="mt-1" placeholder="Nhập đáp án đúng"
                                  value={(q.answer as any)?.text?.[0] || ''}
                                  onChange={(e) => updateQuestion(sIdx, qIdx, 'answer', { text: [e.target.value] })} />
                              )}
                              {q.questionType === 'MATCHING' && (
                                <Input className="mt-1" placeholder="Đáp án (VD: A, B, C)"
                                  value={(q.answer as any)?.correctOption || (q.answer as any)?.text?.[0] || ''}
                                  onChange={(e) => updateQuestion(sIdx, qIdx, 'answer', { correctOption: e.target.value })} />
                              )}
                              {q.questionType === 'GAP_FILL' && (
                                <p className="mt-1 text-xs text-muted-foreground italic">Thiết lập đáp án trong Summary Builder bên dưới ↓</p>
                              )}
                              {(q.questionType === 'MULTIPLE_CHOICE' || q.questionType === 'MULTIPLE_CHOICE_MULTI_ANSWER') && (
                                <p className="mt-2 text-xs text-muted-foreground italic">Chọn đáp án đúng bên dưới ↓</p>
                              )}
                            </div>
                          </div>

                          {/* MCQ Options */}
                          {(q.questionType === 'MULTIPLE_CHOICE' || q.questionType === 'MULTIPLE_CHOICE_MULTI_ANSWER') && (
                            <div className="space-y-2 pt-1">
                              <Label className="text-xs text-muted-foreground">Lựa chọn</Label>
                              {q.options.map((opt, optIdx) => {
                                const isMultiple = q.questionType === 'MULTIPLE_CHOICE_MULTI_ANSWER';
                                const isChecked = isMultiple
                                  ? ((q.answer as any)?.correctIndices || []).includes(optIdx)
                                  : (q.answer as any)?.correctIndex === optIdx;

                                return (
                                  <label key={optIdx} className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all border ${
                                    isChecked
                                      ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700'
                                      : 'bg-background border-transparent hover:bg-muted/50'
                                  }`}>
                                    <input type={isMultiple ? "checkbox" : "radio"} name={`q-${sIdx}-${qIdx}${isMultiple ? `-${optIdx}` : ''}`}
                                      checked={isChecked}
                                      onChange={() => {
                                        if (isMultiple) {
                                          const prev = (q.answer as any)?.correctIndices || [];
                                          const next = prev.includes(optIdx) ? prev.filter((i: number) => i !== optIdx) : [...prev, optIdx];
                                          updateQuestion(sIdx, qIdx, 'answer', { correctIndices: next });
                                        } else {
                                          updateQuestion(sIdx, qIdx, 'answer', { correctIndex: optIdx });
                                        }
                                      }}
                                      className="accent-emerald-600 rounded" />
                                    <span className="text-xs font-bold text-muted-foreground w-5">
                                      {String.fromCharCode(65 + optIdx)}.
                                    </span>
                                    <Input className="h-8 border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none"
                                      placeholder={`Lựa chọn ${String.fromCharCode(65 + optIdx)}`}
                                      value={opt}
                                      onChange={(e) => updateOption(sIdx, qIdx, optIdx, e.target.value)} />
                                  </label>
                                );
                              })}
                              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                                onClick={() => {
                                  setForm(prev => {
                                    const sections = [...prev.sections];
                                    const qs = [...sections[sIdx].questions];
                                    qs[qIdx] = { ...qs[qIdx], options: [...qs[qIdx].options, ''] };
                                    sections[sIdx] = { ...sections[sIdx], questions: qs };
                                    return { ...prev, sections };
                                  });
                                }}>
                                <Plus className="h-3 w-3" /> Thêm lựa chọn
                              </Button>
                            </div>
                          )}

                          {/* ── GAP_FILL: Summary Builder ── */}
                          {q.questionType === 'GAP_FILL' && (
                            <div className="space-y-3 pt-2 border-t">
                              <div>
                                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[14px]">description</span>
                                  Hướng dẫn (Instructions)
                                </Label>
                                <Input className="mt-1" placeholder="VD: Complete the summary below. Choose ONE WORD ONLY from the passage."
                                  value={(q.content as any)?.instruction || ''}
                                  onChange={(e) => updateQuestion(sIdx, qIdx, 'content', { ...q.content, instruction: e.target.value })} />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[14px]">article</span>
                                  Summary Text
                                  <Badge variant="outline" className="text-[10px] ml-1">Dùng {'{{N}}'} cho chỗ trống</Badge>
                                </Label>
                                <Textarea className="mt-1 min-h-[120px] font-serif text-sm leading-relaxed"
                                  placeholder={`VD: The Uffington White Horse is located near an ancient road known as the {{9}} ...... Dating shows the first reference appears in {{10}} ......`}
                                  value={(q.content as any)?.summaryText || ''}
                                  onChange={(e) => {
                                    updateQuestion(sIdx, qIdx, 'content', { ...q.content, summaryText: e.target.value });
                                  }} />
                              </div>
                              {/* Auto-detected gaps with answer inputs */}
                              {(() => {
                                const gaps = parseGapPlaceholders((q.content as any)?.summaryText || '');
                                if (gaps.length === 0) return (
                                  <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                                    💡 Nhập <code className="bg-muted px-1 rounded">{'{{9}}'}</code>, <code className="bg-muted px-1 rounded">{'{{10}}'}</code>... trong Summary Text để tạo chỗ trống
                                  </p>
                                );
                                const gapAnswers = (q.answer as any)?.gaps || {};
                                return (
                                  <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Đáp án cho {gaps.length} chỗ trống</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {gaps.map(gapNum => (
                                        <div key={gapNum} className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 rounded-md px-2 py-1 shrink-0 w-10 text-center">{gapNum}</span>
                                          <Input className="h-8 text-sm" placeholder={`Đáp án cho gap ${gapNum}`}
                                            value={gapAnswers[gapNum]?.[0] || ''}
                                            onChange={(e) => {
                                              const updated = { ...gapAnswers, [gapNum]: [e.target.value] };
                                              updateQuestion(sIdx, qIdx, 'answer', { ...q.answer, gaps: updated });
                                            }} />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* ── MATCHING: Headings/Options list ── */}
                          {q.questionType === 'MATCHING' && (
                            <div className="space-y-3 pt-2 border-t">
                              <div>
                                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[14px]">description</span>
                                  Hướng dẫn
                                </Label>
                                <Input className="mt-1" placeholder="VD: Match each paragraph with the correct heading."
                                  value={(q.content as any)?.instruction || ''}
                                  onChange={(e) => updateQuestion(sIdx, qIdx, 'content', { ...q.content, instruction: e.target.value })} />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Danh sách lựa chọn (Headings)</Label>
                                <div className="space-y-1.5 mt-1">
                                  {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-muted-foreground w-5">{String.fromCharCode(65 + optIdx)}.</span>
                                      <Input className="h-8 text-sm" placeholder={`Heading ${String.fromCharCode(65 + optIdx)}`}
                                        value={opt}
                                        onChange={(e) => updateOption(sIdx, qIdx, optIdx, e.target.value)} />
                                      {q.options.length > 2 && (
                                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                                          onClick={() => {
                                            setForm(prev => {
                                              const sections = [...prev.sections];
                                              const qs = [...sections[sIdx].questions];
                                              qs[qIdx] = { ...qs[qIdx], options: qs[qIdx].options.filter((_, i) => i !== optIdx) };
                                              sections[sIdx] = { ...sections[sIdx], questions: qs };
                                              return { ...prev, sections };
                                            });
                                          }}>
                                          <X className="h-3 w-3 text-muted-foreground" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                                    onClick={() => {
                                      setForm(prev => {
                                        const sections = [...prev.sections];
                                        const qs = [...sections[sIdx].questions];
                                        qs[qIdx] = { ...qs[qIdx], options: [...qs[qIdx].options, ''] };
                                        sections[sIdx] = { ...sections[sIdx], questions: qs };
                                        return { ...prev, sections };
                                      });
                                    }}>
                                    <Plus className="h-3 w-3" /> Thêm heading
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Question Image Upload */}
                          <div>
                            <Label className="text-xs text-muted-foreground">Hình ảnh kèm câu hỏi</Label>
                            {q.imageUrl ? (
                              <div className="mt-1 relative inline-block">
                                <img src={q.imageUrl} alt="Question" className="max-h-32 rounded-lg border object-contain" />
                                <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-5 w-5 rounded-full shadow-md"
                                  onClick={() => updateQuestion(sIdx, qIdx, 'imageUrl', '')}>
                                  <X className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            ) : (
                              <Button variant="outline" size="sm" className="mt-1 gap-1.5 h-7 text-xs"
                                disabled={uploadingImage && imageUploadTarget?.qIdx === qIdx}
                                onClick={() => triggerImageUpload('question', sIdx, qIdx)}>
                                {uploadingImage && imageUploadTarget?.qIdx === qIdx
                                  ? <><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</>
                                  : <><ImagePlus className="h-3 w-3" /> Thêm ảnh</>}
                              </Button>
                            )}
                          </div>
                        </CardContent>

                        {/* Delete button */}
                        <div className="flex items-start pt-4 pr-3">
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => removeQuestion(sIdx, qIdx)}>
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </div>
          );
        })()}
        {/* Bottom Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t">
          <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : navigate('/admin/exams')}
            className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {step > 1 ? 'Quay lại' : 'Hủy'}
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext} className="gap-2">
              Tiếp theo <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSaving || !form.title} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEditing ? 'Lưu thay đổi' : 'Tạo bài thi'}
            </Button>
          )}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="audio/*" className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingSectionIdx !== null) handleAudioUpload(file, uploadingSectionIdx);
          e.target.value = '';
        }} />
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
          e.target.value = '';
        }} />

      <ExamPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={form.title}
        sections={form.sections.map(s => ({
          title: s.title,
          skill: selectedSkill || undefined,
          passageContent: s.passageContent,
          mediaUrl: s.mediaUrl || undefined,
          imageUrl: s.imageUrl || undefined,
          questions: s.questions,
        }))}
      />
    </div>
  );
}
