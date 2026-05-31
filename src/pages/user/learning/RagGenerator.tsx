import { useState, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useMutation } from "@tanstack/react-query";
import { ragService, type FlashcardItem } from "@/lib/api/services/rag.service";
import { useGetDecks } from "@/hooks/api/use-flashcards";
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
  Send,
  MessageCircle,
  Bot,
  User,
  RotateCcw,
  Type,
  Scissors,
  Lightbulb,
  Paperclip,
} from "lucide-react";

type InputMode = "file" | "text";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  chunks?: string[];
}

interface RagGeneratorProps {
  embedded?: boolean;
}

export default function RagGenerator({ embedded = false }: RagGeneratorProps) {
  const navigate = useNavigate();
  const { t } = useTranslation("flashcards");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    docId: string;
    deckId?: string;
    sourcePages: number;
    chunksUsed: number;
  } | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showChunks, setShowChunks] = useState<number | null>(null);

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
      docId: data.doc_id,
      deckId: data.deck_id,
      sourcePages: data.source_pages,
      chunksUsed: data.chunks_used,
    });
    setChatMessages([{
      role: "assistant",
      content: t("ragGenerator.result.stats", {
        count: data.flashcards.length,
        pages: data.source_pages,
        chunks: data.chunks_used,
      }),
    }]);
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
      return ragService.generateFlashcards(file, selectedDeckTitle, userId);
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
      return ragService.generateFlashcardsFromText(textInput.trim(), selectedDeckTitle, userId);
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

  const askMutation = useMutation({
    mutationFn: (question: string) => {
      if (!result?.docId) throw new Error("No document loaded");
      return ragService.askQuestion(result.docId, question);
    },
    onSuccess: (data) => {
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: data.answer,
        chunks: data.relevant_chunks,
      }]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || error.message || "Error";
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: `[Error] ${msg}`,
      }]);
    },
  });

  const handleSendQuestion = () => {
    const q = chatInput.trim();
    if (!q || askMutation.isPending) return;
    setChatMessages(prev => [...prev, { role: "user", content: q }]);
    setChatInput("");
    askMutation.mutate(q);
  };

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

            {/* Pipeline Info */}
            <Card className="border border-slate-100 bg-slate-50/50">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  {t("ragGenerator.pipeline.title")}
                </p>
                <div className="space-y-2.5">
                  {[
                    { step: "1", text: inputMode === "file" ? t("ragGenerator.pipeline.steps.1file") : t("ragGenerator.pipeline.steps.1text"), icon: <FileText size={16} /> },
                    { step: "2", text: t("ragGenerator.pipeline.steps.2"), icon: <Scissors size={16} /> },
                    { step: "3", text: t("ragGenerator.pipeline.steps.3"), icon: <Sparkles size={16} /> },
                    { step: "4", text: t("ragGenerator.pipeline.steps.4"), icon: <Sparkles size={16} /> },
                    { step: "5", text: t("ragGenerator.pipeline.steps.5"), icon: <MessageCircle size={16} /> },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-3">
                      <span className="text-slate-400 flex-shrink-0">{item.icon}</span>
                      <span className="text-sm text-slate-500">{item.text}</span>
                    </div>
                  ))}
                </div>
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

          {/* Main content: Flashcards + Chat side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Flashcard Grid */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[650px] overflow-y-auto pr-1">
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

            {/* Right: RAG Q&A Chat */}
            <div className="lg:col-span-2">
              <Card className="border border-slate-200 shadow-sm flex flex-col" style={{ height: "650px" }}>
                <CardHeader className="pb-3 border-b border-slate-100 flex-shrink-0">
                  <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    {t("ragGenerator.result.chatTitle")}
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold ml-auto">
                      {t("ragGenerator.result.chatBadge")}
                    </Badge>
                  </CardTitle>
                </CardHeader>

                {/* Chat messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-slate-100 text-slate-700 rounded-bl-md"
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.chunks && msg.chunks.length > 0 && (
                          <button
                            className={`text-xs mt-2 underline transition-colors ${
                              msg.role === "user" ? "text-white/70 hover:text-white" : "text-primary/70 hover:text-primary"
                            }`}
                            onClick={() => setShowChunks(showChunks === idx ? null : idx)}>
                            {showChunks === idx
                              ? t("ragGenerator.result.hideSource")
                              : <><Paperclip size={12} className="inline mr-1" />{t("ragGenerator.result.viewSource", { count: msg.chunks.length })}</>}
                          </button>
                        )}
                        {showChunks === idx && msg.chunks && (
                          <div className="mt-2 space-y-1.5">
                            {msg.chunks.map((chunk, ci) => (
                              <div key={ci} className="text-xs text-slate-500 p-2 rounded-lg bg-white border border-slate-200">
                                {chunk.length > 200 ? chunk.substring(0, 200) + "..." : chunk}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/20">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                  {askMutation.isPending && (
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-xs text-slate-400">{t("ragGenerator.result.searching")}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t border-slate-100 flex-shrink-0">
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendQuestion()}
                      placeholder={t("ragGenerator.result.chatPlaceholder")}
                      className="border-slate-200 focus:border-primary"
                      disabled={askMutation.isPending}
                    />
                    <Button
                      size="icon"
                      disabled={!chatInput.trim() || askMutation.isPending}
                      onClick={handleSendQuestion}
                      className="bg-primary hover:bg-primary/90 flex-shrink-0"
                      aria-label={t("ragGenerator.result.send")}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
