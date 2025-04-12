import { type FC, useState, useEffect, useRef } from 'react';
import { X, CreditCard, Wallet } from 'lucide-react';
import type { ESIMPackage } from '../types';
import { useStore } from '../store';
import { translations } from '../i18n';
import { LoadingOverlay } from './LoadingOverlay';
import { SuccessOverlay } from './SuccessOverlay';

interface PaymentPageProps {
  package: ESIMPackage;
  onClose: () => void;
  onPurchaseComplete: () => void;
}

type PaymentMethod = 'card' | 'linepay';
type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

declare global {
  interface Window {
    TPDirect: any;
  }
}

export const PaymentPage: FC<PaymentPageProps> = ({ package: pkg, onClose, onPurchaseComplete }) => {
  const { language } = useStore();
  const t = translations[language];
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isCardValid, setIsCardValid] = useState(false);
  const [isTapPayReady, setIsTapPayReady] = useState(false);
  const setupCompleted = useRef(false);

  useEffect(() => {
    const loadTapPay = async () => {
      try {
        // Check if SDK is already loaded
        if (window.TPDirect) {
          console.log('TapPay SDK already loaded');
          setIsTapPayReady(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://js.tappaysdk.com/sdk/tpdirect/v5.19.2';
        script.async = true;
        script.crossOrigin = "anonymous";

        const scriptLoadPromise = new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = (error) => {
            console.error('Failed to load TapPay SDK:', error);
            reject(new Error('Failed to load TapPay SDK'));
          };
        });

        document.body.appendChild(script);
        await scriptLoadPromise;

        // Wait for TPDirect to be available
        let retries = 0;
        while (!window.TPDirect && retries < 10) {
          await new Promise(resolve => setTimeout(resolve, 500));
          retries++;
        }

        if (!window.TPDirect) {
          throw new Error('TapPay SDK not loaded after multiple retries');
        }

        const appId = parseInt(import.meta.env.VITE_TAPPAY_APP_ID);
        const appKey = import.meta.env.VITE_TAPPAY_APP_KEY;
        
        if (!appId || !appKey) {
          throw new Error('TapPay credentials are missing or invalid');
        }

        window.TPDirect.setupSDK(appId, appKey, 'sandbox');
        setIsTapPayReady(true);
      } catch (error) {
        console.error('TapPay SDK initialization failed:', error);
        setErrorMessage('Payment system initialization failed. Please try again later.');
      }
    };

    loadTapPay();

    return () => {
      // Do not remove the script on unmount to prevent reloading issues
    };
  }, []);

  useEffect(() => {
    if (selectedMethod === 'card' && isTapPayReady && !setupCompleted.current) {
      const setupCard = async () => {
        try {
          // Wait for DOM elements to be ready
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const numberEl = document.getElementById('card-number');
          const expiryEl = document.getElementById('card-expiration-date');
          const ccvEl = document.getElementById('card-ccv');

          if (!numberEl || !expiryEl || !ccvEl) {
            throw new Error('Card form elements not found');
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
                placeholder: 'CCV'
              }
            },
            styles: {
              'input': {
                color: '#333333',
                'font-size': '16px',
                'font-family': 'system-ui, -apple-system, sans-serif',
                'line-height': '20px',
                'font-weight': '400'
              },
              ':focus': {
                color: '#495057'
              },
              '.valid': {
                color: '#00C300'
              },
              '.invalid': {
                color: '#dc3545'
              }
            }
          });

          window.TPDirect.card.onUpdate((update: any) => {
            console.log('Card update:', update);
            setIsCardValid(update.canGetPrime);
            if (update.hasError) {
              if (update.status.number === 2) {
                setErrorMessage('Invalid card number');
              } else if (update.status.expiry === 2) {
                setErrorMessage('Invalid expiration date');
              } else if (update.status.ccv === 2) {
                setErrorMessage('Invalid CCV');
              }
            } else {
              setErrorMessage('');
            }
          });

          setupCompleted.current = true;
        } catch (error) {
          console.error('Card setup error:', error);
          setErrorMessage('Failed to initialize card form. Please refresh the page.');
          setupCompleted.current = false;
        }
      };

      setupCard();
    }
  }, [selectedMethod, isTapPayReady]);

  const handlePurchase = async () => {
    if (selectedMethod === 'card' && !isCardValid) {
      setErrorMessage('Please enter valid card details');
      return;
    }

    setStatus('processing');
    setErrorMessage('');

    try {
      if (selectedMethod === 'card') {
        const getPrimePromise = new Promise((resolve, reject) => {
          window.TPDirect.card.getPrime((result: any) => {
            if (result.status !== 0) {
              reject(new Error(result.msg || 'Failed to get prime token'));
            } else {
              resolve(result.card.prime);
            }
          });
        });

        const prime = await getPrimePromise;
        
        console.log('Making payment request to:', `${import.meta.env.VITE_API_URL}/process-payment`);

        const response = await fetch(`${import.meta.env.VITE_API_URL}/process-payment`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            prime,
            amount: Math.round(pkg.price * 100),
            details: `${pkg.name} - ${pkg.dataAmount}`,
            currency: pkg.currency,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Payment request failed:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            error: errorData
          });
          throw new Error(errorData.error || `Payment failed with status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Payment failed');
        }

        setStatus('success');
        console.log('Transaction ID:', data.transaction_id);
        setTimeout(onPurchaseComplete, 3000);
      } else if (selectedMethod === 'linepay') {
        setStatus('success');
        setTimeout(onPurchaseComplete, 3000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed. Please try again.');
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
                        Card Number
                      </label>
                      <div id="card-number" className="h-10 bg-white border border-gray-300 rounded-lg overflow-hidden"></div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date
                        </label>
                        <div id="card-expiration-date" className="h-10 bg-white border border-gray-300 rounded-lg overflow-hidden"></div>
                      </div>
                      <div className="w-32">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CCV
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
              disabled={status !== 'idle' || (selectedMethod === 'card' && !isCardValid)}
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