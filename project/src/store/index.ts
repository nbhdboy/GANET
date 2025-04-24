import { create } from 'zustand'
import { UserProfile, SavedCard } from '../types'

interface Store {
  // 狀態
  language: 'en' | 'zh' | 'zh-TW'
  user: UserProfile | null
  savedCards: SavedCard[]
  
  // 方法
  setLanguage: (language: 'en' | 'zh' | 'zh-TW') => void
  setUser: (user: UserProfile | null) => void
  updateUserCards: (cards: SavedCard[]) => void
}

// 創建 store
export const useStore = create<Store>((set) => ({
  // 初始狀態
  language: 'zh-TW',
  user: {
    userId: 'mock-user-id',
    displayName: 'Demo User',
    pictureUrl: 'https://example.com/avatar.jpg',
    language: 'zh-TW',
    savedCards: []
  },
  savedCards: [],

  // 方法
  setLanguage: (language) => set({ language }),
  
  setUser: (user) => set({ 
    user,
    savedCards: user?.savedCards || [] 
  }),
  
  updateUserCards: (cards) => set((state) => {
    const updatedUser = state.user ? {
      ...state.user,
      savedCards: cards
    } : null

    return {
      user: updatedUser,
      savedCards: cards
    }
  })
}))