/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
}

export interface SummarySection {
  title: string;
  content: string;
  keyPoints: string[];
  sourceQuote: string;
}

export interface DefinitionItem {
  term: string;
  definition: string;
  sourceQuote: string;
}

export interface TakeawayItem {
  point: string;
  sourceQuote: string;
}

export interface StudySummary {
  overview: string;
  sections: SummarySection[];
  definitions: DefinitionItem[];
  keyTakeaways: TakeawayItem[];
}

export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  sourceQuote: string;
}

export interface TestResult {
  completedAt: string;
  score: number;
  total: number;
  userAnswers: Record<string, number>;
}

export type FlashcardStatus = 'unseen' | 'learning' | 'mastered';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  sourceQuote: string;
  status: FlashcardStatus;
}

export interface SourceStats {
  charCount: number;
  wordCount: number;
  pageCountApprox: number;
  readingTimeMin: number;
}

export interface StudyKit {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  sourceText: string;
  sourceFileName?: string;
  sourceStats: SourceStats;
  summary: StudySummary | null;
  test: TestQuestion[] | null;
  flashcards: Flashcard[] | null;
  lastTestResult: TestResult | null;
  coverImage?: string;
  category?: string;
  generationErrors?: {
    summary?: string;
    test?: string;
    flashcards?: string;
  };
}

export interface PresetChapter {
  id: string;
  title: string;
  category: string;
  coverImage: string;
  description: string;
  sourceText: string;
  sampleKit: Omit<StudyKit, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastTestResult'> & {
    lastTestResult?: TestResult | null;
  };
}
