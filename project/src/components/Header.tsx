import React from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';

interface HeaderProps {
  onMenuClick: () => void;
  onLogout?: () => void;
  title?: string;
}

export function Header({ onMenuClick, onLogout, title }: HeaderProps) {
  const { language, setLanguage, user } = useStore();
  const t = translations[language];

  const handleLanguageChange = () => {
    setLanguage(language === 'en' ? 'zh_TW' : 'en');
  };

  return (
    <header className="fixed top-0 left-0 w-full z-40 bg-[#4CD964] shadow-sm" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}>
      <div className="container mx-auto px-4 flex items-center justify-between" style={{height: '60px'}}>
        <div className="flex items-center gap-2 h-16 flex-1">
          {user ? (
            <button 
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label={t.profile}
            >
              {user.pictureUrl ? (
                <img 
                  src={user.pictureUrl} 
                  alt={user.displayName}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <User size={24} />
              )}
            </button>
          ) : null}
        </div>
        
        <div className="flex-1 flex justify-center">
          {title && (
            <span className="text-xl font-bold text-white">{title}</span>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-1 justify-end">
          <button 
            onClick={handleLanguageChange}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-full transition-all duration-200 active:scale-95"
            aria-label={language === 'en' ? '切換到中文' : 'Switch to English'}
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              className="w-5 h-5 text-white"
            >
              <path
                d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.6 9h16.8M3.6 15h16.8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 3a15 15 0 0 1 0 18"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 3a15 15 0 0 0 0 18"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm font-medium text-white">{language === 'en' ? 'English' : '中文'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}