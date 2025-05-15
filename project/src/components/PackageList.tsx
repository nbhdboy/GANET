import React from 'react';
import { ArrowLeft, Wifi, Clock, CreditCard, ChevronLeft, Users } from 'lucide-react';
import type { PackageData, ESIMPackage, CountryPackageSummary } from '../types';

interface PackageListProps {
  language: 'en' | 'zh' | 'zh-TW';
  onSelectPackage: (pkg: PackageData | null) => void;
  packages?: PackageData[];
  selectedCountry?: ESIMPackage;
  onClose: () => void;
  countryPackages: CountryPackageSummary[];
  loading?: boolean;
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
    country: 'Country',
    dataRange: 'Data Range',
    validityRange: 'Validity',
    operators: 'Operators',
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
    country: '國家',
    dataRange: '數據區間',
    validityRange: '有效期間',
    operators: '電信商',
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
    country: '國家',
    dataRange: '數據區間',
    validityRange: '有效期間',
    operators: '電信商',
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

export function PackageList({ language, onSelectPackage, packages = defaultPackages, selectedCountry, onClose, loading }: PackageListProps) {
  const t = translations[language] ?? translations['zh-TW'];

  if (loading) {
    console.log('[LOG] PackageList loading 畫面 render');
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mb-4"></div>
        <span className="text-gray-500 text-lg">讀取專案中...</span>
      </div>
    );
  }

  // mapping function 放到這裡，才能正確取得 selectedCountry
  const mapToESIMPackage = (pkg: any): ESIMPackage => ({
    id: pkg.package_id || '',
    country: selectedCountry?.country || '',
    countryCode: selectedCountry?.countryCode || pkg.country_code || '',
    countryNameZh: '',
    flag: '',
    name: pkg.operator || '',
    dataAmount: pkg.data || '',
    validity: pkg.day ? String(pkg.day) : '',
    price: Number(pkg.sell_price ?? pkg.price ?? 0),
    currency: 'USD',
    description: '',
    isTopUp: false,
    day: pkg.day,
    sell_price: pkg.sell_price,
    data: pkg.data,
    package_id: pkg.package_id || '',
  });

  // 僅顯示 1GB 與 3GB 專案（去除 data 空白）
  const filteredPackages = Array.isArray(packages)
    ? packages.filter(pkg => {
        const data = (pkg.data || '').replace(/\s+/g, '');
        return data === '1GB' || data === '3GB';
      })
    : [];

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
          <span>{selectedCountry?.country ?? '—'}</span>
          <div className="relative w-10 h-8 bg-white rounded-xl overflow-hidden shadow-sm p-0.5">
            {selectedCountry?.countryCode ? (
              <img
                src={`https://flagcdn.com/${selectedCountry.countryCode.toLowerCase()}.svg`}
                alt={selectedCountry.country}
                className="w-full h-full object-cover text-2xl leading-none"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                  imageRendering: 'crisp-edges',
                }}
              />
            ) : null}
          </div>
        </div>
        <h2 className="text-black font-medium mt-4">{t.title}</h2>
      </div>

      <div className="overflow-auto h-[calc(100vh-8rem)]">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            {filteredPackages.length > 0 ? (
              filteredPackages.map((pkg, idx) => {
                console.log('方案資料:', pkg);
                return (
                  <div key={idx} className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src="/icons/japan-cute.svg"
                        alt="日本主題圖"
                        className="w-8 h-8 object-contain rounded bg-white border border-gray-200"
                        style={{ marginRight: 8 }}
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).src = '/icons/default-operator.svg';
                        }}
                      />
                      <span className="font-bold text-lg">{pkg.operator ?? ''}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Wifi className="text-green-500" size={20} />
                      <span className="text-gray-600">{t.data}：</span>
                      <span className="font-medium">{pkg.data}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="text-green-500" size={20} />
                      <span className="text-gray-600">{t.validity}：</span>
                      <span className="font-medium">{pkg.day ?? pkg.validity}{t.days}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="text-green-500" size={20} />
                      <span className="text-gray-600">{t.price}：</span>
                      <span className="font-medium">${pkg.sell_price ?? pkg.price}</span>
                    </div>
                    <button
                      className="mt-4 w-full bg-[#4CD964] text-white py-2 rounded-lg font-bold hover:bg-[#43c05c] transition"
                      onClick={() => onSelectPackage(mapToESIMPackage(pkg))}
                    >
                      {t.buyNow}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-400 py-8">尚無資料</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PackageList; 