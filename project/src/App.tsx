import React, { useState } from 'react';
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

  // Mock login/logout functions
  const handleLogin = () => {
    const mockUser: UserProfile = {
      userId: 'mock-user-id',
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
    if (!user) {
      handleLogin();
      return;
    }
    setSelectedPackage(pkg);
    setShowPackageList(true);
  };

  const handlePackageConfirm = (pkg: PackageData | null) => {
    if (pkg === null) {
      setShowPackageList(false);
      setSelectedPackage(null);
      return;
    }

    if (selectedPackage) {
      const updatedPackage: ESIMPackage = {
        ...selectedPackage,
        dataAmount: pkg.data === 'unlimited' ? 'Unlimited' : pkg.data,
        validity: `${pkg.validity} days`,
        price: parseFloat(pkg.price),
      };
      setSelectedPackage(updatedPackage);
      setShowPackageList(false);
      setShowPackageConfirmation(true);
    }
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

  const handleConfirmationProceed = (finalPrice: number) => {
    setDiscountedPrice(finalPrice);
    setShowPackageConfirmation(false);
    setShowPayment(true);
  };

  const handlePaymentBack = () => {
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

  const handlePurchaseComplete = () => {
    if (selectedPackage) {
      if (isTopUpFlow) {
        // 找到原始的 eSIM
        const originalEsimIndex = purchasedEsims.findIndex(esim => esim.id === selectedPackage.id);
        if (originalEsimIndex !== -1) {
          const originalEsim = purchasedEsims[originalEsimIndex];
          
          // 更新加購專案列表
          const newAddOnPackage = {
            dataAmount: selectedPackage.dataAmount,
            validity: selectedPackage.validity
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
              const originalValidity = parseInt(originalEsim.validity.replace(' days', ''));
              const topUpValidity = parseInt(selectedPackage.validity.replace(' days', ''));
              return `${originalValidity + topUpValidity} days`;
            })(),
            // 更新總價格
            price: originalEsim.price + (discountedPrice || selectedPackage.price),
            // 更新到期日
            expiryDate: (() => {
              const originalValidity = parseInt(originalEsim.validity.replace(' days', ''));
              const topUpValidity = parseInt(selectedPackage.validity.replace(' days', ''));
              return new Date(Date.now() + (originalValidity + topUpValidity) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            })(),
            // 更新加購次數
            topUpCount: (originalEsim.topUpCount || 0) + 1
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
          topUpCount: 0 // 初始化加購次數為 0
        };
        setPurchasedEsims([...purchasedEsims, newEsim]);
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

  const renderMyEsims = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-line-gradient bg-clip-text text-transparent">
          {t.myEsims}
        </h2>
        <button
          onClick={() => setShowInstallInstructions(true)}
          className="bg-button-gradient hover:bg-button-gradient-hover text-white px-6 py-3 rounded-full transition-all duration-300 shadow-button hover:shadow-lg"
        >
          {t.installInstructions}
        </button>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setEsimTab('current')}
          className={`flex-1 py-3 text-center rounded-full font-medium transition-all duration-300 ${
            esimTab === 'current'
              ? 'bg-button-gradient text-white shadow-button'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.currentEsims}
        </button>
        <button
          onClick={() => setEsimTab('archived')}
          className={`flex-1 py-3 text-center rounded-full font-medium transition-all duration-300 ${
            esimTab === 'archived'
              ? 'bg-button-gradient text-white shadow-button'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.archivedEsims}
        </button>
      </div>

      {user ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchasedEsims.length > 0 ? (
            purchasedEsims.map((esim) => (
              <PackageCard 
                key={esim.id}
                package={esim}
                onSelect={handleViewDetails}
                isPurchased
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-card-gradient rounded-2xl shadow-card">
              <p className="text-gray-600 text-lg">{t.noEsimsPurchased}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-card-gradient rounded-2xl shadow-card">
          <p className="text-gray-600 text-lg mb-6">{t.loginToViewEsims}</p>
          <button
            onClick={handleLogin}
            className="bg-button-gradient hover:bg-button-gradient-hover text-white px-8 py-3 rounded-full transition-all duration-300 shadow-button hover:shadow-lg"
          >
            {t.login}
          </button>
        </div>
      )}
    </div>
  );

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
            {user ? renderProfile() : (
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
              {PACKAGES.map(pkg => (
                <PackageCard 
                  key={pkg.id}
                  package={pkg}
                  onSelect={handlePackageSelect}
                />
              ))}
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header 
        onMenuClick={() => console.log('Menu clicked')} 
        onLogout={user ? handleLogout : undefined}
      />
      
      <main className="container mx-auto px-4 pt-20 pb-24">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'esims' ? (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold bg-line-gradient bg-clip-text text-transparent">
                  {t.myEsims}
                </h2>
                <button
                  onClick={() => setShowInstallInstructions(true)}
                  className="bg-button-gradient hover:bg-button-gradient-hover text-white px-6 py-3 rounded-full transition-all duration-300 shadow-button hover:shadow-lg"
                >
                  {t.installInstructions}
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setEsimTab('current')}
                  className={`flex-1 py-3 text-center rounded-full font-medium transition-all duration-300 ${
                    esimTab === 'current'
                      ? 'bg-button-gradient text-white shadow-button'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t.currentEsims}
                </button>
                <button
                  onClick={() => setEsimTab('archived')}
                  className={`flex-1 py-3 text-center rounded-full font-medium transition-all duration-300 ${
                    esimTab === 'archived'
                      ? 'bg-button-gradient text-white shadow-button'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t.archivedEsims}
                </button>
              </div>

              {user ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {purchasedEsims.length > 0 ? (
                    purchasedEsims.map((esim) => (
                      <PackageCard 
                        key={esim.id}
                        package={esim}
                        onSelect={handleViewDetails}
                        isPurchased
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 bg-card-gradient rounded-2xl shadow-card">
                      <p className="text-gray-600 text-lg">{t.noEsimsPurchased}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-card-gradient rounded-2xl shadow-card">
                  <p className="text-gray-600 text-lg mb-6">{t.loginToViewEsims}</p>
                  <button
                    onClick={handleLogin}
                    className="bg-button-gradient hover:bg-button-gradient-hover text-white px-8 py-3 rounded-full transition-all duration-300 shadow-button hover:shadow-lg"
                  >
                    {t.login}
                  </button>
                </div>
              )}
            </div>
          ) : renderContent()}
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
          }}
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
        />
      )}

      {showSaveCard && (
        <SaveCardPage
          onClose={() => setShowSaveCard(false)}
          onSave={() => setShowSaveCard(false)}
        />
      )}

      {showInstallInstructions && (
        <InstallInstructions
          onBack={() => setShowInstallInstructions(false)}
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