import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
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
  AlertTriangle, Plus, Check,
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
  const { t } = useTranslation('seller');
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
      .catch(() => toast.error(t('finalTestTab.toastLoadTestFailed')))
      .finally(() => setLoadingExisting(false));
  }, [finalTestId, t]);

  const openPicker = () => {
    setPickerOpen(true);
    setPickerSelectedId(null);
    setPickerSearch('');
    setPickerLoading(true);
    courseService.getMyTests()
      .then((res) => setPickerTests((res.data as PickerTest[]) ?? []))
      .catch(() => toast.error(t('finalTestTab.toastLoadListFailed')))
      .finally(() => setPickerLoading(false));
  };

  const handleLinkExisting = async () => {
    if (!pickerSelectedId) {
      toast.error(t('finalTestTab.toastPickOne'));
      return;
    }
    setLinking(true);
    try {
      await courseService.setFinalTest(courseId, pickerSelectedId);
      toast.success(t('finalTestTab.toastLinked'));
      setPickerOpen(false);
      onTestLinked();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? t('finalTestTab.toastLinkFailed');
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
      toast.success(t('finalTestTab.toastDeleted'));
      setExistingTest(null);
      setConfirmRemoveOpen(false);
      onTestLinked();
    } catch {
      toast.error(t('finalTestTab.toastDeleteFailed'));
    } finally {
      setRemoving(false);
    }
  };

  const filteredPickerTests = (pickerTests ?? []).filter((pt) =>
    !pickerSearch.trim() ? true : pt.title.toLowerCase().includes(pickerSearch.trim().toLowerCase())
  );

  if (loadingExisting) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">{t('finalTestTab.loading')}</span>
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
                <CardTitle>{t('finalTestTab.title')}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/seller/tests/${existingTest.id}/edit`)}
                >
                  <Pencil className="h-4 w-4 mr-1" /> {t('finalTestTab.edit')}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setConfirmRemoveOpen(true)} disabled={removing}>
                  {removing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
                  {t('finalTestTab.delete')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label={t('finalTestTab.questions')} value={existingTest.questions?.length ?? 0} />
              <Stat label={t('finalTestTab.minutes')} value={existingTest.durationInMinutes} />
              <Stat label={t('finalTestTab.totalScore')} value={existingTest.totalScore} />
              <Stat label={t('finalTestTab.passingScore')} value={existingTest.passingScore} />
            </div>

            <div>
              <h3 className="font-semibold mb-2">{existingTest.title}</h3>
              <Badge variant="secondary">{t('finalTestTab.multipleChoice')}</Badge>
            </div>

            {existingTest.questions && existingTest.questions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">{t('finalTestTab.questionList')}</h4>
                {existingTest.questions.map((q, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="font-medium text-sm">{t('finalTestTab.questionLabel', { n: i + 1 })}: {q.questionText}</div>
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
                          {oi === q.correctAnswerIndex && <Check size={12} className="inline ml-1" />}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="mt-2 text-xs text-muted-foreground italic">
                        {t('finalTestTab.explanation')}: {q.explanation}
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
                <Trash2 className="w-5 h-5" /> {t('finalTestTab.confirmDeleteTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                <Trans
                  i18nKey="finalTestTab.confirmDeleteDesc"
                  ns="seller"
                  values={{ title: existingTest.title }}
                  components={{ strong: <strong className="text-slate-900" /> }}
                />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={removing}>{t('finalTestTab.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                disabled={removing}
                onClick={(e) => { e.preventDefault(); handleRemove(); }}
              >
                {removing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {t('finalTestTab.deletePermanent')}
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
            {t('finalTestTab.emptyTitle')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{t('finalTestTab.emptyDescription')}</p>
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
                <h3 className="font-semibold text-slate-900">{t('finalTestTab.linkExistingTitle')}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                <Trans
                  i18nKey="finalTestTab.linkExistingDesc"
                  ns="seller"
                  components={{ strong: <strong /> }}
                />
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
                <h3 className="font-semibold text-slate-900">{t('finalTestTab.createNewTitle')}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{t('finalTestTab.createNewDesc')}</p>
            </button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={pickerOpen} onOpenChange={(o) => !linking && setPickerOpen(o)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              {t('finalTestTab.pickerTitle')}
            </DialogTitle>
            <DialogDescription>{t('finalTestTab.pickerDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('finalTestTab.searchPlaceholder')}
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
                    ? t('finalTestTab.pickerEmpty')
                    : t('finalTestTab.pickerNoMatch')}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {filteredPickerTests.map((pt) => {
                  const active = pickerSelectedId === pt.id;
                  return (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => setPickerSelectedId(pt.id)}
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
                        <div className="font-medium truncate">{pt.title}</div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {pt.testType === 'FINAL' && (
                            <Badge variant="secondary" className="font-normal">{t('finalTestTab.badgeFinal')}</Badge>
                          )}
                          <Badge variant="outline" className="font-normal">
                            {t('finalTestTab.badgeQuestionCount', { count: pt._count?.questions ?? 0 })}
                          </Badge>
                          {pt.durationInMinutes ? (
                            <Badge variant="outline" className="font-normal">
                              {t('finalTestTab.badgeMinutes', { count: pt.durationInMinutes })}
                            </Badge>
                          ) : null}
                          {(pt._count?.courseTests ?? 0) > 0 && (
                            <Badge variant="outline" className="font-normal text-amber-700 border-amber-200">
                              {t('finalTestTab.badgeInUse', { count: pt._count?.courseTests })}
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
              {t('finalTestTab.cancel')}
            </Button>
            <Button onClick={handleLinkExisting} disabled={!pickerSelectedId || linking}>
              {linking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('finalTestTab.linkAsFinal')}
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
