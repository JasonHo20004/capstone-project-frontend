import apiClient from '@/lib/api/config';
import type { ApiResponse, EmptyResponse } from '@/lib/api/types';
import type {
  FlashcardDeck,
  Flashcard,
  UserFlashcardProgress,
} from "@/types/type";

export type ReviewQuality = 1 | 3 | 4 | 5; // Dựa theo backend service

export interface SubmitReviewDTO {
  quality: ReviewQuality;
}
export interface DeckFormDTO {
  title: string;
  description?: string;
  isPublic: boolean;
  tagIds?: string[]; // 👈 THÊM DÒNG NÀY
}
export interface CardFormDTO {
  frontContent: string;
  backContent: string;
  exampleSentence?: string;
  deckId: string; // Cần thiết khi TẠO
}
class FlashcardService {
  /**
   * Lấy tất cả bộ thẻ (decks) của user đang đăng nhập
   */
  async getMyDecks(): Promise<ApiResponse<FlashcardDeck[]>> {
    const response = await apiClient.get<ApiResponse<FlashcardDeck[]>>(
      "/flashcard-decks"
    );
    return response.data;
  }
  async createDeck(data: DeckFormDTO): Promise<ApiResponse<FlashcardDeck>> {
    const response = await apiClient.post<ApiResponse<FlashcardDeck>>(
      "/flashcard-decks/create",
      data
    );
    return response.data;
  }
  async updateDeck(
    deckId: string,
    data: DeckFormDTO
  ): Promise<ApiResponse<FlashcardDeck>> {
    // Dùng PUT (như bạn yêu cầu)
    const response = await apiClient.put<ApiResponse<FlashcardDeck>>(
      `/flashcard-decks/update/${deckId}`,
      data
    );
    return response.data;
  }
  async deleteDeck(deckId: string): Promise<ApiResponse<EmptyResponse>> {
    const response = await apiClient.delete(`/flashcard-decks/delete/${deckId}`);
    return response.data;
  }
  /**
   * Lấy tất cả thẻ (cards) của một bộ thẻ cụ thể
   */
  async getCardsByDeck(deckId: string): Promise<ApiResponse<Flashcard[]>> {
    const response = await apiClient.get<ApiResponse<Flashcard[]>>(
      `/flashcards/${deckId}`
    );
    return response.data;
  }

  async createCard(data: CardFormDTO): Promise<ApiResponse<Flashcard>> {
    const response = await apiClient.post<ApiResponse<Flashcard>>('/flashcards/create', data);
    return response.data;
  }
  async updateCard(cardId: string, data: Partial<CardFormDTO>): Promise<ApiResponse<Flashcard>> {
    // Chúng ta dùng Partial<CardFormDTO> vì không cần gửi deckId khi cập nhật
    const response = await apiClient.put<ApiResponse<Flashcard>>(`/flashcards/update/${cardId}`, data);
    return response.data;
  }
  async deleteCard(cardId: string): Promise<ApiResponse<EmptyResponse>> {
    const response = await apiClient.delete(`/flashcards/delete/${cardId}`);
    return response.data;
  }
  /**
   * Lấy tiến độ học của tất cả thẻ trong một bộ (cho StudyMode)
   */
  async getReviewQueue(deckId: string): Promise<ApiResponse<Flashcard[]>> {
    // Gọi route mới: /flashcard-review/queue/:deckId
    const response = await apiClient.get<ApiResponse<Flashcard[]>>(
      `/flashcard-review/queue/${deckId}`
    );
    return response.data;
  }
  async submitReview(
    flashcardId: string,
    data: SubmitReviewDTO
  ): Promise<ApiResponse<UserFlashcardProgress>> {
    // Gọi route mới: /flashcard-review/submit/:flashcardId
    const response = await apiClient.post<ApiResponse<UserFlashcardProgress>>(
      `/flashcard-review/submit/${flashcardId}`,
      data
    );
    return response.data;
  }
}

export const flashcardService = new FlashcardService();
