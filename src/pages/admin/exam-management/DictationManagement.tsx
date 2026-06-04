import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Trash2, Upload, MoreHorizontal, Music, Plus, Pencil, Save, Link, Loader2, Diamond, Wand2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataTable from '@/components/admin/DataTable';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import apiClient from '@/lib/api/config';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DictationExercise {
  id: string;
  title: string;
  description: string | null;
  audioUrl: string;
  level: string | null;
  category: string | null;
  totalSentences: number;
  isPublished: boolean;
  isPremium?: boolean;
  createdAt: string;
}

interface WhisperSentence {
  index: number;
  text: string;
  startTime: number;
  endTime: number;
}

// Stats returned by the rag-service split/clean pipeline.
interface TranscribeReport {
  rawChunks?: number;
  hallucinationsRemoved?: number;
  introSkipped?: number;
  duplicateExampleRemoved?: number;
  instructionsRemoved?: number;
  finalSentences?: number;
}


// Cleaning now happens server-side in the rag-service pipeline.

// ─── API Functions ───────────────────────────────────────────────────────────

const fetchExercises = async (): Promise<DictationExercise[]> => {
  const resp = await apiClient.get('/dictation?all=true');
  return resp.data?.data || [];
};

const deleteExerciseApi = async (id: string) => {
  const resp = await apiClient.delete(`/dictation/${id}`);
  return resp.data;
};

const createExerciseApi = async (data: {
  title: string;
  description: string;
  audioUrl: string;
  level: string;
  category: string;
  sentences: WhisperSentence[];
}) => {
  const resp = await apiClient.post('/dictation', data);
  return resp.data;
};

const fetchExerciseDetail = async (id: string) => {
  const resp = await apiClient.get(`/dictation/${id}`);
  return resp.data?.data;
};

const updateExerciseApi = async (id: string, data: Record<string, unknown>) => {
  const resp = await apiClient.put(`/dictation/${id}`, data);
  return resp.data;
};

const uploadAudioApi = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('audio', file);
  const resp = await apiClient.post('/dictation/upload-audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return resp.data?.data?.url || '';
};

