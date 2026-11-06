/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, StudyKit, SourceStats } from '../types';
import { extractTextFromInput, generateStudyKit } from '../services/api';
import { PRESET_CHAPTERS } from '../data/presets';
import {
  UploadCloud,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Info,
  Shield,
  Layers,
  BookMarked,
} from 'lucide-react';

interface CreateKitViewProps {
  user: User;
  onKitCreated: (kit: StudyKit) => void;
  onCancel: () => void;
}

type TabMode = 'paste' | 'upload' | 'preset';

export const CreateKitView: React.FC<CreateKitViewProps> = ({
  user,
  onKitCreated,
  onCancel,
}) => {
  const [tab, setTab] = useState<TabMode>('paste');
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState<string | undefined>();
  const [category, setCategory] = useState('Общий');
  const [coverImage, setCoverImage] = useState<string | undefined>();

  // Consents & validations
  const [aiConsentAccepted, setAiConsentAccepted] = useState(false);
  const [extractedStats, setExtractedStats] = useState<SourceStats | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Generation status
  const [statusStep, setStatusStep] = useState<
    'idle' | 'extracting' | 'generating' | 'success' | 'failed'
  >('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Handle PDF file selection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Размер файла превышает 10 МБ. Пожалуйста, выберите файл меньшего размера.');
      return;
    }

    setError(null);
    setStatusStep('extracting');
    setStatusMessage('Извлекаем текст из PDF документа...');
    setFileName(file.name);

    if (!title) {
      // Auto-suggest title from filename without extension
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = (reader.result as string).split(',')[1];
          const result = await extractTextFromInput({
            pdfBase64: base64String,
            filename: file.name,
          });

          setRawText(result.text);
          setExtractedStats(result.stats);
          setWarnings(result.warnings || []);
          setStatusStep('idle');
          setStatusMessage('');
        } catch (apiErr: any) {
          setError(apiErr?.message || 'Не удалось извлечь текст из PDF.');
          setStatusStep('idle');
        }
      };
      reader.onerror = () => {
        setError('Не удалось прочитать файл с устройства.');
        setStatusStep('idle');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки файла.');
      setStatusStep('idle');
    }
  };

  // Select Preset Chapter
  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_CHAPTERS.find((p) => p.id === presetId);
    if (!preset) return;
    setTitle(preset.title);
    setRawText(preset.sourceText);
    setCategory(preset.category);
    setCoverImage(preset.coverImage);
    setFileName(preset.sampleKit.sourceFileName);

    const charCount = preset.sourceText.length;
    const words = preset.sourceText.split(/\s+/).length;
    setExtractedStats({
      charCount,
      wordCount: words,
      pageCountApprox: Math.ceil(charCount / 2200),
      readingTimeMin: Math.round(words / 160),
    });
    setWarnings([]);
    setError(null);
  };

  // Launch Generation
  const handleCreateKit = async () => {
    if (!title.trim()) {
      setError('Пожалуйста, укажите название темы комплекта.');
      return;
    }
    if (!rawText.trim() || rawText.trim().length < 200) {
      setError('Учебный текст слишком короткий. Минимальный объем — от 200 символов (рекомендуется от 2 000).');
      return;
    }
    if (!aiConsentAccepted) {
      setError('Для продолжения необходимо подтвердить согласие на обработку материала ИИ.');
      return;
    }

    setError(null);
    setStatusStep('generating');
    setStatusMessage('Создаем материалы: краткий конспект, тест для самопроверки и карточки...');

    try {
      const response = await generateStudyKit({
        title: title.trim(),
        sourceText: rawText.trim(),
        category,
      });

      setStatusStep('success');
      setStatusMessage('Комплект успешно создан!');

      const now = new Date().toISOString();
      const stats: SourceStats = extractedStats || {
        charCount: rawText.length,
        wordCount: rawText.split(/\s+/).length,
        pageCountApprox: Math.max(1, Math.ceil(rawText.length / 2200)),
        readingTimeMin: Math.max(1, Math.round(rawText.split(/\s+/).length / 160)),
      };

      const newKit: StudyKit = {
        id: `kit_${Date.now()}`,
        userId: user.id,
        title: title.trim(),
        createdAt: now,
        updatedAt: now,
        sourceText: rawText.trim(),
        sourceFileName: fileName || 'Ручной ввод',
        sourceStats: stats,
        summary: response.summary,
        test: response.test,
        flashcards: response.flashcards,
        lastTestResult: null,
        category,
        coverImage,
      };

      setTimeout(() => {
        onKitCreated(newKit);
      }, 600);
    } catch (err: any) {
      console.error(err);
      setStatusStep('failed');
      setError(
        err?.message ||
          'Не удалось сгенерировать учебный комплект. Проверьте соединение с сервером и повторите попытку.'
      );
    }
  };

  const currentCharCount = rawText.length;
  const isLengthTooShort = currentCharCount > 0 && currentCharCount < 2000;
  const isLengthTooLong = currentCharCount > 50000;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          disabled={statusStep === 'generating' || statusStep === 'extracting'}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад к списку комплектов</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Создание нового учебного комплекта
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Загрузите главу учебника или вставьте текст. Приложение преобразует его в краткий конспект, тест и карточки.
          </p>
        </div>

        {/* Step 1: Title & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Название темы или главы <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Строение клетки или Информационная революция"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Предметная область
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Биология, История..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Step 2: Choose Source Input Method */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Добавление материала главы
          </label>

          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => setTab('paste')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                tab === 'paste'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Вставить текст</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('upload')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                tab === 'upload'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Загрузить PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('preset')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                tab === 'preset'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Выбрать готовую главу</span>
            </button>
          </div>

          {/* Tab: Upload PDF */}
          {tab === 'upload' && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-8 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition-colors">
                <UploadCloud className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mb-2" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Выберите PDF файл главы или перетащите его сюда
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  До 10 МБ, до 20 страниц. Требуется PDF с текстовым слоем (не сканы)
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {fileName && (
                <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Загружен файл: <strong>{fileName}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Tab: Paste Text */}
          {tab === 'paste' && (
            <div className="space-y-2">
              <textarea
                rows={10}
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  const charCount = e.target.value.length;
                  const words = e.target.value.split(/\s+/).filter(Boolean).length;
                  setExtractedStats({
                    charCount,
                    wordCount: words,
                    pageCountApprox: Math.max(1, Math.ceil(charCount / 2200)),
                    readingTimeMin: Math.max(1, Math.round(words / 160)),
                  });
                }}
                placeholder="Вставьте сюда текст главы учебника, параграфа или лекции (рекомендуемый объем: от 2 000 до 50 000 символов)..."
                className="w-full p-3.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />

              {/* Character Counter & Indicators */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="tabular-nums">
                    Символов: <strong>{currentCharCount.toLocaleString('ru-RU')}</strong> / 50 000
                  </span>
                  {currentCharCount > 0 && (
                    <span>~{Math.max(1, Math.round(currentCharCount / 2200))} стр.</span>
                  )}
                </div>

                <div>
                  {isLengthTooShort && (
                    <span className="text-amber-600 dark:text-amber-400">
                      Рекомендуется от 2 000 симв.
                    </span>
                  )}
                  {isLengthTooLong && (
                    <span className="text-rose-600 dark:text-rose-400">
                      Превышен рекомендуемый лимит (50 000 симв.)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Presets */}
          {tab === 'preset' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRESET_CHAPTERS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    title === preset.title
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                    {preset.category}
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                    {preset.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    {preset.sourceText.length.toLocaleString('ru-RU')} симв.
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Warnings Display */}
        {warnings.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            {warnings.map((w, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Text Preview Drawer if text is loaded */}
        {rawText.trim().length > 0 && (
          <details className="text-xs text-slate-600 dark:text-slate-400 group">
            <summary className="cursor-pointer font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
              Предпросмотр извлеченного текста ({rawText.length.toLocaleString('ru-RU')} симв.)
            </summary>
            <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl max-h-48 overflow-y-auto text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-mono">
              {rawText}
            </div>
          </details>
        )}

        {/* Step 3: Mandatory AI Notice & Consent Checkbox */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Уведомление об обработке ИИ и правах на материал</span>
            </div>
            <p>
              Материалы создаются с помощью нейросетевых моделей на сервере. Приложение извлекает факты строго из предоставленного источника. Все сгенерированные материалы (конспект, тест, карточки) снабжаются подтверждающими цитатами.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={aiConsentAccepted}
              onChange={(e) => setAiConsentAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              Подтверждаю право использования учебного материала и даю согласие на обработку текста сервисами ИИ.
            </span>
          </label>
        </div>

        {/* Errors Display */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions & Status */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {statusStep !== 'idle' && (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onCancel}
              disabled={statusStep === 'generating' || statusStep === 'extracting'}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Отмена
            </button>

            <button
              type="button"
              onClick={handleCreateKit}
              disabled={
                statusStep === 'generating' ||
                statusStep === 'extracting' ||
                !rawText.trim() ||
                !aiConsentAccepted
              }
              className="flex-1 sm:flex-none px-6 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              {statusStep === 'generating' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Создаем комплект...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Создать комплект</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
