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

// eSIM usage 快取型別
type EsimUsage = {
  status: string;
  remaining: number;
  expired_at?: string;
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

  const handlePurchaseComplete = (iccid?: string) => {
    console.log('[LOG] handlePurchaseComplete', selectedPackage, user);
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
        }
      } else {
        // 原有的新購買邏輯
        const newEsim = {
          ...selectedPackage,
          price: discountedPrice || selectedPackage.price,
          status: 'active' as const,
          activationDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + parseInt(selectedPackage.validity) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          usedData: '0 MB',
          totalData: selectedPackage.dataAmount,
          addOnPackages: [],
          topUpCount: 0, // 初始化加購次數為 0
          iccid: iccid
        };
        setPurchasedEsims([newEsim, ...purchasedEsims]);
        setSelectedPackage(null);
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
    // 直接平鋪所有已購買的 eSIM，不分國家卡片
    if (!mergedEsims || mergedEsims.length === 0) {
      return <div className="text-center text-gray-400 py-8">尚未購買 eSIM</div>;
    }
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mergedEsims.map(esim => (
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
                  className="bg-white rounded-2xl p-6 shadow-card hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                  onClick={() => {
                    console.log('[LOG] 點擊卡片', pkg);
                    setSelectedPackage(pkg);
                    setLoadingPackageList(true);
                    setSelectedCountryPackages([]);
                    setTimeout(() => {
                      console.log('[LOG] setShowPackageList(true)');
                      setShowPackageList(true);
                    }, 0);
                  }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative w-10 h-8 bg-white rounded-xl overflow-hidden shadow-sm p-0.5">
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
                    <h3 className="text-xl font-bold">{pkg.country}</h3>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-600">數據區間：</span>
                    <span className="font-medium">{pkg.dataRange ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-600">有效期間：</span>
                    <span className="font-medium">{pkg.validityRange ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-600">電信商：</span>
                    <span className="font-medium">{Array.isArray(pkg.operators) && pkg.operators.length > 0 ? pkg.operators.join('、') : '—'}</span>
                  </div>
                  {/* 社群/導航/影音區塊 */}
                  <div className="flex flex-col gap-1 ml-2">
                    <div className="flex items-center gap-1">
                      <img src="https://www.svgrepo.com/show/452229/instagram-1.svg" alt="Instagram" className="w-4 h-4" />
                      <span className="text-xs text-gray-600">可上傳圖片貼文：350~1050</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <img src="https://www.svgrepo.com/show/452196/facebook-1.svg" alt="Facebook" className="w-4 h-4" />
                      <span className="text-xs text-gray-600">可上傳圖片貼文：250~750</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/threads.svg" alt="Threads" className="w-4 h-4" />
                      <span className="text-xs text-gray-600">可上傳圖片貼文：330~990</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <img src="https://icons.iconarchive.com/icons/dtafalonso/android-lollipop/512/Maps-icon.png" alt="Google Maps" className="w-4 h-4" />
                      <span className="text-xs text-gray-600">可使用導航時間：200~600小時</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/4/42/YouTube_icon_%282013-2017%29.png" alt="YouTube" className="w-4 h-4" />
                      <span className="text-xs text-gray-600">可觀看時間：3~9小時 (360p標準畫質)</span>
                    </div>
                  </div>
                  <button className="mt-4 w-full bg-[#4CD964] text-white py-2 rounded-lg font-bold hover:bg-[#43c05c] transition">
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
          {activeTab === 'esims' ? renderMyEsims() : renderContent()}
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