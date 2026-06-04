import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { flashcardService, type SubmitReviewDTO, type DeckFormDTO, type CardFormDTO } from '@/lib/api/services/user';
import { toast } from 'sonner';
// Tạo key factory giúp quản lý key nhất quán
export const flashcardKeys = {
  allDecks: ['flashcardDecks', 'me'] as const,
  publicDecks: (search?: string) => ['flashcardDecks', 'public', search ?? ''] as const,
  cardsByDeck: (deckId: string) => ['flashcards', 'byDeck', deckId] as const,
  reviewQueue: (deckId: string) => ['flashcardQueue', 'byDeck', deckId] as const,
};

/**
 * Hook 1: Fetch tất cả bộ thẻ (decks) của user
 */
export const useGetDecks = () => {
  return useQuery({
    queryKey: flashcardKeys.allDecks,
    queryFn: async () => (await flashcardService.getMyDecks()).data,
  });
};

/**
 * Hook 1b: Fetch public decks from all users (for Explore tab)
 */
export const useGetPublicDecks = (search?: string) => {
  return useQuery({
    queryKey: flashcardKeys.publicDecks(search),
    queryFn: async () => (await flashcardService.getPublicDecks({ search, limit: 24 })).data,
    staleTime: 30_000,
  });
};
export const useCreateDeck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DeckFormDTO) => flashcardService.createDeck(data),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.allDecks });
      toast.success('Tạo bộ thẻ thành công!');
    },
  });
};
export const useUpdateDeck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // mutationFn nhận vào object chứa deckId và data
    mutationFn: ({ deckId, data }: { deckId: string; data: DeckFormDTO }) =>
      flashcardService.updateDeck(deckId, data),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.allDecks });
      toast.success('Cập nhật bộ thẻ thành công!');
    },
  });
};
export const useDeleteDeck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deckId: string) => flashcardService.deleteDeck(deckId),
    
    onSuccess: (data, deckId) => { // Tham số thứ 2 là biến đã truyền vào mutationFn
      // Fetch lại danh sách decks
      queryClient.invalidateQueries({ queryKey: flashcardKeys.allDecks });
      
      // QUAN TRỌNG: Xóa cache của các thẻ (cards) thuộc bộ thẻ đã bị xóa
      queryClient.removeQueries({ queryKey: flashcardKeys.cardsByDeck(deckId) });
      
      toast.success('Đã xóa bộ thẻ!');
    },
  });
};
/**
 * Hook 2: Fetch các thẻ (cards) khi biết deckId
 */
export const useGetCards = (deckId: string | null) => {
  return useQuery({
    queryKey: flashcardKeys.cardsByDeck(deckId!), // Dùng `!` vì `enabled` sẽ lo
    queryFn: async () => (await flashcardService.getCardsByDeck(deckId!)).data,

    enabled: !!deckId,
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 403) return false;
      return failureCount < 1;
    },
  });
};
export const useCreateCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CardFormDTO) => flashcardService.createCard(data),
    
    onSuccess: (response) => {
      // `response.data` là Flashcard mới
      const deckId = response.data.deckId;
      // Fetch lại danh sách thẻ của bộ này
      queryClient.invalidateQueries({ queryKey: flashcardKeys.cardsByDeck(deckId) });
      toast.success('Tạo thẻ thành công!');
    },
  });
};
export const useUpdateCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: Partial<CardFormDTO> }) =>
      flashcardService.updateCard(cardId, data),
    
    onSuccess: (response) => {
      const deckId = response.data.deckId;
      // Fetch lại danh sách thẻ của bộ này
      queryClient.invalidateQueries({ queryKey: flashcardKeys.cardsByDeck(deckId) });
      toast.success('Cập nhật thẻ thành công!');
    },
  });
};
export const useDeleteCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // Quan trọng: Chúng ta cần `deckId` để invalidate cache
    mutationFn: ({ cardId, deckId }: { cardId: string; deckId: string }) => 
      flashcardService.deleteCard(cardId),
    
    onSuccess: (_, variables) => { // `variables` là object { cardId, deckId }
      const { deckId } = variables;
      // Fetch lại danh sách thẻ của bộ này
      queryClient.invalidateQueries({ queryKey: flashcardKeys.cardsByDeck(deckId) });
      toast.success('Đã xóa thẻ!');
    },
  });
};
/**
 * Hook 3: Fetch tiến độ học (cho StudyMode) khi biết deckId
 */
export const useGetReviewQueue = (deckId: string | null) => {
  return useQuery({
    queryKey: flashcardKeys.reviewQueue(deckId!), // 👈 Dùng key mới
    queryFn: async () => (await flashcardService.getReviewQueue(deckId!)).data,
    enabled: !!deckId,
    staleTime: 0, // Hàng đợi học tập nên được fetch mới mỗi lần
    gcTime: 0,
  });
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // SỬA: mutationFn giờ sẽ nhận { flashcardId, deckId, data }
    mutationFn: ({ flashcardId, deckId, data }: { 
      flashcardId: string; 
      deckId: string; // 👈 Cần deckId
      data: SubmitReviewDTO;
    }) =>
      flashcardService.submitReview(flashcardId, data),
    
    // Không invalidate reviewQueue ở đây để tránh reset progress bar
    // Queue sẽ tự refetch khi user mở lại study mode (staleTime: 0)
    onSuccess: () => {
      // Review submitted — session state is managed locally in StudyMode
    },
  });
};

export const useResetProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deckId: string) => flashcardService.resetProgress(deckId),
    onSuccess: (_, deckId) => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.reviewQueue(deckId) });
      toast.success('Đã xóa tiến độ học!');
    },
  });
};