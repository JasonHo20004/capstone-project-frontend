// =============================================================================
// Seller — Question Import Service
// =============================================================================
// Calls the stateless parse endpoint exposed by assessment-service.
// The endpoint returns parsed questions; nothing is persisted server-side until
// the seller commits via the existing createTest flow.

import apiClient from '../../config';

export interface ParsedOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface ParsedQuestion {
  questionNumber: number;
  questionType: 'MULTIPLE_CHOICE';
  questionText: string;
  options: ParsedOption[];
  correctAnswerIndex: number | null;
  explanation: string | null;
  score: number;
  sourceText: string;
  parserWarnings: string[];
  /** Instruction for this section; only present on the first question of each detected section. */
  sectionInstruction?: string;
}

export interface ParseSummary {
  totalParsed: number;
  withAnswer: number;
  withoutAnswer: number;
  warningCount: number;
}

export interface ParseResponse {
  metadata: {
    fileType: 'pdf' | 'docx';
    wordCount: number;
    characterCount: number;
    pageCount?: number;
  };
  questions: ParsedQuestion[];
  summary: ParseSummary;
  unparsedText?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class QuestionImportService {
  async parseFile(file: File): Promise<ParseResponse> {
    const fd = new FormData();
    fd.append('file', file);
    const response = await apiClient.post<ApiEnvelope<ParseResponse>>(
      '/question-imports/parse',
      fd,
      { timeout: 60_000 }
    );
    if (!response.data?.success || !response.data?.data) {
      throw new Error(response.data?.error || 'Parse failed');
    }
    return response.data.data;
  }
}

export const questionImportService = new QuestionImportService();
