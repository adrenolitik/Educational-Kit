/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudySummary, TestQuestion, Flashcard, SourceStats } from '../types';

export interface ExtractTextResponse {
  success: boolean;
  text: string;
  stats: SourceStats;
  warnings: string[];
  filename: string;
  error?: string;
}

export interface GenerateKitResponse {
  success: boolean;
  summary: StudySummary;
  test: TestQuestion[];
  flashcards: Flashcard[];
  error?: string;
}

export async function extractTextFromInput(params: {
  pdfBase64?: string;
  rawText?: string;
  filename?: string;
}): Promise<ExtractTextResponse> {
  const res = await fetch('/api/extract-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Ошибка при извлечении текста');
  }
  return data;
}

export async function generateStudyKit(params: {
  title: string;
  sourceText: string;
  category?: string;
}): Promise<GenerateKitResponse> {
  const res = await fetch('/api/generate-kit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Ошибка при генерации учебного комплекта');
  }
  return data;
}

export async function regenerateComponent(params: {
  component: 'summary' | 'test' | 'flashcards';
  title: string;
  sourceText: string;
}): Promise<any> {
  const res = await fetch('/api/regenerate-component', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Ошибка при перегенерации компонента');
  }
  return data.data;
}
