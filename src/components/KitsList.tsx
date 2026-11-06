/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudyKit } from '../types';
import {
  Plus,
  Trash2,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  Clock,
  Search,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';

interface KitsListProps {
  kits: StudyKit[];
  onOpenKit: (kitId: string, initialTab?: 'summary' | 'test' | 'cards') => void;
  onCreateNew: () => void;
  onOpenPresets: () => void;
  onDeleteKit: (kitId: string) => void;
}

export const KitsList: React.FC<KitsListProps> = ({
  kits,
  onOpenKit,
  onCreateNew,
  onOpenPresets,
  onDeleteKit,
}) => {
  const [search, setSearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Compute stats across user's kits
  const totalKits = kits.length;
  let totalCardsLearned = 0;
  let totalCards = 0;
  let testsTaken = 0;
  let totalScoreSum = 0;

  kits.forEach((kit) => {
    if (kit.flashcards) {
      totalCards += kit.flashcards.length;
      totalCardsLearned += kit.flashcards.filter((c) => c.status === 'mastered').length;
    }
    if (kit.lastTestResult) {
      testsTaken += 1;
      totalScoreSum += (kit.lastTestResult.score / kit.lastTestResult.total) * 100;
    }
  });

  const avgTestScore = testsTaken > 0 ? Math.round(totalScoreSum / testsTaken) : null;

  const filteredKits = kits.filter((kit) =>
    kit.title.toLowerCase().includes(search.toLowerCase()) ||
    (kit.category && kit.category.toLowerCase().includes(search.toLowerCase()))
  );

  const kitToDelete = kits.find((k) => k.id === deleteConfirmId);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero / Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Мои учебные комплекты
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Конспекты, тесты для самопроверки и карточки для повторения
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenPresets}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
          >
            Готовые главы
          </button>

          <button
            onClick={onCreateNew}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Создать комплект</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Комплектов</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
            {totalKits}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Изучено карточек</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {totalCardsLearned} <span className="text-sm text-slate-400 font-normal">/ {totalCards}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Пройдено тестов</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
            {testsTaken}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Средний результат</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
            {avgTestScore !== null ? `${avgTestScore}%` : '—'}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию или предмету..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Kits Grid */}
      {filteredKits.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {search ? 'Комплекты не найдены' : 'У вас пока нет учебных комплектов'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Загрузите главу учебника в формате PDF или вставьте текст, чтобы ИИ создал краткий конспект, тест и карточки.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onCreateNew}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Создать первый комплект
            </button>
            <button
              onClick={onOpenPresets}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
            >
              Загрузить готовую главу
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKits.map((kit) => {
            const dateStr = new Date(kit.createdAt).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const masteredCount = kit.flashcards?.filter((c) => c.status === 'mastered').length || 0;
            const totalCardsCount = kit.flashcards?.length || 0;
            const hasTestResult = !!kit.lastTestResult;

            return (
              <div
                key={kit.id}
                className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:shadow-sm group"
              >
                {/* Optional Cover Image */}
                {kit.coverImage && (
                  <div className="relative h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={kit.coverImage}
                      alt={kit.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {kit.category && (
                      <span className="absolute top-3 left-3 px-2 py-1 text-[11px] font-semibold rounded-md bg-slate-900/80 text-white backdrop-blur-xs">
                        {kit.category}
                      </span>
                    )}
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Metadata line without pills */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                      <span>{dateStr}</span>
                      <span aria-hidden="true">·</span>
                      <span>{kit.sourceStats.charCount.toLocaleString('ru-RU')} симв.</span>
                      <span aria-hidden="true">·</span>
                      <span>~{kit.sourceStats.readingTimeMin} мин</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mb-3">
                      {kit.title}
                    </h3>

                    {/* Progress details */}
                    <div className="space-y-2 py-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      {/* Test result status */}
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Тест:</span>
                        </span>
                        <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                          {hasTestResult
                            ? `${kit.lastTestResult!.score} из ${kit.lastTestResult!.total} (${Math.round(
                                (kit.lastTestResult!.score / kit.lastTestResult!.total) * 100
                              )}%)`
                            : 'Не пройден'}
                        </span>
                      </div>

                      {/* Flashcards status */}
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <span>Карточки:</span>
                        </span>
                        <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                          {masteredCount} из {totalCardsCount} изучено
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onOpenKit(kit.id, 'summary')}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <span>Открыть материалы</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1">
                      {kit.test && kit.test.length > 0 && (
                        <button
                          onClick={() => onOpenKit(kit.id, 'test')}
                          title="Пройти тест самопроверки"
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          Тест
                        </button>
                      )}

                      <button
                        onClick={() => setDeleteConfirmId(kit.id)}
                        title="Удалить комплект"
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && kitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Удалить учебный комплект?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Вы собираетесь удалить комплект «<strong>{kitToDelete.title}</strong>». Будут безвозвратно удалены исходный учебный текст, конспект, вопросы теста и карточки для повторения.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteKit(kitToDelete.id);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-xs"
              >
                Удалить комплект
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
