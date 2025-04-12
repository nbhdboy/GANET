import React from 'react';
import { Globe, Signal, Calendar } from 'lucide-react';
import type { ESIMPackage } from '../types';
import { useStore } from '../store';
import { translations } from '../i18n';

interface PackageCardProps {
  package: ESIMPackage & {
    status?: 'active' | 'inactive' | 'not_activated';
    activationDate?: string;
    expiryDate?: string;
    usedData?: string;
    totalData?: string;
  };
  onSelect: (pkg: ESIMPackage) => void;
  isPurchased?: boolean;
}

export function PackageCard({ package: pkg, onSelect, isPurchased }: PackageCardProps) {
  const { language } = useStore();
  const t = translations[language];

  const renderUsageGraph = () => {
    const used = parseFloat(pkg.usedData || '0');
    const total = parseFloat(pkg.totalData || '0');
    const percentage = (used / total) * 100;

    return (
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>REMAINING DATA</span>
          <span>{pkg.totalData}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-line-gradient rounded-full"
            style={{ width: `${100 - percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-600">USED DATA</span>
          <span className="text-gray-900">{pkg.usedData || '0 MB'}</span>
        </div>
      </div>
    );
  };

  const renderStatus = () => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      not_activated: 'bg-yellow-100 text-yellow-800'
    };

    const statusText = {
      active: 'Active',
      inactive: 'Inactive',
      not_activated: 'Not Activated'
    };

    return pkg.status ? (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[pkg.status]}`}>
        {statusText[pkg.status]}
      </span>
    ) : null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Globe className="text-line" size={32} />
            <img
              src={`https://flagcdn.com/${pkg.countryCode.toLowerCase()}.svg`}
              alt={pkg.country}
              className="w-4 h-4 absolute -bottom-1 -right-1"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{pkg.country}</h3>
            <p className="text-sm text-gray-500">{pkg.name}</p>
          </div>
        </div>
        {renderStatus()}
      </div>

      {isPurchased && pkg.totalData && renderUsageGraph()}
      
      <div className="space-y-3 text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <Signal size={18} className="text-line" />
          <p>{t.data}: {pkg.dataAmount}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-line" />
          <p>{t.validity}: {pkg.validity}</p>
        </div>
        {pkg.description && (
          <p className="text-sm text-gray-500">{pkg.description}</p>
        )}
        {isPurchased && pkg.status && (
          <>
            {pkg.activationDate && (
              <p className="text-sm">
                {t.activatedOn}: {new Date(pkg.activationDate).toLocaleDateString()}
              </p>
            )}
            {pkg.expiryDate && (
              <p className="text-sm">
                {t.expiresOn}: {new Date(pkg.expiryDate).toLocaleDateString()}
              </p>
            )}
          </>
        )}
      </div>
      
      <div className="mt-4">
        <div className="text-2xl font-bold text-line mb-3">
          {pkg.currency} {pkg.price}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onSelect(pkg)}
            className="flex-1 bg-line-gradient hover:bg-line-gradient-hover text-white px-6 py-2 rounded-full transition-colors font-medium"
          >
            {isPurchased ? t.viewDetails : t.select}
          </button>
          {isPurchased && (
            <button 
              onClick={() => onSelect(pkg)}
              className="flex-1 bg-line-gradient hover:bg-line-gradient-hover text-white px-6 py-2 rounded-full transition-colors font-medium"
            >
              {t.topUp}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}