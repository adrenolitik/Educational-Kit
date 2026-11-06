/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PRESET_CHAPTERS } from '../data/presets';
import { PresetChapter, StudyKit, User } from '../types';
import { X, BookOpen, Layers, CheckCircle2, ArrowRight } from 'lucide-react';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onAddPreset: (kit: StudyKit) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  user,
  onAddPreset,
}) => {
  if (!isOpen) return null;

  const handleClonePreset = (preset: PresetChapter) => {
    const now = new Date().toISOString();
    const newKit: StudyKit = {
      id: `kit_${Date.now()}_preset`,
      userId: user.id,
      title: preset.sampleKit.title,
      createdAt: now,
      updatedAt: now,
      sourceText: preset.sourceText,
      sourceFileName: preset.sampleKit.sourceFileName,
      sourceStats: preset.sampleKit.sourceStats,
      summary: preset.sampleKit.summary,
      test: preset.sampleKit.test,
      flashcards: preset.sampleKit.flashcards,
      lastTestResult: null,
      coverImage: preset.sampleKit.coverImage,
      category: preset.sampleKit.category,
    };
    onAddPreset(newKit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Примеры учебных глав (Согласованные тексты)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Выберите утвержденную главу для мгновенной проверки конспекта, теста и карточек
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Presets */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {PRESET_CHAPTERS.map((preset) => (
            <div
              key={preset.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-emerald-500 transition-colors group"
            >
              {preset.coverImage && (
                <img
                  src={preset.coverImage}
                  alt={preset.title}
                  referrerPolicy="no-referrer"
                  className="w-full sm:w-28 h-24 rounded-xl object-cover shrink-0"
                />
              )}

              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                  {preset.category}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {preset.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                  {preset.description}
                </p>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{preset.sourceText.length.toLocaleString('ru-RU')} симв.</span>
                  <span aria-hidden="true">·</span>
                  <span>{preset.sampleKit.test?.length || 0} вопросов</span>
                  <span aria-hidden="true">·</span>
                  <span>{preset.sampleKit.flashcards?.length || 0} карточек</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleClonePreset(preset)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-colors shrink-0"
              >
                <span>Добавить к себе</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
