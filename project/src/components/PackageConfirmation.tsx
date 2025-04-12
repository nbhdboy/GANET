import { type FC } from 'react';
import { X, CreditCard, Globe, Signal, Calendar } from 'lucide-react';
import type { ESIMPackage } from '../types';
import { useStore } from '../store';
import { translations } from '../i18n';
import type { TranslationKey } from '../types/i18n';

interface PackageConfirmationProps {
  package: ESIMPackage;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PackageConfirmation: FC<PackageConfirmationProps> = ({ package: pkg, onConfirm, onCancel }) => {
  const { language } = useStore();
  const t = translations[language] as Record<TranslationKey, string>;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold bg-line-gradient bg-clip-text text-transparent">
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

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Globe className="bg-line-gradient bg-clip-text text-transparent" size={32} />
                <img
                  src={`https://flagcdn.com/${pkg.countryCode.toLowerCase()}.svg`}
                  alt={pkg.country}
                  className="w-4 h-4 absolute -bottom-1 -right-1"
                />
              </div>
              <div>
                <h3 className="font-semibold">{pkg.country}</h3>
                <p className="text-sm text-gray-500">{pkg.name}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Signal size={18} className="bg-line-gradient bg-clip-text text-transparent" />
                <p>{t.data}: {pkg.dataAmount}</p>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="bg-line-gradient bg-clip-text text-transparent" />
                <p>{t.validity}: {pkg.validity}</p>
              </div>
              {pkg.description && (
                <p className="text-sm text-gray-500">{pkg.description}</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">{t.price}</span>
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

        <div className="p-6 space-y-3">
          <button
            onClick={onConfirm}
            className="w-full bg-line-gradient hover:bg-line-gradient-hover text-white py-3 rounded-full transition-colors font-medium flex items-center justify-center gap-2"
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