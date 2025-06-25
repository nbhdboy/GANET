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
    iccid?: string;
    apn_value?: string;
    apn?: string;
    addOnPackages?: ESIMPackage[];
  };
  onSelect: (pkg: ESIMPackage) => void;
  isPurchased?: boolean;
  onShowInstallInstructions?: (iccid?: string) => void;
}

// === 國碼對應 country background 圖檔 mapping ===
const countryCodeToBg: Record<string, string> = {
  JP: '日本.png',
  KR: '韓國.png',
  US: '美國.png',
  HK: '香港.png',
  MO: '澳門.png',
  SG: '新加坡.png',
  TH: '泰國.png',
  VN: '越南.png',
  MY: '馬來西亞.png',
  CN: '中國.png',
  PH: '菲律賓.png',
  KH: '柬埔寨.png',
  GB: '英國.png',
  DE: '德國.png',
  IT: '義大利.png',
  ID: '印尼.png',
  AS: '亞洲.png',
  EU: '歐洲.png',
  NA: '北美洲.png',
  OC: '大洋洲.png',
  AF: '非洲.png',
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

export function PackageCard({ package: pkg, onSelect, isPurchased, onShowInstallInstructions }: PackageCardProps) {
  const { language } = useStore();
  const t = translations[language];
  const t_pc = t.packageCard;
  const countryDisplayName = countryNames[pkg.countryCode]?.[language] ?? pkg.country;

  console.log('countryCode:', pkg.countryCode);

  // 格式化數據顯示
  const formatDataAmount = (amount: string) => {
    if (!amount) return '';
    if (amount.toLowerCase().includes('unlimited')) return t.unlimited;
    return amount;
  };

  // 格式化有效期顯示
  const formatValidity = (validity: string | number) => {
    if (validity === undefined || validity === null) return '';
    const validityStr = String(validity);
    if (language === 'zh_TW') {
      return validityStr.replace(/\s*days?/, '') + t_pc.daysUnit;
    }
    return validityStr;
  };

  // 加總 top up 數據、天數、金額
  const addOnPackages = pkg.addOnPackages || [];
  // 數據加總（GB）
  const parseData = (d) => {
    if (!d) return 0;
    if (typeof d === 'number') return d;
    if (d.toLowerCase().includes('unlimited')) return 0; // 無限流量不加總
    if (d.toLowerCase().includes('gb')) return parseFloat(d);
    if (d.toLowerCase().includes('mb')) return parseFloat(d) / 1024;
    return 0;
  };
  const mainData = parseData(pkg.dataAmount || pkg.data || '');
  const topupData = addOnPackages.reduce((sum, t) => sum + parseData(t.dataAmount || t.data), 0);
  const totalData = mainData + topupData;
  // 有效期間加總（天）
  const mainValidity = parseInt(pkg.validity) || 0;
  const topupValidity = addOnPackages.reduce((sum, t) => sum + (parseInt(t.validity) || 0), 0);
  const totalValidity = mainValidity + topupValidity;
  // 金額加總
  const mainPrice = Number(pkg.sell_price) || 0;
  const topupTotal = addOnPackages.reduce((sum, t) => sum + (Number(t.sell_price) || 0), 0);
  const totalPrice = mainPrice + topupTotal;

  const renderUsageGraph = () => {
    const used = parseFloat(pkg.usedData || '0');
    const total = parseFloat(pkg.totalData || '0');
    const percentage = (used / total) * 100;

    return (
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{t_pc.remainingData}</span>
          <span>{pkg.totalData}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-line-gradient rounded-full"
            style={{ width: `${100 - percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-600">{t_pc.usedData}</span>
          <span className="text-gray-900">{pkg.usedData || t_pc.defaultUsedData}</span>
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
      active: t_pc.statusActive,
      inactive: t_pc.statusNotActive,
      not_activated: t_pc.statusNotActive
    };

    return pkg.status ? (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[pkg.status]}`}>
        {statusText[pkg.status]}
      </span>
    ) : null;
  };

  // 只針對主卡（type === 'sim'）顯示卡片
  if (pkg.type !== 'sim') return null;

  return (
    <div 
      className="bg-white rounded-2xl p-6 shadow-card hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={() => onSelect(pkg)}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-12 h-8 bg-white rounded-xl overflow-hidden shadow-sm p-0.5">
          <img
            src={pkg.countryCode ? `https://flagcdn.com/${pkg.countryCode.toLowerCase()}.svg` : '/default-flag.svg'}
            alt={countryDisplayName || ''}
            className="w-full h-full object-contain rounded shadow"
          />
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold">{countryDisplayName}</h3>
          {pkg.status && pkg.status.toLowerCase() === 'active' && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#4CD964] text-white ml-2">{t_pc.statusActive}</span>
          )}
          {pkg.status && pkg.status.toLowerCase() === 'not_active' && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-400 text-white ml-2">{t_pc.statusNotActive}</span>
          )}
          {pkg.status && pkg.status.toLowerCase() === 'expired' && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-400 text-white ml-2">{t_pc.statusExpired}</span>
          )}
          {pkg.status && pkg.status.toLowerCase() === 'finished' && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-400 text-white ml-2">{t_pc.statusFinished}</span>
          )}
        </div>
      </div>

      <div className="space-y-1 mb-6">
        {pkg.iccid && (
          <div className="flex items-center gap-3">
            <span className="inline-block w-6 text-center text-line font-bold text-sm">#</span>
            <div>
              <p className="text-black text-sm">{t_pc.iccid}</p>
              <p className="text-gray-400 text-sm font-semibold tracking-widest">{pkg.iccid}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <span className="inline-block w-6 text-center text-line font-bold text-sm">+</span>
          <div>
            <p className="text-black text-sm">{t_pc.apn}</p>
            <p className="text-gray-400 text-sm font-semibold tracking-widest">{pkg.apn_value || pkg.apn || t_pc.noApn}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Signal className="text-line" size={20} />
          <div>
            <p className="text-black text-sm">{t.data}</p>
            <p className="text-gray-400 text-sm font-semibold">
              {totalData > 0 ? `${totalData} ${t_pc.gbUnit}` : formatDataAmount(pkg.dataAmount || pkg.data || '')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="text-line" size={20} />
          <div>
            <p className="text-black text-sm">{t.validityRange || t_pc.validityPeriod}</p>
            <p className="text-gray-400 text-sm font-semibold">
              {totalValidity > 0 ? `${totalValidity}${t_pc.daysUnit}` : (pkg.validity ? formatValidity(pkg.validity) : '')}
            </p>
          </div>
        </div>
        {isPurchased && (
          <div className="flex items-center gap-3">
            <Plus className="text-line" size={20} />
            <div>
              <p className="text-black text-sm">{t_pc.topUpCount}</p>
              <p className="text-gray-400 text-sm font-semibold tracking-widest">{pkg.addOnPackages?.length || 0}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-base font-bold text-line">
            {t_pc.currency} {Math.round(totalPrice)}
          </span>
          <div className="flex gap-2">
            <button 
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full transition-all duration-300 text-sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(pkg);
              }}
            >
              {isPurchased ? t_pc.viewUsage : t.select}
            </button>
            {onShowInstallInstructions && (
              <button
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full transition-all duration-300 text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onShowInstallInstructions(pkg.iccid);
                }}
              >
                {t_pc.installNow}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}