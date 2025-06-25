import { type FC, useState, useRef, useEffect } from 'react';
import { X, CreditCard, Signal, Calendar, Info } from 'lucide-react';
import type { ESIMPackage } from '../types';
import { useStore } from '../store';
import { translations } from '../i18n';
import type { TranslationKey } from '../types/i18n';

interface PackageConfirmationProps {
  package: ESIMPackage;
  onConfirm: (pkg: ESIMPackage) => void;
  onCancel: () => void;
}

const countryNames: Record<string, { en: string; zh_TW: string }> = {
  JP: { en: 'Japan', zh_TW: '日本' },
  KR: { en: 'South Korea', zh_TW: '韓國' },
  US: { en: 'United States', zh_TW: '美國' },
  HK: { en: 'Hong Kong', zh_TW: '香港' },
  MO: { en: 'Macau', zh_TW: '澳門' },
  SG: { en: 'Singapore', zh_TW: '新加坡' },
  TH: { en: 'Thailand', zh_TW: '泰國' },
  VN: { en: 'Vietnam', zh_TW: '越南' },
  MY: { en: 'Malaysia', zh_TW: '馬來西亞' },
  CN: { en: 'China', zh_TW: '中國' },
  PH: { en: 'Philippines', zh_TW: '菲律賓' },
  KH: { en: 'Cambodia', zh_TW: '柬埔寨' },
  GB: { en: 'United Kingdom', zh_TW: '英國' },
  DE: { en: 'Germany', zh_TW: '德國' },
  IT: { en: 'Italy', zh_TW: '義大利' },
  ID: { en: 'Indonesia', zh_TW: '印尼' },
  AS: { en: 'Asia', zh_TW: '亞洲' },
  EU: { en: 'Europe', zh_TW: '歐洲' },
  NA: { en: 'North America', zh_TW: '北美洲' },
  OC: { en: 'Oceania', zh_TW: '大洋洲' },
  AF: { en: 'Africa', zh_TW: '非洲' },
};

