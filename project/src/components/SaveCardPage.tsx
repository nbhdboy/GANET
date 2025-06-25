import React, { useState, useEffect, useRef } from 'react';
import { X, CreditCard } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import type { SavedCard } from '../types';
import { supabase } from '../lib/supabaseClient';

interface SaveCardPageProps {
  onSave: () => void;
  onClose: () => void;
  show: boolean;
}

export function SaveCardPage({ onSave, onClose, show = false }: SaveCardPageProps) {
  console.log('SaveCardPage rendered', show);
  const { language, updateUserCards, userCards: _userCards, user, setUser, fetchUserCards } = useStore();
  const userCards = _userCards ?? [];
  const t = translations[language];
  const t_sc = t.saveCard;
  const [isCardValid, setIsCardValid] = useState(false);
  const [isTapPayReady, setIsTapPayReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setupCompleted = useRef(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const hasCard = (userCards?.length ?? 0) > 0;

  useEffect(() => {
    let isMounted = true;
    const waitForTPDirect = async () => {
      let retries = 0;
      const maxRetries = 20;
      while (!(window as any).TPDirect && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 250));
        retries++;
      }
      if ((window as any).TPDirect && isMounted) {
        setIsTapPayReady(true);
      }
    };
    waitForTPDirect();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (
      isTapPayReady &&
      (isEditMode || userCards?.length === 0) &&
      show &&
      !setupCompleted.current
    ) {
      setupCompleted.current = true; // 先設為 true，避免重複 setup
      const setupCard = async () => {
        try {
          console.log('Starting card setup...');
          await new Promise(resolve => setTimeout(resolve, 500));
          const numberEl = document.getElementById('card-number');
          const expiryEl = document.getElementById('card-expiration-date');
          const ccvEl = document.getElementById('card-ccv');
          console.log('Card elements found:', {
            number: !!numberEl,
            expiry: !!expiryEl,
            ccv: !!ccvEl
          });
          if (!numberEl || !expiryEl || !ccvEl) {
            console.error('找不到信用卡表單元素');
            return;
          }
          // 新增：每次 setup 欄位前都重新 setupSDK
          if (window.TPDirect) {
            const appId = import.meta.env.VITE_TAPPAY_APP_ID;
            const appKey = import.meta.env.VITE_TAPPAY_APP_KEY;
            window.TPDirect.setupSDK(Number(appId), appKey, 'sandbox');
          }
          window.TPDirect.card.setup({
            fields: {
              number: {
                element: '#card-number',
                placeholder: t_sc.cardNumberPlaceholder
              },
              expirationDate: {
                element: '#card-expiration-date',
                placeholder: t_sc.expiryDatePlaceholder
              },
              ccv: {
                element: '#card-ccv',
                placeholder: t_sc.securityCodePlaceholder
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
          console.log('Card form setup completed');
          window.TPDirect.card.onUpdate(function (update) {
            console.log('Card form update:', {
              canGetPrime: update.canGetPrime,
              hasError: update.hasError,
              status: update.status
            });
            if (update.canGetPrime) {
              setIsCardValid(true);
              setErrorMessage('');
            } else {
              setIsCardValid(false);
              if (update.status.number === 2) {
                setErrorMessage(t_sc.errorInvalidCardNumber);
              } else if (update.status.expiry === 2) {
                setErrorMessage(t_sc.errorInvalidExpiryDate);
              } else if (update.status.ccv === 2) {
                setErrorMessage(t_sc.errorInvalidSecurityCode);
              }
            }
          });
        } catch (error) {
          console.error('設置信用卡表單時發生錯誤:', error);
          setErrorMessage(t_sc.errorInitFailed);
        }
      };
      setupCard();
    }
  }, [isTapPayReady, isEditMode, userCards?.length, show]);

  useEffect(() => {
    if (show) {
      setIsEditMode(false);
      setErrorMessage('');
      setIsCardValid(false);
      setupCompleted.current = false;
    }
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('開始信用卡綁定流程');
      const tappayStatus = window.TPDirect.card.getTappayFieldsStatus();
      
      if (!tappayStatus.canGetPrime) {
        throw new Error(t_sc.errorIncorrectInfo);
      }

      // 取得 Prime
      const result = await new Promise((resolve, reject) => {
        window.TPDirect.card.getPrime((r) => {
          console.log('getPrime raw result →', r);
          if (r.status !== 0) {
            reject(new Error(r.msg || t_sc.errorGetPrimeFailed));
            return;
          }
          resolve(r);
        });
      });

      // 取得 prime（同時向下相容）
      const prime = (result as any).card?.prime ?? (result as any).prime;
      
      if (!prime) {
        throw new Error(t_sc.errorGetPrimeFailed);
      }

      console.log('prime to be sent →', prime);

      // 檢查環境變數
      const apiUrl = import.meta.env.VITE_API_URL;

      if (!apiUrl) {
        throw new Error(t_sc.errorMissingEnv);
      }

      console.log('TapPay 回應:', result);
      console.log('準備發送到後端的數據:', {
        prime: prime,
        line_user_id: 'test_user_001',
        cardholder: {
          phone_number: '+886900000000',
          name: 'Test User',
          email: 'test@example.com'
        }
      });

      // 取得 supabase session
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;

      const apiResponse = await fetch(`${apiUrl}/bind-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        },
        body: JSON.stringify({
          prime: prime,
          line_user_id: 'test_user_001',
          cardholder: {
            phone_number: '+886900000000',
            name: 'Test User',
            email: 'test@example.com'
          }
        })
      });

      console.log('後端 API 回應狀態:', apiResponse.status);
      const responseData = await apiResponse.json();
      console.log('後端 API 回應數據:', responseData);

      if (!apiResponse.ok) {
        throw new Error(`API 錯誤: ${apiResponse.status} - ${JSON.stringify(responseData)}`);
      }
      
      // 更新儲存的卡片資訊
      const newCard = {
        id: responseData.card.id,
        last4: responseData.card.last_four,
        brand: responseData.card.brand,
        expiryMonth: responseData.card.expiry_month,
        expiryYear: responseData.card.expiry_year
      };
      updateUserCards([newCard]);
      if (user && setUser) {
        setUser({ ...user, savedCards: [newCard] });
      }
      
      // 觸發重新整理
      if (fetchUserCards) {
        await fetchUserCards();
      }

      onSave();
    } catch (error) {
      console.error('儲存信用卡時發生錯誤:', error);
      setErrorMessage(error instanceof Error ? error.message : t_sc.errorSaveFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;
  return (
    <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{background: 'white', padding: 40, borderRadius: 12, maxWidth: 400, width: '100%', boxSizing: 'border-box', margin: 0}}>
        <h2 style={{fontWeight: 'bold', fontSize: 20, marginBottom: 24, textAlign: 'center'}}>{t_sc.title}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: 16}}>
            <label style={{display: 'block', marginBottom: 4}}>{t_sc.cardNumber}</label>
            <div id="card-number" style={{height: 40, border: '1px solid #ccc', borderRadius: 6, padding: 8}}></div>
          </div>
          <div style={{display: 'flex', gap: 8, marginBottom: 0, alignItems: 'flex-start'}}>
            <div style={{flex: 1, minWidth: 0}}>
              <label style={{display: 'block', marginBottom: 4}}>{t_sc.expiryDate}</label>
              <div id="card-expiration-date" style={{height: 40, border: '1px solid #ccc', borderRadius: 6, padding: 8}}></div>
            </div>
            <div style={{width: 120, minWidth: 100}}>
              <label style={{display: 'block', marginBottom: 4}}>{t_sc.securityCode}</label>
              <div id="card-ccv" style={{height: 40, border: '1px solid #ccc', borderRadius: 6, padding: 8}}></div>
            </div>
          </div>
          <div style={{fontSize: 12, color: '#888', marginTop: 4, marginBottom: 12, textAlign: 'left', lineHeight: 1.4, marginLeft: 0, paddingLeft: 0}}>
            {t_sc.securityCodeInfo}
          </div>
          {errorMessage && (
            <div style={{color: 'red', marginBottom: 12}}>{errorMessage}</div>
          )}
          <div style={{display: 'flex', gap: 8, marginTop: 24}}>
            <button type="button" onClick={onClose} style={{flex: 1, padding: 12, borderRadius: 6, background: '#eee', border: 'none'}} disabled={isSubmitting}>{t_sc.cancel}</button>
            <button 
              type="submit" 
              style={{
                flex: 1, 
                padding: 12, 
                borderRadius: 6, 
                background: '#4CD964', 
                color: '#fff', 
                border: 'none',
                opacity: (!isCardValid || isSubmitting) ? 0.5 : 1,
                cursor: (!isCardValid || isSubmitting) ? 'not-allowed' : 'pointer'
              }}
              disabled={!isCardValid || isSubmitting}
            >
              {isSubmitting ? t_sc.saving : t_sc.save}
            </button>
          </div>
          </form>
      </div>
    </div>
  );
}