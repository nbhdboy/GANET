import { type FC, useState } from 'react';
import { X, CreditCard, Signal, Calendar } from 'lucide-react';
import type { ESIMPackage } from '../types';
import { useStore } from '../store';
import { translations } from '../i18n';
import type { TranslationKey } from '../types/i18n';

interface PackageConfirmationProps {
  package: ESIMPackage;
  onConfirm: (finalPrice: number) => void;
  onCancel: () => void;
}

export const PackageConfirmation: FC<PackageConfirmationProps> = ({ package: pkg, onConfirm, onCancel }) => {
  const { language } = useStore();
  const t = translations[language] as Record<TranslationKey, string>;
  const [discountCode, setDiscountCode] = useState('');
  const [isDiscountApplied, setIsDiscountApplied] = useState(false);
  
  const handleDiscountCode = () => {
    if (discountCode === '4242') {
      setIsDiscountApplied(true);
    } else {
      setIsDiscountApplied(false);
    }
  };

  const calculatePrice = () => {
    if (isDiscountApplied) {
      return parseFloat((pkg.price * 0.9).toFixed(2)); // 9折
    }
    return pkg.price;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col">
        <div className="p-6">
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
                  alt={pkg.country}
                  className="w-full h-full object-cover text-2xl leading-none"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    imageRendering: 'crisp-edges'
                  }}
                />
              </div>
              <h3 className="text-xl font-bold">{pkg.country}</h3>
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
                <p className="text-gray-600">{t.validity}</p>
                <p className="text-lg font-semibold">{pkg.validity}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center text-gray-600">
              <span>{t.price}</span>
              <span className="text-xl font-bold">{pkg.currency} {pkg.price.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder={language === 'en' ? "Enter discount code" : "輸入折扣碼"}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CD964] focus:border-transparent"
              />
              <button 
                onClick={handleDiscountCode}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {language === 'en' ? "Apply" : "使用"}
              </button>
            </div>

            {isDiscountApplied && (
              <div className="flex justify-between items-center text-[#4CD964]">
                <span>{language === 'en' ? "Discount (10% off)" : "折扣 (9折)"}</span>
                <span>-{pkg.currency} {(pkg.price * 0.1).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="font-medium">{t.total}</span>
              <span className="text-2xl font-bold text-[#4CD964]">
                {pkg.currency} {calculatePrice()}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-3">
          <button
            onClick={() => onConfirm(calculatePrice())}
            className="w-full bg-[#4CD964] hover:bg-[#40c357] text-white py-3 rounded-full transition-colors font-medium flex items-center justify-center gap-2"
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