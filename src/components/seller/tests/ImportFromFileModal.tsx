// =============================================================================
// Seller — Import Questions From File Modal
// =============================================================================
// Two-step flow:
//   1. Upload a PDF or DOCX → backend parses and returns questions JSON.
//   2. Seller reviews counts + optionally pastes a manual answer key, then
//      chooses to replace or append into the CreateTestPage form.
// Nothing is written to the database from this modal.

import { useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  X,
  RefreshCw,
  ListPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useParseQuestionFile } from '@/hooks/api/use-question-import';
import type { ParsedQuestion } from '@/lib/api/services/seller/question-import.service';

export interface ImportedQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  /** Only set on the first question of each detected section. */
  sectionInstruction?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Replace the entire existing question list. */
  onReplace: (questions: ImportedQuestion[]) => void;
  /** Append to the existing question list (caller renumbers). */
  onAppend: (questions: ImportedQuestion[]) => void;
}

const ALLOWED_EXT = ['.pdf', '.docx'];
const LETTER_TO_INDEX: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

/**
 * Pad/truncate options to exactly 4 strings so they fit the existing form
 * shape (A/B/C/D). Missing options get empty strings the seller can fill in.
 */
function padOptions(opts: { key: string; text: string }[]): string[] {
  const arr = ['', '', '', ''];
  opts.forEach((o) => {
    const idx = LETTER_TO_INDEX[o.key];
    if (typeof idx === 'number') arr[idx] = o.text;
  });
  return arr;
}

/**
 * Parse a manually-pasted answer key block of the form:
 *   1. A
 *   2) B
 *   3 - C
 * Returns map { "1": "A", ... }.
 */
function parsePastedAnswerKey(text: string): Record<string, string> {
  if (!text) return {};
  const result: Record<string, string> = {};
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*(\d+)\s*[.\)\-:]\s*([A-D])/i);
    if (m) result[m[1]] = m[2].toUpperCase();
  }
  return result;
}

function toImportedQuestion(
  q: ParsedQuestion,
  manualKey: Record<string, string>
): ImportedQuestion {
  const options = padOptions(q.options);
  let correctIndex = q.correctAnswerIndex ?? -1;
  // Manual key overrides only when the parser didn't already supply an answer.
  if (correctIndex < 0) {
    const letter = manualKey[String(q.questionNumber)];
    if (letter && LETTER_TO_INDEX[letter] !== undefined) {
      correctIndex = LETTER_TO_INDEX[letter];
    }
  }
  return {
    questionText: q.questionText,
    options,
    correctAnswerIndex: Math.max(0, correctIndex),
    explanation: q.explanation ?? '',
    sectionInstruction: q.sectionInstruction,
  };
}

