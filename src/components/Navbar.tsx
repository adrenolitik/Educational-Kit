/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User } from '../types';
import { BookOpen, PlusCircle, Library, HelpCircle, LogOut, Moon, Sun, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  activeScreen: 'list' | 'create' | 'presets';
  onNavigate: (screen: 'list' | 'create' | 'presets') => void;
  onOpenHelp: () => void;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeScreen,
  onNavigate,
  onOpenHelp,
  onLogout,
  isDark,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('list')}
              className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:bg-emerald-700 transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
                Учебный комплект
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Single-Line Text) */}
          {user && (
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <button
                onClick={() => onNavigate('list')}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
                  activeScreen === 'list'
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Мои комплекты
              </button>

              <button
                onClick={() => onNavigate('create')}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
                  activeScreen === 'create'
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Создать комплект
              </button>

              <button
                onClick={() => onNavigate('presets')}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
                  activeScreen === 'presets'
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Примеры глав
              </button>

              <button
                onClick={onOpenHelp}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors whitespace-nowrap shrink-0 py-1"
              >
                Справка пилота
              </button>
            </nav>
          )}

          {/* Zone 3: Actions & User Info */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              aria-label="Переключить тему"
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {user.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {user.email}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  title="Выйти из системы"
                  className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Закрытый пилот MVP
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
