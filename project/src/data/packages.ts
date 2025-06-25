import type { ESIMPackage } from '../types';

export const PACKAGES: ESIMPackage[] = [
  {
    id: 'jp-7d',
    country: 'Japan',
    countryCode: 'JP',
    countryNameZh: '日本',
    flag: '🇯🇵',
    name: 'Japan Travel eSIM',
    dataAmount: '5GB',
    validity: '7 days',
    price: 20,
    currency: 'USD',
    description: 'Perfect for short trips to Japan. Works with all major carriers.',
    isTopUp: true,
  },
  {
    id: 'tw-5d',
    country: 'Taiwan',
    countryCode: 'TW',
    countryNameZh: '台灣',
    flag: '🇹🇼',
    name: 'Taiwan Unlimited',
    dataAmount: 'Unlimited',
    validity: '5 days',
    price: 15,
    currency: 'USD',
    description: 'Unlimited data for your Taiwan adventure. Coverage across the island.',
    isTopUp: true,
  },
  {
    id: 'kr-10d',
    country: 'South Korea',
    countryCode: 'KR',
    countryNameZh: '韓國',
    flag: '🇰🇷',
    name: 'Korea Data Pack',
    dataAmount: '10GB',
    validity: '10 days',
    price: 25,
    currency: 'USD',
    description: 'High-speed data across South Korea. Compatible with all Korean networks.',
    isTopUp: true,
  },
  {
    id: 'th-15d',
    country: 'Thailand',
    countryCode: 'TH',
    countryNameZh: '泰國',
    flag: '🇹🇭',
    name: 'Thailand Explorer',
    dataAmount: '15GB',
    validity: '15 days',
    price: 22,
    currency: 'USD',
    description: 'Stay connected throughout Thailand with extensive coverage.',
    isTopUp: true,
  },
  {
    id: 'sg-30d',
    country: 'Singapore',
    countryCode: 'SG',
    countryNameZh: '新加坡',
    flag: '🇸🇬',
    name: 'Singapore Plus',
    dataAmount: '20GB',
    validity: '30 days',
    price: 30,
    currency: 'USD',
    description: 'Extended coverage for Singapore with high-speed data.',
    isTopUp: true,
  },
  {
    id: 'my-15d',
    country: 'Malaysia',
    countryCode: 'MY',
    countryNameZh: '馬來西亞',
    flag: '🇲🇾',
    name: 'Malaysia Connect',
    dataAmount: '12GB',
    validity: '15 days',
    price: 18,
    currency: 'USD',
    description: 'Reliable connectivity across Malaysia.',
    isTopUp: true,
  }
];

const PACKAGE_CACHE_PREFIX = 'airalo_packages_';
const PACKAGE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7天（毫秒）

function getPackageCacheKey(countryCode?: string) {
  return countryCode
    ? `${PACKAGE_CACHE_PREFIX}${countryCode}`
    : `${PACKAGE_CACHE_PREFIX}all`;
}

function setPackageCache(countryCode: string | undefined, data: any) {
  const key = getPackageCacheKey(countryCode);
  console.log('[DEBUG][setPackageCache] 寫入快取', key, data);
  localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
}

function getPackageCache(countryCode: string | undefined) {
  const key = getPackageCacheKey(countryCode);
  const raw = localStorage.getItem(key);
  if (!raw) {
    console.log('[DEBUG][getPackageCache] 無快取', key);
    return null;
  }
  try {
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts < PACKAGE_CACHE_TTL) {
      console.log('[DEBUG][getPackageCache] 命中快取', key, data);
      return data;
    }
    console.log('[DEBUG][getPackageCache] 快取過期，移除', key);
    localStorage.removeItem(key);
    return null;
  } catch (e) {
    console.log('[DEBUG][getPackageCache] 解析快取失敗', key, e);
    return null;
  }
}

export async function fetchAiraloPackages(countryCode?: string) {
  // 先檢查 localStorage 快取
  const cached = getPackageCache(countryCode);
  if (cached) {
    console.log('[DEBUG][fetchAiraloPackages] 使用快取', countryCode, cached);
    return cached;
  }

  // 沒有快取才發 API
  try {
    let url = 'https://lcfsxxncgqrhjtbfmtig.supabase.co/functions/v1/airalo-get-packages';
    if (countryCode) url += `?country_code=${countryCode}`;
    console.log('[DEBUG][fetchAiraloPackages] 發 API', url);
    const res = await fetch(url);
    const data = await res.json();
    setPackageCache(countryCode, data); // 寫入快取
    return data;
  } catch (err) {
    console.error('[DEBUG][fetchAiraloPackages] 取得 Airalo API 失敗', err);
    return null;
  }
}

// 指定要顯示的國家/地區（英文名稱對應 API 回傳）
const TARGET_COUNTRIES: Record<string, { zh: string; code: string; flag: string }> = {
  'Japan': { zh: '日本', code: 'JP', flag: '🇯🇵' },
  'South Korea': { zh: '韓國', code: 'KR', flag: '🇰🇷' },
  'Hong Kong': { zh: '香港', code: 'HK', flag: '🇭🇰' },
  'Macau': { zh: '澳門', code: 'MO', flag: '🇲🇴' },
  'Singapore': { zh: '新加坡', code: 'SG', flag: '🇸🇬' },
  'Thailand': { zh: '泰國', code: 'TH', flag: '🇹🇭' },
  'Vietnam': { zh: '越南', code: 'VN', flag: '🇻🇳' },
  'Malaysia': { zh: '馬來西亞', code: 'MY', flag: '🇲🇾' },
  'China': { zh: '中國', code: 'CN', flag: '🇨🇳' },
  'Philippines': { zh: '菲律賓', code: 'PH', flag: '🇵🇭' },
  'Cambodia': { zh: '柬埔寨', code: 'KH', flag: '🇰🇭' },
  'United Kingdom': { zh: '英國', code: 'GB', flag: '🇬🇧' },
  'Germany': { zh: '德國', code: 'DE', flag: '🇩🇪' },
  'Italy': { zh: '義大利', code: 'IT', flag: '🇮🇹' },
  'Indonesia': { zh: '印尼', code: 'ID', flag: '🇮🇩' },
  'United States': { zh: '美國', code: 'US', flag: '🇺🇸' },
  'Europe': { zh: '歐洲地區', code: 'EU', flag: '🇪🇺' },
  'North America': { zh: '北美地區', code: 'NA', flag: '🌎' },
  'Asia': { zh: '亞洲地區', code: 'AS', flag: '🌏' },
  'Oceania': { zh: '大洋洲', code: 'OC', flag: '🌊' },
  'Africa': { zh: '非洲', code: 'AF', flag: '🌍' },
};

