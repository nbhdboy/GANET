import React from 'react';
import { useStore } from '../store';
import { translations } from '../i18n';

export function LoadingOverlay() {
  const { language } = useStore();
  const t = translations[language];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm mx-4 w-full">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-line/30 border-t-line rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-line/10 rounded-full animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold bg-line-gradient bg-clip-text text-transparent animate-pulse">
            {t.processing}
          </p>
          <p className="text-gray-500 mt-2">{t.pleaseWait}</p>
        </div>
      </div>
    </div>
  );
}

export function DeletingOverlay() {
  const { language } = useStore();
  const t = translations[language];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm mx-4 w-full">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-line/30 border-t-line rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-line/10 rounded-full animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold bg-line-gradient bg-clip-text text-transparent animate-pulse">
            {t.deleting}
          </p>
          <p className="text-gray-500 mt-2">{t.deletingCardWait}</p>
        </div>
      </div>
    </div>
  );
}