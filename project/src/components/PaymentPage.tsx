import { type FC, useState, useEffect, useRef } from 'react';
import { X, CreditCard, Wallet } from 'lucide-react';
import type { ESIMPackage, SavedCard } from '../types';
import { useStore } from '../store';
import { translations } from '../i18n';
import { LoadingOverlay } from './LoadingOverlay';
import { SuccessOverlay } from './SuccessOverlay';

interface PaymentPageProps {
  package: ESIMPackage;
  onClose: () => void;
  onPurchaseComplete: () => void;
}

type PaymentMethod = 'card' | 'linepay' | 'saved_card';
type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

declare global {
  interface Window {
    TPDirect: any;
  }
}

export const PaymentPage: FC<PaymentPageProps> = ({ package: pkg, onClose, onPurchaseComplete }) => {
  const { language, user } = useStore();
  const t = translations[language];
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('saved_card');
  const [selectedCard, setSelectedCard] = useState<SavedCard | null>(null);
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isCardValid, setIsCardValid] = useState(false);
  const [isTapPayReady, setIsTapPayReady] = useState(false);
  const setupCompleted = useRef(false);

  useEffect(() => {
    if (user?.savedCards?.length > 0) {
      setSelectedCard(user.savedCards[0]);
      setSelectedMethod('saved_card');
    } else {
      setSelectedMethod('card');
    }
  }, [user?.savedCards]);

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

        // 詳細記錄初始化參數
        console.log('=== TapPay SDK 初始化參數 ===');
        console.log('App ID:', appId, typeof appId);
        console.log('App Key:', appKey?.substring(0, 10) + '...');
        console.log('Environment:', 'sandbox');

        try {
          // 確保 appId 是數字
          const numericAppId = parseInt(appId, 10);
          if (isNaN(numericAppId)) {
            throw new Error('Invalid App ID format');
          }

          // 檢查 App Key 格式
          if (!appKey?.startsWith('app_')) {
            throw new Error('Invalid App Key format');
          }

          console.log('初始化 TapPay SDK 開始...');
          window.TPDirect.setupSDK(
            numericAppId,
            appKey,
            'sandbox'
          );
          
          // 驗證初始化結果
          if (!window.TPDirect.card) {
            throw new Error('TapPay SDK initialization failed - card module not available');
          }
          
          console.log('TapPay SDK 初始化成功');
          if (isMounted) {
            setIsTapPayReady(true);
          }
        } catch (error) {
          console.error('TapPay SDK 初始化錯誤:', error);
          setErrorMessage(`Payment system initialization failed: ${error.message}`);
          return;
        }
      } catch (error) {
        console.error('TapPay SDK initialization failed:', error);
        if (isMounted) {
          setErrorMessage('Payment system initialization failed. Please try again later.');
        }
      }
    };

    loadTapPay();

    return () => {
      isMounted = false;
      setIsTapPayReady(false);
      setupCompleted.current = false;
    };
  }, []);

  useEffect(() => {
    if (selectedMethod === 'card' && isTapPayReady && !setupCompleted.current) {
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
            // 詳細記錄卡片狀態
            console.log('卡片狀態更新:', {
              canGetPrime: update.canGetPrime,
              hasError: update.hasError,
              status: update.status
            });

            if (update.canGetPrime) {
              setIsCardValid(true);
              setErrorMessage('');
            } else {
              setIsCardValid(false);
              // 顯示具體的錯誤信息
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
  }, [selectedMethod, isTapPayReady]);

  const handlePurchase = async () => {
    try {
      setStatus('processing');
      setErrorMessage('');

      if (selectedMethod === 'saved_card' && selectedCard) {
        // 使用已儲存的卡片進行付款
        const response = await fetch(`${import.meta.env.VITE_API_URL}/process-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'x-client-info': 'payment-client'
          },
          body: JSON.stringify({
            cardId: selectedCard.id,
            amount: pkg.currency === 'USD' ? Math.round(pkg.price * 31 * 100) : Math.round(pkg.price * 100),
            currency: 'TWD'
          })
        });

        if (!response.ok) {
          throw new Error('付款處理失敗');
        }

        setStatus('success');
        setTimeout(() => {
          onPurchaseComplete();
        }, 2000);
      } else if (selectedMethod === 'card') {
        // 獲取 TapPay Prime
        const tappayStatus = window.TPDirect.card.getTappayFieldsStatus();
        
        console.log('支付狀態檢查:', {
          canGetPrime: tappayStatus.canGetPrime,
          hasError: tappayStatus.hasError,
          status: tappayStatus.status
        });

        if (!tappayStatus.canGetPrime) {
          throw new Error('請確認信用卡資訊是否正確填寫');
        }

        try {
          // 使用正確的 TapPay getPrime 回調方式
          const prime = await new Promise((resolve, reject) => {
            window.TPDirect.card.getPrime((result) => {
              console.log('TapPay getPrime 完整結果:', result);
              
              if (result.status !== 0) {
                reject(new Error(result.msg || '取得 prime 失敗'));
                return;
              }
              
              if (!result.card || !result.card.prime) {
                reject(new Error('無法取得有效的 prime'));
                return;
              }
              
              resolve(result.card.prime);
            });
          });

          console.log('成功獲取 prime:', prime);

          // 發送支付請求到後端
          const response = await fetch(`${import.meta.env.VITE_API_URL}/process-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'x-client-info': 'payment-client'
            },
            body: JSON.stringify({
              prime,
              amount: pkg.currency === 'USD' ? Math.round(pkg.price * 31 * 100) : Math.round(pkg.price * 100),
              currency: 'TWD'
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('支付請求失敗:', errorData);
            throw new Error(errorData.message || '支付處理失敗');
          }

          const responseData = await response.json();
          console.log('支付處理成功:', responseData);

          setStatus('success');
          // 延長成功狀態的顯示時間
          setTimeout(() => {
            setStatus('idle');
            onPurchaseComplete();
          }, 5000); // 從 3000ms 改為 5000ms
        } catch (error) {
          console.error('支付處理錯誤:', error);
          setErrorMessage(error.message || '支付處理時發生錯誤，請稍後再試');
          setStatus('error');
        }
      } else if (selectedMethod === 'linepay') {
        setStatus('success');
        // 延長成功狀態的顯示時間
        setTimeout(() => {
          setStatus('idle');
          onPurchaseComplete();
        }, 5000); // 從 3000ms 改為 5000ms
      }
    } catch (error) {
      console.error('付款處理錯誤:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '付款處理失敗');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold bg-line-gradient bg-clip-text text-transparent">
                {t.selectPaymentMethod}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={t.close}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {user?.savedCards?.length > 0 && (
                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedMethod === 'saved_card' 
                      ? 'border-line bg-line/5' 
                      : 'border-gray-200 hover:border-line/50'
                  }`}
                  onClick={() => setSelectedMethod('saved_card')}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className={selectedMethod === 'saved_card' ? 'text-line' : 'text-gray-500'} size={24} />
                    <div>
                      <p className="font-medium">{t.savedCards}</p>
                      <p className="text-sm text-gray-500">{t.selectSavedCard}</p>
                    </div>
                  </div>

                  {selectedMethod === 'saved_card' && (
                    <div className="mt-4 space-y-2">
                      {user.savedCards.map(card => (
                        <div
                          key={card.id}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            selectedCard?.id === card.id
                              ? 'bg-line/10 border-line'
                              : 'bg-gray-50 border-transparent'
                          }`}
                          onClick={() => setSelectedCard(card)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-line">{card.brand}</span>
                              <span>•••• {card.last4}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {card.expiryMonth}/{card.expiryYear}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedMethod === 'card' 
                    ? 'border-line bg-line/5' 
                    : 'border-gray-200 hover:border-line/50'
                }`}
                onClick={() => setSelectedMethod('card')}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className={selectedMethod === 'card' ? 'text-line' : 'text-gray-500'} size={24} />
                  <div>
                    <p className="font-medium">{t.creditCard}</p>
                    <p className="text-sm text-gray-500">Visa, Mastercard</p>
                  </div>
                </div>

                {selectedMethod === 'card' && (
                  <div className="card-form mt-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.cardNumber}
                      </label>
                      <div id="card-number" className="h-10 bg-white border border-gray-300 rounded-lg overflow-hidden"></div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t.expiryDate}
                        </label>
                        <div id="card-expiration-date" className="h-10 bg-white border border-gray-300 rounded-lg overflow-hidden"></div>
                      </div>
                      <div className="w-32">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t.cvv}
                        </label>
                        <div id="card-ccv" className="h-10 bg-white border border-gray-300 rounded-lg overflow-hidden"></div>
                      </div>
                    </div>
                    {errorMessage && (
                      <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
                    )}
                  </div>
                )}
              </div>

              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedMethod === 'linepay' 
                    ? 'border-line bg-line/5' 
                    : 'border-gray-200 hover:border-line/50'
                }`}
                onClick={() => setSelectedMethod('linepay')}
              >
                <div className="flex items-center gap-3">
                  <Wallet className={selectedMethod === 'linepay' ? 'text-line' : 'text-gray-500'} size={24} />
                  <div>
                    <p className="font-medium">LINE Pay</p>
                    <p className="text-sm text-gray-500">{t.linePayDesc}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">{pkg.name}</span>
                  <span className="font-semibold">{pkg.currency} {pkg.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t.total}</span>
                  <span className="text-xl font-bold bg-line-gradient bg-clip-text text-transparent">
                    {pkg.currency} {pkg.price}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <button
              onClick={handlePurchase}
              disabled={status !== 'idle' || 
                (selectedMethod === 'card' && !isCardValid) ||
                (selectedMethod === 'saved_card' && !selectedCard)}
              className="w-full bg-line-gradient hover:bg-line-gradient-hover text-white py-3 rounded-full transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard size={20} />
              {t.purchase}
            </button>
          </div>
        </div>
      </div>
      {status === 'processing' && <LoadingOverlay />}
      {status === 'success' && <SuccessOverlay />}
    </>
  );
}