import React, { useState } from 'react';
import { X, CreditCard } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import type { SavedCard } from '../types';

interface SaveCardPageProps {
  onClose: () => void;
  onSave: () => void;
}

export function SaveCardPage({ onClose, onSave }: SaveCardPageProps) {
  const { language, updateUserCards } = useStore();
  const t = translations[language];
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCard: SavedCard = {
      id: Date.now().toString(),
      last4: cardNumber.slice(-4),
      brand: cardNumber.startsWith('4') ? 'Visa' : 'Mastercard',
      expiryMonth,
      expiryYear,
    };

    updateUserCards([newCard]);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold bg-line-gradient bg-clip-text text-transparent">
              {t.addNewCard}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={t.close}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.cardNumber}
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                  maxLength={16}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-line focus:border-transparent"
                  placeholder="1234 5678 9012 3456"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.expiryDate}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={expiryMonth}
                    onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, ''))}
                    maxLength={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-line focus:border-transparent"
                    placeholder="MM"
                    required
                  />
                  <input
                    type="text"
                    value={expiryYear}
                    onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, ''))}
                    maxLength={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-line focus:border-transparent"
                    placeholder="YY"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.cvv}
                </label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                  maxLength={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-line focus:border-transparent"
                  placeholder="123"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.cardholderName}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-line focus:border-transparent"
                placeholder="John Doe"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-line-gradient hover:bg-line-gradient-hover text-white py-3 rounded-full transition-colors font-medium mt-6"
            >
              {t.saveCard}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}