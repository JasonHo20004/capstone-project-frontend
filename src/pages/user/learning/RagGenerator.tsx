import { useState, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ragService, type FlashcardItem } from "@/lib/api/services/rag.service";
import { useGetDecks, flashcardKeys } from "@/hooks/api/use-flashcards";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  Sparkles,
  Loader2,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  X,
  Zap,
  Brain,
  RotateCcw,
  Type,
  Lightbulb,
} from "lucide-react";

type InputMode = "file" | "text";

interface RagGeneratorProps {
  embedded?: boolean;
}

export default function RagGenerator({ embedded = false }: RagGeneratorProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation("flashcards");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing decks for dropdown
  const { data: decksData } = useGetDecks();
  const decks = useMemo(() => decksData || [], [decksData]);

  // Input mode
  const [inputMode, setInputMode] = useState<InputMode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");

  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const selectedDeckTitle = useMemo(
    () => decks.find(d => d.id === selectedDeckId)?.title || "AI Generated Deck",
    [decks, selectedDeckId]
  );
  const [result, setResult] = useState<{
    flashcards: FlashcardItem[];
    deckId?: string;
    sourcePages: number;
    chunksUsed: number;
  } | null>(null);

  const getUserId = () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return "";
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId || payload.sub || "";
    } catch {
      return "";
    }
  };

  const handleSuccess = (data: any) => {
    setResult({
      flashcards: data.flashcards,
      deckId: data.deck_id,
      sourcePages: data.source_pages,
      chunksUsed: data.chunks_used,
    });
    // Làm mới cache để thẻ AI tạo xuất hiện ngay (không cần reload trang)
    queryClient.invalidateQueries({ queryKey: flashcardKeys.allDecks });
    if (data.deck_id) {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.cardsByDeck(data.deck_id) });
      queryClient.invalidateQueries({ queryKey: flashcardKeys.reviewQueue(data.deck_id) });
    }
    toast.success(t("ragGenerator.result.successBadge"));
  };

  const handleError = (error: any) => {
    const msg = error?.response?.data?.detail || error.message || "Error generating flashcards";
    toast.error(msg);
  };

  // Mutation: File upload
  const generateFileMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("No file selected");
      const userId = getUserId();
      if (!userId) throw new Error("Not authenticated");
      return ragService.generateFlashcards(file, selectedDeckTitle, userId, true, selectedDeckId);
    },
    onSuccess: handleSuccess,
    onError: handleError,
  });

  // Mutation: Text input
  const generateTextMutation = useMutation({
    mutationFn: () => {
      if (!textInput.trim() || textInput.trim().length < 50) throw new Error("Content too short (minimum 50 characters)");
      const userId = getUserId();
      if (!userId) throw new Error("Not authenticated");
      return ragService.generateFlashcardsFromText(textInput.trim(), selectedDeckTitle, userId, true, selectedDeckId);
    },
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const isGenerating = generateFileMutation.isPending || generateTextMutation.isPending;

  const handleGenerate = () => {
    if (inputMode === "file") {
      generateFileMutation.mutate();
    } else {
      generateTextMutation.mutate();
    }
  };

  const hasInput = inputMode === "file" ? !!file : textInput.trim().length >= 50;
  const canGenerate = hasInput && !!selectedDeckId;

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.name.endsWith(".pdf") || dropped.name.endsWith(".txt"))) {
      setFile(dropped);
    } else {
      toast.error(t("ragGenerator.dropzone.formats"));
    }
  }, [t]);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
    setTextInput("");
    setChatMessages([]);
    setSelectedDeckId("");
  };

  return (
    <div className={embedded ? "space-y-6" : "max-w-6xl mx-auto space-y-8"}>
      {/* Header — hidden when embedded in dialog */}
      {!embedded && (
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Brain className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">{t("ragGenerator.ragBadge")}</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("ragGenerator.title")}
          </h1>
          <p className="text-slate-500 mt-1">
            {t("ragGenerator.subtitle")}
          </p>
        </div>
      )}

      {/* ── Upload Phase ── */}
      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Input Zone */}
          <div className="lg:col-span-3">
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2 text-lg">
                  <Upload className="w-5 h-5 text-primary" />
                  {t("ragGenerator.inputCard.title")}
                </CardTitle>
                <CardDescription>
                  {t("ragGenerator.inputCard.desc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tab switcher */}
                <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  <button
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                      inputMode === "file"
                        ? "bg-white text-primary shadow-sm border border-slate-200"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                    onClick={() => setInputMode("file")}
                  >
                    <FileText className="w-4 h-4" />
                    {t("ragGenerator.inputCard.uploadTab")}
                  </button>
                  <button
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                      inputMode === "text"
                        ? "bg-white text-primary shadow-sm border border-slate-200"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                    onClick={() => setInputMode("text")}
                  >
                    <Type className="w-4 h-4" />
                    {t("ragGenerator.inputCard.textTab")}
                  </button>
                </div>

                {/* File upload zone */}
                {inputMode === "file" ? (
                  <div
                    className="rounded-xl p-12 text-center cursor-pointer transition-all duration-300 group/dropzone"
                    style={{
                      border: file ? "2px solid #22c55e" : "2px dashed #cbd5e1",
                      background: file ? "rgba(34, 197, 94, 0.04)" : "rgba(241, 245, 249, 0.5)",
                    }}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input ref={fileInputRef} type="file" accept=".pdf,.txt" className="hidden" onChange={onFileSelect} />
                    {file ? (
                      <div className="space-y-3">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-50">
                          <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <p className="text-slate-900 font-semibold text-lg">{file.name}</p>
                        <p className="text-slate-500 text-sm">{formatFileSize(file.size)}</p>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500"
                          onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                          <X className="w-4 h-4 mr-1" /> {t("ragGenerator.dropzone.deselect")}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/5 group-hover/dropzone:bg-primary/10 transition-colors">
                          <FileText className="w-8 h-8 text-primary/60 group-hover/dropzone:text-primary transition-colors" />
                        </div>
                        <p className="text-slate-700 font-medium">{t("ragGenerator.dropzone.hint")}</p>
                        <p className="text-slate-400 text-sm">{t("ragGenerator.dropzone.formats")}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Text input zone */
                  <div className="space-y-2">
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder={t("ragGenerator.dropzone.textPlaceholder")}
                      className="w-full min-h-[280px] p-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 resize-y focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <div className="flex items-center justify-between text-xs">
                      <span className={`${textInput.trim().length >= 50 ? "text-green-600" : "text-slate-400"}`}>
                        {t("ragGenerator.dropzone.charCount", { count: textInput.trim().length })}
                        {textInput.trim().length < 50 && ` ${t("ragGenerator.dropzone.charCountMin")}`}
                      </span>
                      {textInput.trim().length > 0 && (
                        <button
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          onClick={() => setTextInput("")}
                        >
                          {t("ragGenerator.dropzone.clearContent")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Settings */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-amber-500" /> {t("ragGenerator.settings.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">{t("ragGenerator.settings.deckLabel")}</Label>
                  <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                    <SelectTrigger className="border-slate-200 focus:border-primary focus:ring-primary/20">
                      <SelectValue placeholder={t("ragGenerator.settings.deckPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {decks.map((deck) => (
                        <SelectItem key={deck.id} value={deck.id}>
                          {deck.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {decks.length === 0 && (
                    <p className="text-xs text-amber-600">{t("ragGenerator.settings.noDeck")}</p>
                  )}
                </div>
                <Button className="w-full mt-4 h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
                  disabled={!canGenerate || isGenerating}
                  onClick={handleGenerate}>
                  {isGenerating ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t("ragGenerator.settings.generating")}</>
                  ) : (
                    <><Sparkles className="w-5 h-5 mr-2" /> {t("ragGenerator.settings.generateBtn")}</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* ── Result + Chat Phase ── */
        <div className="space-y-5">
          {/* Top bar: Status + Actions */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> {t("ragGenerator.result.successBadge")}
              </Badge>
              <span className="text-slate-400 text-sm">
                {t("ragGenerator.result.stats", {
                  count: result.flashcards.length,
                  pages: result.sourcePages,
                  chunks: result.chunksUsed,
                })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="border-slate-200" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" /> {t("ragGenerator.result.createNew")}
              </Button>
              {result.deckId && (
                <Button className="bg-primary hover:bg-primary/90 shadow-sm"
                  onClick={() => navigate("/flashcards")}>
                  <BookOpen className="w-4 h-4 mr-2" /> {t("ragGenerator.result.openFlashcards")} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Flashcard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {result.flashcards.map((card, idx) => (
              <Card key={idx}
                className="border border-slate-200 hover:border-primary/30 hover:shadow-md transition-all duration-200 group">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-primary border-primary/20 text-[10px] font-bold">
                      #{idx + 1}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-primary transition-colors">
                    {card.front_content}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-2">
                    {card.back_content}
                  </p>
                  {card.example_sentence && (
                    <p className="text-slate-400 text-xs italic border-t border-slate-100 pt-2 mt-2 flex items-center gap-1">
                      <Lightbulb size={16} /> {card.example_sentence}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
