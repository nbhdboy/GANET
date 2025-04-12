import React from 'react';
import { Store, User, Sigma as Sim } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';

interface BottomNavProps {
  activeTab: 'store' | 'esims' | 'profile';
  onTabChange: (tab: 'store' | 'esims' | 'profile') => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { language } = useStore();
  const t = translations[language];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => onTabChange('esims')}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeTab === 'esims' ? 'text-line' : 'text-gray-600'
          }`}
        >
          <Sim size={24} className="transition-colors" />
          <span className="text-xs mt-1">{t.myEsims}</span>
        </button>
        <button
          onClick={() => onTabChange('store')}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeTab === 'store' ? 'text-line' : 'text-gray-600'
          }`}
        >
          <Store size={24} className="transition-colors" />
          <span className="text-xs mt-1">{t.esimStore}</span>
        </button>
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeTab === 'profile' ? 'text-line' : 'text-gray-600'
          }`}
        >
          <User size={24} className="transition-colors" />
          <span className="text-xs mt-1">{t.profile}</span>
        </button>
      </div>
    </nav>
  );
}