import React from 'react';
import { Signal, Calendar, Plus } from 'lucide-react';
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
    topUpCount?: number;
  };
  onSelect: (pkg: ESIMPackage) => void;
  isPurchased?: boolean;
}

export function PackageCard({ package: pkg, onSelect, isPurchased }: PackageCardProps) {
  const { language } = useStore();
  const t = translations[language];

  // 格式化數據顯示
  const formatDataAmount = (amount: string) => {
    if (!amount) return '';
    if (amount.toLowerCase().includes('unlimited')) return t.unlimited;
    return amount;
  };

  // 格式化有效期顯示
  const formatValidity = (validity: string) => {
    if (!validity) return '';
    const days = validity.replace(' days', '');
    return `${days} ${t.days}`;
  };

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
    <div 
      className="bg-white rounded-2xl p-6 shadow-card hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={() => onSelect(pkg)}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-12 h-8 bg-white rounded-xl overflow-hidden shadow-sm p-0.5">
          <img
            src={`https://flagcdn.com/${pkg.countryCode.toLowerCase()}.svg`}
            alt={pkg.country}
            className="w-full h-full object-cover"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
              imageRendering: 'crisp-edges'
            }}
          />
        </div>
        <div>
          <h3 className="text-xl font-bold">{pkg.country}</h3>
          <p className="text-gray-500">{pkg.name}</p>
        </div>
        {isPurchased && pkg.status === 'active' && (
          <span className="ml-auto px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm">
            {t.active}
          </span>
        )}
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3">
          <Signal className="text-line" size={24} />
          <div>
            <p className="text-gray-600">{t.data}</p>
            <p className="text-lg font-semibold">
              {formatDataAmount(isPurchased ? pkg.totalData || pkg.dataAmount : pkg.dataAmount)}
            </p>
          </div>
          {isPurchased && pkg.usedData && (
            <div className="ml-auto text-right">
              <p className="text-gray-600">{t.used}</p>
              <p className="text-lg font-semibold">{pkg.usedData}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="text-line" size={24} />
          <div>
            <p className="text-gray-600">{t.validity}</p>
            <p className="text-lg font-semibold">
              {formatValidity(pkg.validity)}
            </p>
          </div>
          {isPurchased && pkg.expiryDate && (
            <div className="ml-auto text-right">
              <p className="text-gray-600">{t.expiry}</p>
              <p className="text-lg font-semibold">{pkg.expiryDate}</p>
            </div>
          )}
        </div>

        {isPurchased && (
          <div className="flex items-center gap-3">
            <Plus className="text-line" size={24} />
            <div>
              <p className="text-gray-600">{t.topUpCount || '加購次數'}</p>
              <p className="text-lg font-semibold">
                {pkg.topUpCount ? `x${pkg.topUpCount}` : '0'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-line">
            {pkg.currency} {pkg.price}
          </span>
          <button 
            className="bg-button-gradient hover:bg-button-gradient-hover text-white px-6 py-2 rounded-full transition-all duration-300 shadow-button hover:shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(pkg);
            }}
          >
            {isPurchased ? t.viewDetails : t.select}
          </button>
        </div>
      </div>
    </div>
  );
}