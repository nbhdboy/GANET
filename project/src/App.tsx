import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { PackageCard } from './components/PackageCard';
import { BottomNav } from './components/BottomNav';
import { PackageConfirmation } from './components/PackageConfirmation';
import { PaymentPage } from './components/PaymentPage';
import { SaveCardPage } from './components/SaveCardPage';
import { InstallInstructions } from './components/InstallInstructions';
import { TopUpPackages } from './components/TopUpPackages';
import { TermsAndConditions } from './components/TermsAndConditions';
import { FAQ } from './components/FAQ';
import { ViewDetails } from './components/ViewDetails';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { useStore } from './store';
import { translations } from './i18n';
import { PACKAGES } from './data/packages';
import type { ESIMPackage, UserProfile, PackageData } from './types';
import PackageList from './components/PackageList';
import { Profile } from './components/Profile';
import { fetchAiraloPackages, parseAiraloPackages, CountryPackageSummary, groupByCountry } from './data/packages';
import { ALLOWED_COUNTRY_CODES } from './data/allowedCountryCodes';
import { Routes, Route } from 'react-router-dom';

// eSIM usage 快取型別
type EsimUsage = {
  status: string;
  remaining: number;
  expired_at?: string;
};

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

function App() {
  const { language, setUser, user } = useStore();
  const [activeTab, setActiveTab] = useState<'store' | 'esims' | 'profile'>('store');
  const [selectedPackage, setSelectedPackage] = useState<ESIMPackage | null>(null);
  const [showPackageList, setShowPackageList] = useState(false);
  const [showPackageConfirmation, setShowPackageConfirmation] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSaveCard, setShowSaveCard] = useState(false);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  const [showTopUpPackages, setShowTopUpPackages] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [esimTab, setEsimTab] = useState<'current' | 'archived'>('current');
  const [isTopUpFlow, setIsTopUpFlow] = useState(false);
  const [purchasedEsims, setPurchasedEsims] = useState<Array<ESIMPackage & {
    status: 'active' | 'inactive';
    activationDate?: string;
    expiryDate?: string;
    usedData?: string;
    totalData?: string;
    topUpCount?: number;
  }>>([]);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const t = translations[language];

  // 新增：API 動態資料
  const [countryPackages, setCountryPackages] = useState<CountryPackageSummary[]>([]);
  const [rawApiData, setRawApiData] = useState<any>(null); // 保存 API 原始資料
  const [selectedCountryPackages, setSelectedCountryPackages] = useState<any[]>([]); // 保存選中國家的所有細分方案
  const [loading, setLoading] = useState(true);

  // eSIM usage 狀態快取
  const [usageMap, setUsageMap] = useState<Record<string, EsimUsage>>({});
  const usageFetchedRef = useRef(false);

  // 新增 loadingPackageList 狀態
  const [loadingPackageList, setLoadingPackageList] = useState(false);

  const esimListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadPackages() {
      setLoading(true);
      // 直接拿 DB 查詢的細分專案陣列
      const allPackages = await fetchAiraloPackages();
      setRawApiData(allPackages); // 保存原始細分專案陣列
      // 前端 groupByCountry 彙總顯示首頁
      const grouped = groupByCountry(allPackages);
      // 依照 ALLOWED_COUNTRY_CODES 順序排序
      const sorted = ALLOWED_COUNTRY_CODES
        .map(code => grouped.find(pkg => pkg.countryCode === code))
        .filter(Boolean);
      setCountryPackages(sorted);
      setLoading(false);
    }
    loadPackages();
  }, []);

  useEffect(() => {
    const scripts = document.querySelectorAll('script');
    scripts.forEach(s => {
      console.log('[首頁 useEffect] script:', s.src || '[inline script]');
    });
  }, []);

  useEffect(() => {
    if ((window as any).TPDirect) return; // 已載入過就不重複載入
    const script = document.createElement('script');
    script.src = 'https://js.tappaysdk.com/sdk/tpdirect/v5.20.0';
    script.async = true;
    script.id = 'tappay-sdk';
    document.body.appendChild(script);
    return () => {
      // 可選：離開網站時移除 script
      // document.getElementById('tappay-sdk')?.remove();
    };
  }, []);

  // Mock login/logout functions
  const handleLogin = () => {
    const mockUser: UserProfile = {
      userId: 'test_user_001',
      displayName: 'Demo User',
      pictureUrl: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop',
      language: language as 'en' | 'zh' | 'zh-TW',
      savedCards: []  // 添加默認的空卡片列表
    };
    setUser(mockUser);
  };

  const handleLogout = () => {
    setUser(null);
  };
  
  const handlePackageSelect = (pkg: ESIMPackage) => {
    console.log('[LOG] handlePackageSelect', pkg);
    if (!user) {
      handleLogin();
      return;
    }
    setSelectedPackage(pkg);
    setShowPackageList(true);
  };

  const handlePackageConfirm = (pkg: ESIMPackage | null) => {
    console.log('[LOG] handlePackageConfirm', pkg);
    if (pkg === null) {
      setShowPackageList(false);
      setSelectedPackage(null);
      return;
    }
    setSelectedPackage(pkg);
    setShowPackageList(false);
    setShowPackageConfirmation(true);
  };

  const handleConfirmationBack = () => {
    if (isTopUpFlow) {
      // 加購流程：返回詳細頁面，保持原始 eSIM 資訊
      const originalEsim = purchasedEsims.find(esim => esim.id === selectedPackage?.id);
      setShowPackageConfirmation(false);
      setShowViewDetails(true);
      if (originalEsim) {
        setSelectedPackage(originalEsim);
      }
      setIsTopUpFlow(false);
    } else {
      // 一般購買流程：返回專案列表
      setShowPackageConfirmation(false);
      setShowPackageList(true);
      setSelectedPackage(null);
    }
  };

  const handleConfirmationProceed = (pkg: ESIMPackage) => {
    console.log('[LOG] handleConfirmationProceed', pkg);
    setSelectedPackage(pkg);
    setShowPackageConfirmation(false);
    setShowPayment(true);
  };

  const handlePaymentBack = () => {
    console.log('[LOG] handlePaymentBack', selectedPackage);
    if (isTopUpFlow) {
      // 加購流程：返回詳細頁面，保持原始 eSIM 資訊
      const originalEsim = purchasedEsims.find(esim => esim.id === selectedPackage?.id);
      setShowPayment(false);
      setShowViewDetails(true);
      if (originalEsim) {
        setSelectedPackage(originalEsim);
      }
      setIsTopUpFlow(false);
    } else {
      // 一般購買流程：返回專案列表
      setShowPayment(false);
      setShowPackageList(true);
      setSelectedPackage(null);
    }
    setDiscountedPrice(null);
  };

  // 添加一個新的函數來轉換數據格式
  const convertToPackageData = (esimPackage: ESIMPackage): PackageData[] => {
    // 根據不同的數據量提供不同的選項
    const baseData = parseInt(esimPackage.dataAmount) || 1;
    return [
      {
        data: '1GB',
        validity: '7',
        price: '5.00'
      },
      {
        data: '2GB',
        validity: '15',
        price: '7.00'
      },
      {
        data: '3GB',
        validity: '30',
        price: '10.00'
      },
      {
        data: '10GB',
        validity: '30',
        price: '21.00'
      },
      {
        data: '20GB',
        validity: '30',
        price: '32.00'
      },
      {
        data: 'unlimited',
        validity: '10',
        price: '35.00'
      }
    ];
  };

  // 追蹤 purchasedEsims 狀態變化，並自動 scroll 到最上方
  useEffect(() => {
    if (esimListRef.current) {
      esimListRef.current.scrollTop = 0;
    }
    console.log('[LOG][App] purchasedEsims 狀態變化', purchasedEsims);
  }, [purchasedEsims]);

  const handlePurchaseComplete = (iccid?: string) => {
    console.log('[LOG][App] handlePurchaseComplete 執行', { selectedPackage, iccid, isTopUpFlow, purchasedEsims });
    if (selectedPackage) {
      if (isTopUpFlow) {
        // 找到原始的 eSIM
        const originalEsimIndex = purchasedEsims.findIndex(esim => esim.id === selectedPackage.id);
        if (originalEsimIndex !== -1) {
          const originalEsim = purchasedEsims[originalEsimIndex];
          
          // 更新加購專案列表
          const newAddOnPackage = {
            dataAmount: selectedPackage.dataAmount,
            validity: String(parseInt(selectedPackage.validity))
          };
          
          // 更新 eSIM
          const updatedEsim = {
            ...originalEsim,
            addOnPackages: [
              ...(originalEsim.addOnPackages || []),
              newAddOnPackage
            ],
            // 更新總數據量
            totalData: (() => {
              const originalData = parseFloat(originalEsim.totalData.replace('GB', ''));
              const topUpData = parseFloat(selectedPackage.dataAmount.replace('GB', ''));
              return `${originalData + topUpData}GB`;
            })(),
            // 更新有效期
            validity: (() => {
              const originalValidity = parseInt(
                typeof originalEsim.validity === 'string'
                  ? originalEsim.validity.replace(' days', '')
                  : originalEsim.validity
              );
              const topUpValidity = parseInt(
                typeof selectedPackage.validity === 'string'
                  ? selectedPackage.validity.replace(' days', '')
                  : selectedPackage.validity
              );
              return `${originalValidity + topUpValidity} days`;
            })(),
            // 更新總價格
            price: Number((originalEsim.price + (discountedPrice || selectedPackage.price)).toFixed(1)),
            // 更新到期日
            expiryDate: (() => {
              const originalValidity = parseInt(
                typeof originalEsim.validity === 'string'
                  ? originalEsim.validity.replace(' days', '')
                  : originalEsim.validity
              );
              const topUpValidity = parseInt(
                typeof selectedPackage.validity === 'string'
                  ? selectedPackage.validity.replace(' days', '')
                  : selectedPackage.validity
              );
              return new Date(Date.now() + (originalValidity + topUpValidity) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            })(),
            // 更新加購次數
            topUpCount: (originalEsim.topUpCount || 0) + 1,
            iccid: iccid || originalEsim.iccid
          };
          
          // 更新 purchasedEsims 陣列
          const newPurchasedEsims = [...purchasedEsims];
          newPurchasedEsims[originalEsimIndex] = updatedEsim;
          setPurchasedEsims(newPurchasedEsims);
          
          // 更新選中的套餐為更新後的 eSIM
          setSelectedPackage(updatedEsim);
          // 新增：購買後主動查 usage 並寫入全域快取，避免 race condition
          if (iccid) {
            const USAGE_CACHE_KEY = '__esim_usage_cache__';
            (async () => {
              try {
                const res = await fetch(`https://lcfsxxncgqrhjtbfmtig.supabase.co/functions/v1/airalo-get-usage?iccid=${iccid}`);
                const json = await res.json();
                if (json.data) {
                  const usage = {
                    status: json.data.status,
                    remaining: json.data.remaining,
                    expired_at: json.data.expired_at,
                  };
                  const globalCache = (window as any)[USAGE_CACHE_KEY] || {};
                  (window as any)[USAGE_CACHE_KEY] = {
                    ...globalCache,
                    [iccid]: { data: usage, ts: Date.now() }
                  };
                  // 也寫入 localStorage
                  const cacheKey = `__esim_usage_cache_${iccid}`;
                  window.localStorage.setItem(cacheKey, JSON.stringify({ data: usage, ts: Date.now() }));
                  console.log('[LOG][App] 購買後主動查 usage 並寫入快取', iccid, usage);
                }
              } catch (e) {
                console.warn('[LOG][App] 購買後查 usage 失敗', iccid, e);
              }
            })();
          }
        }
      } else {
        // 原有的新購買邏輯
        const newEsim = {
          ...selectedPackage,
          price: discountedPrice || selectedPackage.price,
          status: 'ACTIVE' as const,
          activationDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + parseInt(selectedPackage.validity) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          usedData: '0 MB',
          totalData: selectedPackage.dataAmount,
          addOnPackages: [],
          topUpCount: 0, // 初始化加購次數為 0
          iccid: iccid
        };
        console.log('[LOG][App] 新增 newEsim', newEsim);
        setPurchasedEsims([newEsim, ...purchasedEsims]);
        setSelectedPackage(null);
        // 新增：購買後主動查 usage 並寫入全域快取，避免 race condition
        if (iccid) {
          const USAGE_CACHE_KEY = '__esim_usage_cache__';
          (async () => {
            try {
              const res = await fetch(`https://lcfsxxncgqrhjtbfmtig.supabase.co/functions/v1/airalo-get-usage?iccid=${iccid}`);
              const json = await res.json();
              if (json.data) {
                const usage = {
                  status: json.data.status,
                  remaining: json.data.remaining,
                  expired_at: json.data.expired_at,
                };
                const globalCache = (window as any)[USAGE_CACHE_KEY] || {};
                (window as any)[USAGE_CACHE_KEY] = {
                  ...globalCache,
                  [iccid]: { data: usage, ts: Date.now() }
                };
                // 也寫入 localStorage
                const cacheKey = `__esim_usage_cache_${iccid}`;
                window.localStorage.setItem(cacheKey, JSON.stringify({ data: usage, ts: Date.now() }));
                console.log('[LOG][App] 購買後主動查 usage 並寫入快取', iccid, usage);
              }
            } catch (e) {
              console.warn('[LOG][App] 購買後查 usage 失敗', iccid, e);
            }
          })();
        }
      }
    }

    // 清理狀態
    setShowPayment(false);
    setShowPackageConfirmation(false);
    setDiscountedPrice(null);

    if (isTopUpFlow) {
      // 加購流程：返回詳細頁面
      setShowViewDetails(true);
      setIsTopUpFlow(false);
    } else {
      // 一般購買流程：返回 eSIM 列表
      setActiveTab('esims');
      setShowPackageList(false);
    }
  };

  const handleTopUpSelect = (packageId: string) => {
    const pkg = PACKAGES.find(p => p.id === packageId);
    if (pkg) {
      setSelectedPackage(pkg);
      setShowTopUpPackages(false);
    }
  };

  const handleViewDetails = (pkg: ESIMPackage) => {
    setSelectedPackage(pkg);
    setShowViewDetails(true);
  };

  const handleTopUpConfirm = (topUpPackage: ESIMPackage) => {
    setIsTopUpFlow(true);
    setSelectedPackage(topUpPackage);
    setShowViewDetails(false);
    setShowPackageConfirmation(true);
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/remove-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete card');
      }

      // 更新用戶的已保存卡片列表
      if (user) {
        const updatedCards = user.savedCards.filter(card => card.id !== cardId);
        setUser({
          ...user,
          savedCards: updatedCards,
        });
      }
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const renderProfile = () => (
    <div className="space-y-6">
      {user && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={user.pictureUrl}
              alt={user.displayName}
              className="w-20 h-20 rounded-full"
            />
            <div>
              <h3 className="text-xl font-semibold">{user.displayName}</h3>
              <p className="text-gray-600">ID: {user.userId}</p>
            </div>
          </div>

          {/* Saved Cards Section */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4">{t.paymentSettings}</h4>
            {user.savedCards?.map(card => (
              <div key={card.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-2">
                <div className="flex items-center gap-3">
                  <div className="text-line">{card.brand === 'Visa' ? 'Visa' : 'Mastercard'}</div>
                  <div>•••• {card.last4}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    {card.expiryMonth}/{card.expiryYear}
                  </div>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="text-red-500 hover:text-red-600 transition-colors"
                  >
                    {t.deleteCard}
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => setShowSaveCard(true)}
              className="mt-4 w-full bg-line-gradient hover:bg-line-gradient-hover text-white py-2 rounded-full transition-colors font-medium"
            >
              {t.addCreditCard}
            </button>
          </div>

          {/* Other Sections */}
          <div className="space-y-4">
            <button 
              onClick={() => setShowTerms(true)}
              className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {t.termsAndConditions}
            </button>
            <button 
              onClick={() => setShowPrivacyPolicy(true)}
              className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {t.privacyPolicy}
            </button>
            <button 
              onClick={() => window.open('https://line.me/R/ti/p/@canet', '_blank')}
              className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {t.customerService}
            </button>
            <button 
              onClick={() => setShowFAQ(true)}
              className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {t.faq}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-gray-100 text-gray-700 py-2 rounded-full hover:bg-gray-200 transition-colors font-medium mt-6"
          >
            {t.logout}
          </button>
        </div>
      )}
    </div>
  );

  // 進入「我的 eSIM」頁時批次查詢 usage 狀態
  useEffect(() => {
    if (activeTab !== 'esims' || usageFetchedRef.current) return;
    if (!purchasedEsims || purchasedEsims.length === 0) return;
    usageFetchedRef.current = true;
    const fetchAllUsage = async () => {
      const newUsageMap: Record<string, EsimUsage> = {};
      for (const esim of purchasedEsims) {
        if (!esim.iccid) continue;
        try {
          const cacheKey = `__esim_usage_cache_${esim.iccid}`;
          const cache = window.localStorage.getItem(cacheKey);
          let usage: EsimUsage | null = null;
          if (cache) {
            const parsed = JSON.parse(cache);
            if (Date.now() - parsed.ts < 15 * 60 * 1000) {
              usage = parsed.data;
            }
          }
          if (!usage) {
            const res = await fetch(`https://lcfsxxncgqrhjtbfmtig.supabase.co/functions/v1/airalo-get-usage?iccid=${esim.iccid}`);
            const json = await res.json();
            if (json.data) {
              usage = {
                status: json.data.status,
                remaining: json.data.remaining,
                expired_at: json.data.expired_at,
              };
              window.localStorage.setItem(cacheKey, JSON.stringify({ data: usage, ts: Date.now() }));
            }
          }
          if (usage) newUsageMap[esim.iccid] = usage;
          // 新增：寫入全域快取，讓詳細頁/安裝頁能共用
          if (usage) {
            const USAGE_CACHE_KEY = '__esim_usage_cache__';
            const globalCache = (window as any)[USAGE_CACHE_KEY] || {};
            (window as any)[USAGE_CACHE_KEY] = {
              ...globalCache,
              [esim.iccid]: { data: usage, ts: Date.now() }
            };
          }
        } catch {}
      }
      setUsageMap(newUsageMap);
    };
    fetchAllUsage();
  }, [activeTab, purchasedEsims]);

  // 合併 usage 狀態進每個 package
  const mergedEsims = purchasedEsims.map(esim => {
    if (!esim.iccid) return esim;
    const usage = usageMap[esim.iccid];
    return usage
      ? { ...esim, status: usage.status, remaining: usage.remaining, expired_at: usage.expired_at }
      : esim;
  });

  const renderMyEsims = () => {
    // 先判斷有沒有購買過
    if (!mergedEsims || mergedEsims.length === 0) {
      return <div className="text-center text-gray-400 py-8">尚未購買 eSIM</div>;
    }
    // 根據 tab 狀態篩選
    const filteredEsims = mergedEsims.filter(esim =>
      esimTab === 'current'
        ? (esim.status === 'ACTIVE' || esim.status === 'NOT_ACTIVE')
        : (esim.status === 'EXPIRED')
    );
    // 有購買但該類型沒資料
    if (filteredEsims.length === 0) {
      return (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold bg-line-gradient bg-clip-text text-transparent">
              {t.myEsims}
            </h2>
          </div>
          {/* 分頁 tab */}
          <div className="flex gap-4 mb-4">
            <button
              className={`px-4 py-2 rounded-full font-semibold ${esimTab === 'current' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
              onClick={() => setEsimTab('current')}
            >
              {t.currentEsims || '目前 eSIM'}
            </button>
            <button
              className={`px-4 py-2 rounded-full font-semibold ${esimTab === 'archived' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
              onClick={() => setEsimTab('archived')}
            >
              {t.archivedEsims || '已封存 eSIM'}
            </button>
          </div>
          <div className="text-center text-gray-400 py-8">尚未有符合條件的 eSIM</div>
        </div>
      );
    }
    // 有購買且有符合條件的 eSIM
    return (
      <div ref={esimListRef} className="space-y-8" style={{overflowY: 'auto', maxHeight: '80vh'}}>
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold bg-line-gradient bg-clip-text text-transparent">
            {t.myEsims}
          </h2>
        </div>
        {/* 分頁 tab */}
        <div className="flex gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded-full font-semibold ${esimTab === 'current' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
            onClick={() => setEsimTab('current')}
          >
            {t.currentEsims || '目前 eSIM'}
          </button>
          <button
            className={`px-4 py-2 rounded-full font-semibold ${esimTab === 'archived' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
            onClick={() => setEsimTab('archived')}
          >
            {t.archivedEsims || '已封存 eSIM'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEsims.map(esim => (
            <PackageCard
              key={esim.iccid || esim.id}
              package={esim}
              onSelect={handleViewDetails}
              isPurchased
              onShowInstallInstructions={handleShowInstallInstructions}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'esims':
        return renderMyEsims();
      case 'profile':
        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold bg-line-gradient bg-clip-text text-transparent mb-4">
              {t.memberProfile}
            </h2>
            {user ? (
              <Profile 
                onAddCard={() => {
                  setShowSaveCard(true);
                  console.log('App setShowSaveCard(true)');
                }}
                onShowTerms={() => setShowTerms(true)}
                onShowPrivacy={() => setShowPrivacyPolicy(true)}
                onShowFAQ={() => setShowFAQ(true)}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">{t.loginToViewProfile}</p>
                <button
                  onClick={handleLogin}
                  className="bg-line-gradient hover:bg-line-gradient-hover text-white px-6 py-2 rounded-full transition-colors font-medium"
                >
                  {t.login}
                </button>
              </div>
            )}
          </div>
        );
      default:
        return (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold bg-line-gradient bg-clip-text text-transparent">
                {t.availablePackages}
              </h2>
              <p className="text-gray-600 mt-2">
                {t.packageDescription}
              </p>
            </div>

            {!user && (
              <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
                <button
                  onClick={handleLogin}
                  className="w-full bg-line-gradient hover:bg-line-gradient-hover text-white py-3 rounded-full transition-colors font-medium"
                >
                  {t.login}
                </button>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {countryPackages.map(pkg => (
                <div
                  key={pkg.countryCode}
                  className="bg-white rounded-2xl p-6 shadow-card hover:shadow-lg transition-shadow duration-300 cursor-pointer flex flex-col items-center"
                  onClick={() => {
                    setSelectedPackage(pkg);
                    setLoadingPackageList(true);
                    setSelectedCountryPackages([]);
                    setTimeout(() => {
                      setShowPackageList(true);
                    }, 0);
                  }}
                >
                  {/* 國家小圖與名稱 */}
                  <div className="flex items-center gap-3 mb-2 w-full justify-center">
                    <img
                      src={`https://flagcdn.com/${pkg.countryCode.toLowerCase()}.svg`}
                      alt={pkg.country}
                      className="w-12 h-12 object-cover rounded shadow"
                    />
                    <span className="text-2xl font-bold text-gray-900">{pkg.country}</span>
                  </div>
                  {/* 三個橢圓框只顯示 label，value 移到下方且變小變灰 */}
                  <div className="flex gap-3 mb-1 w-full justify-center">
                    <span className="px-3 py-1 rounded-full border border-gray-200 bg-white text-gray-700 text-sm font-semibold min-w-[80px] text-center">電信商</span>
                    <span className="px-3 py-1 rounded-full border border-gray-200 bg-white text-gray-700 text-sm font-semibold min-w-[80px] text-center">有效期間</span>
                    <span className="px-3 py-1 rounded-full border border-gray-200 bg-white text-gray-700 text-sm font-semibold min-w-[80px] text-center">數據區間</span>
                  </div>
                  <div className="flex gap-3 mb-2 w-full justify-center">
                    <span className="block min-w-[80px] text-center text-xs text-gray-500 font-normal">{pkg.operators?.[0] || '—'}</span>
                    <span className="block min-w-[80px] text-center text-xs text-gray-500 font-normal">{pkg.validityRange ? pkg.validityRange.replace('～', '-') : '—'}</span>
                    <span className="block min-w-[80px] text-center text-xs text-gray-500 font-normal">{pkg.dataRange ? pkg.dataRange.replace('～', '-') : '—'}</span>
                  </div>
                  {/* 中間背景圖，調整為更寬且無外框 */}
                  <div className="w-full flex justify-center my-4">
                    <img
                      src={countryCodeToBg[pkg.countryCode] ? `/country background/${countryCodeToBg[pkg.countryCode]}` : '/country background/default.png'}
                      alt={pkg.country}
                      className="w-full max-w-[340px] h-32 object-cover rounded-xl"
                      style={{ boxShadow: 'none', border: 'none' }}
                    />
                  </div>
                  {/* 五個 brand logo，縮小且移除 30小時，並在下方顯示小時區間 */}
                  <div className="flex w-full justify-between items-end mb-4 px-2">
                    {(() => {
                      // 取所有 data，轉 MB
                      const datas = (pkg.packages || []).map(p => (p.data || '').replace(/\s+/g, '').toUpperCase());
                      const mbs = datas.map(d => d.endsWith('GB') ? parseFloat(d) * 1024 : d.endsWith('MB') ? parseFloat(d) : 0).filter(n => !isNaN(n) && n > 0);
                      const minMB = Math.min(...mbs);
                      const maxMB = Math.max(...mbs);
                      // 先除以5
                      const minBase = Math.round(minMB / 5);
                      const maxBase = Math.round(maxMB / 5);
                      // 各 logo 一小時用量
                      const logoUsage = [
                        { label: 'YouTube', file: 'youtube.png', usage: 1024 },
                        { label: 'Google Map', file: 'google_map.png', usage: 15 },
                        { label: 'Facebook', file: 'facebook.png', usage: 180 },
                        { label: 'Instagram', file: 'ig.png', usage: 180 },
                        { label: 'Threads', file: 'thread.png', usage: 120 },
                      ];
                      return logoUsage.map(brand => {
                        const minH = minBase && brand.usage ? (minBase / brand.usage) : 0;
                        const maxH = maxBase && brand.usage ? (maxBase / brand.usage) : 0;
                        let text = '-';
                        if (minH && maxH) {
                          text = minH === maxH ? `${minH.toFixed(1)}` : `${minH.toFixed(1)}-${maxH.toFixed(1)}`;
                        } else if (minH) {
                          text = minH.toFixed(1);
                        } else if (maxH) {
                          text = maxH.toFixed(1);
                        }
                        return (
                          <div key={brand.label} className="flex flex-col items-center w-1/5">
                            <img
                              src={`/brand logo/${brand.file}`}
                              alt={brand.label}
                              className="w-4 h-4 object-contain mb-1"
                            />
                            <span className="text-[10px] text-gray-500 leading-tight">{text}</span>
                            <span className="text-[10px] text-gray-400 leading-tight">小時</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  {/* 選擇按鈕 */}
                  <button className="mt-2 w-full bg-[#4CD964] text-white py-2 rounded-lg font-bold hover:bg-[#43c05c] transition">
                    選擇
                  </button>
                </div>
              ))}
            </div>
          </>
        );
    }
  };

  const [installIccid, setInstallIccid] = useState<string | undefined>(undefined);
  const handleShowInstallInstructions = (iccid?: string) => {
    setInstallIccid(iccid);
    setShowInstallInstructions(true);
  };

  // useEffect 只依賴 showPackageList 和 selectedPackage
  useEffect(() => {
    if (showPackageList && selectedPackage) {
      console.log('[LOG] useEffect 觸發 fetch，showPackageList:', showPackageList, 'selectedPackage:', selectedPackage);
      setLoadingPackageList(true);
      const start = Date.now();
      (async () => {
        try {
          console.log('[LOG] fetch 前，loadingPackageList:', loadingPackageList);
          // 改用快取 function
          const countryPackages = await fetchAiraloPackages(selectedPackage.countryCode);
          setSelectedCountryPackages(countryPackages);
          console.log('[LOG] fetch 完成，countryPackages:', countryPackages);
        } catch (e) {
          setSelectedCountryPackages([]);
          console.log('[LOG] fetch 失敗', e);
        }
        const elapsed = Date.now() - start;
        const minLoading = 500;
        if (elapsed < minLoading) {
          setTimeout(() => {
            setLoadingPackageList(false);
            console.log('[LOG] setLoadingPackageList(false) (延遲)');
          }, minLoading - elapsed);
        } else {
          setLoadingPackageList(false);
          console.log('[LOG] setLoadingPackageList(false)');
        }
      })();
    }
  }, [showPackageList, selectedPackage]);

  if (loading) return <div>載入中...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header 
        onMenuClick={() => console.log('Menu clicked')} 
        onLogout={user ? handleLogout : undefined}
      />
      
      <main className="container mx-auto px-4 pt-20 pb-24">
        <div className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/faq" element={<FAQ onBack={() => window.history.back()} />} />
            <Route path="/privacypolicy" element={<PrivacyPolicy onBack={() => window.history.back()} />} />
            <Route path="/profile" element={<Profile onAddCard={() => setShowSaveCard(true)} onShowTerms={() => {}} onShowPrivacy={() => {}} onShowFAQ={() => {}} />} />
            <Route path="/terms" element={<TermsAndConditions onBack={() => window.history.back()} />} />
            <Route path="*" element={activeTab === 'esims' ? renderMyEsims() : renderContent()} />
          </Routes>
        </div>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {selectedPackage && showPackageList && (
        <PackageList
          language={language}
          onSelectPackage={handlePackageConfirm}
          selectedCountry={selectedPackage}
          onClose={() => {
            setShowPackageList(false);
            setSelectedPackage(null);
            setSelectedCountryPackages([]);
          }}
          packages={selectedCountryPackages}
          loading={loadingPackageList}
        />
      )}

      {selectedPackage && showPackageConfirmation && (
        <PackageConfirmation
          package={selectedPackage}
          onConfirm={handleConfirmationProceed}
          onCancel={handleConfirmationBack}
        />
      )}

      {selectedPackage && showPayment && (
        <PaymentPage
          package={{
            ...selectedPackage,
            price: discountedPrice || selectedPackage.price
          }}
          onClose={handlePaymentBack}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}

      {selectedPackage && showViewDetails && (
        <ViewDetails
          package={selectedPackage}
          onBack={() => {
            setShowViewDetails(false);
            setSelectedPackage(null);
            setIsTopUpFlow(false);
          }}
          onPurchaseConfirm={handleTopUpConfirm}
          onTabChange={setActiveTab}
          onShowInstallInstructions={handleShowInstallInstructions}
        />
      )}

        <SaveCardPage
        show={showSaveCard}
          onClose={() => setShowSaveCard(false)}
          onSave={() => setShowSaveCard(false)}
        />

      {showInstallInstructions && (
        <InstallInstructions
          onBack={() => setShowInstallInstructions(false)}
          iccid={installIccid}
        />
      )}

      {showTopUpPackages && (
        <TopUpPackages
          onSelect={handleTopUpSelect}
          onClose={() => setShowTopUpPackages(false)}
        />
      )}

      {showTerms && (
        <TermsAndConditions onBack={() => setShowTerms(false)} />
      )}

      {showFAQ && (
        <FAQ onBack={() => setShowFAQ(false)} />
      )}

      {showPrivacyPolicy && (
        <PrivacyPolicy onBack={() => setShowPrivacyPolicy(false)} />
      )}
    </div>
  );
}

export default App;