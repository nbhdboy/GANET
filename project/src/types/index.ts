export interface ESIMPackage {
  id: string;
  country: string;
  name: string;
  dataAmount: string;
  validity: string;
  price: number;
  currency: string;
  description?: string;
  countryCode: string;
  isTopUp?: boolean;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  language?: 'en' | 'zh';
  savedCards?: SavedCard[];
}

export interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expiryMonth: string;
  expiryYear: string;
}

export interface PurchasedESIM extends ESIMPackage {
  status: 'active' | 'inactive';
  activationDate?: string;
  expiryDate?: string;
  qrCode?: string;
}

export interface AppState {
  language: 'en' | 'zh';
  user: UserProfile | null;
  setLanguage: (lang: 'en' | 'zh') => void;
  setUser: (user: UserProfile | null) => void;
  updateUserCards: (cards: SavedCard[]) => void;
}