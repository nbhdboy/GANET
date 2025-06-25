import React from 'react';
import { ArrowLeft, Wifi, Clock, CreditCard, ChevronLeft, Users } from 'lucide-react';
import type { PackageData, ESIMPackage, CountryPackageSummary } from '../types';
import { translations } from '../i18n';

interface PackageListProps {
  language: 'en' | 'zh_TW';
  onSelectPackage: (pkg: PackageData | null) => void;
  packages?: PackageData[];
  selectedCountry?: ESIMPackage;
  onClose: () => void;
  countryPackages: CountryPackageSummary[];
  loading?: boolean;
}

const defaultPackages: PackageData[] = [
  { data: '1GB', validity: '7', price: '5.00' },
  { data: '2GB', validity: '15', price: '7.00' },
  { data: '3GB', validity: '30', price: '10.00' },
  { data: '10GB', validity: '30', price: '21.00' },
  { data: '20GB', validity: '30', price: '32.00' },
  { data: 'unlimited', validity: '10', price: '35.00' },
];

// === 新增：國碼對應中文圖檔名稱 ===
const countryCodeToChinese: Record<string, string> = {
  JP: '日本',
  KR: '南韓',
  US: '美國',
  HK: '香港',
  MO: '澳門',
  SG: '新加坡',
  TH: '泰國',
  VN: '越南',
  MY: '馬來西亞',
  CN: '中國',
  PH: '菲律賓',
  KH: '柬埔寨',
  GB: '英國',
  DE: '德國',
  IT: '義大利',
  ID: '印尼',
  // 區域型
  AS: '亞洲',
  EU: '歐洲',
  NA: '北美洲',
  OC: '大洋洲',
  AF: '非洲',
};

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

// 解析 data 字串為數字（GB/MB），unlimited 排最後
function parseDataValue(data: string) {
  if (!data) return Number.MAX_SAFE_INTEGER;
  const str = data.replace(/\s+/g, '').toUpperCase();
  if (str === 'UNLIMITED') return Number.MAX_SAFE_INTEGER;
  if (str.endsWith('GB')) return parseFloat(str) * 1024;
  if (str.endsWith('MB')) return parseFloat(str);
  return Number.MAX_SAFE_INTEGER;
}
function parseDayValue(day: any) {
  if (!day) return Number.MAX_SAFE_INTEGER;
  return parseInt(day, 10) || Number.MAX_SAFE_INTEGER;
}

