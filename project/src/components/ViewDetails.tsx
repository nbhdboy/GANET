import React, { useRef, useState } from 'react';
import { ArrowLeft, Signal, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ESIMPackage } from '../types';
import { useStore } from '../store';
import { translations } from '../i18n';
import { BottomNav } from './BottomNav';

interface ViewDetailsProps {
  package: ESIMPackage & {
    status?: 'active' | 'inactive' | 'not_activated';
    activationDate?: string;
    expiryDate?: string;
    usedData?: string;
    totalData?: string;
    addOnPackages?: Array<{
      dataAmount: string;
      validity: string;
    }>;
    purchaseCount?: number;
  };
  onBack: () => void;
  onPurchaseConfirm?: (pkg: ESIMPackage) => void;
  onTabChange?: (tab: 'store' | 'esims' | 'profile') => void;
}

export function ViewDetails({ 
  package: pkg, 
  onBack, 
  onPurchaseConfirm,
  onTabChange 
}: ViewDetailsProps) {
  const { language } = useStore();
  const t = translations[language];
  const [currentTopUpIndex, setCurrentTopUpIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const topUpPackages = [
    { data: '1GB', validity: '7', price: '5.00' },
    { data: '3GB', validity: '30', price: '10.00' },
    { data: '10GB', validity: '30', price: '21.00' },
    { data: '20GB', validity: '30', price: '32.00' },
    { data: '30GB', validity: '30', price: '45.00' }
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.targetTouches[0].clientX;
    const newOffset = currentX - touchStart;
    // 允許在第一個項目時向右滑動，最後一個項目時向左滑動
    setDragOffset(newOffset);
    setTouchEnd(currentX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const minSwipeDistance = 50;
    const swipeDistance = touchStart - touchEnd;
    
    if (Math.abs(swipeDistance) >= minSwipeDistance) {
      if (swipeDistance > 0) {
        // 向左滑動
        handleNextPackage();
      } else {
        // 向右滑動
        handlePrevPackage();
      }
    }
    setDragOffset(0);
  };

  const handlePrevPackage = () => {
    setCurrentTopUpIndex((prev) => 
      prev === 0 ? topUpPackages.length - 1 : prev - 1
    );
  };

  const handleNextPackage = () => {
    setCurrentTopUpIndex((prev) => 
      prev === topUpPackages.length - 1 ? 0 : prev + 1
    );
  };

  const handleTopUp = (e: React.MouseEvent, selectedPackage: typeof topUpPackages[0]) => {
    e.stopPropagation();
    if (onPurchaseConfirm) {
      const topUpPackage = {
        ...pkg,
        dataAmount: selectedPackage.data,
        validity: `${selectedPackage.validity} days`,
        price: parseFloat(selectedPackage.price),
        // 更新加購專案列表
        addOnPackages: [
          ...(pkg.addOnPackages || []),
          {
            dataAmount: selectedPackage.data,
            validity: `${selectedPackage.validity}天`
          }
        ],
        // 更新加購次數
        purchaseCount: (pkg.purchaseCount || 0) + 1
      };
      onPurchaseConfirm(topUpPackage);
    }
  };

  const handleTabChange = (tab: 'store' | 'esims' | 'profile') => {
    if (onTabChange) {
      onTabChange(tab);
    }
    onBack(); // 切換頁面時同時關閉詳情頁
  };

  const renderUsageGraph = () => {
    const used = parseFloat(pkg.usedData || '0');
    const total = parseFloat(pkg.totalData || '0');
    const percentage = (used / total) * 100;

    const radius = 150;
    const centerX = 120;
    const centerY = 150;
    const strokeWidth = 20;

    // 計算圓弧路徑
    const createArc = (percentage: number) => {
      const r = radius - strokeWidth / 2;
      const startAngle = -180;
      const endAngle = -180 + (180 * percentage) / 100;
      
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + r * Math.cos(startRad);
      const y1 = centerY + r * Math.sin(startRad);
      const x2 = centerX + r * Math.cos(endRad);
      const y2 = centerY + r * Math.sin(endRad);
      
      const largeArcFlag = percentage > 50 ? 1 : 0;
      
      return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
    };

    return (
      <div className="bg-white rounded-lg p-3">
        <h2 className="text-lg font-semibold mb-1">{t.usage}</h2>
        <div>
          <div className="flex items-center justify-between mb-0">
            <div className="flex items-center gap-2">
              <Signal className="w-4 h-4" />
              <span className="font-medium text-sm">數據用量</span>
            </div>
          </div>
          <div className="relative mt-4">
            <div className="w-full h-36 mx-auto relative">
              <div className="absolute inset-0">
                <svg viewBox="0 0 240 240" className="w-full h-full">
                  <defs>
                    <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#4ADE80' }} />
                      <stop offset="100%" style={{ stopColor: '#86EFAC' }} />
                    </linearGradient>
                  </defs>
                  {/* 背景圓弧 - 使用淺綠色漸層 */}
                  <path
                    d={createArc(100)}
                    fill="none"
                    stroke="url(#greenGradient)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                  />
                  {/* 已使用進度 - 灰色 */}
                  {percentage > 0 && (
                    <path
                      d={createArc(percentage)}
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                    />
                  )}
                  {/* 進度點 */}
                  <circle
                    cx={centerX + (radius - strokeWidth / 2) * Math.cos((-180 + (180 * percentage) / 100) * Math.PI / 180)}
                    cy={centerY + (radius - strokeWidth / 2) * Math.sin((-180 + (180 * percentage) / 100) * Math.PI / 180)}
                    r={strokeWidth / 2}
                    fill={percentage > 0 ? '#E5E7EB' : '#86EFAC'}
                  />
                </svg>
              </div>
              <div className="absolute inset-0 flex items-center justify-center flex-col translate-y-2">
                <span className="text-3xl font-bold text-gray-700">{percentage.toFixed(2)}%</span>
                <div className="text-sm text-gray-500">
                  {t.remainingData}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-0 space-y-1.5 border-t pt-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">已使用數據</span>
              <span className="font-medium">{pkg.usedData || '0 MB'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">尚未使用數據</span>
              <span className="font-medium">
                {(() => {
                  const total = parseFloat(pkg.totalData?.replace('GB', '') || '0');
                  const used = parseFloat(pkg.usedData?.replace('MB', '') || '0') / 1024;
                  return `${(total - used).toFixed(2)} GB`;
                })()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">有效期間</span>
              <span className="font-medium">
                {(() => {
                  if (pkg.activationDate && pkg.expiryDate) {
                    const start = new Date(pkg.activationDate);
                    const end = new Date(pkg.expiryDate);
                    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    return `${days} 天`;
                  }
                  return '尚未啟用';
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPackageDetails = () => (
    <div className="bg-white rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-2">{t.myPackages}</h2>
      <div className="relative">
        {pkg.status === 'not_activated' && (
          <div className="absolute top-0 left-0 bg-orange-400 text-white px-3 py-1 rounded-md text-sm">
            {t.notActivated}
          </div>
        )}
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Signal className="w-5 h-5" />
              <span className="font-medium">基本數據</span>
            </div>
            <span className="text-lg">{pkg.dataAmount}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">已加購專案</span>
            </div>
            <div className="text-right">
              {pkg.addOnPackages && pkg.addOnPackages.length > 0 ? (
                pkg.addOnPackages.map((addOn, index) => (
                  <div key={index} className="bg-green-50 rounded-lg px-4 py-2 mb-2 last:mb-0">
                    <div className="font-medium text-green-600 text-lg">{addOn.dataAmount}</div>
                    <div className="text-sm text-gray-600">有效期 {addOn.validity.replace('天', '')} 天</div>
                  </div>
                ))
              ) : (
                <span className="text-gray-500">尚未加購專案</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTopUpPackages = () => (
    <div className="bg-white rounded-lg p-4 h-full">
      <h3 className="text-lg font-semibold mb-2">加購專案</h3>
      <div className="relative overflow-hidden h-[calc(100%-3rem)]">
        <div 
          className="flex transition-transform duration-300 ease-out h-full"
          style={{
            transform: `translateX(${dragOffset}px)`,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {topUpPackages.map((topUpPkg, index) => (
            <div 
              key={index}
              className={`w-full flex-shrink-0 transition-transform duration-300 ${
                index === currentTopUpIndex ? 'scale-100' : 'scale-95 opacity-80'
              }`}
              style={{
                transform: `translateX(-${currentTopUpIndex * 100}%)`,
              }}
            >
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 mx-2 h-full">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">數據</span>
                    <h4 className="text-2xl font-bold">{topUpPkg.data}</h4>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">有效期限</span>
                    <p className="font-medium">{topUpPkg.validity} 天</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">價格</span>
                    <p className="text-xl font-bold text-green-600">
                      ${topUpPkg.price}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button 
                      onClick={(e) => handleTopUp(e, topUpPkg)}
                      className="w-full py-3 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full text-sm hover:from-green-500 hover:to-green-600 transition-all duration-300"
                    >
                      加購
                    </button>
                    <div className="flex justify-center gap-2 pt-2">
                      {topUpPackages.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            idx === currentTopUpIndex ? 'w-2 bg-green-500' : 'w-2 bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto pb-[60px]">
      <div className="bg-line-gradient text-white sticky top-0 z-20">
        <div className="container mx-auto px-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 py-4"
          >
            <ArrowLeft size={20} />
            {t.back}
          </button>
          <h1 className="text-2xl font-bold pb-6">{pkg.name}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            {renderUsageGraph()}
            {renderPackageDetails()}
          </div>
          <div>
            {renderTopUpPackages()}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white z-50">
        <BottomNav activeTab="esims" onTabChange={handleTabChange} />
      </div>
    </div>
  );
}