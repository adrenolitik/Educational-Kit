/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  StudyKit,
  TestResult,
  FlashcardStatus,
  StudySummary,
  TestQuestion,
  Flashcard,
} from '../types';
import { AiNoticeBanner } from './AiNoticeBanner';
import { regenerateComponent } from '../services/api';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  RotateCw,
  Layers,
  HelpCircle,
  BookOpen,
  Sparkles,
  Quote,
  Shuffle,
  Volume2,
  Check,
  RefreshCcw,
  Copy,
  Printer,
  ChevronRight,
  ChevronLeft,
  Award,
  Search,
  ExternalLink,
} from 'lucide-react';

interface KitDetailViewProps {
  kit: StudyKit;
  initialTab?: 'summary' | 'test' | 'cards' | 'source';
  onBack: () => void;
  onUpdateTestResult: (result: TestResult) => void;
  onUpdateCardStatus: (cardId: string, status: FlashcardStatus) => void;
  onResetCards: () => void;
  onUpdateComponent: (component: 'summary' | 'test' | 'flashcards', data: any) => void;
  onOpenSourceQuote: (quote: string) => void;
  onDeleteKit: () => void;
}

type TabType = 'summary' | 'test' | 'cards' | 'source';

export const KitDetailView: React.FC<KitDetailViewProps> = ({
  kit,
  initialTab = 'summary',
  onBack,
  onUpdateTestResult,
  onUpdateCardStatus,
  onResetCards,
  onUpdateComponent,
  onOpenSourceQuote,
  onDeleteKit,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Test state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>(
    kit.lastTestResult ? kit.lastTestResult.userAnswers : {}
  );
  const [testSubmitted, setTestSubmitted] = useState<boolean>(!!kit.lastTestResult);

  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [cardsFilter, setCardsFilter] = useState<'all' | 'learning' | 'mastered'>('all');
  const [cardsViewMode, setCardsViewMode] = useState<'carousel' | 'grid'>('carousel');

  // Selective regeneration loading
  const [regeneratingComponent, setRegeneratingComponent] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Sync state if kit changes
  useEffect(() => {
    if (kit.lastTestResult) {
      setSelectedAnswers(kit.lastTestResult.userAnswers);
      setTestSubmitted(true);
    } else {
      setSelectedAnswers({});
      setTestSubmitted(false);
    }
  }, [kit.id, kit.lastTestResult]);

  // Keyboard navigation for flashcards
  useEffect(() => {
    if (activeTab !== 'cards' || cardsViewMode !== 'carousel') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsCardFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleMarkCurrentCard('mastered');
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleMarkCurrentCard('learning');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, cardsViewMode, currentCardIndex, isCardFlipped, kit.flashcards]);

  // Test actions
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (testSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitTest = () => {
    if (!kit.test) return;
    let score = 0;
    kit.test.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctOptionIndex) {
        score += 1;
      }
    });

    const result: TestResult = {
      completedAt: new Date().toISOString(),
      score,
      total: kit.test.length,
      userAnswers: selectedAnswers,
    };

    setTestSubmitted(true);
    onUpdateTestResult(result);
  };

  const handleRetakeTest = () => {
    setSelectedAnswers({});
    setTestSubmitted(false);
  };

  // Flashcards actions
  const allCards = kit.flashcards || [];
  const filteredCards = allCards.filter((c) => {
    if (cardsFilter === 'learning') return c.status === 'learning';
    if (cardsFilter === 'mastered') return c.status === 'mastered';
    return true;
  });

  const currentCard = filteredCards[currentCardIndex] || filteredCards[0];

  const handleMarkCurrentCard = (status: FlashcardStatus) => {
    if (!currentCard) return;
    onUpdateCardStatus(currentCard.id, status);
    setIsCardFlipped(false);
    if (currentCardIndex < filteredCards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const handleNextCard = () => {
    setIsCardFlipped(false);
    if (currentCardIndex < filteredCards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const handlePrevCard = () => {
    setIsCardFlipped(false);
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
    }
  };

  // Handle selective component regeneration
  const handleRegenerate = async (comp: 'summary' | 'test' | 'flashcards') => {
    setRegeneratingComponent(comp);
    try {
      const data = await regenerateComponent({
        component: comp,
        title: kit.title,
        sourceText: kit.sourceText,
      });
      onUpdateComponent(comp, data);
      if (comp === 'test') {
        setSelectedAnswers({});
        setTestSubmitted(false);
      }
    } catch (e: any) {
      alert('Ошибка при обновлении компонента: ' + (e?.message || 'Неизвестная ошибка'));
    } finally {
      setRegeneratingComponent(null);
    }
  };

  const handleCopySummary = () => {
    if (!kit.summary) return;
    const text = `# ${kit.title}\n\n${kit.summary.overview}\n\n` +
      kit.summary.sections.map((s) => `## ${s.title}\n${s.content}\n${s.keyPoints.map((k) => `- ${k}`).join('\n')}`).join('\n\n') +
      `\n\n### Что нужно запомнить\n` +
      kit.summary.keyTakeaways.map((t) => `- ${t.point}`).join('\n');

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Flashcards statistics
  const masteredCount = allCards.filter((c) => c.status === 'mastered').length;
  const learningCount = allCards.filter((c) => c.status === 'learning').length;
  const unseenCount = allCards.filter((c) => c.status === 'unseen').length;
  const cardProgressPercent = allCards.length > 0 ? Math.round((masteredCount / allCards.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Bar Navigation inside Kit */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Назад к списку комплектов"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{kit.category || 'Учебный комплект'}</span>
              <span aria-hidden="true">·</span>
              <span>{kit.sourceStats.charCount.toLocaleString('ru-RU')} симв.</span>
              <span aria-hidden="true">·</span>
              <span>~{kit.sourceStats.readingTimeMin} мин чтения</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {kit.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenSourceQuote('')}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Исходный текст</span>
          </button>
        </div>
      </div>

      {/* Mandatory AI Warning Banner */}
      <AiNoticeBanner onOpenSource={() => onOpenSourceQuote('')} />

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl max-w-xl">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'summary'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Конспект</span>
        </button>

        <button
          onClick={() => setActiveTab('test')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'test'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Тест</span>
          {kit.lastTestResult && (
            <span className="text-[10px] tabular-nums font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              {kit.lastTestResult.score}/{kit.lastTestResult.total}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cards')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'cards'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Карточки</span>
          <span className="text-[10px] tabular-nums font-bold px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
            {allCards.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('source')}
          className={`hidden sm:flex flex-1 py-2 text-xs font-semibold rounded-xl transition-all items-center justify-center gap-2 ${
            activeTab === 'source'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Источник</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: КОНСПЕКТ */}
      {/* ========================================================= */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {kit.summary ? (
            <div className="space-y-6">
              {/* Header with actions */}
              <div className="flex items-center justify-between gap-4">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Академический конспект главы
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySummary}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSummary ? 'Скопировано' : 'Копировать'}</span>
                  </button>
                  <button
                    onClick={() => handleRegenerate('summary')}
                    disabled={regeneratingComponent === 'summary'}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors"
                    title="Пересоздать конспект"
                  >
                    <RefreshCcw className={`w-3.5 h-3.5 ${regeneratingComponent === 'summary' ? 'animate-spin' : ''}`} />
                    <span>Обновить</span>
                  </button>
                </div>
              </div>

              {/* Overview */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Краткое описание темы
                </div>
                <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                  {kit.summary.overview}
                </p>
              </div>

              {/* Main Sections */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Основные положения по разделам
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {kit.summary.sections.map((section, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3"
                    >
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {section.title}
                      </h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {section.content}
                      </p>

                      {section.keyPoints && section.keyPoints.length > 0 && (
                        <ul className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400">
                          {section.keyPoints.map((pt, ptIdx) => (
                            <li key={ptIdx} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Interactive Source Citation Link */}
                      {section.sourceQuote && (
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                          <button
                            onClick={() => onOpenSourceQuote(section.sourceQuote)}
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1.5 group text-left"
                          >
                            <Quote className="w-3.5 h-3.5 shrink-0" />
                            <span className="italic line-clamp-1 group-hover:underline">
                              Источник: «{section.sourceQuote}»
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Definitions */}
              {kit.summary.definitions && kit.summary.definitions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Ключевые понятия и определения
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {kit.summary.definitions.map((def, idx) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                            {def.term}
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {def.definition}
                          </p>
                        </div>

                        {def.sourceQuote && (
                          <button
                            onClick={() => onOpenSourceQuote(def.sourceQuote)}
                            className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-left"
                          >
                            <Quote className="w-3 h-3 shrink-0" />
                            <span className="truncate italic">«{def.sourceQuote}»</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Takeaways: Что нужно запомнить */}
              {kit.summary.keyTakeaways && kit.summary.keyTakeaways.length > 0 && (
                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-900 dark:text-emerald-100">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Что нужно запомнить</span>
                  </div>
                  <div className="space-y-3">
                    {kit.summary.keyTakeaways.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-3 text-xs">
                        <div className="flex items-start gap-2.5 text-slate-800 dark:text-slate-200">
                          <span className="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed font-medium">{item.point}</span>
                        </div>
                        {item.sourceQuote && (
                          <button
                            onClick={() => onOpenSourceQuote(item.sourceQuote)}
                            className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline shrink-0 flex items-center gap-1"
                          >
                            <Quote className="w-3 h-3" />
                            <span>Цитата</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
              <p className="text-xs text-slate-500 mb-4">Конспект пока не сгенерирован для этого комплекта.</p>
              <button
                onClick={() => handleRegenerate('summary')}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white"
              >
                Сгенерировать конспект
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ТЕСТ ДЛЯ САМОПРОВЕРКИ */}
      {/* ========================================================= */}
      {activeTab === 'test' && (
        <div className="space-y-6">
          {kit.test && kit.test.length > 0 ? (
            <div className="space-y-6">
              {/* Test Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Тест для самопроверки ({kit.test.length} вопросов)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Выберите правильный вариант для каждого вопроса и нажмите «Завершить тест».
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {testSubmitted && (
                    <button
                      onClick={handleRetakeTest}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Пройти заново</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleRegenerate('test')}
                    disabled={regeneratingComponent === 'test'}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                    title="Сгенерировать новый набор вопросов"
                  >
                    <RefreshCcw className={`w-3.5 h-3.5 ${regeneratingComponent === 'test' ? 'animate-spin' : ''}`} />
                    <span>Новые вопросы</span>
                  </button>
                </div>
              </div>

              {/* Result Score Banner if submitted */}
              {testSubmitted && kit.lastTestResult && (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-extrabold text-xl">
                      {Math.round((kit.lastTestResult.score / kit.lastTestResult.total) * 100)}%
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Результат: {kit.lastTestResult.score} из {kit.lastTestResult.total} правильных ответов
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {kit.lastTestResult.score === kit.lastTestResult.total
                          ? 'Идеально! Материал усвоен превосходно.'
                          : kit.lastTestResult.score >= kit.lastTestResult.total * 0.7
                          ? 'Хороший результат! Проверьте вопросы, где были допущены неточности.'
                          : 'Рекомендуется повторить конспект и карточки перед следующей попыткой.'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleRetakeTest}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    Пройти тест еще раз
                  </button>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-6">
                {kit.test.map((question, qIdx) => {
                  const userAnswer = selectedAnswers[question.id];
                  const isAnswered = userAnswer !== undefined;
                  const isCorrect = isAnswered && userAnswer === question.correctOptionIndex;

                  return (
                    <div
                      key={question.id}
                      className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-xs transition-colors ${
                        testSubmitted
                          ? isCorrect
                            ? 'border-emerald-300 dark:border-emerald-900/60'
                            : 'border-rose-300 dark:border-rose-900/60'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {qIdx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                            {question.question}
                          </h4>
                        </div>

                        {testSubmitted && (
                          <div className="shrink-0">
                            {isCorrect ? (
                              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Верно</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                                <XCircle className="w-4 h-4" />
                                <span>Ошибка</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                        {question.options.map((option, optIdx) => {
                          const isSelected = userAnswer === optIdx;
                          const isCorrectOption = optIdx === question.correctOptionIndex;

                          let optionStyle =
                            'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300';
                          if (testSubmitted) {
                            if (isCorrectOption) {
                              optionStyle =
                                'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
                            } else if (isSelected && !isCorrect) {
                              optionStyle =
                                'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 line-through';
                            } else {
                              optionStyle = 'opacity-60 border-slate-200 dark:border-slate-800';
                            }
                          } else if (isSelected) {
                            optionStyle =
                              'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-medium ring-1 ring-emerald-500';
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              disabled={testSubmitted}
                              onClick={() => handleSelectOption(question.id, optIdx)}
                              className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 ${optionStyle}`}
                            >
                              <span className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="leading-relaxed flex-1">{option}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation & Source Quote (Shown after submit) */}
                      {testSubmitted && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
                            <span className="font-semibold block mb-1 text-slate-900 dark:text-slate-100">
                              Объяснение:
                            </span>
                            {question.explanation}
                          </div>

                          {question.sourceQuote && (
                            <button
                              onClick={() => onOpenSourceQuote(question.sourceQuote)}
                              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 font-medium"
                            >
                              <Quote className="w-3.5 h-3.5 shrink-0" />
                              <span>Подтверждение в источнике: «{question.sourceQuote}»</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit Button */}
              {!testSubmitted && (
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSubmitTest}
                    disabled={Object.keys(selectedAnswers).length === 0}
                    className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-sm transition-colors"
                  >
                    Завершить тест и проверить ответы ({Object.keys(selectedAnswers).length} из {kit.test.length})
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
              <p className="text-xs text-slate-500 mb-4">Тест пока не сгенерирован.</p>
              <button
                onClick={() => handleRegenerate('test')}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white"
              >
                Сгенерировать тест
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: КАРТОЧКИ ДЛЯ ПОВТОРЕНИЯ */}
      {/* ========================================================= */}
      {activeTab === 'cards' && (
        <div className="space-y-6">
          {allCards.length > 0 ? (
            <div className="space-y-6">
              {/* Header and Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Карточки для интервального повторения ({allCards.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Просматривайте вопрос, открывайте ответ и отмечайте: «Знаю» или «Повторить».
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onResetCards}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors"
                    title="Сбросить статус всех карточек"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Сбросить прогресс</span>
                  </button>

                  <button
                    onClick={() => handleRegenerate('flashcards')}
                    disabled={regeneratingComponent === 'flashcards'}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors"
                    title="Сгенерировать новые карточки"
                  >
                    <RefreshCcw className={`w-3.5 h-3.5 ${regeneratingComponent === 'flashcards' ? 'animate-spin' : ''}`} />
                    <span>Обновить</span>
                  </button>
                </div>
              </div>

              {/* Progress Summary Strip */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">
                    Прогресс запоминания: {cardProgressPercent}%
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Знаю: <strong>{masteredCount}</strong>
                    </span>
                    <span className="text-amber-600 dark:text-amber-400">
                      Повторить: <strong>{learningCount}</strong>
                    </span>
                    <span className="text-slate-400">
                      Не просмотрено: <strong>{unseenCount}</strong>
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  <div
                    style={{ width: `${(masteredCount / allCards.length) * 100}%` }}
                    className="bg-emerald-500 h-full transition-all duration-300"
                  />
                  <div
                    style={{ width: `${(learningCount / allCards.length) * 100}%` }}
                    className="bg-amber-500 h-full transition-all duration-300"
                  />
                </div>
              </div>

              {/* Filter Tabs & View Toggle */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium">
                  <button
                    onClick={() => {
                      setCardsFilter('all');
                      setCurrentCardIndex(0);
                    }}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      cardsFilter === 'all'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Все ({allCards.length})
                  </button>
                  <button
                    onClick={() => {
                      setCardsFilter('learning');
                      setCurrentCardIndex(0);
                    }}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      cardsFilter === 'learning'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Повторить ({learningCount})
                  </button>
                  <button
                    onClick={() => {
                      setCardsFilter('mastered');
                      setCurrentCardIndex(0);
                    }}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      cardsFilter === 'mastered'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Знаю ({masteredCount})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCardsViewMode(cardsViewMode === 'carousel' ? 'grid' : 'carousel')}
                    className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                  >
                    {cardsViewMode === 'carousel' ? 'Показать плиткой' : 'Режим карточки'}
                  </button>
                </div>
              </div>

              {/* Carousel Mode */}
              {cardsViewMode === 'carousel' && currentCard && (
                <div className="max-w-2xl mx-auto space-y-4">
                  {/* Card counter */}
                  <div className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Карточка {currentCardIndex + 1} из {filteredCards.length}
                    {currentCard.category && ` · ${currentCard.category}`}
                  </div>

                  {/* 3D Flip Card Container */}
                  <div
                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                    className="relative w-full min-h-[280px] sm:min-h-[320px] rounded-3xl cursor-pointer perspective-1000 select-none"
                  >
                    <div
                      className={`relative w-full h-full min-h-[280px] sm:min-h-[320px] rounded-3xl transition-transform duration-500 transform-style-preserve-3d shadow-md border ${
                        isCardFlipped ? 'rotate-y-180' : ''
                      } ${
                        currentCard.status === 'mastered'
                          ? 'border-emerald-300 dark:border-emerald-900'
                          : currentCard.status === 'learning'
                          ? 'border-amber-300 dark:border-amber-900'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {/* FRONT FACE */}
                      <div className="absolute inset-0 w-full h-full p-8 rounded-3xl bg-white dark:bg-slate-900 flex flex-col justify-between backface-hidden">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Вопрос / Термин</span>
                          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            Нажмите, чтобы перевернуть
                          </span>
                        </div>

                        <div className="text-center py-6">
                          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                            {currentCard.front}
                          </p>
                        </div>

                        <div className="text-center text-[11px] text-slate-400">
                          Клавиша Пробел: перевернуть
                        </div>
                      </div>

                      {/* BACK FACE */}
                      <div className="absolute inset-0 w-full h-full p-8 rounded-3xl bg-emerald-50/50 dark:bg-slate-900 flex flex-col justify-between backface-hidden rotate-y-180 border-t border-emerald-500/20">
                        <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                          <span>Ответ / Определение</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            Нажмите для возврата
                          </span>
                        </div>

                        <div className="text-center py-4">
                          <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                            {currentCard.back}
                          </p>
                        </div>

                        {currentCard.sourceQuote && (
                          <div className="pt-2 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenSourceQuote(currentCard.sourceQuote);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                            >
                              <Quote className="w-3.5 h-3.5" />
                              <span>Подтверждающая цитата в тексте</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating / Navigation Buttons */}
                  <div className="flex items-center justify-between gap-4 pt-2">
                    <button
                      onClick={handlePrevCard}
                      disabled={currentCardIndex === 0}
                      className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Предыдущая карточка"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleMarkCurrentCard('learning')}
                        className="px-5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold hover:bg-amber-100 transition-colors flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4 text-amber-600" />
                        <span>Повторить (←)</span>
                      </button>

                      <button
                        onClick={() => handleMarkCurrentCard('mastered')}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Знаю (→)</span>
                      </button>
                    </div>

                    <button
                      onClick={handleNextCard}
                      disabled={currentCardIndex === filteredCards.length - 1}
                      className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Следующая карточка"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Grid Mode */}
              {cardsViewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCards.map((card, idx) => (
                    <div
                      key={card.id}
                      className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border flex flex-col justify-between space-y-3 ${
                        card.status === 'mastered'
                          ? 'border-emerald-300 dark:border-emerald-900/60'
                          : card.status === 'learning'
                          ? 'border-amber-300 dark:border-amber-900/60'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                          <span>#{idx + 1} {card.category}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              card.status === 'mastered'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : card.status === 'learning'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {card.status === 'mastered'
                              ? 'Знаю'
                              : card.status === 'learning'
                              ? 'Повторить'
                              : 'Не просмотрено'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                          {card.front}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2">
                          {card.back}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        {card.sourceQuote && (
                          <button
                            onClick={() => onOpenSourceQuote(card.sourceQuote)}
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <Quote className="w-3 h-3" />
                            <span>Цитата</span>
                          </button>
                        )}
                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            onClick={() => onUpdateCardStatus(card.id, 'learning')}
                            className="px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 rounded hover:bg-amber-100 transition-colors"
                          >
                            Повторить
                          </button>
                          <button
                            onClick={() => onUpdateCardStatus(card.id, 'mastered')}
                            className="px-2 py-1 text-[11px] font-semibold text-white bg-emerald-600 rounded hover:bg-emerald-700 transition-colors"
                          >
                            Знаю
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
              <p className="text-xs text-slate-500 mb-4">Карточки пока не сгенерированы.</p>
              <button
                onClick={() => handleRegenerate('flashcards')}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white"
              >
                Сгенерировать карточки
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: ИСХОДНЫЙ ТЕКСТ */}
      {/* ========================================================= */}
      {activeTab === 'source' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Исходный текст главы
              </h3>
              <p className="text-xs text-slate-500">
                {kit.sourceFileName || 'Вставленный текст'} · {kit.sourceText.length.toLocaleString('ru-RU')} символов
              </p>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(kit.sourceText);
                alert('Исходный текст скопирован в буфер обмена.');
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Копировать</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line max-h-[600px] overflow-y-auto">
            {kit.sourceText}
          </div>
        </div>
      )}
    </div>
  );
};
