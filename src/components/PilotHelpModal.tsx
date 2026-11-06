/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, CheckCircle2, ShieldAlert, BookOpen, Layers, HelpCircle, FileText } from 'lucide-react';

interface PilotHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PilotHelpModal: React.FC<PilotHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Справка по пилотной версии MVP
              </h2>
              <p className="text-xs text-slate-500">Первый этап проекта «Учебный комплект»</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {/* Section 1: Goals */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              1. Назначение и сценарий
            </h3>
            <p>
              Приложение разработано для самостоятельной подготовки студентов на основе загруженной главы учебника или лекционного материала. Приложение преобразует учебный текст в согласованный комплект материалов:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Краткий конспект:</strong> основные положения, ключевые понятия и блок «Что нужно запомнить».</li>
              <li><strong>Тест для самопроверки:</strong> до 10 вопросов с 4 вариантами, объяснениями и ссылками на первоисточник.</li>
              <li><strong>Карточки для повторения:</strong> до 15 карточек «вопрос — ответ» с режимом самопроверки.</li>
            </ul>
          </div>

          {/* Section 2: Limitations */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Ограничения первой версии (MVP)</span>
            </div>
            <ul className="space-y-1.5 text-amber-800 dark:text-amber-300">
              <li>• <strong>Источник:</strong> одна глава или небольшой учебный текст на комплект.</li>
              <li>• <strong>Формат:</strong> PDF с текстовым слоем или вставка текста вручную.</li>
              <li>• <strong>Сканы:</strong> графические сканы без текстового слоя не обрабатываются (предлагается вставить текст вручную).</li>
              <li>• <strong>Объем:</strong> от 2 000 до 50 000 символов с пробелами.</li>
              <li>• <strong>Язык:</strong> русский академический.</li>
              <li>• <strong>Таблицы и формулы:</strong> первая версия обрабатывает только извлеченный текст.</li>
            </ul>
          </div>

          {/* Section 3: Citations */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              2. Привязка цитат к источнику
            </h3>
            <p>
              К каждому разделу конспекта, вопросу теста и карточке прикреплена подтверждающая цитата из текста. По нажатию на ссылку приложение открывает исходный текст и выделяет подтверждающий фрагмент.
            </p>
          </div>

          {/* Section 4: Notice */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
            <strong>Предупреждение:</strong> Материалы созданы с помощью ИИ и могут содержать ошибки. Всегда проверяйте важные сведения по источнику.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
