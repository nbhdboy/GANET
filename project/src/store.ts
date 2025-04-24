import { create } from 'zustand';
import type { UserProfile } from './types';

interface Store {
  language: string;
  setLanguage: (language: string) => void;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
}

export const useStore = create<Store>((set) => ({
  language: 'zh-TW',
  setLanguage: (language) => set({ language }),
  user: null,
  setUser: (user) => set({ user }),
})); 