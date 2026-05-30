import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft, ClipboardList, Clock, ListChecks, Trophy, Trash2,
  Loader2, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { courseService } from "@/lib/api/services/course.service";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { toast } from "sonner";

interface DetailQuestion {
  id?: string;
  questionText?: string;
  options?: string[];
  correctAnswerIndex?: number;
  explanation?: string;
  questionOrder?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  answer?: any;
}

interface DetailSection {
  id?: string;
  title?: string;
  questions?: DetailQuestion[];
}

interface TestDetail {
  id: string;
  title: string;
  status: string;
  testType: string | null;
  durationInMinutes: number | null;
  totalScore: number | null;
  passingScore: number | null;
  englishTestType?: { name: string } | null;
  sections?: DetailSection[];
  questions?: DetailQuestion[];
  createdAt: string;
  updatedAt: string | null;
}

export default function SellerTestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("seller");
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-GB";

  const [test, setTest] = useState<TestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    courseService
      .getTestById(id, { includeAnswers: true })
      .then((res) => {
        setTest(res.data as TestDetail);
      })
      .catch((err) => {
        console.error(err);
        const status = (err as { response?: { status?: number } })?.response?.status;
        setError(status === 404 ? t("testDetail.notFound") : t("testDetail.loadError"));
      })
      .finally(() => setLoading(false));
  }, [id, t]);

  // Flatten — final tests have questions nested under sections[0].
  const allQuestions: DetailQuestion[] = (() => {
    if (!test) return [];
    if (Array.isArray(test.questions) && test.questions.length > 0) return test.questions;
    if (Array.isArray(test.sections) && test.sections.length > 0) {
      return test.sections.flatMap((s) => s.questions ?? []);
    }
    return [];
  })();

  const resolveCorrectIdx = (q: DetailQuestion): number | null => {
    if (typeof q.correctAnswerIndex === "number") return q.correctAnswerIndex;
    if (q.answer && typeof q.answer === "object" && typeof q.answer.correctIndex === "number") {
      return q.answer.correctIndex;
    }
    return null;
  };

  const passPercent =
    test?.passingScore != null && test?.totalScore != null && test.totalScore > 0
      ? Math.round((test.passingScore / test.totalScore) * 100)
      : null;

  const handleDelete = async () => {
    if (!test) return;
    setDeleting(true);
    try {
      await courseService.deleteTest(test.id);
      toast.success(t("testDetail.deleteSuccess"));
      navigate("/seller/tests");
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t("testDetail.deleteError");
      toast.error(msg);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
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
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/seller/tests")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> {t("testDetail.backToList")}
        </Button>
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!test) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/seller/tests")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("testDetail.list")}
          </Button>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            {test.title}
          </h1>
          {test.testType === "FINAL" && <Badge variant="secondary">{t("testDetail.finalBadge")}</Badge>}
          <Badge variant="outline">{test.status}</Badge>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmDelete(true)}
          disabled={deleting}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {t("testDetail.deleteAction")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <ListChecks className="w-5 h-5 mx-auto text-primary mb-1" />
            <div className="text-2xl font-bold">{allQuestions.length}</div>
            <div className="text-xs text-muted-foreground">{t("testDetail.stats.questions")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 mx-auto text-primary mb-1" />
            <div className="text-2xl font-bold">{test.durationInMinutes ?? "—"}</div>
            <div className="text-xs text-muted-foreground">{t("testDetail.stats.minutes")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-5 h-5 mx-auto text-primary mb-1" />
            <div className="text-2xl font-bold">{test.totalScore ?? "—"}</div>
            <div className="text-xs text-muted-foreground">{t("testDetail.stats.totalScore")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
            <div className="text-2xl font-bold">{passPercent != null ? `${passPercent}%` : "—"}</div>
            <div className="text-xs text-muted-foreground">{t("testDetail.stats.passScore")}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("testDetail.generalInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div>
            {t("testDetail.typeLabel")} <span className="font-medium">{test.englishTestType?.name || "—"}</span>
          </div>
          <div>
            {t("testDetail.createdLabel")} <span className="font-medium">{new Date(test.createdAt).toLocaleString(dateLocale)}</span>
          </div>
          {test.updatedAt && (
            <div>
              {t("testDetail.updatedLabel")}{" "}
              <span className="font-medium">{new Date(test.updatedAt).toLocaleString(dateLocale)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("testDetail.questionListTitle", { count: allQuestions.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          {allQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <AlertTriangle className="w-8 h-8 mb-2" />
              <p className="text-sm">{t("testDetail.emptyQuestions")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allQuestions.map((q, idx) => {
                const correctIdx = resolveCorrectIdx(q);
                return (
                  <div key={q.id ?? idx} className="rounded-lg border p-4">
                    <div className="font-semibold text-sm mb-2">
                      {t("testDetail.questionLabel", { n: idx + 1 })}{" "}
                      {q.questionText || (
                        <em className="text-muted-foreground">{t("testDetail.noContent")}</em>
                      )}
                    </div>
                    <div className="space-y-1">
                      {(q.options ?? []).map((opt, oi) => (
                        <div
                          key={oi}
                          className={`text-sm px-2 py-1.5 rounded ${
                            correctIdx === oi
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium"
                              : "bg-muted/30"
                          }`}
                        >
                          <span className="font-mono mr-2">{String.fromCharCode(65 + oi)}.</span>
                          {opt}
                          {correctIdx === oi && (
                            <CheckCircle2 className="inline w-3.5 h-3.5 ml-2 -mt-0.5" />
                          )}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="mt-2 text-xs text-muted-foreground italic">
                        {t("testDetail.explanationLabel")} {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              {t("testDetail.deleteDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Trans
                i18nKey="testDetail.deleteDialog.body"
                ns="seller"
                values={{ title: test.title }}
                components={{ strong: <strong /> }}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("testDetail.deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("testDetail.deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
