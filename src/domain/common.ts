/**
 * Domain - Shared entities (Tag, Report, Flashcard, Rating, Comment, etc.)
 */

import type { EReasonType, FlashcardStatus } from './enums';

export interface Rating {
  id: string;
  score: number;
  userId: string;
  courseId: string;
  content?: string;
  createdAt: string;
  replyContent?: string;
  repliedAt?: string;
  isReported: boolean;
  /** Optional relation - populated by API when requested */
  user?: { fullName?: string; id?: string };
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
  parentCommentId?: string;
  lessonId: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Report {
  id: string;
  content: string;
  reasonType: EReasonType;
  userId: string;
  courseId: string;
  createdAt: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  createdAt: string;
  description?: string;
  isPublic: boolean;
  userId: string;
}

export interface Flashcard {
  id: string;
  frontContent: string;
  backContent: string;
  exampleSentence?: string;
  audioUrl?: string;
  videoUrl?: string;
  deckId: string;
  queueType?: FlashcardStatus;
}

export interface UserFlashcardProgress {
  userId: string;
  flashcardId: string;
  status: FlashcardStatus;
  nextReviewAt: string;
  repetitions: number;
  easeFactor: number;
  interval: number;
  learningStep: number;
}
