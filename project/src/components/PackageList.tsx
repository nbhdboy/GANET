import React from 'react';
import { ArrowLeft, Wifi, Clock, CreditCard, ChevronLeft } from 'lucide-react';
import type { PackageData, ESIMPackage } from '../types';

interface PackageListProps {
  language: 'en' | 'zh' | 'zh-TW';
  onSelectPackage: (pkg: PackageData | null) => void;
  packages?: PackageData[];
  selectedCountry?: ESIMPackage;
  onClose: () => void;
}

const translations = {
  en: {
    title: 'Select Package',
    coverage: 'Coverage',
    data: 'Data',
    validity: 'Validity',
    price: 'Price',
    buyNow: 'Buy Now',
    unlimited: 'Unlimited',
    days: 'days',
    back: 'Back',
    for: 'Available for',
  },
  zh: {
    title: '選擇專案',
    coverage: '覆蓋範圍',
    data: '數據',
    validity: '效期',
    price: '價格',
    buyNow: '立即購買',
    unlimited: '無限',
    days: '天',
    back: '返回',
    for: '適用於',
  },
  'zh-TW': {
    title: '選擇專案',
    coverage: '覆蓋範圍',
    data: '數據',
    validity: '效期',
    price: '價格',
    buyNow: '立即購買',
    unlimited: '無限',
    days: '天',
    back: '返回',
    for: '適用於',
  },
};

const defaultPackages: PackageData[] = [
  { data: '1GB', validity: '7', price: '5.00' },
  { data: '2GB', validity: '15', price: '7.00' },
  { data: '3GB', validity: '30', price: '10.00' },
  { data: '10GB', validity: '30', price: '21.00' },
  { data: '20GB', validity: '30', price: '32.00' },
  { data: 'unlimited', validity: '10', price: '35.00' },
];

export function PackageList({ language, onSelectPackage, packages = defaultPackages, selectedCountry, onClose }: PackageListProps) {
  const t = translations[language];

  const formatData = (data: string) => {
    return data === 'unlimited' ? t.unlimited : data;
  };

  return (
    <div className="fixed inset-0 bg-white z-50">
      <div className="bg-[#4CD964] p-4">
        <div className="flex items-center">
          <button
            onClick={onClose}
            className="text-white flex items-center"
          >
            <ChevronLeft className="w-6 h-6" />
            <span>{t.back}</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4">
        <div className="flex items-center space-x-2">
          <span>{t.for}</span>
          <span>{selectedCountry.country}</span>
          <div className="relative w-10 h-8 bg-white rounded-xl overflow-hidden shadow-sm p-0.5">
            <img
              src={`https://flagcdn.com/${selectedCountry.countryCode.toLowerCase()}.svg`}
              alt={selectedCountry.country}
              className="w-full h-full object-cover text-2xl leading-none"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                imageRendering: 'crisp-edges'
              }}
            />
          </div>
        </div>
        <h2 className="text-black font-medium mt-4">{t.title}</h2>
      </div>

      <div className="overflow-auto h-[calc(100vh-8rem)]">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            {packages.map((pkg, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-gradient-to-r from-green-400 to-green-500 rounded-full p-3">
                    <Wifi className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{formatData(pkg.data)}</h3>
                    <p className="text-gray-600 flex items-center gap-1">
                      <Clock size={16} />
                      {pkg.validity} {t.days}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <p className="text-2xl font-bold text-green-600">
                      ${pkg.price} <span className="text-sm">USD</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onSelectPackage(pkg)}
                  className="w-full bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white py-3 rounded-full transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <CreditCard size={20} />
                  {t.buyNow}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PackageList; 