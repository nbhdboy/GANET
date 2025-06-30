import React from 'react';
import { Store, User } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import { useNavigate } from 'react-router-dom'; // ✅ 第 1 點

interface BottomNavProps {
  activeTab: 'store' | 'esims' | 'profile' | 'privacy';
  onTabChange: (tab: 'store' | 'esims' | 'profile' | 'privacy') => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { language } = useStore();
  const t = translations[language];
  const navigate = useNavigate(); // ✅ 第 2 點

  // ... SimIcon / StoreIcon / ProfileIcon / PrivacyIcon 略（與原本相同） ...

  const PrivacyIcon = () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`w-6 h-6 transition-colors ${activeTab === 'privacy' ? 'text-line' : 'text-gray-600'}`}
    >
      <path
        d="M12 3C12 3 5 5 5 10C5 17 12 21 12 21C12 21 19 17 19 10C19 5 12 3 12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={activeTab === 'privacy' ? 'animate-pulse' : ''}
      />
      <circle
        cx="12"
        cy="13"
        r="2"
        fill="currentColor"
        className={activeTab === 'privacy' ? 'animate-bounce' : ''}
      />
    </svg>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => onTabChange('esims')}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeTab === 'esims' ? 'text-line' : 'text-gray-600'
          }`}
        >
          <SimIcon />
          <span className="text-xs mt-1">{t.myEsims}</span>
        </button>
        <button
          onClick={() => onTabChange('store')}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeTab === 'store' ? 'text-line' : 'text-gray-600'
          }`}
        >
          <StoreIcon />
          <span className="text-xs mt-1">{t.esimStore}</span>
        </button>
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeTab === 'profile' ? 'text-line' : 'text-gray-600'
          }`}
        >
          <ProfileIcon />
          <span className="text-xs mt-1">{t.profile.title}</span>
        </button>
        <button
          onClick={() => {
            onTabChange('privacy');       // ✅ 更新 activeTab 狀態
            navigate('/privacypolicy');   // ✅ 第 3 點：顯式導航到 /privacypolicy
          }}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeTab === 'privacy' ? 'text-line' : 'text-gray-600'
          }`}
        >
          <PrivacyIcon />
          <span className="text-xs mt-1">{t.privacyPolicy}</span>
        </button>
      </div>
    </nav>
  );
}
