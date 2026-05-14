import { useState, useMemo, useCallback } from 'react';
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
import { Trash2, Upload, MoreHorizontal, FileJson, Music, Eye, Plus, Pencil, Save, Link, Loader2, Diamond } from 'lucide-react';
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

interface WhisperJSON {
  title: string;
  description?: string;
  level?: string;
  category?: string;
  audioFileName?: string;
  totalSentences?: number;
  sentences: WhisperSentence[];
}

// ─── Instruction keywords for auto-cleaning ──────────────────────────────────

const INSTRUCTION_KEYWORDS = [
  'questions', 'look at', 'you will hear', 'listen carefully',
  'now turn to', 'that is the end', 'before you hear',
  'you have some time', 'now listen', 'section',
  'part one', 'part two', 'part three', 'part four',
  'example', 'answer the questions', 'read the questions',
  'first you have', 'complete the', 'choose the correct',
  'write no more than', 'label the',
  'has been written', 'now we shall begin', 'we shall begin',
  'the answer is', 'so the answer', 'you can see',
  'in the space', 'on the form', 'on your answer sheet',
  'end of section', 'end of part',
];

const NON_LATIN = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;

function cleanSentences(sentences: WhisperSentence[]): { cleaned: WhisperSentence[]; removed: number } {
  let result = [...sentences];
  const originalCount = result.length;

  // Remove hallucinations
  result = result.filter((s) => {
    const duration = s.endTime - s.startTime;
    return !NON_LATIN.test(s.text) && !(duration < 0.5 && s.text.split(' ').length > 3);
  });

  // Remove instructions
  result = result.filter((s) => {
    const lower = s.text.toLowerCase();
    return !INSTRUCTION_KEYWORDS.some((kw) => lower.includes(kw));
  });

  // Remove duplicate intro
  if (result.length > 10) {
    const firstText = result[0]?.text.toLowerCase().trim().slice(0, 40) || '';
    for (let i = 3; i < Math.min(15, result.length); i++) {
      if (result[i].text.toLowerCase().trim().slice(0, 40) === firstText) {
        result = result.slice(i);
        break;
      }
    }
  }

  // Merge short segments
  const merged: WhisperSentence[] = [];
  for (const s of result) {
    if (merged.length > 0 && s.text.split(' ').length < 3) {
      merged[merged.length - 1].text += ' ' + s.text;
      merged[merged.length - 1].endTime = s.endTime;
    } else {
      merged.push({ ...s });
    }
  }

  // Re-index
  merged.forEach((s, i) => { s.index = i; });

  return { cleaned: merged, removed: originalCount - merged.length };
}

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

// ─── Component ───────────────────────────────────────────────────────────────

export default function DictationManagement() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<DictationExercise | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Upload form state
  const [jsonData, setJsonData] = useState<WhisperJSON | null>(null);
  const [cleanedSentences, setCleanedSentences] = useState<WhisperSentence[]>([]);
  const [removedCount, setRemovedCount] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('B2');
  const [category, setCategory] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioUploading, setAudioUploading] = useState(false);

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
    setJsonData(null);
    setCleanedSentences([]);
    setRemovedCount(0);
    setTitle('');
    setDescription('');
    setLevel('B2');
    setCategory('');
    setAudioUrl('');
    setAudioUploading(false);
  };

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'create' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const setUploading = mode === 'create' ? setAudioUploading : setEditAudioUploading;
    const setUrl = mode === 'create' ? setAudioUrl : setEditAudioUrl;
    setUploading(true);
    try {
      const url = await uploadAudioApi(file);
      setUrl(url);
    } catch {
      toast.error('Upload thất bại', { description: 'Kiểm tra kết nối S3 và thử lại.' });
    }
    setUploading(false);
  };

  // Handle JSON file drop/upload
  const handleJsonUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as WhisperJSON;
        setJsonData(data);

        // Auto-clean
        const { cleaned, removed } = cleanSentences(data.sentences);
        setCleanedSentences(cleaned);
        setRemovedCount(removed);

        // Auto-fill metadata
        setTitle(data.title || '');
        setDescription(data.description || '');
        setLevel(data.level || 'B2');
        setCategory(data.category || '');
      } catch {
        toast.error('File JSON không hợp lệ', { description: 'Vui lòng kiểm tra cú pháp file và thử lại.' });
      }
    };
    reader.readAsText(file);
  }, []);

  const handleCreate = () => {
    if (!title || cleanedSentences.length === 0) return;
    createMutation.mutate({
      title,
      description,
      audioUrl: audioUrl || `placeholder://${jsonData?.audioFileName || 'audio.mp3'}`,
      level,
      category,
      sentences: cleanedSentences,
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
          Import từ Whisper
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
              <Upload className="h-5 w-5" />
              Import bài Dictation từ Whisper JSON
            </DialogTitle>
            <DialogDescription>
              Upload file JSON từ Kaggle notebook, hệ thống sẽ tự động clean data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* JSON Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                File JSON (Whisper output)
              </Label>
              <Input
                type="file"
                accept=".json"
                onChange={handleJsonUpload}
                className="cursor-pointer"
              />
            </div>

            {/* Show results if JSON loaded */}
            {jsonData && (
              <>
                {/* Clean stats */}
                <div className="rounded-lg border bg-muted/50 p-4 space-y-1">
                  <div className="text-sm font-medium">📊 Kết quả clean tự động:</div>
                  <div className="text-sm text-muted-foreground">
                    Raw: {jsonData.sentences.length} câu → Clean: {cleanedSentences.length} câu
                    {removedCount > 0 && (
                      <span className="text-red-500"> (loại bỏ {removedCount} câu: hallucination/intro/instructions)</span>
                    )}
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-xs"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    {showPreview ? 'Ẩn preview' : 'Xem preview câu'}
                  </Button>

                  {showPreview && (
                    <div className="mt-2 max-h-48 overflow-y-auto rounded border bg-background p-2 text-xs space-y-1">
                      {cleanedSentences.map((s) => (
                        <div key={s.index} className="flex gap-2">
                          <span className="text-muted-foreground w-6 shrink-0">{s.index}</span>
                          <span className="text-muted-foreground w-16 shrink-0">
                            {s.startTime.toFixed(1)}s-{s.endTime.toFixed(1)}s
                          </span>
                          <span>{s.text.slice(0, 80)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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

                {/* Audio — Upload or URL */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Audio
                    {audioUrl && <Badge variant="default" className="text-xs ml-2">✓ {audioUrl.startsWith('http') ? 'Đã có URL' : 'Đã upload'}</Badge>}
                  </Label>
                  <Tabs defaultValue="upload" className="w-full">
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
                        onChange={(e) => handleAudioFileUpload(e, 'create')}
                        disabled={audioUploading}
                        className="cursor-pointer"
                      />
                      {audioUploading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Đang upload lên S3...
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="url" className="mt-2">
                      <Input
                        value={audioUrl}
                        onChange={(e) => setAudioUrl(e.target.value)}
                        placeholder="https://example.com/audio.mp3"
                      />
                    </TabsContent>
                  </Tabs>
                  <p className="text-xs text-muted-foreground">
                    Để trống nếu chưa có audio. Có thể cập nhật sau trong phần chỉnh sửa.
                  </p>
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
              disabled={!jsonData || !title || cleanedSentences.length === 0 || createMutation.isPending}
            >
              {createMutation.isPending ? 'Đang tạo...' : `Tạo bài (${cleanedSentences.length} câu)`}
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
                  <Badge variant="default" className="text-xs ml-2">✓ Đã có audio</Badge>
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
                    onChange={(e) => handleAudioFileUpload(e, 'edit')}
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
