import React from 'react';
import { ArrowLeft, Bell } from 'lucide-react';
import type { ESIMPackage } from '../types';
import { useStore } from '../store';
import { translations } from '../i18n';

interface ViewDetailsProps {
  package: ESIMPackage & {
    status?: 'active' | 'inactive' | 'not_activated';
    activationDate?: string;
    expiryDate?: string;
    usedData?: string;
    totalData?: string;
  };
  onBack: () => void;
}

export function ViewDetails({ package: pkg, onBack }: ViewDetailsProps) {
  const { language } = useStore();
  const t = translations[language];
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);

  const renderUsageGraph = () => {
    const used = parseFloat(pkg.usedData || '0');
    const total = parseFloat(pkg.totalData || '0');
    const percentage = (used / total) * 100;

    return (
      <div className="bg-white rounded-lg p-6 mb-4">
        <h2 className="text-lg font-semibold mb-4">USAGE</h2>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-medium">DATA</span>
            </div>
          </div>
          <div className="relative">
            <div className="w-48 h-24 mx-auto relative">
              <div className="absolute inset-0">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                  <path
                    d="M 0 50 A 50 50 0 1 1 100 50"
                    fill="none"
                    stroke="#f1f1f1"
                    strokeWidth="12"
                  />
                  <path
                    d="M 0 50 A 50 50 0 1 1 100 50"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="12"
                    strokeDasharray={`${157 * (1 - percentage/100)} ${157}`}
                  />
                </svg>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{pkg.totalData}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 text-center text-sm text-gray-500">
                REMAINING DATA
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">USED DATA</span>
              <span className="font-medium">{pkg.usedData || '0 MB'}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">TOTAL DATA</span>
              <span className="font-medium">{pkg.totalData}</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={20} />
              <span className="font-medium">LOW DATA NOTIFICATION</span>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className="px-4 py-1 border rounded-full text-sm"
            >
              {notificationsEnabled ? 'ENABLED' : 'ALLOW'}
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            Your push notification permission is currently disabled. Allow notifications to be notified when the remaining data is low, or your package is about to expire.
          </p>
        </div>
      </div>
    );
  };

  const renderPackageDetails = () => (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">MY PACKAGES</h2>
      <div className="relative">
        {pkg.status === 'not_activated' && (
          <div className="absolute top-0 left-0 bg-orange-400 text-white px-3 py-1 rounded-md text-sm">
            Not Activated
          </div>
        )}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="font-medium">VALIDITY</span>
            </div>
            <span>{pkg.validity}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-medium">DATA</span>
            </div>
            <span>{pkg.dataAmount}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
      <div className="bg-line-gradient text-white sticky top-0">
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

      <div className="container mx-auto px-4 py-6 space-y-4">
        {renderUsageGraph()}
        {renderPackageDetails()}
      </div>
    </div>
  );
}