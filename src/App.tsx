/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, StudyKit, TestResult, FlashcardStatus } from './types';
import {
  getCurrentUser,
  setCurrentUser,
  getUserKits,
  saveKit,
  deleteKit,
  updateKitTestResult,
  updateFlashcardStatus,
  resetFlashcardsProgress,
  updateKitComponent,
} from './services/storage';

import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { KitsList } from './components/KitsList';
import { CreateKitView } from './components/CreateKitView';
import { KitDetailView } from './components/KitDetailView';
import { SourceInspector } from './components/SourceInspector';
import { PresetsModal } from './components/PresetsModal';
import { PilotHelpModal } from './components/PilotHelpModal';

export default function App() {
  const [currentUser, setCurrentUserState] = useState<User | null>(() => getCurrentUser());
  const [kits, setKits] = useState<StudyKit[]>([]);
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);
  const [activeTabInKit, setActiveTabInKit] = useState<'summary' | 'test' | 'cards' | 'source'>('summary');

  // Screens: 'list' | 'create' | 'presets'
  const [activeScreen, setActiveScreen] = useState<'list' | 'create' | 'presets'>('list');

  // Modals & Drawers
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isSourceInspectorOpen, setIsSourceInspectorOpen] = useState(false);
  const [activeCitationQuote, setActiveCitationQuote] = useState<string | null>(null);

  // Theme
  const [isDark, setIsDark] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark mode class to <html>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Load kits whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      const userKits = getUserKits(currentUser.id);
      setKits(userKits);
      // If user had selected a kit that doesn't belong to them, clear selection
      setSelectedKitId(null);
    } else {
      setKits([]);
      setSelectedKitId(null);
    }
  }, [currentUser]);

  // Selected kit
  const selectedKit = kits.find((k) => k.id === selectedKitId) || null;

  // Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUserState(user);
    setActiveScreen('list');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentUserState(null);
    setSelectedKitId(null);
    setActiveScreen('list');
  };

  const handleOpenKit = (kitId: string, initialTab: 'summary' | 'test' | 'cards' = 'summary') => {
    setSelectedKitId(kitId);
    setActiveTabInKit(initialTab);
  };

  const handleBackToList = () => {
    setSelectedKitId(null);
    setActiveScreen('list');
  };

  const handleKitCreated = (newKit: StudyKit) => {
    saveKit(newKit);
    if (currentUser) {
      setKits(getUserKits(currentUser.id));
    }
    setSelectedKitId(newKit.id);
    setActiveTabInKit('summary');
    setActiveScreen('list');
  };

  const handleDeleteKit = (kitId: string) => {
    if (!currentUser) return;
    deleteKit(currentUser.id, kitId);
    const updated = getUserKits(currentUser.id);
    setKits(updated);
    if (selectedKitId === kitId) {
      setSelectedKitId(null);
    }
  };

  const handleUpdateTestResult = (result: TestResult) => {
    if (!currentUser || !selectedKitId) return;
    const updated = updateKitTestResult(currentUser.id, selectedKitId, result);
    if (updated) {
      setKits(getUserKits(currentUser.id));
    }
  };

  const handleUpdateCardStatus = (cardId: string, status: FlashcardStatus) => {
    if (!currentUser || !selectedKitId) return;
    const updated = updateFlashcardStatus(currentUser.id, selectedKitId, cardId, status);
    if (updated) {
      setKits(getUserKits(currentUser.id));
    }
  };

  const handleResetCards = () => {
    if (!currentUser || !selectedKitId) return;
    const updated = resetFlashcardsProgress(currentUser.id, selectedKitId);
    if (updated) {
      setKits(getUserKits(currentUser.id));
    }
  };

  const handleUpdateComponent = (component: 'summary' | 'test' | 'flashcards', data: any) => {
    if (!currentUser || !selectedKitId) return;
    const updated = updateKitComponent(currentUser.id, selectedKitId, component, data);
    if (updated) {
      setKits(getUserKits(currentUser.id));
    }
  };

  const handleOpenSourceQuote = (quote: string) => {
    setActiveCitationQuote(quote || null);
    setIsSourceInspectorOpen(true);
  };

  const handleAddPreset = (kit: StudyKit) => {
    saveKit(kit);
    if (currentUser) {
      setKits(getUserKits(currentUser.id));
    }
    setSelectedKitId(kit.id);
    setActiveTabInKit('summary');
  };

  // If not logged in, show Login Screen (Screen 1)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <Navbar
          user={null}
          activeScreen="list"
          onNavigate={() => {}}
          onOpenHelp={() => setIsHelpOpen(true)}
          onLogout={() => {}}
          isDark={isDark}
          onToggleTheme={() => setIsDark(!isDark)}
        />
        <main>
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        </main>
        <PilotHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col">
      <Navbar
        user={currentUser}
        activeScreen={activeScreen}
        onNavigate={(screen) => {
          if (screen === 'presets') {
            setIsPresetsOpen(true);
          } else {
            setSelectedKitId(null);
            setActiveScreen(screen);
          }
        }}
        onOpenHelp={() => setIsHelpOpen(true)}
        onLogout={handleLogout}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {selectedKit ? (
          /* Screen 4: Kit Detail View */
          <KitDetailView
            kit={selectedKit}
            initialTab={activeTabInKit}
            onBack={handleBackToList}
            onUpdateTestResult={handleUpdateTestResult}
            onUpdateCardStatus={handleUpdateCardStatus}
            onResetCards={handleResetCards}
            onUpdateComponent={handleUpdateComponent}
            onOpenSourceQuote={handleOpenSourceQuote}
            onDeleteKit={() => handleDeleteKit(selectedKit.id)}
          />
        ) : activeScreen === 'create' ? (
          /* Screen 3: Create Kit View */
          <CreateKitView
            user={currentUser}
            onKitCreated={handleKitCreated}
            onCancel={() => setActiveScreen('list')}
          />
        ) : (
          /* Screen 2: Kits List Dashboard */
          <KitsList
            kits={kits}
            onOpenKit={handleOpenKit}
            onCreateNew={() => setActiveScreen('create')}
            onOpenPresets={() => setIsPresetsOpen(true)}
            onDeleteKit={handleDeleteKit}
          />
        )}
      </main>

      {/* Source Text Inspector Drawer */}
      {selectedKit && (
        <SourceInspector
          isOpen={isSourceInspectorOpen}
          onClose={() => {
            setIsSourceInspectorOpen(false);
            setActiveCitationQuote(null);
          }}
          title={selectedKit.title}
          sourceText={selectedKit.sourceText}
          sourceFileName={selectedKit.sourceFileName}
          selectedQuote={activeCitationQuote}
        />
      )}

      {/* Presets Modal */}
      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        user={currentUser}
        onAddPreset={handleAddPreset}
      />

      {/* Pilot Help Modal */}
      <PilotHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
