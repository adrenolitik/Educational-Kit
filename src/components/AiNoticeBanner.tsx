/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, FileText } from 'lucide-react';

interface AiNoticeBannerProps {
  onOpenSource?: () => void;
  className?: string;
}

export const AiNoticeBanner: React.FC<AiNoticeBannerProps> = ({ onOpenSource, className = '' }) => {
  return (
    <div
      role="note"
      className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          <strong>Уведомление:</strong> Материалы созданы с помощью ИИ и могут содержать ошибки. Всегда проверяйте важные сведения по источнику.
        </span>
      </div>

      {onOpenSource && (
        <button
          onClick={onOpenSource}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg transition-colors shrink-0"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Открыть источник</span>
        </button>
      )}
    </div>
  );
};
