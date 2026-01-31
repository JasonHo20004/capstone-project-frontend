import { useQuery,useQueryClient,useMutation } from '@tanstack/react-query';
import { flashcardService, type SubmitReviewDTO, type DeckFormDTO, type CardFormDTO, } from '@/lib/api/services/user';

import { toast } from 'sonner';
// Tạo key factory giúp quản lý key nhất quán
export const flashcardKeys = {
  allDecks: ['flashcardDecks', 'me'] as const,
  cardsByDeck: (deckId: string) => ['flashcards', 'byDeck', deckId] as const,
  // 🔽 THÊM key mới
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
export const useCreateDeck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DeckFormDTO) => flashcardService.createDeck(data),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.allDecks });
      toast.success('Tạo bộ thẻ thành công!');
    },
    onError: (error:any) => {
      const message = error.response?.data?.message || "Tạo bộ thẻ thất bại";
      toast.error(message);
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
      // Fetch lại danh sách decks sau khi cập nhật thành công
      queryClient.invalidateQueries({ queryKey: flashcardKeys.allDecks });
      toast.success('Cập nhật bộ thẻ thành công!');
    },
    onError: (error:any) => {
    
      const message = error.response?.data?.message || "Cập nhật thất bại";
      toast.error(message);
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
    onError: (error:any) => {
      
      const message = error.response?.data?.message || "Xóa thất bại";
      toast.error(message);
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
    
    // Rất quan trọng: Chỉ chạy query này khi `deckId` tồn tại (không null)
    enabled: !!deckId, 
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
    onError: (error:any) => {
   
      const message = error.response?.data?.message || "Tạo thẻ thất bại";
      toast.error(message);
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
    onError: (error:any) => {
      const message = error.response?.data?.message || "Cập nhật thẻ thất bại";
      toast.error(message);
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
    onError: (error:any) => {
   
      const message = error.response?.data?.message || "Xóa thẻ thất bại";
      toast.error(message);
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
    
    // SỬA: Dùng `deckId` từ `variables`
    onSuccess: (response, variables) => {
      // `variables` chính là object { flashcardId, deckId, data }
      const { deckId } = variables;

      // Bây giờ chúng ta có thể làm mới hàng đợi (queue)
      // cho đúng bộ thẻ này!
      queryClient.invalidateQueries({ queryKey: flashcardKeys.reviewQueue(deckId) });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message);
    },
  });
};