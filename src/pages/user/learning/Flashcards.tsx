import { useMemo, useState } from 'react';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  FlashcardDeck,
  Flashcard,
  mockFlashcardDecks,
  mockFlashcards,
} from '@/data/mock';
import DeckList from '@/components/flashcards/DeckList';
import CardList from '@/components/flashcards/CardList';
import StudyMode from '@/components/flashcards/StudyMode';

const currentUserId = (typeof window !== 'undefined' ? localStorage.getItem('currentUserId') : null) ?? '1';

const Flashcards = () => {
  // Deck state
  const [decks, setDecks] = useState<FlashcardDeck[]>(
    mockFlashcardDecks.filter((d) => d.userId === currentUserId)
  );
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(
    decks[0]?.id ?? null
  );

  // Cards state (only those belonging to user's decks)
  const userDeckIds = useMemo(() => decks.map((d) => d.id), [decks]);
  const [cards, setCards] = useState<Flashcard[]>(
    mockFlashcards.filter((c) => userDeckIds.includes(c.deckId))
  );
  const selectedDeck = useMemo(
    () => decks.find((d) => d.id === selectedDeckId) ?? null,
    [decks, selectedDeckId]
  );
  const selectedDeckCards = useMemo(
    () => cards.filter((c) => c.deckId === selectedDeckId),
    [cards, selectedDeckId]
  );

  // Deck dialogs
  const [creatingDeck, setCreatingDeck] = useState(false);
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | null>(null);
  const [deckForm, setDeckForm] = useState({
    title: '',
    description: '',
    isPublic: false,
  });

  // Card dialogs
  const [creatingCard, setCreatingCard] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [cardForm, setCardForm] = useState({
    frontContent: '',
    backContent: '',
    exampleSentence: '',
  });
  const [studyDialogOpen, setStudyDialogOpen] = useState(false);

  // Helpers
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

  // Deck handlers
  const openCreateDeck = () => {
    setDeckForm({ title: '', description: '', isPublic: false });
    setCreatingDeck(true);
  };

  const saveCreateDeck = () => {
    if (!deckForm.title.trim()) {
      toast.error('Vui lòng nhập tên bộ thẻ');
      return;
    }
    const newDeck: FlashcardDeck = {
      id: `deck_${Date.now()}`,
      title: deckForm.title.trim(),
      description: deckForm.description.trim() || undefined,
      isPublic: deckForm.isPublic,
      createdAt: new Date().toISOString(),
      userId: currentUserId,
    };
    setDecks((prev) => [...prev, newDeck]);
    setSelectedDeckId(newDeck.id);
    setCreatingDeck(false);
    toast.success('Tạo bộ thẻ thành công!');
  };

  const openEditDeck = (deck: FlashcardDeck) => {
    setEditingDeck(deck);
    setDeckForm({
      title: deck.title,
      description: deck.description ?? '',
      isPublic: deck.isPublic,
    });
  };

  const saveEditDeck = () => {
    if (!editingDeck) return;
    const updated: FlashcardDeck = {
      ...editingDeck,
      title: deckForm.title.trim() || editingDeck.title,
      description: deckForm.description.trim() || undefined,
      isPublic: deckForm.isPublic,
    };
    setDecks((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setEditingDeck(null);
    toast.success('Cập nhật bộ thẻ thành công!');
  };

  const deleteDeck = (deck: FlashcardDeck) => {
    setDecks((prev) => prev.filter((d) => d.id !== deck.id));
    setCards((prev) => prev.filter((c) => c.deckId !== deck.id));
    if (selectedDeckId === deck.id) {
      const next = decks.find((d) => d.id !== deck.id)?.id ?? null;
      setSelectedDeckId(next);
    }
    toast.success('Đã xóa bộ thẻ và các thẻ liên quan!');
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
    const newCard: Flashcard = {
      id: `fc_${Date.now()}`,
      frontContent: cardForm.frontContent.trim(),
      backContent: cardForm.backContent.trim(),
      exampleSentence: cardForm.exampleSentence.trim() || undefined,
      deckId: selectedDeckId,
    };
    setCards((prev) => [
      ...prev,
      newCard,
    ]);
    setCreatingCard(false);
    toast.success('Tạo thẻ thành công!');
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
    const updated: Flashcard = {
      ...editingCard,
      frontContent: cardForm.frontContent.trim() || editingCard.frontContent,
      backContent: cardForm.backContent.trim() || editingCard.backContent,
      exampleSentence: cardForm.exampleSentence.trim() || undefined,
    };
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setEditingCard(null);
    toast.success('Cập nhật thẻ thành công!');
  };

  const deleteCard = (card: Flashcard) => {
    setCards((prev) => prev.filter((c) => c.id !== card.id));
    toast.success('Đã xóa thẻ!');
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-20">
        {/* Header */}
        <section className="bg-gradient-hero text-primary-foreground py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-['Be Vietnam Pro']">
                Quản lý Flashcards
              </h1>
              <p className="text-primary-foreground/80 text-lg">
                Tạo, chỉnh sửa và xóa bộ thẻ và thẻ ghi nhớ của riêng bạn
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Decks Panel */}
              <div className="w-full lg:w-1/3">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">Bộ thẻ của tôi</h2>
                  <Button onClick={openCreateDeck} className="bg-primary">
                    <Plus className="w-4 h-4 mr-2" /> Thêm bộ thẻ
                  </Button>
                </div>

                {decks.length > 0 ? (
                  <DeckList
                    decks={decks}
                    selectedDeckId={selectedDeckId}
                    onSelectDeck={setSelectedDeckId}
                    onEditDeck={openEditDeck}
                    onDeleteDeck={deleteDeck}
                    formatDate={formatDate}
                  />
                ) : (
                  <div className="border rounded-xl p-6 text-center text-muted-foreground">
                    Chưa có bộ thẻ nào. Hãy tạo bộ thẻ đầu tiên!
                  </div>
                )}
              </div>

              {/* Cards Panel */}
              <div className="w-full lg:w-2/3">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">
                    {selectedDeck ? `Thẻ trong: ${selectedDeck.title}` : 'Chọn một bộ thẻ'}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button onClick={openCreateCard} disabled={!selectedDeckId} className="bg-primary">
                      <Plus className="w-4 h-4 mr-2" /> Thêm thẻ
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setStudyDialogOpen(true)}
                      disabled={!selectedDeckId || selectedDeckCards.length === 0}
                    >
                      Học thẻ
                    </Button>
                  </div>
                </div>

                {selectedDeckId ? (
                  selectedDeckCards.length > 0 ? (
                    <CardList
                      cards={selectedDeckCards}
                      onEditCard={openEditCard}
                      onDeleteCard={deleteCard}
                    />
                  ) : (
                    <div className="border rounded-xl p-6 text-center text-muted-foreground">
                      Chưa có thẻ nào trong bộ này. Hãy thêm thẻ!
                    </div>
                  )
                ) : (
                  <div className="border rounded-xl p-6 text-center text-muted-foreground">
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
            <DialogDescription>Nhập thông tin cho bộ thẻ của bạn</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên bộ thẻ *</Label>
              <Input
                value={deckForm.title}
                onChange={(e) => setDeckForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ví dụ: Từ vựng Business English"
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={deckForm.description}
                onChange={(e) => setDeckForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả ngắn về bộ thẻ"
              />
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
            <Button variant="outline" onClick={() => setCreatingDeck(false)}>Hủy</Button>
            <Button onClick={saveCreateDeck} className="bg-primary">Tạo</Button>
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
          {editingDeck && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tên bộ thẻ *</Label>
                <Input
                  value={deckForm.title}
                  onChange={(e) => setDeckForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={deckForm.description}
                  onChange={(e) => setDeckForm((f) => ({ ...f, description: e.target.value }))}
                />
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
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDeck(null)}>Hủy</Button>
            <Button onClick={saveEditDeck} className="bg-primary">Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                onChange={(e) => setCardForm((f) => ({ ...f, frontContent: e.target.value }))}
                placeholder="Từ/cụm từ"
              />
            </div>
            <div className="space-y-2">
              <Label>Mặt sau *</Label>
              <Textarea
                value={cardForm.backContent}
                onChange={(e) => setCardForm((f) => ({ ...f, backContent: e.target.value }))}
                placeholder="Định nghĩa/giải thích"
              />
            </div>
            <div className="space-y-2">
              <Label>Câu ví dụ</Label>
              <Textarea
                value={cardForm.exampleSentence}
                onChange={(e) => setCardForm((f) => ({ ...f, exampleSentence: e.target.value }))}
                placeholder="Ví dụ sử dụng trong câu"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatingCard(false)}>Hủy</Button>
            <Button onClick={saveCreateCard} className="bg-primary">Tạo</Button>
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
                  onChange={(e) => setCardForm((f) => ({ ...f, frontContent: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Mặt sau *</Label>
                <Textarea
                  value={cardForm.backContent}
                  onChange={(e) => setCardForm((f) => ({ ...f, backContent: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Câu ví dụ</Label>
                <Textarea
                  value={cardForm.exampleSentence}
                  onChange={(e) => setCardForm((f) => ({ ...f, exampleSentence: e.target.value }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCard(null)}>Hủy</Button>
            <Button onClick={saveEditCard} className="bg-primary">Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Study Mode Dialog */}
      <Dialog open={studyDialogOpen} onOpenChange={setStudyDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <StudyMode
            cards={selectedDeckCards}
            userId={currentUserId}
            onClose={() => setStudyDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Flashcards;