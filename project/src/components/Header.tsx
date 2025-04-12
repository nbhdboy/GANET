import React from 'react';
import { Menu, Globe2, User, LogOut } from 'lucide-react';
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
    <header className="fixed top-0 left-0 right-0 bg-line-gradient text-white shadow-lg z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label={t.menu}
        >
          <Menu size={24} />
        </button>
        
        <h1 className="text-xl font-bold">{t.title}</h1>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleLanguageChange}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label={language === 'en' ? '切換到中文' : 'Switch to English'}
          >
            <Globe2 size={24} />
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