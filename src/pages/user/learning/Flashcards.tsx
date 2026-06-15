import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Edit,
  Plus,
  Trash2,
  Loader2,
  Check,
  ChevronsUpDown,
  Zap,
  BookOpen,
  Play,
  Layers,
  Sparkles,
  Clock,
  RotateCcw,
  Brain,
  Globe,
  Search,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { FlashcardDeck, Flashcard } from "@/domain";
import RagGenerator from "./RagGenerator";
import { DeckList } from "@/components/user/flashcards/DeckList";
import CardList from "@/components/user/flashcards/CardList";
import StudyMode from "@/components/user/flashcards/StudyMode";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { MouseParticles } from "@/components/ui/mouse-particles";
import { formatDate } from "@/lib/utils";

import {
  useGetDecks,
  useGetPublicDecks,
  useGetCards,
  useGetReviewQueue,
  useCreateDeck,
  useUpdateDeck,
  useDeleteDeck,
  useCreateCard,
  useUpdateCard,
  useDeleteCard,
  useResetProgress
} from "@/hooks/api/use-flashcards";
import { useUser } from "@/hooks/api/use-user";
import { useGetTags } from "@/hooks/api/use-tags";
import { DeckFormDTO, CardFormDTO } from "@/lib/api/services/user/flashcard/flashcard.service";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const Flashcards = () => {
  const { user } = useUser();
  const { t } = useTranslation("flashcards");
  const reduceMotion = useReducedMotion() ?? false;

  // ── Tab ────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'mine' | 'explore'>('mine');

  // ── My Decks ───────────────────────────────────────────────────────────────
  const { data: decksData, isLoading: isLoadingDecks } = useGetDecks();
  const decks = useMemo(() => decksData || [], [decksData]);

  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  const { data: cardsData, isLoading: isLoadingCards } =
    useGetCards(selectedDeckId);
  const selectedDeckCards = useMemo(() => cardsData || [], [cardsData]);

  const { data: reviewQueueData, isLoading: isLoadingQueue } = useGetReviewQueue(selectedDeckId);
  const reviewQueueCount = reviewQueueData?.length ?? 0;
  const hasOnlyNewCards = useMemo(
    () => reviewQueueCount > 0 && (reviewQueueData ?? []).every((c) => c.queueType === 'NEW'),
    [reviewQueueData, reviewQueueCount]
  );

  const queryClient = useQueryClient();

  const { data: allTagsData, isLoading: isLoadingTags } = useGetTags();
  const allTags = useMemo(() => allTagsData || [], [allTagsData]);

  useEffect(() => {
    if (!selectedDeckId && decks.length > 0) {
      setSelectedDeckId(decks[0].id);
    }
  }, [decks, selectedDeckId]);

  const selectedDeck = useMemo(
    () => decks.find((d) => d.id === selectedDeckId) ?? null,
    [decks, selectedDeckId]
  );

  const createDeckMutation = useCreateDeck();
  const updateDeckMutation = useUpdateDeck();
  const deleteDeckMutation = useDeleteDeck();
  const createCardMutation = useCreateCard();
  const updateCardMutation = useUpdateCard();
  const deleteCardMutation = useDeleteCard();
  const resetProgressMutation = useResetProgress();

  const [creatingDeck, setCreatingDeck] = useState(false);
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | null>(null);
  const [deletingDeck, setDeletingDeck] = useState<FlashcardDeck | null>(null);
  const [deckForm, setDeckForm] = useState({
    title: "",
    description: "",
    isPublic: false,
    tagIds: [],
  });

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [creatingCard, setCreatingCard] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [deletingCard, setDeletingCard] = useState<Flashcard | null>(null);
  const [cardForm, setCardForm] = useState<Omit<CardFormDTO, 'deckId'>>({
    frontContent: '',
    backContent: '',
    exampleSentence: '',
  });
  const [studyDialogOpen, setStudyDialogOpen] = useState(false);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [ragDialogOpen, setRagDialogOpen] = useState(false);

  // ── Explore (public decks) ─────────────────────────────────────────────────
  const [publicSearch, setPublicSearch] = useState('');
  const [publicSearchInput, setPublicSearchInput] = useState('');
  const [selectedPublicDeckId, setSelectedPublicDeckId] = useState<string | null>(null);
  const [isPublicSheetOpen, setIsPublicSheetOpen] = useState(false);
  const [publicStudyOpen, setPublicStudyOpen] = useState(false);

  const { data: publicDecks, isLoading: isLoadingPublic } = useGetPublicDecks(publicSearch);
  const { data: publicCardsData, isLoading: isLoadingPublicCards } = useGetCards(selectedPublicDeckId);
  const publicCards = useMemo(() => publicCardsData || [], [publicCardsData]);
  const { data: publicQueueData } = useGetReviewQueue(selectedPublicDeckId);
  const publicQueueCount = publicQueueData?.length ?? 0;
  const publicHasOnlyNewCards = useMemo(
    () => publicQueueCount > 0 && (publicQueueData ?? []).every((c) => c.queueType === 'NEW'),
    [publicQueueData, publicQueueCount]
  );

  const selectedPublicDeck = useMemo(
    () => (publicDecks ?? []).find((d) => d.id === selectedPublicDeckId) ?? null,
    [publicDecks, selectedPublicDeckId]
  );

  // Deck handlers
  const openCreateDeck = () => {
    setDeckForm({ title: "", description: "", isPublic: false, tagIds: [] });
    setCreatingDeck(true);
  };

  const saveCreateDeck = () => {
    if (!deckForm.title.trim()) {
      toast.error(t("toast.deckNameRequired"));
      return;
    }
    createDeckMutation.mutate(deckForm, {
      onSuccess: (response) => {
        setSelectedDeckId(response.data.id);
        setCreatingDeck(false);
      },
    });
  };

  const openEditDeck = (deck: FlashcardDeck) => {
    setEditingDeck(deck);
    setDeckForm({
      title: deck.title,
      description: deck.description ?? "",
      isPublic: deck.isPublic,
      tagIds: deck.deckTags.map((deckTag) => deckTag.tag.id),
    });
  };

  const saveEditDeck = () => {
    if (!editingDeck) return;
    if (!deckForm.title.trim()) {
      toast.error(t("toast.deckNameRequired"));
      return;
    }
    updateDeckMutation.mutate(
      { deckId: editingDeck.id, data: deckForm },
      { onSuccess: () => setEditingDeck(null) }
    );
  };

  const deleteDeck = (deck: FlashcardDeck) => {
    setDeletingDeck(deck);
  };

  const handleConfirmDelete = () => {
    if (!deletingDeck) return;
    deleteDeckMutation.mutate(deletingDeck.id, {
      onSuccess: () => {
        if (selectedDeckId === deletingDeck.id) {
          const firstDeckId = decks.find((d) => d.id !== deletingDeck.id)?.id ?? null;
          setSelectedDeckId(firstDeckId);
        }
      },
      onSettled: () => setDeletingDeck(null),
    });
  };

  // Card handlers
  const openCreateCard = () => {
    if (!selectedDeckId) {
      toast.error(t("toast.selectDeckFirst"));
      return;
    }
    setCardForm({ frontContent: '', backContent: '', exampleSentence: '' });
    setCreatingCard(true);
  };

  const saveCreateCard = () => {
    if (!selectedDeckId) return;
    if (!cardForm.frontContent.trim() || !cardForm.backContent.trim()) {
      toast.error(t("toast.cardFieldsRequired"));
      return;
    }
    createCardMutation.mutate({
      ...cardForm,
      deckId: selectedDeckId,
    }, {
      onSuccess: () => setCreatingCard(false),
    });
  };

  const openEditCard = (card: Flashcard) => {
    setEditingCard(card);
    setCardForm({
      frontContent: card.frontContent,
      backContent: card.backContent,
      exampleSentence: card.exampleSentence ?? '',
    });
  };

  const saveEditCard = () => {
    if (!editingCard) return;
    if (!cardForm.frontContent.trim() || !cardForm.backContent.trim()) {
      toast.error(t("toast.cardFieldsRequired"));
      return;
    }
    updateCardMutation.mutate({
      cardId: editingCard.id,
      data: cardForm
    }, {
      onSuccess: () => setEditingCard(null),
    });
  };

  const deleteCard = (card: Flashcard) => {
    setDeletingCard(card);
  };

  const handleConfirmDeleteCard = () => {
    if (!deletingCard || !selectedDeckId) return;
    deleteCardMutation.mutate({
      cardId: deletingCard.id,
      deckId: selectedDeckId,
    }, {
      onSuccess: () => setDeletingCard(null),
    });
  };

  // Tag selector shared component
  const renderTagSelector = () => (
    <div className="space-y-2">
      <Label className="text-foreground font-semibold">{t("tags.label")}</Label>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={popoverOpen}
            className="w-full justify-between border-border hover:border-primary/40 transition-colors"
            disabled={isLoadingTags}
          >
            {deckForm.tagIds?.length ?? 0 > 0
              ? t("tags.selected", { count: deckForm.tagIds?.length })
              : t("tags.selectPlaceholder")}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder={t("tags.searchPlaceholder")} />
            <CommandList>
              <CommandEmpty>{t("tags.empty")}</CommandEmpty>
              <CommandGroup>
                {allTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => {
                      const selected = deckForm.tagIds || [];
                      const isSelected = selected.includes(tag.id);
                      setDeckForm((f) => ({
                        ...f,
                        tagIds: isSelected
                          ? selected.filter((id) => id !== tag.id)
                          : [...selected, tag.id],
                      }));
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        (deckForm.tagIds || []).includes(tag.id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {deckForm.tagIds?.map((id) => {
          const tag = allTags.find((t) => t.id === id);
          return tag ? (
            <Badge key={id} className="bg-primary/10 text-primary hover:bg-primary/20 border-0 text-xs font-semibold">
              {tag.name}
            </Badge>
          ) : null;
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <main>
        {/* Hero Section — Kahoot-style vibrant header */}
        <section className="relative overflow-hidden rounded-2xl bg-hero-gradient p-6 md:p-8 shadow-xl shadow-primary/20">
          {/* Interactive Gamified Mouse Particles */}
          <MouseParticles />
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-secondary/25 blur-3xl motion-safe:animate-float-slow" />

          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Zap className="w-5 h-5 text-secondary-light" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {t("page.title")}
              </h1>
            </div>
            <p className="text-white/80 text-base md:text-lg font-medium">
              {t("page.subtitle")}
            </p>

            {/* Quick stats */}
            <div className="flex gap-3 mt-4">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-white">
                <Layers className="w-3.5 h-3.5" />
                {t("page.deckCount", { count: decks.length })}
              </div>
              {selectedDeck && (
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-white">
                  <BookOpen className="w-3.5 h-3.5" />
                  {t("page.cardCount", { count: selectedDeckCards.length })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-surface-low p-1 rounded-xl w-fit mt-6">
          {([
            { id: 'mine', icon: Lock, label: t("tabs.mine") },
            { id: 'explore', icon: Globe, label: t("tabs.explore") },
          ] as const).map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="flashcards-tab-pill"
                    className="absolute inset-0 -z-0 rounded-lg bg-surface-lowest shadow-sm"
                    transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon className="relative z-10 w-4 h-4" />
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Explore tab ──────────────────────────────────────────────────── */}
        {activeTab === 'explore' && (
          <section className="py-8">
            <div className="container mx-auto px-0">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Globe className="w-6 h-6 text-primary" />
                  {t("explore.heading")}
                </h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t("explore.searchPlaceholder")}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface-lowest"
                    value={publicSearchInput}
                    onChange={(e) => setPublicSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setPublicSearch(publicSearchInput)}
                  />
                </div>
              </div>

              {isLoadingPublic ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : !publicDecks || publicDecks.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-20 text-center border-2 border-dashed border-primary/20 rounded-3xl bg-primary/5">
                  <Globe className="w-12 h-12 text-primary/30" />
                  <p className="font-semibold text-foreground">{t("explore.empty")}</p>
                  <p className="text-sm text-muted-foreground">{t("explore.emptyHint")}</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {publicDecks.map((deck) => {
                    const isOwn = deck.userId === user?.id;
                    return (
                      <div
                        key={deck.id}
                        className="bg-surface-lowest border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group"
                        onClick={() => {
                          setSelectedPublicDeckId(deck.id);
                          setIsPublicSheetOpen(true);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="font-bold text-foreground leading-snug line-clamp-2 flex-1 group-hover:text-primary transition-colors">
                            {deck.title}
                          </h3>
                          {isOwn ? (
                            <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full shrink-0">{t("explore.ownBadge")}</span>
                          ) : (
                            <Globe className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          )}
                        </div>
                        {deck.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{deck.description}</p>
                        )}
                        {deck.deckTags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {deck.deckTags.slice(0, 3).map((dt: any) => (
                              <span key={dt.tag?.id ?? dt.id} className="text-xs bg-surface-low text-muted-foreground px-2 py-0.5 rounded-full">
                                {dt.tag?.name ?? dt.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-border/60">
                          <span className="text-xs text-muted-foreground">
                            {new Date(deck.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="text-xs font-semibold text-primary group-hover:underline">
                            {t("explore.viewAndStudy")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Content */}
        {activeTab === 'mine' && (
        <section className="py-8">
          <div className="container mx-auto px-0">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Layers className="w-6 h-6 text-primary" />
                {t("mine.heading")}
              </h2>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setRagDialogOpen(true)}
                  variant="outline"
                  className="border-secondary/40 text-secondary-foreground hover:bg-secondary/10 hover:border-secondary/60 shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 font-bold rounded-xl"
                >
                  <Brain className="w-5 h-5 mr-1 text-secondary" /> {t("mine.aiGenerate")}
                </Button>
                <Button
                  onClick={openCreateDeck}
                  className="bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary shadow-md shadow-primary/20 transition-all duration-200 hover:scale-105 active:scale-95 font-bold rounded-xl"
                >
                  <Plus className="w-5 h-5 mr-1" /> {t("mine.addDeck")}
                </Button>
              </div>
            </div>

            {isLoadingDecks ? (
              <div className="flex flex-col items-center justify-center p-16 rounded-3xl border border-border bg-surface-lowest">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground mt-4 font-medium">{t("mine.loading")}</p>
              </div>
            ) : decks.length > 0 ? (
              <DeckList
                decks={decks}
                selectedDeckId={selectedDeckId}
                onSelectDeck={(id) => {
                  setSelectedDeckId(id);
                  // Using setTimeout to allow state flush before opening Sheet
                  setTimeout(() => setIsDetailsSheetOpen(true), 0);
                }}
                onEditDeck={openEditDeck}
                onDeleteDeck={deleteDeck}
                formatDate={formatDate}
              />
            ) : (
              <div className="border-2 border-dashed border-primary/20 rounded-3xl p-16 text-center bg-primary/5 max-w-2xl mx-auto">
                <Sparkles className="w-16 h-16 text-primary/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">{t("mine.empty")}</h3>
                <p className="text-muted-foreground mb-6">{t("mine.emptyHint")}</p>
                <Button onClick={openCreateDeck} className="rounded-xl px-8">{t("mine.createNow")}</Button>
              </div>
            )}
          </div>
        </section>
        )}
      </main>

      {/* ── Public Deck Sheet (Explore / read-only) ───────────────────────── */}
      <Sheet open={isPublicSheetOpen} onOpenChange={setIsPublicSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] sm:h-[90vh] rounded-t-2xl p-0 shadow-2xl flex flex-col gap-0 overflow-hidden bg-surface/60 backdrop-blur-xl border-none">
          <div className="bg-white p-6 md:p-8 flex-shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row gap-6 md:items-end md:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
                    <Globe className="w-6 h-6" />
                  </div>
                  <SheetTitle className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                    {selectedPublicDeck?.title || t("sheet.publicTitle")}
                  </SheetTitle>
                </div>
                <SheetDescription className="text-base text-muted-foreground mt-2 max-w-2xl text-left">
                  {selectedPublicDeck?.description || t("sheet.noDesc")}
                </SheetDescription>
                {selectedPublicDeck?.deckTags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {selectedPublicDeck.deckTags.map((dt: any) => (
                      <span key={dt.tag?.id ?? dt.id} className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-0.5 rounded-full">
                        {dt.tag?.name ?? dt.name}
                      </span>
                    ))}
                  </div>
                )}
                {publicCards.length > 0 && (
                  <div className="flex items-center gap-2 mt-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${
                      publicQueueCount === 0
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : publicHasOnlyNewCards
                        ? 'bg-primary/5 border-primary/20 text-primary'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      {publicQueueCount === 0 ? (
                        <Check className="w-4 h-4" />
                      ) : publicHasOnlyNewCards ? (
                        <Sparkles className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      {publicQueueCount === 0
                        ? t("sheet.queueStatus.publicDone")
                        : publicHasOnlyNewCards
                        ? t("sheet.queueStatus.publicNew", { count: publicQueueCount })
                        : t("sheet.queueStatus.publicDue", { count: publicQueueCount })}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 relative group">
                <Button
                  onClick={() => setPublicStudyOpen(true)}
                  disabled={!selectedPublicDeckId || publicCards.length === 0}
                  size="lg"
                  className="h-14 px-8 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 shadow-xl shadow-emerald-500/20 text-white rounded-2xl text-lg font-bold transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <Play className="w-6 h-6 mr-2 fill-white" /> {t("sheet.study")}
                </Button>
                {publicQueueCount > 0 && (
                  <span className={`absolute -top-2 -right-2 min-w-[28px] h-7 flex items-center justify-center text-xs font-black text-white rounded-full px-2 shadow-md animate-pulse pointer-events-none z-10 border-2 border-white ${
                    publicHasOnlyNewCards ? 'bg-primary' : 'bg-red-500'
                  }`}>
                    {publicQueueCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white p-6 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                {t("sheet.cardList", { count: publicCards.length })}
                <span className="ml-2 text-xs font-normal text-muted-foreground bg-surface-low px-2 py-0.5 rounded-full">{t("sheet.readOnly")}</span>
              </h3>

              {isLoadingPublicCards ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : publicCards.length === 0 ? (
                <div className="border border-dashed border-border rounded-2xl p-12 text-center">
                  <Sparkles className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">{t("sheet.emptyCards")}</p>
                </div>
              ) : (
                <div className="bg-surface-lowest rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                  <CardList
                    cards={publicCards}
                    onEditCard={() => {}}
                    onDeleteCard={() => {}}
                    readOnly
                  />
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Public Study Mode Dialog */}
      <Dialog open={publicStudyOpen} onOpenChange={(open) => {
        setPublicStudyOpen(open);
        if (!open && selectedPublicDeckId) {
          import("@/hooks/api/use-flashcards").then(module => {
            queryClient.invalidateQueries({ queryKey: module.flashcardKeys.reviewQueue(selectedPublicDeckId) });
          });
        }
      }}>
        <DialogContent className="sm:max-w-2xl p-0 bg-transparent border-0 shadow-none" aria-describedby={undefined}>
          <DialogTitle className="sr-only">{t("dialogs.studyMode.title")}</DialogTitle>
          <StudyMode
            deckId={selectedPublicDeckId!}
            onClose={() => {
              setPublicStudyOpen(false);
              import("@/hooks/api/use-flashcards").then(module => {
                queryClient.invalidateQueries({ queryKey: module.flashcardKeys.reviewQueue(selectedPublicDeckId!) });
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Kahoot-style Detail Sheet */}
      <Sheet open={isDetailsSheetOpen} onOpenChange={setIsDetailsSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] sm:h-[90vh] rounded-t-2xl p-0 shadow-2xl flex flex-col gap-0 overflow-hidden bg-surface/60 backdrop-blur-xl border-none">
          {/* Header Area with vibrant background */}
          <div className="bg-white p-6 md:p-8 flex-shrink-0 relative overflow-hidden">
             {/* Subtle gradient bloblets */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
             <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/5 rounded-full blur-2xl" />

             <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row gap-6 md:items-end md:justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-primary/10 text-primary p-2 rounded-xl">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <SheetTitle className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                      {selectedDeck?.title}
                    </SheetTitle>
                  </div>
                  <SheetDescription className="text-base text-muted-foreground mt-2 max-w-2xl text-left truncate">
                    {selectedDeck?.description || t("sheet.noDesc")}
                  </SheetDescription>

                  {selectedDeckId && selectedDeckCards.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold shadow-sm transition-all duration-300 ${
                          isLoadingQueue
                            ? 'bg-surface-low border-border text-muted-foreground animate-pulse'
                            : reviewQueueCount === 0
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : hasOnlyNewCards
                            ? 'bg-primary/5 border-primary/20 text-primary'
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}
                      >
                        {isLoadingQueue ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : reviewQueueCount === 0 ? (
                          <Check className="w-4 h-4" />
                        ) : hasOnlyNewCards ? (
                          <Sparkles className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                        <span>
                          {isLoadingQueue
                            ? t("sheet.queueStatus.loading")
                            : reviewQueueCount === 0
                            ? t("sheet.queueStatus.done")
                            : hasOnlyNewCards
                            ? t("sheet.queueStatus.newCards", { count: reviewQueueCount })
                            : t("sheet.queueStatus.dueCards", { count: reviewQueueCount })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto relative group">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="lg"
                          disabled={!selectedDeckId || resetProgressMutation.isPending}
                          className="h-14 w-14 md:w-14 rounded-2xl border-border text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                          aria-label={t("sheet.resetProgress")}
                        >
                          {resetProgressMutation.isPending ? (
                            <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
                          ) : (
                            <RotateCcw className="w-6 h-6" aria-hidden="true" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("dialogs.resetProgress.title")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("dialogs.resetProgress.desc")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("dialogs.resetProgress.cancel")}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => selectedDeckId && resetProgressMutation.mutate(selectedDeckId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t("dialogs.resetProgress.confirm")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button
                      onClick={() => setStudyDialogOpen(true)}
                      disabled={!selectedDeckId || selectedDeckCards.length === 0}
                      size="lg"
                      className="flex-1 md:flex-none h-14 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 shadow-xl shadow-emerald-500/20 text-white rounded-2xl text-lg font-bold transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden"
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />

                      <Play className="w-6 h-6 mr-2 fill-white" /> {t("sheet.study")}
                    </Button>

                    {reviewQueueCount > 0 && (
                        <span className={`absolute -top-2 -right-2 md:-right-4 min-w-[28px] h-7 flex items-center justify-center text-xs font-black text-white rounded-full px-2 shadow-md animate-pulse pointer-events-none z-10 border-2 border-white ${
                          hasOnlyNewCards
                            ? 'bg-primary shadow-primary/40'
                            : 'bg-red-500 shadow-red-500/40'
                        }`}>
                          {reviewQueueCount}
                        </span>
                    )}
                </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white p-6 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  {t("sheet.cardList", { count: selectedDeckCards.length })}
                </h3>
                <Button
                  onClick={openCreateCard}
                  disabled={!selectedDeckId}
                  variant="outline"
                  className="rounded-xl border-primary/30 text-primary hover:bg-primary/5 hover:text-primary font-semibold shadow-sm bg-surface-lowest"
                >
                  <Plus className="w-4 h-4 mr-1" /> {t("sheet.addCard")}
                </Button>
              </div>

              {isLoadingCards && (
                <div className="flex justify-center p-8 border border-border bg-surface-lowest rounded-2xl shadow-sm">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isLoadingCards && selectedDeckCards.length === 0 ? (
                <div className="border border-dashed border-border rounded-2xl p-12 text-center bg-white shadow-sm">
                  <Sparkles className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-lg text-foreground font-bold mb-2">{t("sheet.emptyMyCards")}</p>
                  <p className="text-muted-foreground mb-6">{t("sheet.emptyMyCardsHint")}</p>
                  <Button onClick={openCreateCard} className="rounded-xl px-6">{t("sheet.addCardNow")}</Button>
                </div>
              ) : !isLoadingCards && (
                <div className="bg-surface-lowest rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                  <CardList cards={selectedDeckCards} onEditCard={openEditCard} onDeleteCard={deleteCard} />
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ===== DIALOGS ===== */}

      {/* Create Deck Dialog */}
      <Dialog open={creatingDeck} onOpenChange={setCreatingDeck}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              {t("dialogs.createDeck.title")}
            </DialogTitle>
            <DialogDescription>{t("dialogs.createDeck.desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">{t("dialogs.createDeck.nameLabel")}</Label>
              <Input
                value={deckForm.title}
                onChange={(e) => setDeckForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={t("dialogs.createDeck.namePlaceholder")}
                className="border-border focus:border-primary focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">{t("dialogs.createDeck.descLabel")}</Label>
              <Textarea
                value={deckForm.description}
                onChange={(e) => setDeckForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={t("dialogs.createDeck.descPlaceholder")}
                className="border-border focus:border-primary focus:ring-primary/20"
              />
            </div>
            {renderTagSelector()}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={deckForm.isPublic}
                onCheckedChange={(checked) =>
                  setDeckForm((f) => ({ ...f, isPublic: !!checked }))
                }
              />
              <Label className="text-muted-foreground">{t("dialogs.createDeck.isPublic")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatingDeck(false)}>
              {t("dialogs.createDeck.cancel")}
            </Button>
            <Button
              onClick={saveCreateDeck}
              className="bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary font-bold"
              disabled={createDeckMutation.isPending}
            >
              {createDeckMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("dialogs.createDeck.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Deck Dialog */}
      <Dialog open={!!editingDeck} onOpenChange={() => setEditingDeck(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Edit className="w-4 h-4 text-amber-600" />
              </div>
              {t("dialogs.editDeck.title")}
            </DialogTitle>
            <DialogDescription>{t("dialogs.editDeck.desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">{t("dialogs.editDeck.nameLabel")}</Label>
              <Input
                value={deckForm.title}
                onChange={(e) => setDeckForm((f) => ({ ...f, title: e.target.value }))}
                className="border-border focus:border-primary focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">{t("dialogs.createDeck.descLabel")}</Label>
              <Textarea
                value={deckForm.description}
                onChange={(e) => setDeckForm((f) => ({ ...f, description: e.target.value }))}
                className="border-border focus:border-primary focus:ring-primary/20"
              />
            </div>
            {renderTagSelector()}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={deckForm.isPublic}
                onCheckedChange={(checked) =>
                  setDeckForm((f) => ({ ...f, isPublic: !!checked }))
                }
              />
              <Label className="text-muted-foreground">{t("dialogs.editDeck.isPublic")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDeck(null)}>
              {t("dialogs.editDeck.cancel")}
            </Button>
            <Button
              onClick={saveEditDeck}
              className="bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary font-bold"
              disabled={updateDeckMutation.isPending}
            >
              {updateDeckMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("dialogs.editDeck.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Delete Deck */}
      <AlertDialog
        open={!!deletingDeck}
        onOpenChange={(isOpen) => !isOpen && setDeletingDeck(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              {t("dialogs.deleteDeck.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.deleteDeck.desc", { name: deletingDeck?.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingDeck(null)}>
              {t("dialogs.deleteDeck.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-bold"
              onClick={handleConfirmDelete}
              disabled={deleteDeckMutation.isPending}
            >
              {deleteDeckMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("dialogs.deleteDeck.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Card Dialog */}
      <Dialog open={creatingCard} onOpenChange={setCreatingCard}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Plus className="w-4 h-4 text-emerald-600" />
              </div>
              {t("dialogs.createCard.title")}
            </DialogTitle>
            <DialogDescription>{t("dialogs.createCard.desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">{t("dialogs.createCard.frontLabel")}</Label>
              <Input
                value={cardForm.frontContent}
                onChange={(e) => setCardForm((f) => ({ ...f, frontContent: e.target.value }))}
                placeholder={t("dialogs.createCard.frontPlaceholder")}
                className="border-border focus:border-primary focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">{t("dialogs.createCard.backLabel")}</Label>
              <Textarea
                value={cardForm.backContent}
                onChange={(e) => setCardForm((f) => ({ ...f, backContent: e.target.value }))}
                placeholder={t("dialogs.createCard.backPlaceholder")}
                className="border-border focus:border-primary focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">{t("dialogs.createCard.exampleLabel")}</Label>
              <Textarea
                value={cardForm.exampleSentence}
                onChange={(e) => setCardForm((f) => ({ ...f, exampleSentence: e.target.value }))}
                placeholder={t("dialogs.createCard.examplePlaceholder")}
                className="border-border focus:border-primary focus:ring-primary/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatingCard(false)}>
              {t("dialogs.createCard.cancel")}
            </Button>
            <Button
              onClick={saveCreateCard}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 font-bold"
              disabled={createCardMutation.isPending}
            >
              {createCardMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("dialogs.createCard.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Card Dialog */}
      <Dialog open={!!editingCard} onOpenChange={() => setEditingCard(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Edit className="w-4 h-4 text-amber-600" />
              </div>
              {t("dialogs.editCard.title")}
            </DialogTitle>
            <DialogDescription>{t("dialogs.editCard.desc")}</DialogDescription>
          </DialogHeader>
          {editingCard && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground font-semibold">{t("dialogs.editCard.frontLabel")}</Label>
                <Input
                  value={cardForm.frontContent}
                  onChange={(e) => setCardForm((f) => ({ ...f, frontContent: e.target.value }))}
                  className="border-border focus:border-primary focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-semibold">{t("dialogs.editCard.backLabel")}</Label>
                <Textarea
                  value={cardForm.backContent}
                  onChange={(e) => setCardForm((f) => ({ ...f, backContent: e.target.value }))}
                  className="border-border focus:border-primary focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-semibold">{t("dialogs.editCard.exampleLabel")}</Label>
                <Textarea
                  value={cardForm.exampleSentence}
                  onChange={(e) => setCardForm((f) => ({ ...f, exampleSentence: e.target.value }))}
                  className="border-border focus:border-primary focus:ring-primary/20"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCard(null)}>
              {t("dialogs.editCard.cancel")}
            </Button>
            <Button
              onClick={saveEditCard}
              className="bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary font-bold"
              disabled={updateCardMutation.isPending}
            >
              {updateCardMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("dialogs.editCard.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Delete Card */}
      <AlertDialog open={!!deletingCard} onOpenChange={(isOpen) => !isOpen && setDeletingCard(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              {t("dialogs.deleteCard.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.deleteCard.desc", { name: deletingCard?.frontContent })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingCard(null)}>
              {t("dialogs.deleteCard.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-bold"
              onClick={handleConfirmDeleteCard}
              disabled={deleteCardMutation.isPending}
            >
              {deleteCardMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("dialogs.deleteCard.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* RAG Generator Dialog */}
      <Dialog open={ragDialogOpen} onOpenChange={setRagDialogOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Brain className="w-4 h-4 text-emerald-600" />
              </div>
              {t("dialogs.ragGenerator.title")}
            </DialogTitle>
            <DialogDescription>{t("dialogs.ragGenerator.desc")}</DialogDescription>
          </DialogHeader>
          <RagGenerator embedded />
        </DialogContent>
      </Dialog>

      {/* Study Mode Dialog */}
      <Dialog open={studyDialogOpen} onOpenChange={(open) => {
        setStudyDialogOpen(open);
        if (!open && selectedDeckId) {
          import("@/hooks/api/use-flashcards").then(module => {
            queryClient.invalidateQueries({ queryKey: module.flashcardKeys.reviewQueue(selectedDeckId) });
          });
        }
      }}>
        <DialogContent className="sm:max-w-2xl p-0 bg-transparent border-0 shadow-none" aria-describedby={undefined}>
          <DialogTitle className="sr-only">{t("dialogs.studyMode.title")}</DialogTitle>
          <StudyMode
            deckId={selectedDeckId!}
            onClose={() => {
              setStudyDialogOpen(false);
              import("@/hooks/api/use-flashcards").then(module => {
                queryClient.invalidateQueries({ queryKey: module.flashcardKeys.reviewQueue(selectedDeckId!) });
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Flashcards;
