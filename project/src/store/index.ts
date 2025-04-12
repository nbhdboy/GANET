import { create } from 'zustand';
import type { AppState, SavedCard } from '../types';

export const useStore = create<AppState>((set) => ({
  language: 'en',
  user: null,
  setLanguage: (language) => set({ language }),
  setUser: (user) => set({ user }),
  updateUserCards: (cards: SavedCard[]) => 
    set((state) => ({
      user: state.user ? { ...state.user, savedCards: cards } : null
    })),
}));