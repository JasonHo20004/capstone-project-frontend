import { useState, useEffect } from 'react';
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
  Mic,
  MessageCircle,
  CreditCard,
  FileText,
  Check,
  Plus,
  Trash2,
  Info,
  GripVertical,
} from 'lucide-react';
import apiClient from '@/lib/api/config';

interface SpeakingFormData {
  title: string;
  durationInMinutes: number;
  status: string;
  englishTestTypeId: string;
  topic: string;
  // Part 1
  part1Questions: string[];
  // Part 2
  cueCardTopic: string;
  cueCardBullets: string[];
  cueCardFinalPrompt: string;
  // Part 3
  part3Questions: string[];
}

const STEPS = [
  { id: 1, label: 'Thông tin', icon: FileText },
  { id: 2, label: 'Part 1', icon: MessageCircle },
  { id: 3, label: 'Part 2', icon: CreditCard },
  { id: 4, label: 'Part 3', icon: Mic },
];

export default function SpeakingTestForm() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditing = !!editId;
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);

  const [form, setForm] = useState<SpeakingFormData>({
    title: '',
    durationInMinutes: 14,
    status: 'DRAFT',
    englishTestTypeId: '',
    topic: '',
    part1Questions: ['', '', '', ''],
    cueCardTopic: '',
    cueCardBullets: ['', '', ''],
    cueCardFinalPrompt: '',
    part3Questions: ['', '', '', ''],
  });

  // Fetch test types
  const { data: testTypes = [] } = useQuery({
    queryKey: ['englishTestTypes'],
    queryFn: async () => {
      try {
        const resp = await apiClient.get('/tests/types');
        return resp.data?.data || [];
      } catch { return []; }
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
          const part1Section = sections.find((s: any) => s.title?.toLowerCase().includes('part 1')) || sections[0];
          const part2Section = sections.find((s: any) => s.title?.toLowerCase().includes('part 2')) || sections[1];
          const part3Section = sections.find((s: any) => s.title?.toLowerCase().includes('part 3')) || sections[2];

          const part1Qs = part1Section?.questions?.map((q: any) => q.questionText || '') || ['', '', '', ''];
          const part3Qs = part3Section?.questions?.map((q: any) => q.questionText || '') || ['', '', '', ''];

          const cueCardContent = part2Section?.questions?.[0]?.content || {};

          setForm({
            title: test.title,
            durationInMinutes: test.durationInMinutes || 14,
            status: test.status,
            englishTestTypeId: test.englishTestTypeId || '',
            topic: cueCardContent.topic || part1Section?.questions?.[0]?.content?.topic || '',
            part1Questions: part1Qs.length > 0 ? part1Qs : ['', '', '', ''],
            cueCardTopic: cueCardContent.cueCardTopic || part2Section?.questions?.[0]?.questionText || '',
            cueCardBullets: cueCardContent.bulletPoints || ['', '', ''],
            cueCardFinalPrompt: cueCardContent.finalPrompt || '',
            part3Questions: part3Qs.length > 0 ? part3Qs : ['', '', '', ''],
          });
        }
      }).finally(() => setLoadingEdit(false));
    }
  }, [editId]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => { const resp = await apiClient.post('/tests', data); return resp.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminTests'] }); navigate('/admin/exams'); },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => { const resp = await apiClient.put(`/tests/${editId}`, data); return resp.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminTests'] }); navigate('/admin/exams'); },
  });

  // List helpers
  const updateListItem = (key: 'part1Questions' | 'part3Questions' | 'cueCardBullets', idx: number, value: string) => {
    setForm(prev => {
      const list = [...prev[key]];
      list[idx] = value;
      return { ...prev, [key]: list };
    });
  };

  const addListItem = (key: 'part1Questions' | 'part3Questions' | 'cueCardBullets') => {
    setForm(prev => ({ ...prev, [key]: [...prev[key], ''] }));
  };

  const removeListItem = (key: 'part1Questions' | 'part3Questions' | 'cueCardBullets', idx: number) => {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = () => {
    const part1Qs = form.part1Questions.filter(Boolean);
    const part3Qs = form.part3Questions.filter(Boolean);
    const bullets = form.cueCardBullets.filter(Boolean);

    const payload = {
      title: form.title,
      durationInMinutes: form.durationInMinutes,
      status: form.status,
      englishTestTypeId: form.englishTestTypeId || testTypes[0]?.id,
      testSkills: ['SPEAKING'],
      sections: [
        // Part 1: Warm-up questions
        {
          title: 'Part 1 — Introduction & Interview',
          skill: 'SPEAKING',
          questions: part1Qs.map((q, i) => ({
            questionText: q,
            questionType: 'IELTS_SPEAKING',
            questionOrder: i + 1,
            content: { part: 1, topic: form.topic },
            answer: { gradingType: 'AI_EVALUATION' },
          })),
        },
        // Part 2: Cue Card
        {
          title: 'Part 2 — Individual Long Turn',
          skill: 'SPEAKING',
          questions: [{
            questionText: form.cueCardTopic,
            questionType: 'IELTS_SPEAKING',
            questionOrder: 1,
            content: {
              part: 2,
              topic: form.topic,
              cueCardTopic: form.cueCardTopic,
              bulletPoints: bullets,
              finalPrompt: form.cueCardFinalPrompt,
            },
            answer: { gradingType: 'AI_EVALUATION' },
          }],
        },
        // Part 3: Discussion
        {
          title: 'Part 3 — Two-way Discussion',
          skill: 'SPEAKING',
          questions: part3Qs.map((q, i) => ({
            questionText: q,
            questionType: 'IELTS_SPEAKING',
            questionOrder: i + 1,
            content: { part: 3, topic: form.topic },
            answer: { gradingType: 'AI_EVALUATION' },
          })),
        },
      ],
    };

    isEditing ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const canNext = step === 1 ? !!form.title && !!form.topic
    : step === 2 ? form.part1Questions.some(Boolean)
    : step === 3 ? !!form.cueCardTopic
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
      {/* Header */}
      <div className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/exams')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                {isEditing ? 'Chỉnh sửa đề Speaking' : 'Tạo đề Speaking mới'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {form.title || 'Chưa đặt tên'} · {form.topic || 'Chưa chọn topic'}
              </p>
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
                className={`flex items-center gap-2 px-3 py-2.5 rounded-full text-sm font-medium transition-all ${
                  active ? 'bg-primary text-primary-foreground shadow-md' :
                  done ? 'bg-primary/10 text-primary' :
                  'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}>
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
          <span className="text-xs text-muted-foreground">Bước {step}/4</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pb-24">
        {/* STEP 1: Info */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold mb-1">Thông tin đề Speaking</h2>
              <p className="text-muted-foreground">Cấu hình tổng thể cho bài thi Speaking</p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <Label className="text-sm font-medium">Tên đề thi <span className="text-destructive">*</span></Label>
                  <Input className="mt-1.5 text-lg h-12"
                    placeholder="VD: IELTS Speaking — Technology & Daily Life"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} />
                </div>

                <div>
                  <Label className="text-sm font-medium">Chủ đề chính <span className="text-destructive">*</span></Label>
                  <Input className="mt-1.5"
                    placeholder="VD: Technology, Travel, Education, Environment..."
                    value={form.topic}
                    onChange={(e) => setForm(prev => ({ ...prev, topic: e.target.value }))} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Thời gian (phút)</Label>
                    <Input type="number" className="mt-1.5" value={form.durationInMinutes}
                      onChange={(e) => setForm(prev => ({ ...prev, durationInMinutes: parseInt(e.target.value) || 0 }))} />
                    <p className="text-xs text-muted-foreground mt-1">IELTS Speaking: 11–14 phút</p>
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

        {/* STEP 2: Part 1 */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold mb-1">Part 1 — Introduction & Interview</h2>
              <p className="text-muted-foreground">4–5 câu hỏi warm-up về chủ đề quen thuộc (4–5 phút)</p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-xs">
                Part 1 gồm các câu hỏi đơn giản, thân mật về cuộc sống hàng ngày. Examiner hỏi trực tiếp, thí sinh trả lời ngắn (2-3 câu).
              </p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-3">
                {form.part1Questions.map((q, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Badge variant="outline" className="shrink-0 w-8 justify-center">{idx + 1}</Badge>
                    <Input placeholder={`VD: ${idx === 0 ? 'Do you work or study?' : idx === 1 ? 'What do you enjoy about your work/studies?' : 'Tell me about...'}`}
                      value={q}
                      onChange={(e) => updateListItem('part1Questions', idx, e.target.value)} />
                    {form.part1Questions.length > 2 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive"
                        onClick={() => removeListItem('part1Questions', idx)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" className="gap-1.5 mt-2"
                  onClick={() => addListItem('part1Questions')}>
                  <Plus className="h-3.5 w-3.5" /> Thêm câu hỏi
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 3: Part 2 (Cue Card) */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold mb-1">Part 2 — Individual Long Turn</h2>
              <p className="text-muted-foreground">Thí sinh nhận topic card, chuẩn bị 1 phút, nói 1–2 phút</p>
            </div>

            <Card className="border-2 border-teal-200 dark:border-teal-800">
              <CardContent className="pt-6 space-y-5">
                {/* Cue card preview header */}
                <div className="flex items-center gap-2 pb-3 border-b">
                  <CreditCard className="h-5 w-5 text-teal-600" />
                  <span className="font-semibold text-teal-700 dark:text-teal-400">Topic Card</span>
                </div>

                <div>
                  <Label className="text-sm font-medium">Chủ đề cue card <span className="text-destructive">*</span></Label>
                  <Input className="mt-1.5"
                    placeholder="VD: Describe a time when you used technology to solve a problem"
                    value={form.cueCardTopic}
                    onChange={(e) => setForm(prev => ({ ...prev, cueCardTopic: e.target.value }))} />
                </div>

                <div>
                  <Label className="text-sm font-medium">Bullet Points (gợi ý)</Label>
                  <p className="text-xs text-muted-foreground mb-2">Những gợi ý giúp thí sinh triển khai ý</p>
                  {form.cueCardBullets.map((b, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <span className="text-muted-foreground text-sm shrink-0">•</span>
                      <Input placeholder={`VD: ${idx === 0 ? 'What the problem was' : idx === 1 ? 'How you used technology' : 'What the result was'}`}
                        value={b}
                        onChange={(e) => updateListItem('cueCardBullets', idx, e.target.value)} />
                      {form.cueCardBullets.length > 2 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive"
                          onClick={() => removeListItem('cueCardBullets', idx)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="gap-1.5"
                    onClick={() => addListItem('cueCardBullets')}>
                    <Plus className="h-3.5 w-3.5" /> Thêm bullet
                  </Button>
                </div>

                <div>
                  <Label className="text-sm font-medium">Final Prompt</Label>
                  <Input className="mt-1.5"
                    placeholder="VD: And explain how you felt about using technology in that situation"
                    value={form.cueCardFinalPrompt}
                    onChange={(e) => setForm(prev => ({ ...prev, cueCardFinalPrompt: e.target.value }))} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 4: Part 3 */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold mb-1">Part 3 — Two-way Discussion</h2>
              <p className="text-muted-foreground">4–6 câu hỏi thảo luận sâu liên quan đến topic Part 2 (4–5 phút)</p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-xs">
                Part 3 yêu cầu thí sinh thảo luận, phân tích, so sánh ở mức trừu tượng hơn. Câu hỏi nên liên quan đến chủ đề Part 2 nhưng ở phạm vi xã hội rộng hơn.
              </p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-3">
                {form.part3Questions.map((q, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Badge variant="outline" className="shrink-0 w-8 justify-center">{idx + 1}</Badge>
                    <Input placeholder={`VD: ${idx === 0 ? 'How has technology changed the way people communicate?' : idx === 1 ? 'Do you think people rely too much on technology?' : 'What are the advantages and disadvantages of...'}`}
                      value={q}
                      onChange={(e) => updateListItem('part3Questions', idx, e.target.value)} />
                    {form.part3Questions.length > 2 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive"
                        onClick={() => removeListItem('part3Questions', idx)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" className="gap-1.5 mt-2"
                  onClick={() => addListItem('part3Questions')}>
                  <Plus className="h-3.5 w-3.5" /> Thêm câu hỏi
                </Button>
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
              {isEditing ? 'Lưu thay đổi' : 'Tạo đề Speaking'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
