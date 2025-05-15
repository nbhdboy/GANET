import React from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';

interface HeaderProps {
  onMenuClick: () => void;
  onLogout?: () => void;
}

export function Header({ onMenuClick, onLogout }: HeaderProps) {
  const { language, setLanguage, user } = useStore();
  const t = translations[language];

  const handleLanguageChange = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#E6F9EC] text-green-900 shadow-lg z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 h-16">
          <img src="/icons/logo.png" alt="CANET Logo" className="h-16 ml-1" style={{height: '60px', marginTop: '-16px'}} />
        </div>
        
        {/* <h1 className="text-xl font-bold">{t.title}</h1> */}
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleLanguageChange}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-full transition-all duration-200 active:scale-95"
            aria-label={language === 'en' ? '切換到中文' : 'Switch to English'}
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              className="w-5 h-5"
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
            <span className="text-sm font-medium">{language === 'en' ? 'English' : '中文'}</span>
          </button>
          
          {user ? (
            <>
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
              {onLogout && (
                <button 
                  onClick={onLogout}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  aria-label={t.logout}
                >
                  <LogOut size={24} />
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}