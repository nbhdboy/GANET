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
  const { language, updateUserCards, userCards: _userCards, user, setUser } = useStore();
  const userCards = _userCards ?? [];
  const t = translations[language];
  const [isCardValid, setIsCardValid] = useState(false);
  const [isTapPayReady, setIsTapPayReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const setupCompleted = useRef(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const hasCard = (userCards?.length ?? 0) > 0;

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

        console.log('TapPay Config:', {
          appId: appId ? 'exists' : 'missing',
          appKey: appKey ? 'exists' : 'missing'
        });

        window.TPDirect.setupSDK(
          parseInt(appId, 10),
          appKey,
          'sandbox'
        );
        
        console.log('TapPay SDK Setup completed');
        
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
                placeholder: '後三碼'
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
                setErrorMessage('卡號無效');
              } else if (update.status.expiry === 2) {
                setErrorMessage('有效期無效');
              } else if (update.status.ccv === 2) {
                setErrorMessage('安全碼無效');
              }
            }
          });
        } catch (error) {
          console.error('設置信用卡表單時發生錯誤:', error);
          setErrorMessage('初始化支付表單失敗，請刷新頁面重試');
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
    
    try {
      console.log('開始信用卡綁定流程');
      const tappayStatus = window.TPDirect.card.getTappayFieldsStatus();
      
      if (!tappayStatus.canGetPrime) {
        throw new Error('請確認信用卡資訊是否正確填寫');
      }

      // 取得 Prime
      const result = await new Promise((resolve, reject) => {
        window.TPDirect.card.getPrime((r) => {
          console.log('getPrime raw result →', r);
          if (r.status !== 0) {
            reject(new Error(r.msg || '取得 prime 失敗'));
            return;
          }
          resolve(r);
        });
      });

      // 取得 prime（同時向下相容）
      const prime = (result as any).card?.prime ?? (result as any).prime;
      
      if (!prime) {
        throw new Error('取得 prime 失敗');
      }

      console.log('prime to be sent →', prime);

      // 檢查環境變數
      const apiUrl = import.meta.env.VITE_API_URL;

      if (!apiUrl) {
        throw new Error('缺少必要的環境變數設定');
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
      const newCard: SavedCard = {
        id: responseData.card.card_key,
        last4: responseData.card.last_four,
        brand: responseData.card.brand,
        expiryMonth: responseData.card.expiry_month,
        expiryYear: responseData.card.expiry_year,
        token: responseData.card.card_token,
        cardKey: responseData.card.card_key
      };

      updateUserCards([newCard]);
      if (user && setUser) {
        setUser({ ...user, savedCards: [newCard] });
      }
      onSave();
    } catch (error) {
      console.error('儲存信用卡時發生錯誤:', error);
      setErrorMessage(error instanceof Error ? error.message : '儲存信用卡失敗');
    }
  };

  if (!show) return null;
  return (
    <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999}}>
      <div style={{background: 'white', padding: 40, borderRadius: 12, maxWidth: 400, margin: '40px auto'}}>
        <h2 style={{fontWeight: 'bold', fontSize: 20, marginBottom: 24}}>新增／編輯信用卡</h2>
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: 16}}>
            <label style={{display: 'block', marginBottom: 4}}>卡號</label>
            <div id="card-number" style={{height: 40, border: '1px solid #ccc', borderRadius: 6, padding: 8}}></div>
          </div>
          <div style={{display: 'flex', gap: 8, marginBottom: 0, alignItems: 'flex-start'}}>
            <div style={{flex: 1, minWidth: 0}}>
              <label style={{display: 'block', marginBottom: 4}}>有效期限</label>
              <div id="card-expiration-date" style={{height: 40, border: '1px solid #ccc', borderRadius: 6, padding: 8}}></div>
            </div>
            <div style={{width: 120, minWidth: 100}}>
              <label style={{display: 'block', marginBottom: 4}}>安全碼</label>
              <div id="card-ccv" style={{height: 40, border: '1px solid #ccc', borderRadius: 6, padding: 8}}></div>
            </div>
          </div>
          <div style={{fontSize: 12, color: '#888', marginTop: 4, marginBottom: 12, textAlign: 'left', lineHeight: 1.4, marginLeft: 0, paddingLeft: 0}}>
            安全碼僅用於本次驗證，不會被儲存
          </div>
          {errorMessage && (
            <div style={{color: 'red', marginBottom: 12}}>{errorMessage}</div>
          )}
          <div style={{display: 'flex', gap: 8, marginTop: 24}}>
            <button type="button" onClick={onClose} style={{flex: 1, padding: 12, borderRadius: 6, background: '#eee', border: 'none'}}>取消</button>
            <button type="submit" style={{flex: 1, padding: 12, borderRadius: 6, background: '#4CD964', color: '#fff', border: 'none'}}>儲存</button>
          </div>
          </form>
      </div>
    </div>
  );
}