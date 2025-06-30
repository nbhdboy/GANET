import React from 'react';
import { Store, User } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import { useNavigate } from 'react-router-dom';

interface BottomNavProps {
  activeTab: 'store' | 'esims' | 'profile' | 'privacy';
  onTabChange: (tab: 'store' | 'esims' | 'profile' | 'privacy') => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { language } = useStore();
  const t = translations[language];
  const navigate = useNavigate();

  const SimIcon = () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`w-6 h-6 transition-colors ${activeTab === 'esims' ? 'text-line' : 'text-gray-600'}`}
    >
      <path
        d="M8 6H16C17.1046 6 18 6.89543 18 8V16C18 17.1046 17.1046 18 16 18H8C6.89543 18 6 17.1046 6 16V8C6 6.89543 6.89543 6 8 6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={activeTab === 'esims' ? 'animate-pulse' : ''}
      />
      <path
        d="M10 11C10.5523 11 11 10.5523 11 10C11 9.44772 10.5523 9 10 9C9.44772 9 9 9.44772 9 10C9 10.5523 9.44772 11 10 11Z"
        fill="currentColor"
        className={activeTab === 'esims' ? 'animate-bounce' : ''}
      />
      <path
        d="M14 15C14.5523 15 15 14.5523 15 14C15 13.4477 14.5523 13 14 13C13.4477 13 13 13.4477 13 14C13 14.5523 13.4477 15 14 15Z"
        fill="currentColor"
        className={activeTab === 'esims' ? 'animate-bounce delay-100' : ''}
      />
    </svg>
  );

  const StoreIcon = () => (
    <Store className={`w-6 h-6 ${activeTab === 'store' ? 'text-line' : 'text-gray-600'}`} />
  );

  const ProfileIcon = () => (
    <User className={`w-6 h-6 ${activeTab === 'profile' ? 'text-line' : 'text-gray-600'}`} />
  );

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
            onTabChange('privacy');
            navigate('/privacypolicy');
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
