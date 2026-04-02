import { useMemo, useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { FlashcardDeck, Flashcard, Tag } from "@/domain";
import { DeckList } from "@/components/user/flashcards/DeckList";
import CardList from "@/components/user/flashcards/CardList";
import StudyMode from "@/components/user/flashcards/StudyMode";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { MouseParticles } from "@/components/ui/mouse-particles";
import { formatDate, formatDateForInput } from "@/lib/utils";

import {
  useGetDecks,
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
  const { data: decksData, isLoading: isLoadingDecks } = useGetDecks();
  const decks = useMemo(() => decksData || [], [decksData]);

  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  const { data: cardsData, isLoading: isLoadingCards } =
    useGetCards(selectedDeckId);
  const selectedDeckCards = useMemo(() => cardsData || [], [cardsData]);

  // Review queue — shows how many cards are due for the selected deck
  const { data: reviewQueueData, isLoading: isLoadingQueue } = useGetReviewQueue(selectedDeckId);
  const reviewQueueCount = reviewQueueData?.length ?? 0;

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

  // Deck handlers
  const openCreateDeck = () => {
    setDeckForm({ title: "", description: "", isPublic: false, tagIds: [] });
    setCreatingDeck(true);
  };

  const saveCreateDeck = () => {
    if (!deckForm.title.trim()) {
      toast.error("Vui lòng nhập tên bộ thẻ");
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
      toast.error("Vui lòng nhập tên bộ thẻ");
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
      toast.error('Hãy chọn một bộ thẻ trước');
      return;
    }
    setCardForm({ frontContent: '', backContent: '', exampleSentence: '' });
    setCreatingCard(true);
  };

  const saveCreateCard = () => {
    if (!selectedDeckId) return;
    if (!cardForm.frontContent.trim() || !cardForm.backContent.trim()) {
      toast.error('Vui lòng nhập mặt trước và mặt sau');
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
      toast.error('Vui lòng nhập mặt trước và mặt sau');
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
      <Label className="text-slate-700 font-semibold">Tags</Label>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={popoverOpen}
            className="w-full justify-between border-slate-200 hover:border-indigo-300 transition-colors"
            disabled={isLoadingTags}
          >
            {deckForm.tagIds?.length ?? 0 > 0
              ? `Đã chọn ${deckForm.tagIds?.length} tag`
              : "Chọn tag..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Tìm tag..." />
            <CommandList>
              <CommandEmpty>Không tìm thấy tag.</CommandEmpty>
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
            <Badge key={id} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0 text-xs font-semibold">
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
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 p-6 md:p-8 shadow-xl shadow-indigo-500/20">
          {/* Interactive Gamified Mouse Particles */}
          <MouseParticles />

          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-300" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Flashcards
              </h1>
            </div>
            <p className="text-indigo-100 text-base md:text-lg font-medium">
              Tạo, chỉnh sửa, và học bộ thẻ ghi nhớ — phong cách gamified!
            </p>

            {/* Quick stats */}
            <div className="flex gap-3 mt-4">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-white">
                <Layers className="w-3.5 h-3.5" />
                {decks.length} bộ thẻ
              </div>
              {selectedDeck && (
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-white">
                  <BookOpen className="w-3.5 h-3.5" />
                  {selectedDeckCards.length} thẻ
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="container mx-auto px-0">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-6 h-6 text-indigo-500" />
                Bộ thẻ của tôi
              </h2>
              <Button
                onClick={openCreateDeck}
                className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 shadow-md shadow-indigo-500/20 transition-all duration-200 hover:scale-105 active:scale-95 font-bold rounded-xl"
              >
                <Plus className="w-5 h-5 mr-1" /> Thêm bộ thẻ
              </Button>
            </div>

            {isLoadingDecks ? (
              <div className="flex flex-col items-center justify-center p-16 rounded-3xl border border-slate-200 bg-white">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <p className="text-slate-400 mt-4 font-medium">Đang tải danh sách bộ thẻ...</p>
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
              <div className="border-2 border-dashed border-indigo-200 rounded-3xl p-16 text-center bg-indigo-50/50 max-w-2xl mx-auto">
                <Sparkles className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa có bộ thẻ nào</h3>
                <p className="text-slate-500 mb-6">Tạo bộ thẻ đầu tiên của bạn để bắt đầu hành trình học tập đầy thú vị!</p>
                <Button onClick={openCreateDeck} className="rounded-xl px-8">Tạo ngay</Button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Kahoot-style Detail Sheet */}
      <Sheet open={isDetailsSheetOpen} onOpenChange={setIsDetailsSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] sm:h-[90vh] rounded-t-2xl p-0 shadow-2xl flex flex-col gap-0 overflow-hidden bg-slate-50/50 backdrop-blur-xl border-none">
          {/* Header Area with vibrant background */}
          <div className="bg-white p-6 md:p-8 flex-shrink-0 relative overflow-hidden">
             {/* Subtle gradient bloblets */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
             <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-500/5 rounded-full blur-2xl" />
             
             <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row gap-6 md:items-end md:justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <SheetTitle className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                      {selectedDeck?.title || "Chi tiết bộ thẻ"}
                    </SheetTitle>
                  </div>
                  <SheetDescription className="text-base text-slate-500 mt-2 max-w-2xl text-left truncate">
                    {selectedDeck?.description || "Không có mô tả."}
                  </SheetDescription>
                  
                  {/* Status Indicator inside Sheet Header */}
                  {selectedDeckId && selectedDeckCards.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold shadow-sm transition-all duration-300 ${
                          isLoadingQueue
                            ? 'bg-slate-50 border-slate-200 text-slate-500 animate-pulse'
                            : reviewQueueCount > 0
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}
                      >
                        {isLoadingQueue ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : reviewQueueCount > 0 ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>
                          {isLoadingQueue
                            ? 'Đang tính toán thẻ cần ôn...'
                            : reviewQueueCount > 0
                            ? `${reviewQueueCount} thẻ cần ôn tập ngay bây giờ`
                            : 'Đã ôn hết! Hẹn gặp lại vào lần tới 🎉'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto relative group">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ tiến độ học của bộ thẻ này? Hành động này không thể hoàn tác.")) {
                          resetProgressMutation.mutate(selectedDeckId!);
                        }
                      }}
                      disabled={!selectedDeckId || resetProgressMutation.isPending}
                      className="h-14 w-14 md:w-14 rounded-2xl border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors shrink-0"
                      title="Xóa tiến độ học"
                    >
                      {resetProgressMutation.isPending ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <RotateCcw className="w-6 h-6" />
                      )}
                    </Button>
                    <Button
                      onClick={() => setStudyDialogOpen(true)}
                      disabled={!selectedDeckId || selectedDeckCards.length === 0}
                      size="lg"
                      className="flex-1 md:flex-none h-14 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 shadow-xl shadow-emerald-500/20 text-white rounded-2xl text-lg font-bold transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden"
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                      
                      <Play className="w-6 h-6 mr-2 fill-white" /> HỌC THẺ
                    </Button>
                    
                    {/* Badge moved outside the button to prevent clipping from overflow-hidden */}
                    {reviewQueueCount > 0 && (
                        <span className="absolute -top-2 -right-2 md:-right-4 min-w-[28px] h-7 flex items-center justify-center text-xs font-black bg-red-500 text-white rounded-full px-2 shadow-md shadow-red-500/40 animate-pulse pointer-events-none z-10 border-2 border-white">
                          {reviewQueueCount}
                        </span>
                    )}
                </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white p-6 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-500" />
                  Danh sách thẻ ({selectedDeckCards.length})
                </h3>
                <Button
                  onClick={openCreateCard}
                  disabled={!selectedDeckId}
                  variant="outline"
                  className="rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 font-semibold shadow-sm bg-white"
                >
                  <Plus className="w-4 h-4 mr-1" /> Thêm thẻ mới
                </Button>
              </div>

              {isLoadingCards && (
                <div className="flex justify-center p-8 border border-slate-200 bg-white rounded-2xl shadow-sm">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              )}
              
              {!isLoadingCards && selectedDeckCards.length === 0 ? (
                <div className="border border-dashed border-slate-300 rounded-2xl p-12 text-center bg-white shadow-sm">
                  <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg text-slate-600 font-bold mb-2">Chưa có thẻ nào trong bộ này</p>
                  <p className="text-slate-400 mb-6">Thêm thẻ đầu tiên để bắt đầu học nhé!</p>
                  <Button onClick={openCreateCard} className="rounded-xl px-6">Thêm thẻ ngay</Button>
                </div>
              ) : !isLoadingCards && (
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
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
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Plus className="w-4 h-4 text-indigo-600" />
              </div>
              Tạo bộ thẻ mới
            </DialogTitle>
            <DialogDescription>Nhập thông tin cho bộ thẻ của bạn</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Tên bộ thẻ *</Label>
              <Input
                value={deckForm.title}
                onChange={(e) => setDeckForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ví dụ: Từ vựng Business English"
                className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Mô tả</Label>
              <Textarea
                value={deckForm.description}
                onChange={(e) => setDeckForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả ngắn về bộ thẻ"
                className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
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
              <Label className="text-slate-600">Bộ thẻ công khai</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatingDeck(false)}>
              Hủy
            </Button>
            <Button
              onClick={saveCreateDeck}
              className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 font-bold"
              disabled={createDeckMutation.isPending}
            >
              {createDeckMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Tạo
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
              Chỉnh sửa bộ thẻ
            </DialogTitle>
            <DialogDescription>Cập nhật thông tin bộ thẻ</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Tên bộ thẻ *</Label>
              <Input
                value={deckForm.title}
                onChange={(e) => setDeckForm((f) => ({ ...f, title: e.target.value }))}
                className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Mô tả</Label>
              <Textarea
                value={deckForm.description}
                onChange={(e) => setDeckForm((f) => ({ ...f, description: e.target.value }))}
                className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
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
              <Label className="text-slate-600">Bộ thẻ công khai</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDeck(null)}>
              Hủy
            </Button>
            <Button
              onClick={saveEditDeck}
              className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 font-bold"
              disabled={updateDeckMutation.isPending}
            >
              {updateDeckMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Lưu
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
              Bạn có chắc chắn muốn xóa?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Thao tác này sẽ xóa vĩnh viễn bộ thẻ
              <strong className="text-foreground">
                {" "}{deletingDeck?.title}{" "}
              </strong>
              và tất cả các thẻ con bên trong.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingDeck(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-bold"
              onClick={handleConfirmDelete}
              disabled={deleteDeckMutation.isPending}
            >
              {deleteDeckMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Tiếp tục xóa
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
              Thêm thẻ mới
            </DialogTitle>
            <DialogDescription>Thêm thẻ vào bộ thẻ đang chọn</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Mặt trước *</Label>
              <Input
                value={cardForm.frontContent}
                onChange={(e) => setCardForm((f) => ({ ...f, frontContent: e.target.value }))}
                placeholder="Từ/cụm từ"
                className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Mặt sau *</Label>
              <Textarea
                value={cardForm.backContent}
                onChange={(e) => setCardForm((f) => ({ ...f, backContent: e.target.value }))}
                placeholder="Định nghĩa/giải thích"
                className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Câu ví dụ</Label>
              <Textarea
                value={cardForm.exampleSentence}
                onChange={(e) => setCardForm((f) => ({ ...f, exampleSentence: e.target.value }))}
                placeholder="Ví dụ sử dụng trong câu"
                className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatingCard(false)}>
              Hủy
            </Button>
            <Button
              onClick={saveCreateCard}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 font-bold"
              disabled={createCardMutation.isPending}
            >
              {createCardMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Tạo
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
              Chỉnh sửa thẻ
            </DialogTitle>
            <DialogDescription>Cập nhật nội dung thẻ</DialogDescription>
          </DialogHeader>
          {editingCard && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Mặt trước *</Label>
                <Input
                  value={cardForm.frontContent}
                  onChange={(e) => setCardForm((f) => ({ ...f, frontContent: e.target.value }))}
                  className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Mặt sau *</Label>
                <Textarea
                  value={cardForm.backContent}
                  onChange={(e) => setCardForm((f) => ({ ...f, backContent: e.target.value }))}
                  className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Câu ví dụ</Label>
                <Textarea
                  value={cardForm.exampleSentence}
                  onChange={(e) => setCardForm((f) => ({ ...f, exampleSentence: e.target.value }))}
                  className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCard(null)}>
              Hủy
            </Button>
            <Button
              onClick={saveEditCard}
              className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 font-bold"
              disabled={updateCardMutation.isPending}
            >
              {updateCardMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Lưu
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
              Bạn có chắc chắn muốn xóa?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Thao tác này sẽ xóa vĩnh viễn thẻ
              <strong className="text-foreground"> {deletingCard?.frontContent} </strong>
              khỏi bộ thẻ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingCard(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-bold"
              onClick={handleConfirmDeleteCard}
              disabled={deleteCardMutation.isPending}
            >
              {deleteCardMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Tiếp tục xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Study Mode Dialog */}
      <Dialog open={studyDialogOpen} onOpenChange={(open) => {
        setStudyDialogOpen(open);
        if (!open && selectedDeckId) {
          // Bắt buộc refetch queue khi đóng dialog để cập nhật lại số lượng thẻ
          import("@/hooks/api/use-flashcards").then(module => {
            queryClient.invalidateQueries({ queryKey: module.flashcardKeys.reviewQueue(selectedDeckId) });
          });
        }
      }}>
        <DialogContent className="sm:max-w-2xl p-0 bg-transparent border-0 shadow-none" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Chế độ học thẻ</DialogTitle>
          <StudyMode
            deckId={selectedDeckId!}
            onClose={() => {
              setStudyDialogOpen(false);
              // Invalidate thủ công lần nữa cho chắc nếu đóng qua nút
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
