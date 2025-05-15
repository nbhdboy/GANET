import React, { useEffect, useRef, useState } from 'react';
import { CreditCard, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import type { SavedCard } from '../types';
import { DeletingOverlay } from './LoadingOverlay';

console.log('App render');

export function Profile({ onAddCard, onShowTerms, onShowPrivacy, onShowFAQ }) {
  const { language, user, savedCards, updateUserCards, fetchUserCards } = useStore();
  const [localCards, setLocalCards] = useState<SavedCard[]>(user?.savedCards || []);
  const t = translations[language];
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditCardAlert, setShowEditCardAlert] = useState(false);

  useEffect(() => {
    // 當 user 或 savedCards 變動時，強制同步 localCards
    setLocalCards(user?.savedCards || savedCards || []);
  }, [user, savedCards]);

  useEffect(() => {
    if (typeof fetchUserCards === 'function') {
      fetchUserCards();
    }
  }, []);

  const handleDeleteCard = async () => {
    try {
      setIsDeleting(true);
      console.log('呼叫 remove-card 傳送的 line_user_id:', user.userId);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/remove-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          line_user_id: user.userId
        })
      });

      let data = null;
      try {
        data = await response.json();
      } catch (e) {}
      console.log('remove-card response:', response.status, data);

      if (!response.ok) {
        if (response.status === 404 || (data && data.success)) {
          const store = useStore.getState();
          if (typeof store.fetchUserCards === 'function') {
            await store.fetchUserCards();
            console.log('fetchUserCards 已呼叫完畢');
          }
          setIsDeleting(false);
          return;
        }
        setIsDeleting(false);
        throw new Error('解除綁定信用卡失敗');
      } else {
        const store = useStore.getState();
        if (typeof store.fetchUserCards === 'function') {
          await store.fetchUserCards();
          console.log('fetchUserCards 已呼叫完畢');
        }
        setIsDeleting(false);
      }
    } catch (error) {
      setIsDeleting(false);
      console.error('刪除信用卡時發生錯誤:', error);
      alert(error instanceof Error ? error.message : '刪除信用卡失敗');
    }
  };

  // 編輯信用卡按鈕點擊事件
  const handleEditCardClick = () => {
    if (localCards && localCards.length > 0) {
      setShowEditCardAlert(true);
      return;
    }
    if (typeof onAddCard === 'function') {
      onAddCard();
    }
  };

  return (
    <div className="space-y-6">
      {isDeleting && <DeletingOverlay />}
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
            {(() => {
              const latestCard = localCards && localCards.length > 0
                ? localCards[localCards.length - 1]
                : null;
              if (!latestCard) return null;
              return (
                <div key={latestCard.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-2">
                <div className="flex items-center gap-3">
                  <CreditCard className="text-line" size={20} />
                  <div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{latestCard.brand}</span>
                        <span>•••• {latestCard.last4}</span>
                    </div>
                      <div className="text-xs text-gray-500">有效期: {latestCard.expiryMonth}/{latestCard.expiryYear}</div>
                  </div>
                </div>
                <button
                    className="text-red-500 hover:text-red-700"
                    onClick={handleDeleteCard}
                >
                  <Trash2 size={20} />
                </button>
              </div>
              );
            })()}
            {(!localCards || localCards.length === 0) && (
              <button
                onClick={onAddCard}
                className="mt-4 w-full bg-line-gradient hover:bg-line-gradient-hover text-white py-2 rounded-full transition-colors font-medium"
              >
                新增信用卡
              </button>
            )}
            {localCards?.length > 0 && (
            <button
                onClick={handleEditCardClick}
              className="mt-4 w-full bg-line-gradient hover:bg-line-gradient-hover text-white py-2 rounded-full transition-colors font-medium"
            >
                編輯信用卡
              </button>
            )}
          </div>

          <div className="space-y-4">
            <button 
              onClick={onShowTerms}
              className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {t.termsAndConditions}
            </button>
            <button 
              onClick={onShowPrivacy}
              className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {t.privacyPolicy}
            </button>
            <button 
              onClick={() => window.open('https://line.me/R/ti/p/@canet', '_blank')}
              className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {t.customerService}
            </button>
            <button 
              onClick={onShowFAQ}
              className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {t.faq}
            </button>
          </div>
        </div>
      )}
      {/* 編輯信用卡提示彈窗 */}
      {showEditCardAlert && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-xs w-full flex flex-col items-center">
            <div className="text-base mb-4 text-gray-500 font-normal">請先刪除已儲存的信用卡</div>
            <button
              onClick={() => setShowEditCardAlert(false)}
              className="mt-2 px-6 py-2 bg-line-gradient hover:bg-line-gradient-hover text-white rounded-full font-medium"
            >
              確定
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 