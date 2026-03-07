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
} from "lucide-react";
import { toast } from "sonner";
import type { FlashcardDeck, Flashcard, Tag } from "@/domain";
import DeckList from "@/components/user/flashcards/DeckList";
import CardList from "@/components/user/flashcards/CardList";
import StudyMode from "@/components/user/flashcards/StudyMode";
import { formatDate, formatDateForInput } from "@/lib/utils";

import {
  useGetDecks,
  useGetCards,
  useCreateDeck,
  useUpdateDeck,
  useDeleteDeck,
  useCreateCard,
  useUpdateCard,
  useDeleteCard
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
  // Deck state
  const { data: decksData, isLoading: isLoadingDecks } = useGetDecks();
  const decks = useMemo(() => decksData || [], [decksData]);

  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  // Cards state (only those belonging to user's decks)
  const { data: cardsData, isLoading: isLoadingCards } =
    useGetCards(selectedDeckId);
  const selectedDeckCards = useMemo(() => cardsData || [], [cardsData]);

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
  const createDeckMutation = useCreateDeck(); // 👈 KHỞI TẠO MUTATION
  // Deck dialogs
  const updateDeckMutation = useUpdateDeck();
  const deleteDeckMutation = useDeleteDeck(); // 👈 KHỞI TẠO

// 👈 THÊM: Khởi tạo card mutations
  const createCardMutation = useCreateCard();
  const updateCardMutation = useUpdateCard();
  const deleteCardMutation = useDeleteCard();

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
  // Card dialogs
  const [creatingCard, setCreatingCard] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [deletingCard, setDeletingCard] = useState<Flashcard | null>(null);
const [cardForm, setCardForm] = useState<Omit<CardFormDTO, 'deckId'>>({
    frontContent: '',
    backContent: '',
    exampleSentence: '',
  });
  const [studyDialogOpen, setStudyDialogOpen] = useState(false);

  // Helpers

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

    // Gọi mutation với data từ form
    createDeckMutation.mutate(deckForm, {
      onSuccess: (response) => {
        // response.data là FlashcardDeck mới
        setSelectedDeckId(response.data.id); // Tự động chọn bộ thẻ mới
        setCreatingDeck(false); // Đóng dialog
      },
      // onError đã được xử lý trong hook
    });
  };

  const openEditDeck = (deck: FlashcardDeck) => {
    setEditingDeck(deck); // Lưu lại deck đang sửa

    // Điền data vào form
    setDeckForm({
      title: deck.title,
      description: deck.description ?? "",
      isPublic: deck.isPublic,
      // Chuyển đổi deck.deckTags (từ API) -> tagIds (cho form)
      tagIds: deck.deckTags.map((deckTag) => deckTag.tag.id),
    });
  };

  const saveEditDeck = () => {
    if (!editingDeck) return; // Không có deck nào đang được sửa

    if (!deckForm.title.trim()) {
      toast.error("Vui lòng nhập tên bộ thẻ");
      return;
    }

    // Gọi mutation với ID và data từ form
    updateDeckMutation.mutate(
      {
        deckId: editingDeck.id,
        data: deckForm,
      },
      {
        onSuccess: () => {
          setEditingDeck(null); // Đóng dialog
        },
      }
    );
  };

  const deleteDeck = (deck: FlashcardDeck) => {
    setDeletingDeck(deck); // 👈 Chỉ cần set state này
  };

  /**
   * MỚI: Hàm xử lý khi người dùng BẤM NÚT XÓA THẬT
   */
  const handleConfirmDelete = () => {
    if (!deletingDeck) return;

    deleteDeckMutation.mutate(deletingDeck.id, {
      onSuccess: () => {
        if (selectedDeckId === deletingDeck.id) {
          const firstDeckId =
            decks.find((d) => d.id !== deletingDeck.id)?.id ?? null;
          setSelectedDeckId(firstDeckId);
        }
      },
      onSettled: () => {
        setDeletingDeck(null);
      },
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
      deckId: selectedDeckId, // Thêm deckId lúc submit
    }, {
      onSuccess: () => {
        setCreatingCard(false); // Đóng dialog
      }
    });
  };
  const openEditCard = (card: Flashcard) => {
    setEditingCard(card); // Lưu lại thẻ đang sửa
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
      data: cardForm // Gửi data từ form
    }, {
      onSuccess: () => {
        setEditingCard(null); // Đóng dialog
      }
    });
  };

  const deleteCard = (card: Flashcard) => {
    setDeletingCard(card); // 👈 Chỉ mở dialog
  };
  const handleConfirmDeleteCard = () => {
    if (!deletingCard || !selectedDeckId) return;

    deleteCardMutation.mutate({
      cardId: deletingCard.id,
      deckId: selectedDeckId, // 👈 Cần deckId để invalidate cache
    }, {
      onSuccess: () => {
        setDeletingCard(null); // Đóng dialog
      }
    });
  };
  return (
    <div className="space-y-6">
      <main>
        <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight text-slate-900">
              Flashcards Workspace
            </h1>
            <p className="text-slate-500 text-lg">
              Tạo, chỉnh sửa, và học bộ thẻ theo giao diện mới nhưng vẫn giữ logic quản lý hiện tại.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-2">
          <div className="container mx-auto px-0">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Decks Panel */}
              <div className="w-full lg:w-1/3">
                <div className="flex items-center justify-between mb-4 bg-white rounded-2xl border border-slate-200 p-4">
                  <h2 className="text-2xl font-bold text-slate-900">Bộ thẻ của tôi</h2>
                  <Button onClick={openCreateDeck} className="bg-primary">
                    <Plus className="w-4 h-4 mr-2" /> Thêm bộ thẻ
                  </Button>
                </div>

                {isLoadingDecks ? (
                  <div className="flex justify-center p-10 rounded-xl border border-slate-200">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : decks.length > 0 ? (
                  <DeckList
                    decks={decks} // Truyền data đã fetch
                    selectedDeckId={selectedDeckId}
                    onSelectDeck={setSelectedDeckId}
                    onEditDeck={openEditDeck}
                    onDeleteDeck={deleteDeck}
                    formatDate={formatDate}
                  />
                ) : (
                  <div className="border border-slate-200 rounded-xl p-6 text-center text-slate-500">
                    Chưa có bộ thẻ nào. Hãy tạo bộ thẻ đầu tiên!
                  </div>
                )}
              </div>

              {/* Cards Panel */}
              <div className="w-full lg:w-2/3">
                <div className="flex items-center justify-between mb-4 bg-white rounded-2xl border border-slate-200 p-4">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedDeck
                      ? `Thẻ trong: ${selectedDeck.title}`
                      : "Chọn một bộ thẻ"}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={openCreateCard}
                      disabled={!selectedDeckId}
                      className="bg-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Thêm thẻ
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setStudyDialogOpen(true)}
                      disabled={
                        !selectedDeckId || selectedDeckCards.length === 0
                      }
                    >
                      Học thẻ
                    </Button>
                  </div>
                </div>

                {selectedDeckId ? (
                  isLoadingCards ? (
                    <div className="flex justify-center p-10 rounded-xl border border-slate-200">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : selectedDeckCards.length > 0 ? (
                    <CardList
                      cards={selectedDeckCards} // Truyền data đã fetch
                      onEditCard={openEditCard}
                      onDeleteCard={deleteCard}
                    />
                  ) : (
                    <div className="border border-slate-200 rounded-xl p-6 text-center text-slate-500">
                      Chưa có thẻ nào trong bộ này. Hãy thêm thẻ!
                    </div>
                  )
                ) : (
                  <div className="border border-slate-200 rounded-xl p-6 text-center text-slate-500">
                    Hãy chọn một bộ thẻ ở panel bên trái.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Create Deck Dialog */}
      <Dialog open={creatingDeck} onOpenChange={setCreatingDeck}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo bộ thẻ mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin cho bộ thẻ của bạn
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên bộ thẻ *</Label>
              <Input
                value={deckForm.title}
                onChange={(e) =>
                  setDeckForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Ví dụ: Từ vựng Business English"
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={deckForm.description}
                onChange={(e) =>
                  setDeckForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Mô tả ngắn về bộ thẻ"
              />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
                    className="w-full justify-between"
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
                                  ? selected.filter((id) => id !== tag.id) // Bỏ chọn
                                  : [...selected, tag.id], // Chọn
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
              {/* Hiển thị tag đã chọn */}
              <div className="flex flex-wrap gap-1 pt-1">
                {deckForm.tagIds?.map((id) => {
                  const tag = allTags.find((t) => t.id === id);

                  return tag ? (
                    <Badge key={id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={deckForm.isPublic}
                onCheckedChange={(checked) =>
                  setDeckForm((f) => ({ ...f, isPublic: !!checked }))
                }
              />
              <Label>Bộ thẻ công khai</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatingDeck(false)}>
              Hủy
            </Button>
            <Button
              onClick={saveCreateDeck}
              className="bg-primary"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa bộ thẻ</DialogTitle>
            <DialogDescription>Cập nhật thông tin bộ thẻ</DialogDescription>
          </DialogHeader>

          {/* Chúng ta tái sử dụng UI từ Create Deck, 
            vì `deckForm` đã được `openEditDeck` điền sẵn data
          */}
          <div className="space-y-4">
            {/* Tên bộ thẻ */}
            <div className="space-y-2">
              <Label>Tên bộ thẻ *</Label>
              <Input
                value={deckForm.title}
                onChange={(e) =>
                  setDeckForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>

            {/* Mô tả */}
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={deckForm.description}
                onChange={(e) =>
                  setDeckForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            {/* Chọn Tag (Logic y hệt Create Dialog) */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
                    className="w-full justify-between"
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
                                  ? selected.filter((id) => id !== tag.id) // Bỏ chọn
                                  : [...selected, tag.id], // Chọn
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
              {/* Hiển thị tag đã chọn */}
              <div className="flex flex-wrap gap-1 pt-1">
                {deckForm.tagIds?.map((id) => {
                  const tag = allTags.find((t) => t.id === id);

                  return tag ? (
                    <Badge key={id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>

            {/* Checkbox Công khai */}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={deckForm.isPublic}
                onCheckedChange={(checked) =>
                  setDeckForm((f) => ({ ...f, isPublic: !!checked }))
                }
              />
              <Label>Bộ thẻ công khai</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDeck(null)}>
              Hủy
            </Button>
            <Button
              onClick={saveEditDeck} // 👈 Gọi hàm `saveEditDeck` mới
              className="bg-primary"
              disabled={updateDeckMutation.isPending} // 👈 Vô hiệu hóa khi đang lưu
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
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Thao tác này sẽ xóa vĩnh viễn bộ
              thẻ
              <strong className="text-foreground">
                {" "}
                {deletingDeck?.title}{" "}
              </strong>
              và tất cả các thẻ con bên trong.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingDeck(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
              disabled={deleteDeckMutation.isPending} // 👈 Vô hiệu hóa khi đang xóa
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm thẻ mới</DialogTitle>
            <DialogDescription>Thêm thẻ vào bộ thẻ đang chọn</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mặt trước *</Label>
              <Input
                value={cardForm.frontContent}
                onChange={(e) =>
                  setCardForm((f) => ({ ...f, frontContent: e.target.value }))
                }
                placeholder="Từ/cụm từ"
              />
            </div>
            <div className="space-y-2">
              <Label>Mặt sau *</Label>
              <Textarea
                value={cardForm.backContent}
                onChange={(e) =>
                  setCardForm((f) => ({ ...f, backContent: e.target.value }))
                }
                placeholder="Định nghĩa/giải thích"
              />
            </div>
            <div className="space-y-2">
              <Label>Câu ví dụ</Label>
              <Textarea
                value={cardForm.exampleSentence}
                onChange={(e) =>
                  setCardForm((f) => ({
                    ...f,
                    exampleSentence: e.target.value,
                  }))
                }
                placeholder="Ví dụ sử dụng trong câu"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatingCard(false)}>
              Hủy
            </Button>
            <Button onClick={saveCreateCard} className="bg-primary" disabled={createCardMutation.isPending}>
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Card Dialog */}
      <Dialog open={!!editingCard} onOpenChange={() => setEditingCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thẻ</DialogTitle>
            <DialogDescription>Cập nhật nội dung thẻ</DialogDescription>
          </DialogHeader>
          {editingCard && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Mặt trước *</Label>
                <Input
                  value={cardForm.frontContent}
                  onChange={(e) =>
                    setCardForm((f) => ({ ...f, frontContent: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Mặt sau *</Label>
                <Textarea
                  value={cardForm.backContent}
                  onChange={(e) =>
                    setCardForm((f) => ({ ...f, backContent: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Câu ví dụ</Label>
                <Textarea
                  value={cardForm.exampleSentence}
                  onChange={(e) =>
                    setCardForm((f) => ({
                      ...f,
                      exampleSentence: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCard(null)}>
              Hủy
            </Button>
            <Button onClick={saveEditCard} className="bg-primary" disabled={createCardMutation.isPending}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
<AlertDialog open={!!deletingCard} onOpenChange={(isOpen) => !isOpen && setDeletingCard(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDeleteCard} // 👈 Gọi hàm mới
              disabled={deleteCardMutation.isPending} // 👈 Vô hiệu hóa
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
      <Dialog open={studyDialogOpen} onOpenChange={setStudyDialogOpen}>
        <DialogContent className="sm:max-w-2xl" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Chế độ học thẻ</DialogTitle>
          <StudyMode
            //cards={selectedDeckCards}
            deckId={selectedDeckId}
            onClose={() => setStudyDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Flashcards;
