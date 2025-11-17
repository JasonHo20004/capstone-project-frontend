import { useQuery,useQueryClient,useMutation } from '@tanstack/react-query';
import { flashcardService, type SubmitReviewDTO, type DeckFormDTO } from '@/lib/api/services/flashcard.service';

import { toast } from 'sonner';
// Tạo key factory giúp quản lý key nhất quán
export const flashcardKeys = {
  allDecks: ['flashcardDecks', 'me'] as const,
  cardsByDeck: (deckId: string) => ['flashcards', 'byDeck', deckId] as const,
  progressByDeck: (deckId: string) => ['flashcardProgress', 'byDeck', deckId] as const,
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

/**
 * Hook 3: Fetch tiến độ học (cho StudyMode) khi biết deckId
 */
export const useGetReviewQueue = (deckId: string | null) => {
  return useQuery({
    // Dùng key mới
    queryKey: ['flashcardQueue', deckId],
    queryFn: async () => (await flashcardService.getReviewQueue(deckId!)).data,
    enabled: !!deckId,
  });
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ flashcardId, data }: { flashcardId: string; data: SubmitReviewDTO }) =>
      flashcardService.submitReview(flashcardId, data),
    onSuccess: (response) => {
      // Khi nộp bài thành công, chúng ta cần báo cho hàng đợi (queue)
      // biết là data đã cũ, để nó fetch lại (nếu cần)
      // (response.data.deckId giả sử API trả về deckId)
      // queryClient.invalidateQueries({ queryKey: ['flashcardQueue', response.data.deckId] });
      
      // Không cần làm gì cả, vì component sẽ tự quản lý session
    },
    onError: (error) => toast.error('Lưu tiến độ thất bại: ' + error.message),
  });
};