export const PackageConfirmation: FC<PackageConfirmationProps> = ({ package: pkg, onConfirm, onCancel }) => {
  const { language, user, setUser } = useStore();
  const t = translations[language] as Record<TranslationKey, string>;
  const t_c = t.confirmation;
  const countryDisplayName = countryNames[pkg.countryCode]?.[language] ?? pkg.country;
  const [discountCode, setDiscountCode] = useState('');
  const [isDiscountApplied, setIsDiscountApplied] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const discountRef = useRef<HTMLDivElement>(null);
  const discountErrorRef = useRef<HTMLDivElement>(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountRate, setDiscountRate] = useState(1);
  const [email, setEmail] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [emailSaveLoading, setEmailSaveLoading] = useState(false);
  const [emailSaveError, setEmailSaveError] = useState('');
  const [carrier, setCarrier] = useState('');
  const [carrierValid, setCarrierValid] = useState(false);
  const [carrierSaveLoading, setCarrierSaveLoading] = useState(false);
  const [carrierSaveError, setCarrierSaveError] = useState('');
  
  // 監聽 user.email，自動帶入 email 並驗證格式
  useEffect(() => {
    setEmail(user?.email || '');
    setEmailValid(!!user?.email && /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i.test(user?.email || ''));
  }, [user?.email]);

  // 監聽 user.carrier，自動帶入 carrier 並驗證格式
  useEffect(() => {
    setCarrier(user?.carrier || '');
    setCarrierValid(!!user?.carrier && /^\/[A-Z0-9!@#$%^&*()_+\-=\[\]{};':",.<>/?]{7}$/.test(user?.carrier || ''));
  }, [user?.carrier]);

  const handleDiscountCode = async () => {
    setDiscountLoading(true);
    setDiscountError('');
    try {
      const res = await fetch('https://lcfsxxncgqrhjtbfmtig.supabase.co/functions/v1/verify-discount-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode, user_id: user.userId }),
      });
      const result = await res.json();
      if (result.success) {
        setDiscountRate(result.rate);
        setIsDiscountApplied(true);
        setDiscountError('');
        setTimeout(() => {
          discountRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      } else {
        setDiscountRate(1);
        setIsDiscountApplied(false);
        setDiscountError(result.error || t_c.discountCodeFailed);
        setTimeout(() => {
          discountErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    } catch (err) {
      setDiscountRate(1);
      setIsDiscountApplied(false);
      setDiscountError(t_c.discountCodeFailed);
      setTimeout(() => {
        discountErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
    setDiscountLoading(false);
  };

  // 取得天數與價格，優先 day/sell_price
  const validityDays = pkg.day ?? pkg.validity;
  const finalPrice = pkg.sell_price ?? pkg.price;

  const calculatePrice = () => {
    if (isDiscountApplied) {
      return parseFloat((Number(finalPrice) * discountRate).toFixed(2));
    }
    return Number(finalPrice);
  };

  // email 儲存 function
  const handleSaveEmail = async () => {
    if (!user?.userId || !emailValid) return;
    setEmailSaveLoading(true);
    setEmailSaveError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/save-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_user_id: user.userId, email })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setEmailSaveError(data.error || t_c.saveFailed);
        setEmailSaveLoading(false);
        return;
      }
      setUser({ ...user, email });
    } catch (e) {
      setEmailSaveError(t_c.saveFailed);
    }
    setEmailSaveLoading(false);
  };

  // 載具號碼儲存 function
  const handleSaveCarrier = async () => {
    if (!user?.userId || (!carrier && carrier !== '')) return;
    setCarrierSaveLoading(true);
    setCarrierSaveError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/save-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_user_id: user.userId, carrier })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setCarrierSaveError(data.error || t_c.saveFailed);
        setCarrierSaveLoading(false);
        return;
      }
      setUser({ ...user, carrier });
    } catch (e) {
      setCarrierSaveError(t_c.saveFailed);
    }
    setCarrierSaveLoading(false);
  };

  // 決定按鈕顯示文字
  const emailButtonText = email && user?.email && email !== user.email ? t_c.update : t_c.save;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#4CD964]">
              {t.confirmPurchase}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={t.close}
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="relative w-10 h-8 bg-white rounded-xl overflow-hidden shadow-sm p-0.5">
                <img
                  src={`https://flagcdn.com/${pkg.countryCode.toLowerCase()}.svg`}
                  alt={countryDisplayName}
                  className="w-full h-full object-cover text-2xl leading-none"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    imageRendering: 'crisp-edges'
                  }}
                />
              </div>
              <h3 className="text-xl font-bold">{countryDisplayName}</h3>
            </div>
            <p className="text-gray-500">{pkg.name}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Signal className="text-[#4CD964]" size={24} />
              <div>
                <p className="text-gray-600">{t.data}</p>
                <p className="text-lg font-semibold">{pkg.dataAmount}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="text-[#4CD964]" size={24} />
              <div>
                <p className="text-gray-600">{t_c.validityPeriod}</p>
                <p className="text-lg font-semibold">{validityDays} {t.days}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center text-gray-600">
              <span className="text-sm font-medium text-gray-700">{t.price}</span>
              <span className="text-xl font-bold">{pkg.currency} {Math.round(finalPrice)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder={t_c.enterDiscountCode}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CD964] focus:border-transparent"
              />
              <button 
                onClick={handleDiscountCode}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t_c.apply}
              </button>
            </div>
            <div className="flex items-center text-xs text-red-500 mt-1">
              <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-red-500 text-white mr-1" style={{ fontSize: '10px' }}>!</span>
              {t_c.discountWarning}
            </div>

            {/* 新增 email 輸入框與 tooltip */}
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center mb-1">
                <span className="text-sm font-medium">{t_c.email}</span>
                <span className="text-red-500 ml-1">*</span>
                <span className="text-xs text-gray-500 ml-2">{t_c.required}</span>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    // 驗證email格式
                    const re = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i;
                    setEmailValid(re.test(e.target.value));
                  }}
                  placeholder={t_c.ensureCorrectEmail}
                  className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CD964] focus:border-transparent${email && !emailValid ? ' border-red-400' : ''}`}
                  required
                />
                <button
                  type="button"
                  className={`px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors relative${emailSaveLoading ? ' opacity-50 cursor-not-allowed' : ''}`}
                  onClick={handleSaveEmail}
                  disabled={emailSaveLoading || !emailValid}
                >
                  <span style={{ position: 'relative', display: 'inline-block' }}>
                    {emailSaveLoading && (
                      <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                        <svg className="animate-spin" style={{ width: '1em', height: '1em', color: '#888' }} viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      </span>
                    )}
                    <span style={{ opacity: emailSaveLoading ? 0.3 : 1 }}>{emailButtonText}</span>
                  </span>
                </button>
              </div>
              <span className="text-xs text-gray-400 mt-1 flex items-center">
                <Info size={14} className="mr-1" />
                {t_c.invoiceEmailInfo}
              </span>
            </div>

            {/* 新增發票載具欄位與 tooltip */}
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center mb-1">
                <span className="text-sm font-medium">{t_c.invoiceCarrier}</span>
                <span className="text-xs text-gray-500 ml-2">{t_c.optional}</span>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={carrier}
                  onChange={e => {
                    setCarrier(e.target.value);
                    const re = /^\/[A-Z0-9!@#$%^&*()_+\-=\[\]{};':",.<>/?]{7}$/;
                    setCarrierValid(re.test(e.target.value));
                  }}
                  placeholder={t_c.invoiceCarrierPlaceholder}
                  className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CD964] focus:border-transparent${carrier && !carrierValid ? ' border-red-400' : ''}`}
                />
                <button
                  type="button"
                  className={`px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors relative${carrierSaveLoading ? ' opacity-50 cursor-not-allowed' : ''}`}
                  onClick={handleSaveCarrier}
                  disabled={carrierSaveLoading || (carrier && !carrierValid)}
                >
                  <span style={{ position: 'relative', display: 'inline-block' }}>
                    {carrierSaveLoading && (
                      <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                        <svg className="animate-spin" style={{ width: '1em', height: '1em', color: '#888' }} viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      </span>
                    )}
                    <span style={{ opacity: carrierSaveLoading ? 0.3 : 1 }}>{t_c.save}</span>
                  </span>
                </button>
              </div>
              <span className="text-xs text-gray-400 mt-1 flex items-center">
                <Info size={14} className="mr-1" />
                {t_c.invoiceCarrierInfo}
              </span>
              {carrierSaveError && <div className="text-red-500 text-xs mt-1">{carrierSaveError}</div>}
            </div>

            {isDiscountApplied && (
              <div ref={discountRef} className="flex justify-between items-center text-[#4CD964]">
                <span>
                  {language === 'en'
                    ? `${t_c.discount} (${Math.round((1 - discountRate) * 100)}${t_c.off})`
                    : `${t_c.discount} (${Math.round(discountRate * 10)}${t_c.fold})`}
                </span>
                <span>
                  -{pkg.currency} {Math.round(Number(finalPrice) * (1 - discountRate))}
                </span>
              </div>
            )}

            {discountError && !isDiscountApplied && (
              <div ref={discountErrorRef} className="text-red-500 text-sm mt-1">{discountError}</div>
            )}

            {emailSaveError && <div className="text-red-500 text-xs mt-1">{emailSaveError}</div>}

            <div className="flex justify-between items-center">
              <span className="font-medium">{t.total} <span className="text-xs text-gray-400">{t_c.taxIncluded}</span></span>
              <span className="text-2xl font-bold text-[#4CD964]">
                {pkg.currency} {Math.round(calculatePrice())}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-3">
          <button
            onClick={() => onConfirm({
              ...pkg,
              price: calculatePrice(),
              sell_price: calculatePrice(),
              discount_code: discountCode,
              discount_rate: discountRate,
              email: email,
              carrier: carrier
            })}
            className={`w-full bg-[#4CD964] hover:bg-[#40c357] text-white py-3 rounded-full transition-colors font-medium flex items-center justify-center gap-2${!emailValid ? ' opacity-50 cursor-not-allowed' : ''}`}
            disabled={!emailValid}
          >
            <CreditCard size={20} />
            {t.proceedToPayment}
          </button>
          <button
            onClick={onCancel}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-full hover:bg-gray-200 transition-colors font-medium"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};