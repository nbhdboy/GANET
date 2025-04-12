import React from 'react';
import { PackageCard } from './PackageCard';
import { useStore } from '../store';
import { translations } from '../i18n';
import { PACKAGES } from '../data/packages';

interface TopUpPackagesProps {
  onSelect: (packageId: string) => void;
  onClose: () => void;
}

export function TopUpPackages({ onSelect, onClose }: TopUpPackagesProps) {
  const { language } = useStore();
  const t = translations[language];
  const topUpPackages = PACKAGES.filter(pkg => pkg.isTopUp);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold bg-line-gradient bg-clip-text text-transparent">
              {t.availableTopUps}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              {t.close}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topUpPackages.map(pkg => (
              <PackageCard
                key={pkg.id}
                package={pkg}
                onSelect={() => onSelect(pkg.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}