// Upload audio → Whisper (CPU) auto-generates + cleans timestamps server-side.
// The audio is also stored on S3, so the returned audioUrl is ready to use.
// Long timeout: CPU transcription of a few-minute clip can take several minutes.
const transcribeAudioApi = async (
  file: File
): Promise<{ audioUrl: string; sentences: WhisperSentence[]; report: TranscribeReport }> => {
  const formData = new FormData();
  formData.append('audio', file);
  const resp = await apiClient.post('/dictation/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000,
  });
  const data = resp.data?.data || {};
  return {
    audioUrl: data.audioUrl || '',
    sentences: data.sentences || [],
    report: data.report || {},
  };
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function DictationManagement() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<DictationExercise | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // Upload form state — audio file → auto-transcribe → preview → create
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [hasTranscribed, setHasTranscribed] = useState(false);
  const [sentences, setSentences] = useState<WhisperSentence[]>([]);
  const [report, setReport] = useState<TranscribeReport | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('B2');
  const [category, setCategory] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

  // Edit form state
  const [editTarget, setEditTarget] = useState<DictationExercise | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLevel, setEditLevel] = useState('B2');
  const [editCategory, setEditCategory] = useState('');
  const [editAudioUrl, setEditAudioUrl] = useState('');
  const [editSentences, setEditSentences] = useState<WhisperSentence[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editAudioUploading, setEditAudioUploading] = useState(false);

  const { data: exercises = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['adminDictation'],
    queryFn: fetchExercises,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExerciseApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDictation'] });
      setDeleteTarget(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: createExerciseApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDictation'] });
      resetUploadForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateExerciseApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDictation'] });
      setEditTarget(null);
    },
  });

  const togglePremiumMutation = useMutation({
    mutationFn: (ex: DictationExercise) => updateExerciseApi(ex.id, { isPremium: !ex.isPremium }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminDictation'] }),
  });

  const resetUploadForm = () => {
    setShowUpload(false);
    setAudioFile(null);
    setTranscribing(false);
    setHasTranscribed(false);
    setSentences([]);
    setReport(null);
    setTitle('');
    setDescription('');
    setLevel('B2');
    setCategory('');
    setAudioUrl('');
  };

  // Audio upload in the EDIT dialog (replace audio without re-transcribing).
  const handleEditAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditAudioUploading(true);
    try {
      const url = await uploadAudioApi(file);
      setEditAudioUrl(url);
    } catch {
      toast.error('Upload thất bại', { description: 'Kiểm tra kết nối S3 và thử lại.' });
    }
    setEditAudioUploading(false);
  };

  // Admin picks an audio file in the create dialog.
  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAudioFile(file);
    setHasTranscribed(false);
    setSentences([]);
    setReport(null);
    setAudioUrl('');
    // Auto-fill title from the file name (admin can edit).
    if (file && !title) {
      setTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  // Run Whisper on the selected audio (CPU, server-side) and load the sentences.
  const handleTranscribe = async () => {
    if (!audioFile) return;
    setTranscribing(true);
    try {
      const result = await transcribeAudioApi(audioFile);
      setSentences(result.sentences);
      setReport(result.report);
      setAudioUrl(result.audioUrl);
      setHasTranscribed(true);
      if (result.sentences.length === 0) {
        toast.warning('Không tách được câu nào', { description: 'Thử file audio khác hoặc kiểm tra chất lượng âm thanh.' });
      } else {
        toast.success(`Đã tách ${result.sentences.length} câu`, { description: 'Kiểm tra và chỉnh sửa trước khi tạo bài.' });
      }
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error('Tách timestamp thất bại', {
        description: detail || 'Whisper service (rag-service) có đang chạy không? Quá trình trên CPU có thể mất vài phút.',
      });
    }
    setTranscribing(false);
  };

  const updateUploadSentenceText = (index: number, text: string) => {
    setSentences((prev) => prev.map((s) => (s.index === index ? { ...s, text } : s)));
  };

  const deleteUploadSentence = (index: number) => {
    setSentences((prev) => prev.filter((s) => s.index !== index));
  };

  const handleCreate = () => {
    if (!title || sentences.length === 0) return;
    // Re-index after any inline edits/deletes.
    const reindexed = sentences.map((s, i) => ({ ...s, index: i }));
    createMutation.mutate({
      title,
      description,
      audioUrl: audioUrl || `placeholder://${audioFile?.name || 'audio.mp3'}`,
      level,
      category,
      sentences: reindexed,
    });
  };

  const openEditDialog = async (ex: DictationExercise) => {
    setEditTarget(ex);
    setEditTitle(ex.title);
    setEditDescription(ex.description || '');
    setEditLevel(ex.level || 'B2');
    setEditCategory(ex.category || '');
    setEditAudioUrl(ex.audioUrl || '');
    setEditLoading(true);
    try {
      const detail = await fetchExerciseDetail(ex.id);
      setEditSentences(detail.sentences || []);
    } catch {
      setEditSentences([]);
    }
    setEditLoading(false);
  };

  const handleUpdate = () => {
    if (!editTarget || !editTitle) return;
    // Re-index sentences
    const reindexed = editSentences.map((s: WhisperSentence, i: number) => ({ ...s, index: i }));
    updateMutation.mutate({
      id: editTarget.id,
      data: {
        title: editTitle,
        description: editDescription,
        level: editLevel,
        category: editCategory,
        audioUrl: editAudioUrl,
        sentences: reindexed,
      },
    });
  };

  const updateSentenceText = (index: number, text: string) => {
    setEditSentences((prev) => prev.map((s) => s.index === index ? { ...s, text } : s));
  };

  const deleteSentence = (index: number) => {
    setEditSentences((prev) => prev.filter((s) => s.index !== index));
  };

  const columns = [
    {
      key: 'title',
      header: 'Bài dictation',
      render: (ex: DictationExercise) => (
        <div className="flex items-center gap-2">
          <div>
            <div className="font-medium">{ex.title}</div>
            <div className="text-xs text-muted-foreground">{ex.description || '—'}</div>
          </div>
          {ex.isPremium && (
            <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200 text-[10px] gap-0.5">
              <Diamond className="h-3 w-3" />
              PRO
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Danh mục',
      render: (ex: DictationExercise) => (
        <Badge variant="outline">{ex.category || '—'}</Badge>
      ),
    },
    {
      key: 'level',
      header: 'Level',
      render: (ex: DictationExercise) => {
        const colors: Record<string, string> = {
          A1: 'bg-green-500/10 text-green-600 border-green-200',
          A2: 'bg-green-500/10 text-green-600 border-green-200',
          B1: 'bg-blue-500/10 text-blue-600 border-blue-200',
          B2: 'bg-blue-500/10 text-blue-600 border-blue-200',
          C1: 'bg-orange-500/10 text-orange-600 border-orange-200',
          C2: 'bg-red-500/10 text-red-600 border-red-200',
        };
        return <Badge className={colors[ex.level || ''] || ''}>{ex.level || '—'}</Badge>;
      },
    },
    {
      key: 'sentences',
      header: 'Câu',
      render: (ex: DictationExercise) => (
        <span className="text-sm font-medium">{ex.totalSentences}</span>
      ),
    },
    {
      key: 'audio',
      header: 'Audio',
      render: (ex: DictationExercise) => (
        <Badge variant={ex.audioUrl?.startsWith('placeholder') ? 'destructive' : 'default'} className="text-xs">
          {ex.audioUrl?.startsWith('placeholder') ? 'Chưa có' : 'Đã upload'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (ex: DictationExercise) => (
        <span className="text-xs text-muted-foreground">
          {new Date(ex.createdAt).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (ex: DictationExercise) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openEditDialog(ex)}>
              <Pencil className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => togglePremiumMutation.mutate(ex)}>
              <Diamond className={`mr-2 h-4 w-4 ${ex.isPremium ? 'text-amber-500' : ''}`} />
              {ex.isPremium ? 'Bỏ PRO' : 'Đặt PRO'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTarget(ex)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý Dictation</h1>
        <LoadingSpinner text="Đang tải..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý Dictation</h1>
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Không thể tải danh sách.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Dictation</h1>
          <p className="text-muted-foreground">Import và quản lý bài luyện nghe dictation</p>
        </div>
        <Button className="gap-2" onClick={() => setShowUpload(true)}>
          <Plus className="h-4 w-4" />
          Tạo bài từ Audio
        </Button>
      </div>

      <DataTable
        title="Danh sách bài Dictation"
        description={`Tổng cộng ${exercises.length} bài`}
        data={exercises}
        columns={columns}
        emptyMessage="Chưa có bài dictation nào"
      />

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={(open) => !open && resetUploadForm()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Tạo bài Dictation từ file Audio
            </DialogTitle>
            <DialogDescription>
              Upload file audio, hệ thống tự chạy Whisper trên CPU để tách câu + timestamp và lọc dữ liệu. Không cần Kaggle hay file JSON.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Audio Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                File Audio (mp3, wav, m4a...)
              </Label>
              <Input
                type="file"
                accept="audio/*"
                onChange={handleAudioSelect}
                disabled={transcribing}
                className="cursor-pointer"
              />
              <Button
                type="button"
                onClick={handleTranscribe}
                disabled={!audioFile || transcribing}
                className="gap-2 w-full"
              >
                {transcribing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tách timestamp trên CPU... (có thể mất vài phút)
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    {hasTranscribed ? 'Tách lại timestamp' : 'Tách timestamp tự động'}
                  </>
                )}
              </Button>
            </div>

            {/* Show results once transcribed */}
            {hasTranscribed && (
              <>
                {/* Pipeline stats */}
                {report && (
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-1">
                    <div className="text-sm font-medium">📊 Kết quả tách tự động:</div>
                    <div className="text-sm text-muted-foreground">
                      Raw: {report.rawChunks ?? '—'} đoạn → Sạch: {report.finalSentences ?? sentences.length} câu
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Loại bỏ: {report.hallucinationsRemoved ?? 0} hallucination · {report.instructionsRemoved ?? 0} câu hướng dẫn · {report.duplicateExampleRemoved ?? 0} intro lặp · {report.introSkipped ?? 0} bỏ đầu
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tiêu đề *</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cam20 - Test 1 - Part 1" />
                  </div>
                  <div className="space-y-2">
                    <Label>Danh mục</Label>
                    <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Cambridge 20" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mô tả</Label>
                    <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Restaurant Recommendations" />
                  </div>
                  <div className="space-y-2">
                    <Label>Level</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Editable sentence list */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Danh sách câu ({sentences.length}) — kiểm tra & chỉnh sửa</Label>
                  <div className="max-h-72 overflow-y-auto space-y-2 rounded border p-3">
                    {sentences.map((s, idx) => (
                      <div key={s.index} className="flex gap-2 items-start">
                        <span className="text-xs text-muted-foreground w-6 pt-2 shrink-0">{idx}</span>
                        <span className="text-xs text-muted-foreground w-20 pt-2 shrink-0">
                          {s.startTime.toFixed(1)}s-{s.endTime.toFixed(1)}s
                        </span>
                        <Textarea
                          value={s.text}
                          onChange={(e) => updateUploadSentenceText(s.index, e.target.value)}
                          className="text-sm min-h-[36px] h-9 py-1.5 resize-none"
                          rows={1}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 shrink-0 text-red-500 hover:text-red-700"
                          onClick={() => deleteUploadSentence(s.index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audio status */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Music className="h-4 w-4" />
                  {audioUrl && !audioUrl.startsWith('placeholder') ? (
                    <span>Audio đã được lưu trữ. <Badge variant="default" className="text-xs ml-1">Sẵn sàng</Badge></span>
                  ) : (
                    <span className="text-amber-600">Chưa lưu được audio — có thể cập nhật sau trong phần chỉnh sửa.</span>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetUploadForm}>
              Hủy
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!hasTranscribed || !title || sentences.length === 0 || createMutation.isPending}
            >
              {createMutation.isPending ? 'Đang tạo...' : `Tạo bài (${sentences.length} câu)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Chỉnh sửa bài Dictation
            </DialogTitle>
            <DialogDescription>
              Cập nhật thông tin và nội dung câu dictation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tiêu đề *</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <Select value={editLevel} onValueChange={setEditLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                Audio
                {editAudioUrl && !editAudioUrl.startsWith('placeholder') && (
                  <Badge variant="default" className="text-xs ml-2">Đã có audio</Badge>
                )}
              </Label>
              <Tabs defaultValue={editAudioUrl && !editAudioUrl.startsWith('placeholder') ? 'url' : 'upload'} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="upload" className="text-xs gap-1">
                    <Upload className="h-3 w-3" /> Upload file
                  </TabsTrigger>
                  <TabsTrigger value="url" className="text-xs gap-1">
                    <Link className="h-3 w-3" /> Paste URL
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-2">
                  <Input
                    type="file"
                    accept="audio/*"
                    onChange={handleEditAudioUpload}
                    disabled={editAudioUploading}
                    className="cursor-pointer"
                  />
                  {editAudioUploading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Đang upload lên S3...
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="url" className="mt-2">
                  <Input
                    value={editAudioUrl}
                    onChange={(e) => setEditAudioUrl(e.target.value)}
                    placeholder="https://example.com/audio.mp3"
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sentences */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Danh sách câu ({editSentences.length})</Label>
              {editLoading ? (
                <div className="text-sm text-muted-foreground">Đang tải...</div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2 rounded border p-3">
                  {editSentences.map((s, idx) => (
                    <div key={s.index} className="flex gap-2 items-start">
                      <span className="text-xs text-muted-foreground w-6 pt-2 shrink-0">{idx}</span>
                      <span className="text-xs text-muted-foreground w-20 pt-2 shrink-0">
                        {s.startTime.toFixed(1)}s-{s.endTime.toFixed(1)}s
                      </span>
                      <Textarea
                        value={s.text}
                        onChange={(e) => updateSentenceText(s.index, e.target.value)}
                        className="text-sm min-h-[36px] h-9 py-1.5 resize-none"
                        rows={1}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 shrink-0 text-red-500 hover:text-red-700"
                        onClick={() => deleteSentence(s.index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Hủy
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!editTitle || updateMutation.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa bài dictation</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa <strong>"{deleteTarget?.title}"</strong>?
              Tất cả sentences và sessions liên quan sẽ bị xóa. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
