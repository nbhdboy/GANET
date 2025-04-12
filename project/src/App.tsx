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
import type { ESIMPackage, UserProfile } from './types';

function App() {
  const { language, setUser, user } = useStore();
  const [activeTab, setActiveTab] = useState<'store' | 'esims' | 'profile'>('store');
  const [selectedPackage, setSelectedPackage] = useState<ESIMPackage | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showSaveCard, setShowSaveCard] = useState(false);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  const [showTopUpPackages, setShowTopUpPackages] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [esimTab, setEsimTab] = useState<'current' | 'archived'>('current');
  const t = translations[language];

  // Mock login/logout functions
  const handleLogin = () => {
    const mockUser: UserProfile = {
      userId: 'mock-user-id',
      displayName: 'Demo User',
      pictureUrl: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop',
      language: language,
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
  };

  const handleConfirmPurchase = () => {
    setShowPayment(true);
  };

  const handlePurchaseComplete = () => {
    setShowPayment(false);
    setSelectedPackage(null);
    setActiveTab('esims');
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
            <h4 className="text-lg font-semibold mb-4">付款設定</h4>
            {user.savedCards?.map(card => (
              <div key={card.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-2">
                <div className="flex items-center gap-3">
                  <div className="text-line">{card.brand === 'Visa' ? 'Visa' : 'Mastercard'}</div>
                  <div>•••• {card.last4}</div>
                </div>
                <div className="text-sm text-gray-500">
                  {card.expiryMonth}/{card.expiryYear}
                </div>
              </div>
            ))}
            <button
              onClick={() => setShowSaveCard(true)}
              className="mt-4 w-full bg-line-gradient hover:bg-line-gradient-hover text-white py-2 rounded-full transition-colors font-medium"
            >
              新增信用卡
            </button>
          </div>

          {/* Other Sections */}
          <div className="space-y-4">
            <button 
              onClick={() => setShowTerms(true)}
              className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              一般條款與條件
            </button>
            <button 
              onClick={() => setShowPrivacyPolicy(true)}
              className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              隱私權政策
            </button>
            <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              客服中心
            </button>
            <button 
              onClick={() => setShowFAQ(true)}
              className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              常見問題
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-line-gradient bg-clip-text text-transparent">
          {t.myEsims}
        </h2>
        <button
          onClick={() => setShowInstallInstructions(true)}
          className="bg-line-gradient hover:bg-line-gradient-hover text-white px-4 py-2 rounded-full transition-colors font-medium"
        >
          {t.installInstructions}
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setEsimTab('current')}
          className={`flex-1 py-2 text-center rounded-full font-medium transition-colors ${
            esimTab === 'current'
              ? 'bg-line-gradient text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.currentEsims}
        </button>
        <button
          onClick={() => setEsimTab('archived')}
          className={`flex-1 py-2 text-center rounded-full font-medium transition-colors ${
            esimTab === 'archived'
              ? 'bg-line-gradient text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.archivedEsims}
        </button>
      </div>

      {user ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {esimTab === 'current' ? (
            <PackageCard 
              package={{
                ...PACKAGES[0],
                status: 'active',
                activationDate: '2024-03-15',
                expiryDate: '2024-03-22',
                usedData: '0 MB',
                totalData: '1 GB'
              }}
              onSelect={handleViewDetails}
              isPurchased
            />
          ) : (
            <PackageCard 
              package={{
                ...PACKAGES[1],
                status: 'inactive',
                activationDate: '2024-02-15',
                expiryDate: '2024-02-22',
                usedData: '950 MB',
                totalData: '1 GB'
              }}
              onSelect={handleViewDetails}
              isPurchased
            />
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">{t.loginToViewEsims}</p>
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
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuClick={() => console.log('Menu clicked')} 
        onLogout={user ? handleLogout : undefined}
      />
      
      <main className="container mx-auto px-4 pt-20 pb-24">
        {activeTab === 'esims' ? renderMyEsims() : renderContent()}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {selectedPackage && !showPayment && !showViewDetails && (
        <PackageConfirmation
          package={selectedPackage}
          onConfirm={handleConfirmPurchase}
          onCancel={() => setSelectedPackage(null)}
        />
      )}

      {selectedPackage && showPayment && (
        <PaymentPage
          package={selectedPackage}
          onClose={() => setShowPayment(false)}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}

      {selectedPackage && showViewDetails && (
        <ViewDetails
          package={selectedPackage}
          onBack={() => {
            setShowViewDetails(false);
            setSelectedPackage(null);
          }}
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