// 新增：以 country_code 為 key 的 lookup table
const TARGET_COUNTRIES_BY_CODE: Record<string, { zh: string; flag: string }> = Object.fromEntries(
  Object.values(TARGET_COUNTRIES).map(({ code, zh, flag }) => [code, { zh, flag }])
);

export interface CountryPackageSummary {
  country: string; // 中文名
  countryCode: string;
  flag: string;
  dataRange: string;
  validityRange: string;
  operators: string[];
}

export function parseAiraloPackages(apiData: any): CountryPackageSummary[] {
  if (!apiData || !apiData.data) return [];
  const result: CountryPackageSummary[] = [];
  for (const countryObj of apiData.data) {
    const countryEn = countryObj.title;
    if (!TARGET_COUNTRIES[countryEn]) continue;
    const { zh, code, flag } = TARGET_COUNTRIES[countryEn];
    let minData = Infinity, maxData = 0, hasUnlimited = false;
    let minDay = Infinity, maxDay = 0;
    const operatorsSet = new Set<string>();
    for (const op of countryObj.operators || []) {
      if (op.title) operatorsSet.add(op.title);
      for (const pkg of op.packages || []) {
        // 數據
        if (typeof pkg.amount === 'number') {
          minData = Math.min(minData, pkg.amount);
          maxData = Math.max(maxData, pkg.amount);
        }
        if (pkg.is_unlimited) hasUnlimited = true;
        // 天數
        if (typeof pkg.day === 'number') {
          minDay = Math.min(minDay, pkg.day);
          maxDay = Math.max(maxDay, pkg.day);
        }
      }
    }
    // 數據區間
    let dataRange = '';
    if (minData !== Infinity && (maxData !== minData || hasUnlimited)) {
      dataRange = `${minData / 1024}GB～${hasUnlimited ? '無限流量' : maxData / 1024 + 'GB'}`;
    } else if (minData !== Infinity) {
      dataRange = `${minData / 1024}GB`;
    } else if (hasUnlimited) {
      dataRange = '無限流量';
    }
    // 有效期間區間
    let validityRange = '';
    if (minDay !== Infinity && maxDay !== Infinity && minDay !== maxDay) {
      validityRange = `${minDay}天～${maxDay}天`;
    } else if (minDay !== Infinity) {
      validityRange = `${minDay}天`;
    }
    result.push({
      country: zh,
      countryCode: code,
      flag,
      dataRange,
      validityRange,
      operators: Array.from(operatorsSet),
    });
  }
  return result;
}

async function getCountrySummaries() {
  const apiData = await fetchAiraloPackages();
  const summaries = parseAiraloPackages(apiData);
  console.log(summaries);
}

// 將扁平陣列 group 成以 country_code 為單位的摘要卡片資料
export function groupByCountry(packages: any[]) {
  const map = new Map();
  for (const pkg of packages) {
    const key = pkg.country_code || pkg.countryCode || '其他';
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(pkg);
  }
  return Array.from(map.entries()).map(([countryCode, pkgs]) => {
    const countryInfo = TARGET_COUNTRIES_BY_CODE[countryCode] || { zh: countryCode, flag: '' };
    const operators = [...new Set(pkgs.map(p => p.operator))];
    console.log(`[groupByCountry] ${countryCode} pkgs data:`, pkgs.map(p => p.data));
    // 計算數據區間
    let minData = Infinity, maxData = 0, hasUnlimited = false;
    let minDay = Infinity, maxDay = 0;
    for (const p of pkgs) {
      if (typeof p.data === 'string' && p.data.toLowerCase().includes('unlimited')) hasUnlimited = true;
      const amount = parseFloat(p.data);
      if (!isNaN(amount)) {
        minData = Math.min(minData, amount);
        maxData = Math.max(maxData, amount);
      }
      if (typeof p.day === 'number') {
        minDay = Math.min(minDay, p.day);
        maxDay = Math.max(maxDay, p.day);
      }
    }
    let dataRange = '';
    if (minData !== Infinity && (maxData !== minData || hasUnlimited)) {
      dataRange = `${minData}GB～${hasUnlimited ? '無限流量' : maxData + 'GB'}`;
    } else if (minData !== Infinity) {
      dataRange = `${minData}GB`;
    } else if (hasUnlimited) {
      dataRange = '無限流量';
    }
    let validityRange = '';
    if (minDay !== Infinity && maxDay !== Infinity && minDay !== maxDay) {
      validityRange = `${minDay}天～${maxDay}天`;
    } else if (minDay !== Infinity) {
      validityRange = `${minDay}天`;
    }
    return {
      country: countryInfo.zh,
      countryCode,
      flag: countryInfo.flag,
      dataRange,
      validityRange,
      operators,
      packages: pkgs,
    };
  });
}