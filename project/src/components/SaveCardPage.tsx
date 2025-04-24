import React, { useState, useEffect, useRef } from 'react';
import { X, CreditCard } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import type { SavedCard } from '../types';
import liff from '@line/liff';
import { message } from 'antd';

// 用於本地測試的 mock token
const MOCK_TOKEN = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface SaveCardPageProps {
  onClose: () => void;
  onSave: () => void;
}

interface CardFormValues {
  cardNumber: string;
  expiryDate: string;
  ccv: string;
  cardHolder: string;
}

export function SaveCardPage({ onClose, onSave }: SaveCardPageProps) {
  const {
    user,
    savedCards,
    updateUserCards,
    language
  } = useStore()

  const t = translations[language]
  const [isCardValid, setIsCardValid] = useState(false)
  const [isTapPayReady, setIsTapPayReady] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // 檢查 store 是否正確初始化
  useEffect(() => {
    if (!user || !Array.isArray(savedCards) || typeof updateUserCards !== 'function') {
      console.error('Store 狀態:', {
        user,
        savedCards,
        updateUserCards: typeof updateUserCards
      })
      setErrorMessage('系統錯誤：請重新整理頁面')
      return
    }
    setErrorMessage('')
  }, [user, savedCards, updateUserCards])

  const setupCompleted = useRef(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadTapPay = async () => {
      try {
        // 檢查全局變數
        if (window.TPDirect?.card) {
          console.log('TapPay SDK already initialized');
          setIsTapPayReady(true);
          return;
        }

        // 檢查是否已經有 script 標籤
        const existingScript = document.getElementById('tappay-sdk');
        if (existingScript) {
          console.log('Waiting for existing TapPay script to load');
          await new Promise(resolve => {
            existingScript.addEventListener('load', resolve);
          });
          if (window.TPDirect?.card) {
            setIsTapPayReady(true);
            return;
          }
        }

        console.log('Loading TapPay SDK');
        const script = document.createElement('script');
        script.src = 'https://js.tappaysdk.com/sdk/tpdirect/v5.19.2';
        script.async = true;
        script.crossOrigin = "anonymous";
        script.id = 'tappay-sdk';

        const scriptLoadPromise = new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });

        document.body.appendChild(script);
        await scriptLoadPromise;

        // 等待 TPDirect 可用
        let retries = 0;
        const maxRetries = 10;
        while (!window.TPDirect && retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500));
          retries++;
        }

        if (!window.TPDirect) {
          throw new Error('TapPay SDK not loaded after multiple retries');
        }

        const appId = import.meta.env.VITE_TAPPAY_APP_ID;
        const appKey = import.meta.env.VITE_TAPPAY_APP_KEY;

        window.TPDirect.setupSDK(
          parseInt(appId, 10),
          appKey,
          'sandbox'
        );
        
        if (isMounted) {
          setIsTapPayReady(true);
        }
      } catch (error) {
        console.error('TapPay SDK initialization failed:', error);
        if (isMounted) {
          setErrorMessage('支付系統初始化失敗，請稍後再試');
        }
      }
    };

    loadTapPay();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isTapPayReady && !setupCompleted.current) {
      const setupCard = async () => {
        try {
          // 等待 DOM 元素準備就緒
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const numberEl = document.getElementById('card-number');
          const expiryEl = document.getElementById('card-expiration-date');
          const ccvEl = document.getElementById('card-ccv');

          if (!numberEl || !expiryEl || !ccvEl) {
            console.error('找不到信用卡表單元素');
            return;
          }

          // 設置 TapPay Fields
          window.TPDirect.card.setup({
            fields: {
              number: {
                element: '#card-number',
                placeholder: '**** **** **** ****'
              },
              expirationDate: {
                element: '#card-expiration-date',
                placeholder: 'MM / YY'
              },
              ccv: {
                element: '#card-ccv',
                placeholder: 'CCV'
              }
            },
            styles: {
              'input': {
                'color': '#333333',
                'font-size': '16px',
                'font-family': 'system-ui, -apple-system, sans-serif',
                'font-weight': '400',
                'line-height': '24px'
              },
              'input.ccv': {
                'font-size': '16px'
              },
              ':focus': {
                'color': '#495057'
              },
              '.valid': {
                'color': '#00C300'
              },
              '.invalid': {
                'color': '#dc3545'
              }
            }
          });

          // 監聽信用卡欄位狀態變化
          window.TPDirect.card.onUpdate(function(update) {
            if (update.canGetPrime) {
              setIsCardValid(true);
              setErrorMessage('');
            } else {
              setIsCardValid(false);
              if (update.status.number === 2) {
                setErrorMessage('卡號無效');
              } else if (update.status.expiry === 2) {
                setErrorMessage('有效期無效');
              } else if (update.status.ccv === 2) {
                setErrorMessage('安全碼無效');
              }
            }
          });

          setupCompleted.current = true;
        } catch (error) {
          console.error('設置信用卡表單時發生錯誤:', error);
          setErrorMessage('初始化支付表單失敗，請刷新頁面重試');
        }
      };

      setupCard();
    }
  }, [isTapPayReady]);

  useEffect(() => {
    let isMounted = true;
    
    const handleShowSaveCard = () => {
      if (isMounted) {
        onSave();
      }
    };

    window.addEventListener('show-save-card', handleShowSaveCard);

    return () => {
      isMounted = false;
      window.removeEventListener('show-save-card', handleShowSaveCard);
    };
  }, [onSave]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    try {
      if (!user) {
        message.error('請先登入')
        return
      }

      if (typeof updateUserCards !== 'function') {
        message.error('系統錯誤：請重新整理頁面')
        return
      }

      // 檢查 TapPay 狀態
      if (!window.TPDirect?.card) {
        message.error('支付系統尚未準備就緒，請稍後再試')
        return
      }

      const tappayStatus = window.TPDirect.card.getTappayFieldsStatus()
      
      if (!tappayStatus.canGetPrime) {
        message.error('請確認信用卡資訊是否正確填寫')
        return
      }

      // 取得 Prime
      const result = await new Promise<any>((resolve, reject) => {
        window.TPDirect.card.getPrime((result) => {
          if (result.status !== 0) {
            reject(new Error(result.msg))
            return
          }
          resolve(result)
        })
      })

      // 取得 LINE 用戶 ID
      const lineProfile = await liff.getProfile()
      
      // 呼叫後端 API
      const response = await fetch(bindCardUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_TAPPAY_PARTNER_KEY
        },
        body: JSON.stringify({
          prime: result.card.prime,
          line_user_id: lineProfile.userId,
          cardholder: {
            phone_number: user.phone || '',
            name: user.name || '',
            email: user.email || ''
          }
        })
      })

      if (!response.ok) {
        throw new Error(`綁定失敗: ${response.status}`)
      }

      const cardData = await response.json()
      
      if (cardData.status !== 0) {
        throw new Error(cardData.msg || '綁定信用卡失敗')
      }

      // 更新前端狀態
      const newCard: SavedCard = {
        id: cardData.card.id,
        token: cardData.card.card_token,
        last4: cardData.card.last_four,
        brand: cardData.card.brand,
        expiryMonth: cardData.card.expiry_month,
        expiryYear: cardData.card.expiry_year
      }

      const currentCards = Array.isArray(savedCards) ? savedCards : []
      await updateUserCards([...currentCards, newCard])
      
      message.success('卡片綁定成功！')
      onSave()
      
    } catch (error) {
      console.error('綁定卡片失敗:', error)
      message.error(error instanceof Error ? error.message : '綁定卡片失敗，請稍後再試')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold bg-line-gradient bg-clip-text text-transparent">
              {t.addNewCard}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={t.close}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.cardNumber}
              </label>
              <div id="card-number" className="h-10 bg-white border border-gray-300 rounded-lg overflow-hidden"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.expiryDate}
                </label>
                <div id="card-expiration-date" className="h-10 bg-white border border-gray-300 rounded-lg overflow-hidden"></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.cvv}
                </label>
                <div id="card-ccv" className="h-10 bg-white border border-gray-300 rounded-lg overflow-hidden"></div>
              </div>
            </div>

            {errorMessage && (
              <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={!isCardValid}
              className="w-full bg-line-gradient hover:bg-line-gradient-hover text-white py-3 rounded-full transition-colors font-medium mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.saveCard}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}