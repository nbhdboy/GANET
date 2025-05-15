import React, { useEffect, useState } from 'react';
import { CheckCircle, PartyPopper } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';

export function SuccessOverlay() {
  const { language } = useStore();
  const t = translations[language];
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
      {/* Confetti animation */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#00E000', '#00C300', '#FFD700', '#FF69B4'][Math.floor(Math.random() * 4)],
                width: '10px',
                height: '10px',
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-6 max-w-sm mx-4 w-full animate-success-pop">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-line/10 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-line animate-success-check" />
          </div>
          <PartyPopper 
            className="absolute -right-2 -top-2 w-8 h-8 text-yellow-500 animate-party-popper" 
          />
        </div>
        
        <div className="text-center">
          <h3 className="text-2xl font-bold bg-line-gradient bg-clip-text text-transparent mb-2 flex items-center justify-center">
            {t.purchaseSuccess.replace('🎉','')}
          </h3>
          <div className="text-xl font-bold bg-line-gradient bg-clip-text text-transparent mb-2">
            {t.haveANiceTrip}
          </div>
          <p className="text-gray-600">{t.redirectingToEsims}</p>
        </div>

        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-line-gradient animate-progress rounded-full" />
        </div>
      </div>
    </div>
  );
}