export function PackageList({ language, onSelectPackage, packages = defaultPackages, selectedCountry, onClose, loading }: PackageListProps) {
  const t = translations[language] ?? translations['zh_TW'];
  const t_pkg = t.packageList;

  if (loading) {
    console.log('[LOG] PackageList loading 畫面 render');
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mb-4"></div>
        <span className="text-gray-500 text-lg">{t.loadingPackages}</span>
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
    price: Math.round(Number(pkg.sell_price ?? pkg.price ?? 0)),
    currency: 'TWD',
    description: '',
    isTopUp: false,
    day: pkg.day,
    sell_price: pkg.sell_price,
    data: pkg.data,
    package_id: pkg.package_id || '',
  });

  // 僅顯示 1GB 與 3GB 專案（去除 data 空白）
  const filteredPackages = Array.isArray(packages) ? packages : [];

  const sortedPackages = [...filteredPackages].sort((a, b) => {
    const dataA = parseDataValue(a.data);
    const dataB = parseDataValue(b.data);
    if (dataA !== dataB) return dataA - dataB;
    // data 相同時比天數
    const dayA = parseDayValue(a.day ?? a.validity);
    const dayB = parseDayValue(b.day ?? b.validity);
    return dayA - dayB;
  });

  return (
    <div className="fixed inset-0 bg-white z-50">
      <div className="bg-[#4CD964] p-4">
        <div className="flex items-center">
          <button
            onClick={onClose}
            className="text-white flex items-center"
          >
            <ChevronLeft className="w-6 h-6" />
            <span>{t_pkg.back}</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4">
        <div className="flex items-center space-x-2">
          <span>{t_pkg.for}</span>
          <span>{selectedCountry?.countryCode ? countryNames[selectedCountry.countryCode]?.[language] ?? selectedCountry.country : selectedCountry?.country ?? '—'}</span>
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
        <h2 className="text-black font-medium mt-4">{t_pkg.selectPackage}</h2>
      </div>

      <div className="overflow-auto h-[calc(100vh-8rem)]">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            {sortedPackages.length > 0 ? (
              sortedPackages.map((pkg, idx) => {
                console.log('方案資料:', pkg);
                return (
                  <div key={idx} className="bg-white rounded-xl p-0 shadow-card hover:shadow-lg transition-all duration-300 flex flex-col items-center overflow-hidden">
                    {/* 上方：橫幅 banner 圖片 */}
                    <div className="w-full h-16">
                      <img
                        src={countryCodeToChinese[pkg.country_code]
                          ? `/icons/${countryCodeToChinese[pkg.country_code]}.png`
                          : '/icons/default-operator.svg'}
                        alt={countryCodeToChinese[pkg.country_code] ?? t.countryThemeImageAlt}
                        className="w-full h-full object-cover rounded-t-xl"
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).src = '/icons/default-operator.svg';
                        }}
                      />
                    </div>
                    {/* 下方：名稱與其他資訊 */}
                    <div className="flex flex-col items-center w-full px-6 pt-4 pb-0">
                      <span className="font-bold text-2xl mb-2">{pkg.operator ?? ''}</span>
                      {/* 下方三欄：價格、數據、效期 */}
                      <div className="flex w-full justify-between mb-6 mt-[-8px]">
                        <div className="flex flex-col items-center w-1/3">
                          <CreditCard className="text-green-500 mb-1" size={24} />
                          <span className="text-black text-sm mb-1">{t_pkg.price}</span>
                          <span className="font-normal text-gray-500 text-lg">${pkg.sell_price ?? pkg.price}</span>
                        </div>
                        <div className="flex flex-col items-center w-1/3">
                          <Wifi className="text-green-500 mb-1" size={24} />
                          <span className="text-black text-sm mb-1">{t_pkg.data}</span>
                          <span className="font-normal text-gray-500 text-lg">{pkg.data}</span>
                        </div>
                        <div className="flex flex-col items-center w-1/3">
                          <Clock className="text-green-500 mb-1" size={24} />
                          <span className="text-black text-sm mb-1">{t_pkg.validity}</span>
                          <span className="font-normal text-gray-500 text-lg">{pkg.day ?? pkg.validity} {t.daysUnit}</span>
                        </div>
                      </div>
                      {/* brand logo 一排＋小時數 */}
                      <div className="flex w-full justify-between items-end mb-4 px-2">
                        {(() => {
                          // 解析 data 轉 MB
                          const dataStr = (pkg.data || '').replace(/\s+/g, '').toUpperCase();
                          let mb = 0;
                          if (dataStr.endsWith('GB')) mb = parseFloat(dataStr) * 1024;
                          else if (dataStr.endsWith('MB')) mb = parseFloat(dataStr);
                          // 先除以5
                          const base = Math.round(mb / 5);
                          // 各 logo 一小時用量
                          const logoUsage = [
                            { label: 'YouTube', file: 'youtube.png', usage: 1024 },
                            { label: 'Google Map', file: 'google_map.png', usage: 15 },
                            { label: 'Facebook', file: 'facebook.png', usage: 180 },
                            { label: 'Instagram', file: 'ig.png', usage: 180 },
                            { label: 'Threads', file: 'thread.png', usage: 120 },
                          ];
                          return logoUsage.map(brand => {
                            const hours = base && brand.usage ? (base / brand.usage) : 0;
                            return (
                              <div key={brand.label} className="flex flex-col items-center w-1/5">
                                <img
                                  src={`/brand logo/${brand.file}`}
                                  alt={brand.label}
                                  className="w-4 h-4 object-contain mb-1"
                                />
                                <span className="text-[10px] text-gray-500 leading-tight">{hours ? hours.toFixed(1) : '-'}</span>
                                <span className="text-[10px] text-gray-400 leading-tight">{t.hoursUnit}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      {/* 購買按鈕 */}
                      <button
                        className="mt-2 w-full bg-[#4CD964] text-white py-2 rounded-lg font-bold hover:bg-[#43c05c] transition mb-4"
                        onClick={() => onSelectPackage(mapToESIMPackage(pkg))}
                      >
                        {t_pkg.buyNow}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-400 py-8">{t.noDataAvailable}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PackageList; 