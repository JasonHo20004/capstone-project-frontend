import type { ReactNode } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
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

type Mode = "reading" | "listening" | "writing" | "speaking";

interface BaseShellProps {
  title: string;
  subtitle?: string;
  durationSeconds: number;
  totalQuestions: number;
  answeredCount: number;
  onSubmit: () => void;
  isSubmitting?: boolean;
  onBackHref?: string;
  onBackClick?: () => void;
  backConfirm?: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
  };
  leftContent: ReactNode;
  rightContent: ReactNode;
  navigator: ReactNode;
}

interface ShellProps extends BaseShellProps {
  mode: Mode;
}

function formatSeconds(totalSeconds: number) {
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function iconForMode(mode: Mode) {
  switch (mode) {
    case "listening":
      return "headphones";
    case "writing":
      return "edit_note";
    case "speaking":
      return "mic";
    case "reading":
    default:
      return "menu_book";
  }
}

function Shell({
  mode,
  title,
  subtitle,
  durationSeconds,
  totalQuestions,
  answeredCount,
  onSubmit,
  isSubmitting,
  onBackHref,
  onBackClick,
  backConfirm,
  leftContent,
  rightContent,
  navigator,
}: ShellProps) {
  const [isExitOpen, setIsExitOpen] = useState(false);

  const BackControl = () => {
    if (onBackClick) {
      return (
        <>
          <button
            type="button"
            onClick={() => setIsExitOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
            aria-label="Back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>

          <AlertDialog open={isExitOpen} onOpenChange={setIsExitOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{backConfirm?.title ?? "Exit test?"}</AlertDialogTitle>
                <AlertDialogDescription>
                  {backConfirm?.description ??
                    "Your progress may be lost. Are you sure you want to leave this test?"}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel type="button">
                  {backConfirm?.cancelText ?? "Stay"}
                </AlertDialogCancel>
                <AlertDialogAction
                  type="button"
                  onClick={() => {
                    setIsExitOpen(false);
                    onBackClick();
                  }}
                >
                  {backConfirm?.confirmText ?? "Exit"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    }

    return (
      <Link
        to={onBackHref ?? "/dashboard"}
        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
        aria-label="Back"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </Link>
    );
  };

  return (
    <div className="bg-[#f8fafc] rounded-2xl border border-slate-200 shadow-sm flex flex-col text-slate-900 overflow-hidden">
      {/* Header - slight variations per mode */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <BackControl />
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg bg-indigo-600">
            <span className="material-symbols-outlined text-[20px]">
              {iconForMode(mode)}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-300 mx-2" />
          <div className="min-w-0">
            <h1 className="font-bold text-slate-800 truncate">{title}</h1>
            {subtitle ? (
              <span className="text-xs font-medium text-slate-500 truncate">
                {subtitle}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md">
            <span className="material-symbols-outlined text-slate-500 text-[20px]">
              timer
            </span>
            <span className="font-mono font-bold text-slate-700">
              {formatSeconds(durationSeconds)}
            </span>
          </div>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            type="button"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </header>

      {/* Main Layout shared with design */}
      <div className="flex min-h-[480px]">
        {/* Left panel: passage/audio/etc. */}
        <div className="w-1/2 bg-white border-r border-slate-200 flex flex-col">
          {leftContent}
        </div>

        {/* Right panel: questions + navigator */}
        <div className="w-1/2 bg-[#f8fafc] flex flex-col">
          {rightContent}

          <div className="bg-white border-t border-slate-200 p-4 shrink-0">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Question Navigator
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>
                  Answered {answeredCount}/{totalQuestions}
                </span>
              </div>
            </div>
            {navigator}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReadingShell(props: BaseShellProps) {
  return <Shell mode="reading" {...props} />;
}

export function ListeningShell(props: BaseShellProps) {
  return <Shell mode="listening" {...props} />;
}

export function WritingShell(props: BaseShellProps) {
  return <Shell mode="writing" {...props} />;
}

export function SpeakingShell(props: BaseShellProps) {
  return <Shell mode="speaking" {...props} />;
}

