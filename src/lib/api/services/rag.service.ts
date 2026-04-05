import apiClient from "@/lib/api/config";

export interface FlashcardItem {
  front_content: string;
  back_content: string;
  example_sentence?: string;
}

export interface GenerateFlashcardsResponse {
  success: boolean;
  doc_id: string;
  deck_id?: string;
  title: string;
  flashcards: FlashcardItem[];
  source_pages: number;
  chunks_used: number;
}

export interface AskQuestionResponse {
  success: boolean;
  answer: string;
  relevant_chunks: string[];
}

class RagService {
  async generateFlashcards(
    file: File,
    title: string,
    userId: string,
    saveToService: boolean = true,
  ): Promise<GenerateFlashcardsResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("user_id", userId);
    formData.append("save_to_service", saveToService.toString());

    const response = await apiClient.post<GenerateFlashcardsResponse>(
      "/rag/generate/flashcards",
      formData,
      { timeout: 300000 }, // 5 min — LLM generation takes time
    );
    return response.data;
  }

  async generateFlashcardsFromText(
    text: string,
    title: string,
    userId: string,
    saveToService: boolean = true,
  ): Promise<GenerateFlashcardsResponse> {
    const response = await apiClient.post<GenerateFlashcardsResponse>(
      "/rag/generate/flashcards/text",
      {
        text,
        title,
        user_id: userId,
        save_to_service: saveToService,
      },
      { timeout: 300000 }, // 5 min — LLM generation takes time
    );
    return response.data;
  }

  async askQuestion(docId: string, question: string): Promise<AskQuestionResponse> {
    const response = await apiClient.post<AskQuestionResponse>("/rag/ask", {
      doc_id: docId,
      question,
    }, { timeout: 120000 }); // 2 min for Q&A
    return response.data;
  }
}

export const ragService = new RagService();
