import { useEffect, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ClipboardList, Clock, ListChecks, Trophy, Link2, Trash2,
  Search, RefreshCw, FileWarning, Loader2,
} from "lucide-react";
import { courseService } from "@/lib/api/services/course.service";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { toast } from "sonner";

interface SellerTest {
  id: string;
  title: string;
  status: string;
  testType: string | null;
  durationInMinutes: number | null;
  totalScore: number | null;
  passingScore: number | null;
  practiceCount: number | null;
  createdAt: string;
  updatedAt: string | null;
  englishTestType: { name: string } | null;
  _count: { sections: number; questions: number; courseTests: number };
}

export default function SellerTests() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('seller');

  const [tests, setTests] = useState<SellerTest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<SellerTest | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await courseService.getMyTests();
      setTests(res.data ?? []);
    } catch (err) {
      console.error(err);
      setError(t("tests.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // One-shot backfill per browser tab — repairs `_count.courseTests` for
    // tests that were linked before course-test sync existed. Idempotent so
    // re-runs are cheap; the flag just avoids the round-trip after the first.
    const KEY = 'courseTestsBackfilled';
    const run = async () => {
      if (!sessionStorage.getItem(KEY)) {
        try {
          await courseService.syncCourseTests();
          sessionStorage.setItem(KEY, '1');
        } catch (err) {
          console.warn('Backfill failed (continuing with stale counts):', err);
        }
      }
      await load();
    };
    run();
  }, []);

  const filtered = (tests ?? []).filter((t) =>
    !search.trim() ? true : t.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await courseService.deleteTest(pendingDelete.id);
      toast.success(t("tests.deleted"));
      setTests((prev) => (prev ?? []).filter((x) => x.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      // Most common reason for failure is FK from CourseTest — the test is
      // still linked to a course as a final test.
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t("tests.deleteFailedLinked");
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            {t('tests.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('tests.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('tests.reload')}
          </Button>
          <Button size="sm" onClick={() => navigate('/seller/tests/new')}>
            <ClipboardList className="w-4 h-4 mr-2" />
            {t('tests.create')}
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('tests.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileWarning className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {tests?.length === 0
                ? t('tests.emptyNone')
                : t('tests.emptyFiltered')}
            </p>
            {tests?.length === 0 && (
              <Button
                size="sm"
                className="mt-4"
                onClick={() => navigate('/seller/tests/new')}
              >
                <ClipboardList className="w-4 h-4 mr-2" /> {t('tests.create')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((test) => {
            const linkedCount = test._count?.courseTests ?? 0;
            const isLinked = linkedCount > 0;
            return (
              <Card key={test.id} className="flex flex-col">
                <CardContent className="p-5 space-y-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight line-clamp-2">{test.title}</h3>
                    {test.testType === "FINAL" && (
                      <Badge variant="secondary" className="shrink-0">
                        {t('tests.finalBadge')}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="font-normal">
                      <ListChecks className="w-3 h-3 mr-1" />
                      {t('tests.questionCount', { count: test._count?.questions ?? 0 })}
                    </Badge>
                    {test.durationInMinutes ? (
                      <Badge variant="outline" className="font-normal">
                        <Clock className="w-3 h-3 mr-1" />
                        {t('tests.minutes', { count: test.durationInMinutes })}
                      </Badge>
                    ) : null}
                    {test.passingScore != null && test.totalScore != null && test.totalScore > 0 ? (
                      <Badge variant="outline" className="font-normal">
                        <Trophy className="w-3 h-3 mr-1" />
                        {t('tests.passPercent', { percent: Math.round((test.passingScore / test.totalScore) * 100) })}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      {t('tests.typeLabel')}{" "}
                      <span className="text-foreground">
                        {test.englishTestType?.name || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link2 className="w-3 h-3" />
                      {isLinked ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {t('tests.linkedTo', { count: linkedCount })}
                        </span>
                      ) : (
                        <span>{t('tests.notLinked')}</span>
                      )}
                    </div>
                    <div>
                      {t('tests.statusLabel')}{" "}
                      <Badge variant="secondary" className="font-normal">
                        {test.status}
                      </Badge>
                    </div>
                    <div>{t('tests.createdLabel', { date: new Date(test.createdAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-GB') })}</div>
                  </div>
                </CardContent>

                <div className="border-t p-3 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/seller/tests/${test.id}`)}
                  >
                    {t('tests.view')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setPendingDelete(test)}
                    title={isLinked ? t('tests.deleteLinkedTitle') : t('tests.deleteTitle')}
                    disabled={isLinked}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              {t('tests.deleteDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Trans
                i18nKey="tests.deleteDialog.body"
                ns="seller"
                values={{ title: pendingDelete?.title }}
                components={{ strong: <strong className="text-slate-900" /> }}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('tests.deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {t('tests.deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
