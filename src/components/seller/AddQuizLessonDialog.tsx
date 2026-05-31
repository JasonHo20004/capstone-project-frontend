import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ClipboardList, Loader2, FileWarning, ListChecks, Clock, ExternalLink } from "lucide-react";
import { courseService } from "@/lib/api/services/course.service";
import { useCreateLesson } from "@/hooks/api";
import { toast } from "sonner";
import type { Lesson } from "@/domain";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  moduleId: string;
  /** All lessons currently in the module — used to compute next lessonOrder. */
  existingLessons: Pick<Lesson, "lessonOrder">[];
  onSuccess?: () => void;
}

interface MyTest {
  id: string;
  title: string;
  durationInMinutes: number | null;
  testType: string | null;
  status: string;
  _count?: { questions: number; courseTests: number };
}

export default function AddQuizLessonDialog({
  open,
  onOpenChange,
  courseId,
  moduleId,
  existingLessons,
  onSuccess,
}: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation("seller");
  const [tests, setTests] = useState<MyTest[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const createLessonMutation = useCreateLesson();

  // Load tests every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setSelectedId(null);
    setSearch("");
    courseService
      .getMyTests()
      .then((res) => setTests((res.data as MyTest[]) ?? []))
      .catch((err) => {
        console.error(err);
        setError(t("addQuizLesson.errors.loadFailed"));
      })
      .finally(() => setLoading(false));
  }, [open]);

  const nextOrder = useMemo(() => {
    if (existingLessons.length === 0) return 1;
    return Math.max(...existingLessons.map((l) => l.lessonOrder ?? 0)) + 1;
  }, [existingLessons]);

  const filtered = useMemo(() => {
    const list = tests ?? [];
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter((t) => t.title.toLowerCase().includes(q));
  }, [tests, search]);

  const handleSave = () => {
    if (!selectedId) {
      toast.error(t("addQuizLesson.errors.noneSelected"));
      return;
    }
    const selected = tests?.find((t) => t.id === selectedId);
    if (!selected) return;

    const fd = new FormData();
    fd.append("title", selected.title);
    fd.append("moduleId", moduleId);
    fd.append("testId", selectedId);
    fd.append("lessonOrder", String(nextOrder));

    createLessonMutation.mutate(
      { courseId, formData: fd },
      {
        onSuccess: () => {
          onSuccess?.();
          onOpenChange(false);
        },
        onError: (err) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            t("addQuizLesson.errors.addFailed");
          toast.error(msg);
        },
      }
    );
  };

  const isPending = createLessonMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            {t("addQuizLesson.title")}
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="addQuizLesson.lead"
              ns="seller"
              components={{ strong: <strong /> }}
            />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("addQuizLesson.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              disabled={isPending}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <FileWarning className="w-8 h-8 mb-2" />
              <p className="text-sm max-w-sm">
                {tests?.length === 0
                  ? t("addQuizLesson.empty.noneCreated")
                  : t("addQuizLesson.empty.noMatch")}
              </p>
              {tests?.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate("/seller/tests")}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  {t("addQuizLesson.empty.openTestsPage")}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {filtered.map((test) => {
                const active = selectedId === test.id;
                return (
                  <button
                    key={test.id}
                    type="button"
                    onClick={() => setSelectedId(test.id)}
                    disabled={isPending}
                    className={`w-full text-left rounded-lg border p-3 flex items-start gap-3 transition-colors ${
                      active
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 ${
                        active ? "border-primary bg-primary" : "border-slate-300"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{test.title}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {test.testType === "FINAL" && (
                          <Badge
                            variant="secondary"
                            className="font-normal bg-amber-100 text-amber-800 border-amber-200"
                            title={t("addQuizLesson.finalBadgeTitle")}
                          >
                            {t("addQuizLesson.finalBadge")}
                          </Badge>
                        )}
                        <Badge variant="outline" className="font-normal">
                          <ListChecks className="w-3 h-3 mr-1" />
                          {t("addQuizLesson.questionCount", { count: test._count?.questions ?? 0 })}
                        </Badge>
                        {test.durationInMinutes ? (
                          <Badge variant="outline" className="font-normal">
                            <Clock className="w-3 h-3 mr-1" />
                            {t("addQuizLesson.minutes", { count: test.durationInMinutes })}
                          </Badge>
                        ) : null}
                        <span className="text-[10px]">{test.status}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {t("addQuizLesson.nextOrderHint", { order: nextOrder })}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("addQuizLesson.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={!selectedId || isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("addQuizLesson.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