export default function ImportFromFileModal({
  open,
  onOpenChange,
  onReplace,
  onAppend,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [manualAnswerKey, setManualAnswerKey] = useState('');
  const parseMutation = useParseQuestionFile();
  const parseResult = parseMutation.data;

  const resetAll = () => {
    setFile(null);
    setManualAnswerKey('');
    parseMutation.reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = (next: boolean) => {
    if (!next) resetAll();
    onOpenChange(next);
  };

  const onFileSelected = (f: File | null) => {
    if (!f) return;
    const name = f.name.toLowerCase();
    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
    if (!ALLOWED_EXT.includes(ext)) {
      toast.error('Chỉ chấp nhận file .pdf hoặc .docx');
      return;
    }
    setFile(f);
    parseMutation.reset();
  };

  const handleParse = () => {
    if (!file) return;
    parseMutation.mutate(file, {
      onError: (err: unknown) => {
        const msg =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error
          ?? (err instanceof Error ? err.message : 'Phân tích file thất bại');
        toast.error(msg);
      },
    });
  };

  const manualKey = useMemo(
    () => parsePastedAnswerKey(manualAnswerKey),
    [manualAnswerKey]
  );

  const importedQuestions = useMemo<ImportedQuestion[]>(() => {
    if (!parseResult) return [];
    return parseResult.questions.map((q) => toImportedQuestion(q, manualKey));
  }, [parseResult, manualKey]);

  const missingAnswerAfterPaste = useMemo(() => {
    if (!parseResult) return 0;
    return parseResult.questions.filter((q) => {
      if (q.correctAnswerIndex !== null) return false;
      return !manualKey[String(q.questionNumber)];
    }).length;
  }, [parseResult, manualKey]);

  const handleReplace = () => {
    if (importedQuestions.length === 0) return;
    onReplace(importedQuestions);
    toast.success(`Đã thay thế bằng ${importedQuestions.length} câu hỏi`);
    handleClose(false);
  };

  const handleAppend = () => {
    if (importedQuestions.length === 0) return;
    onAppend(importedQuestions);
    toast.success(`Đã thêm ${importedQuestions.length} câu hỏi`);
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Import câu hỏi từ file
          </DialogTitle>
          <DialogDescription>
            Hỗ trợ PDF (text) và DOCX. PDF scan, file chứa câu hỏi dạng ảnh, bảng phức tạp KHÔNG hỗ trợ.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1 — Upload */}
        {!parseResult && (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertTitle>Format mẫu khuyến nghị</AlertTitle>
              <AlertDescription>
                <pre className="mt-2 text-xs bg-slate-50 p-3 rounded-md overflow-x-auto whitespace-pre">
{`Question 1: What is ...?
A. option A
B. option B
C. option C
D. option D

Answer Key:
1. B
2. C`}
                </pre>
              </AlertDescription>
            </Alert>

            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
              }}
              className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                {file ? file.name : 'Bấm để chọn file .pdf hoặc .docx'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Tối đa 50MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="ghost" onClick={() => handleClose(false)}>
                Hủy
              </Button>
              <Button onClick={handleParse} disabled={!file || parseMutation.isPending}>
                {parseMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-1" />
                    Phân tích file
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2 — Result */}
        {parseResult && (
          <div className="space-y-4">
            <Alert variant={parseResult.summary.totalParsed > 0 ? 'default' : 'destructive'}>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Kết quả phân tích</AlertTitle>
              <AlertDescription>
                Đã parse <strong>{parseResult.summary.totalParsed}</strong> câu —{' '}
                <Badge variant="secondary" className="mr-1">
                  {parseResult.summary.withAnswer} có đáp án
                </Badge>
                {parseResult.summary.withoutAnswer > 0 && (
                  <Badge variant="outline" className="mr-1">
                    {parseResult.summary.withoutAnswer} chưa có đáp án
                  </Badge>
                )}
                {parseResult.summary.warningCount > 0 && (
                  <Badge variant="outline" className="text-amber-700 border-amber-300">
                    {parseResult.summary.warningCount} cảnh báo
                  </Badge>
                )}
              </AlertDescription>
            </Alert>

            {parseResult.summary.withoutAnswer > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Dán answer key thủ công (tùy chọn)
                </label>
                <Textarea
                  rows={4}
                  placeholder={'1. A\n2. B\n3. C'}
                  value={manualAnswerKey}
                  onChange={(e) => setManualAnswerKey(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {missingAnswerAfterPaste > 0
                    ? `Còn ${missingAnswerAfterPaste} câu chưa có đáp án — bạn có thể sửa sau trong form.`
                    : 'Tất cả câu hỏi đã có đáp án.'}
                </p>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto rounded-md border bg-slate-50/40 p-2 space-y-1">
              {parseResult.questions.slice(0, 50).map((q, idx) => {
                const prevInstruction = idx > 0 ? parseResult.questions[idx - 1].sectionInstruction : undefined;
                const showHeader = !!q.sectionInstruction && q.sectionInstruction !== prevInstruction;
                return (
                  <div key={idx}>
                    {showHeader && (
                      <div className="text-xs px-2 py-1.5 mt-2 first:mt-0 rounded bg-blue-50 border border-blue-200 text-blue-700 font-medium flex items-start gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{q.sectionInstruction}</span>
                      </div>
                    )}
                    <div className="text-xs px-2 py-1 rounded bg-white border">
                      <div className="font-medium">
                        {q.questionNumber}. {q.questionText.slice(0, 80)}
                        {q.questionText.length > 80 ? '…' : ''}
                      </div>
                      <div className="mt-0.5 text-muted-foreground">
                        {q.options.length}/4 đáp án •{' '}
                        {q.correctAnswerIndex !== null
                          ? `Đúng: ${String.fromCharCode(65 + q.correctAnswerIndex)}`
                          : manualKey[String(q.questionNumber)]
                          ? `Đúng (manual): ${manualKey[String(q.questionNumber)]}`
                          : 'Chưa có đáp án'}
                      </div>
                    </div>
                  </div>
                );
              })}
              {parseResult.questions.length > 50 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  …và {parseResult.questions.length - 50} câu khác
                </p>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="ghost" onClick={resetAll} className="sm:mr-auto">
                <X className="h-4 w-4 mr-1" /> Chọn file khác
              </Button>
              <Button variant="outline" onClick={handleAppend} disabled={importedQuestions.length === 0}>
                <ListPlus className="h-4 w-4 mr-1" /> Thêm vào danh sách
              </Button>
              <Button onClick={handleReplace} disabled={importedQuestions.length === 0}>
                <RefreshCw className="h-4 w-4 mr-1" /> Thay thế danh sách
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
