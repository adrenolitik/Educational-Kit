/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Search, FileText, Copy, Check, Quote, ExternalLink } from 'lucide-react';

interface SourceInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sourceText: string;
  sourceFileName?: string;
  selectedQuote?: string | null;
}

export const SourceInspector: React.FC<SourceInspectorProps> = ({
  isOpen,
  onClose,
  title,
  sourceText,
  sourceFileName,
  selectedQuote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const quoteRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && selectedQuote && quoteRef.current) {
      setTimeout(() => {
        quoteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [isOpen, selectedQuote]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sourceText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Split into paragraphs for readable viewing
  const paragraphs = sourceText.split(/\n\s*\n/).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Исходный учебный материал</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {title}
            </h2>
            {sourceFileName && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Файл: {sourceFileName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Копировать весь исходный текст"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selected Quote Banner if clicked from study view */}
        {selectedQuote && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60">
            <div className="flex items-start gap-2.5">
              <Quote className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-amber-900 dark:text-amber-200 block mb-1">
                  Подтверждающий фрагмент:
                </span>
                <p className="text-amber-800 dark:text-amber-300 italic">
                  «{selectedQuote}»
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search inside source text */}
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по тексту главы..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Text Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-normal">
          {paragraphs.map((p, idx) => {
            const hasQuote = selectedQuote && p.toLowerCase().includes(selectedQuote.toLowerCase());
            const hasSearch = searchQuery.trim() && p.toLowerCase().includes(searchQuery.toLowerCase());

            return (
              <div
                key={idx}
                ref={hasQuote ? quoteRef : null}
                className={`p-3 rounded-xl transition-all ${
                  hasQuote
                    ? 'bg-amber-100/70 dark:bg-amber-900/40 border-2 border-amber-400 dark:border-amber-600 shadow-xs'
                    : hasSearch
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <p className="whitespace-pre-line">{p}</p>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Символов: {sourceText.length.toLocaleString('ru-RU')}</span>
          <span>Академический первоисточник</span>
        </div>
      </div>
    </div>
  );
};
