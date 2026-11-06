/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, StudyKit, TestResult, FlashcardStatus } from '../types';
import { PRESET_CHAPTERS } from '../data/presets';

// Default closed-pilot users
export const PILOT_USERS: (User & { password: string })[] = [
  {
    id: 'user_alex',
    email: 'student@study.edu',
    name: 'Алексей Смирнов',
    role: 'student',
    password: 'study2026',
  },
  {
    id: 'user_anna',
    email: 'anna@university.ru',
    name: 'Анна Иванова',
    role: 'student',
    password: 'pass123',
  },
  {
    id: 'user_dmitry',
    email: 'dmitry@tech.ru',
    name: 'Дмитрий Кузнецов',
    role: 'student',
    password: 'tech2026',
  },
];

const CURRENT_USER_KEY = 'study_kit_current_user';
const USERS_LIST_KEY = 'study_kit_registered_users';

export function getRegisteredUsers(): (User & { password: string })[] {
  try {
    const raw = localStorage.getItem(USERS_LIST_KEY);
    if (!raw) {
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(PILOT_USERS));
      return PILOT_USERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return PILOT_USERS;
  }
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function registerOrLoginUser(email: string, password?: string): User {
  const users = getRegisteredUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    setCurrentUser({
      id: existing.id,
      email: existing.email,
      name: existing.name,
      role: existing.role,
    });
    return existing;
  }

  // Create new user for closed pilot
  const newUser = {
    id: `user_${Date.now()}`,
    email: email.trim(),
    name: email.split('@')[0],
    role: 'student' as const,
    password: password || 'study2026',
  };
  users.push(newUser);
  localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));

  const authUser: User = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
  };
  setCurrentUser(authUser);

  // Initialize with the first preset kit for immediate testing
  initializeUserWithPreset(newUser.id);
  return authUser;
}

// User Isolated Kits Storage
function getKitsStorageKey(userId: string): string {
  return `study_kits_user_${userId}`;
}

export function getUserKits(userId: string): StudyKit[] {
  try {
    const key = getKitsStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      // If user has no kits yet, seed with one preset
      const seeded = initializeUserWithPreset(userId);
      return seeded;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveUserKits(userId: string, kits: StudyKit[]): void {
  try {
    const key = getKitsStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(kits));
  } catch (e) {
    console.error('Failed to save kits in localStorage:', e);
  }
}

export function saveKit(kit: StudyKit): void {
  const kits = getUserKits(kit.userId);
  const index = kits.findIndex((k) => k.id === kit.id);
  if (index >= 0) {
    kits[index] = { ...kit, updatedAt: new Date().toISOString() };
  } else {
    kits.unshift(kit);
  }
  saveUserKits(kit.userId, kits);
}

export function deleteKit(userId: string, kitId: string): void {
  const kits = getUserKits(userId);
  const filtered = kits.filter((k) => k.id !== kitId);
  saveUserKits(userId, filtered);
}

export function updateKitTestResult(userId: string, kitId: string, result: TestResult): StudyKit | null {
  const kits = getUserKits(userId);
  const kit = kits.find((k) => k.id === kitId);
  if (!kit) return null;

  kit.lastTestResult = result;
  kit.updatedAt = new Date().toISOString();
  saveUserKits(userId, kits);
  return kit;
}

export function updateFlashcardStatus(
  userId: string,
  kitId: string,
  cardId: string,
  status: FlashcardStatus
): StudyKit | null {
  const kits = getUserKits(userId);
  const kit = kits.find((k) => k.id === kitId);
  if (!kit || !kit.flashcards) return null;

  kit.flashcards = kit.flashcards.map((card) =>
    card.id === cardId ? { ...card, status } : card
  );
  kit.updatedAt = new Date().toISOString();
  saveUserKits(userId, kits);
  return kit;
}

export function resetFlashcardsProgress(userId: string, kitId: string): StudyKit | null {
  const kits = getUserKits(userId);
  const kit = kits.find((k) => k.id === kitId);
  if (!kit || !kit.flashcards) return null;

  kit.flashcards = kit.flashcards.map((card) => ({
    ...card,
    status: 'unseen',
  }));
  kit.updatedAt = new Date().toISOString();
  saveUserKits(userId, kits);
  return kit;
}

export function updateKitComponent(
  userId: string,
  kitId: string,
  component: 'summary' | 'test' | 'flashcards',
  data: any
): StudyKit | null {
  const kits = getUserKits(userId);
  const kit = kits.find((k) => k.id === kitId);
  if (!kit) return null;

  if (component === 'summary') {
    kit.summary = data;
  } else if (component === 'test') {
    kit.test = data;
    kit.lastTestResult = null; // reset test score if test questions changed
  } else if (component === 'flashcards') {
    kit.flashcards = data;
  }

  kit.updatedAt = new Date().toISOString();
  saveUserKits(userId, kits);
  return kit;
}

export function initializeUserWithPreset(userId: string): StudyKit[] {
  // Pick preset matching user or default to biology
  const presetIndex = userId === 'user_anna' ? 1 : userId === 'user_dmitry' ? 2 : 0;
  const preset = PRESET_CHAPTERS[presetIndex] || PRESET_CHAPTERS[0];

  const now = new Date().toISOString();
  const seededKit: StudyKit = {
    id: `kit_${Date.now()}_seed`,
    userId,
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

  const initialKits = [seededKit];
  saveUserKits(userId, initialKits);
  return initialKits;
}
