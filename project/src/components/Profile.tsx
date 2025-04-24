import React from 'react';
import { CreditCard, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import type { SavedCard } from '../types';

export function Profile() {
  const { language, user, updateUserCards } = useStore();
  const t = translations[language];

  const handleDeleteCard = async (card: SavedCard) => {
    try {
      // 呼叫後端 API 解除綁定信用卡
      const response = await fetch(`${import.meta.env.VITE_API_URL}/remove-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          card_key: card.id,
          card_token: card.token, // 需要在 SavedCard 類型中添加 token 欄位
          merchant_id: import.meta.env.VITE_TAPPAY_MERCHANT_ID,
        })
      });

      if (!response.ok) {
        throw new Error('解除綁定信用卡失敗');
      }

      // 更新本地狀態，移除已刪除的卡片
      const updatedCards = user?.savedCards?.filter(c => c.id !== card.id) || [];
      updateUserCards(updatedCards);
    } catch (error) {
      console.error('刪除信用卡時發生錯誤:', error);
      alert(error instanceof Error ? error.message : '刪除信用卡失敗');
    }
  };

  return (
    <div className="space-y-6">
      {user && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={user.pictureUrl}
              alt={user.displayName}
              className="w-20 h-20 rounded-full"
            />
            <div>
              <h3 className="text-xl font-semibold">{user.displayName}</h3>
              <p className="text-gray-600">ID: {user.userId}</p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4">{t.paymentSettings}</h4>
            {user.savedCards?.map(card => (
              <div key={card.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-2">
                <div className="flex items-center gap-3">
                  <CreditCard className="text-line" size={20} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{card.brand}</span>
                      <span className="text-gray-600">•••• {card.last4}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {t.expiryDate}: {card.expiryMonth}/{card.expiryYear}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCard(card)}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title={t.deleteCard}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('show-save-card'))}
              className="mt-4 w-full bg-line-gradient hover:bg-line-gradient-hover text-white py-2 rounded-full transition-colors font-medium"
            >
              {t.addCreditCard}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 