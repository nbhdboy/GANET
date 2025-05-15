export interface ESIMPackage {
  id: string;
  iccid?: string;
  country: string;
  countryCode: string;
  countryNameZh: string;
  flag: string;
  name: string;
  dataAmount: string;
  validity: string;
  price: number;
  currency: string;
  description: string;
  isTopUp: boolean;
  day?: number | string;
  sell_price?: number | string;
  data?: string;
}

export interface PackageData {
  data: string;
  validity: string;
  price: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  language?: 'en' | 'zh' | 'zh-TW';
  savedCards?: SavedCard[];
}

export interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expiryMonth: string;
  expiryYear: string;
  token: string;
  cardKey: string;
}

export interface PurchasedESIM extends ESIMPackage {
  status: 'active' | 'inactive';
  activationDate?: string;
  expiryDate?: string;
  qrCode?: string;
  iccid?: string;
}

export interface AppState {
  language: 'en' | 'zh' | 'zh-TW';
  user: UserProfile | null;
  setLanguage: (lang: 'en' | 'zh' | 'zh-TW') => void;
  setUser: (user: UserProfile | null) => void;
  updateUserCards: (cards: SavedCard[]) => void;
}