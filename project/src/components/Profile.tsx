import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, Trash2, Info, Barcode } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import type { SavedCard } from '../types';
import { DeletingOverlay, LoadingOverlay } from './LoadingOverlay';
import { useNavigate } from 'react-router-dom';

console.log('App render');

export function Profile({ onAddCard, loading }) {
  const { language, user, savedCards, updateUserCards, fetchUserCards, setUser } = useStore();
  const [localCards, setLocalCards] = useState<SavedCard[]>(user?.savedCards || []);
  const t = translations[language];
  const t_prof = t.profile;
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditCardAlert, setShowEditCardAlert] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [emailInputValid, setEmailInputValid] = useState(false);
  const [emailSaveLoading, setEmailSaveLoading] = useState(false);
  const [emailSaveError, setEmailSaveError] = useState('');
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [carrierInput, setCarrierInput] = useState(user?.carrier || '');
  const [carrierInputValid, setCarrierInputValid] = useState(false);
  const [carrierSaveLoading, setCarrierSaveLoading] = useState(false);
  const [carrierSaveError, setCarrierSaveError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // 當 user 或 savedCards 變動時，強制同步 localCards
    setLocalCards(user?.savedCards || savedCards || []);
  }, [user, savedCards]);

  // 監聽 user.email，自動帶入 emailInput
  useEffect(() => {
    setEmailInput(user?.email || '');
    setEmailInputValid(!!user?.email && /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i.test(user?.email || ''));
  }, [user?.email]);

  // 監聽 user.carrier，自動帶入 carrierInput
  useEffect(() => {
    setCarrierInput(user?.carrier || '');
    setCarrierInputValid(!!user?.carrier && /^\/[A-Z0-9!@#$%^&*()_+\-=\[\]{};':",.<>/?]{7}$/.test(user?.carrier || ''));
  }, [user?.carrier]);

  const handleDeleteCard = async () => {
    try {
      setIsDeleting(true);
      console.log('呼叫 remove-card 傳送的 line_user_id:', user.userId);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/remove-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          line_user_id: user.userId
        })
      });

      let data = null;
      try {
        data = await response.json();
      } catch (e) {}
      console.log('remove-card response:', response.status, data);

      if (!response.ok) {
        if (response.status === 404 || (data && data.success)) {
          const store = useStore.getState();
          if (typeof store.fetchUserCards === 'function') {
            await store.fetchUserCards();
            console.log('fetchUserCards 已呼叫完畢');
          }
          setIsDeleting(false);
          return;
        }
        setIsDeleting(false);
        throw new Error(t_prof.errorUnbindFailed);
      } else {
        const store = useStore.getState();
        if (typeof store.fetchUserCards === 'function') {
          await store.fetchUserCards();
          console.log('fetchUserCards 已呼叫完畢');
        }
        setIsDeleting(false);
      }
    } catch (error) {
      setIsDeleting(false);
      console.error('刪除信用卡時發生錯誤:', error);
      alert(error instanceof Error ? error.message : t_prof.errorDeleteFailed);
    }
  };

  // 編輯信用卡按鈕點擊事件
  const handleEditCardClick = () => {
    if (localCards && localCards.length > 0) {
      setShowEditCardAlert(true);
      return;
    }
    if (typeof onAddCard === 'function') {
      onAddCard();
    }
  };

  // Email 儲存 function
  const handleSaveEmail = async () => {
    if (!user?.userId || !emailInputValid) return;
    setEmailSaveLoading(true);
    setEmailSaveError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/save-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_user_id: user.userId, email: emailInput })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setEmailSaveError(data.error || t_prof.errorSaveFailed);
        setEmailSaveLoading(false);
        return;
      }
      setUser({ ...user, email: emailInput });
      setShowEmailModal(false);
    } catch (e) {
      setEmailSaveError(t_prof.errorSaveFailed);
    }
    setEmailSaveLoading(false);
  };

  // 載具號碼儲存 function
  const handleSaveCarrier = async () => {
    if (!user?.userId || !carrierInputValid) return;
    setCarrierSaveLoading(true);
    setCarrierSaveError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/save-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_user_id: user.userId, carrier: carrierInput })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setCarrierSaveError(data.error || t_prof.errorSaveFailed);
        setCarrierSaveLoading(false);
        return;
      }
      setUser({ ...user, carrier: carrierInput });
      setShowCarrierModal(false);
    } catch (e) {
      setCarrierSaveError(t_prof.errorSaveFailed);
    }
    setCarrierSaveLoading(false);
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm mx-4 w-full">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-line/30 border-t-line rounded-full animate-spin" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-line/10 rounded-full animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold bg-line-gradient bg-clip-text text-transparent animate-pulse">
                {t_prof.loading}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {user && (
            <>
              {/* 第一張卡片：大頭照、ID、信用卡、Email */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={user.pictureUrl}
                    alt={user.displayName}
                    className="w-20 h-20 rounded-full"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">{user.displayName}</h3>
                    <p className="text-gray-600">{t_prof.idPrefix} {user.userId}</p>
                  </div>
                </div>
                <div className="mb-6">
                  {/* 信用卡顯示區塊 */}
                  {localCards && localCards.length > 0 && localCards[0].last_four ? (
                    (() => {
                      const latestCard = localCards[localCards.length - 1];
                      return (
                        <div key={latestCard.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-2">
                          <div className="flex items-center gap-3">
                            <CreditCard className="text-line" size={20} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{latestCard.brand}</span>
                                <span>•••• {latestCard.last4}</span>
                              </div>
                              <div className="text-xs text-gray-500">{t_prof.expiryLabel} {latestCard.expiryMonth}/{latestCard.expiryYear}</div>
                            </div>
                          </div>
                          <button
                            className="text-red-500 hover:text-red-700"
                            onClick={handleDeleteCard}
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    <button
                      onClick={onAddCard}
                      className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400 justify-center"
                    >
                      <CreditCard size={20} />
                      {t_prof.addCard}
                    </button>
                  )}
                </div>
                {/* Email 輸入框 */}
                <div className="mb-6">
                  {emailInputValid && emailInput ? (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-2">
                      <div className="flex items-center gap-3">
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='h-5 w-5 text-line'><rect x='2' y='4' width='20' height='16' rx='3'/><polyline points='22,6 12,13 2,6'/></svg>
                        <span
                          className="font-medium truncate max-w-[180px]"
                          title={user?.email || emailInput}
                          style={{ display: 'inline-block', verticalAlign: 'middle' }}
                        >
                          {user?.email || emailInput}
                        </span>
                      </div>
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={async () => {
                          setEmailInput('');
                          setEmailInputValid(false);
                          setUser({ ...user, email: '' });
                          // 呼叫 save-email API，將 email 設為空字串
                          if (user?.userId) {
                            await fetch(`${import.meta.env.VITE_API_URL}/save-email`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ line_user_id: user.userId, email: '' })
                            });
                          }
                        }}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400 justify-center"
                      onClick={() => setShowEmailModal(true)}
                    >
                      {/* 信封icon，大小與信用卡icon一致 */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect x="2" y="4" width="20" height="16" rx="3"/><polyline points="22,6 12,13 2,6"/></svg>
                      <span className="text-gray-400">{t_prof.addEmail}</span>
                    </button>
                  )}
                </div>
                {/* 載具號碼顯示區塊 */}
                <div className="mb-0">
                  {carrierInputValid && carrierInput ? (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-2">
                      <div className="flex items-center gap-3">
                        <Barcode className="text-line" size={20} />
                        <span
                          className="font-medium truncate max-w-[180px]"
                          title={user?.carrier || carrierInput}
                          style={{ display: 'inline-block', verticalAlign: 'middle' }}
                        >
                          {user?.carrier || carrierInput}
                        </span>
                      </div>
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={async () => {
                          setCarrierInput('');
                          setCarrierInputValid(false);
                          setUser({ ...user, carrier: '' });
                          // 呼叫 save-email API，將 carrier 設為空字串
                          if (user?.userId) {
                            await fetch(`${import.meta.env.VITE_API_URL}/save-email`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ line_user_id: user.userId, carrier: '' })
                            });
                          }
                        }}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400 justify-center"
                      onClick={() => setShowCarrierModal(true)}
                    >
                      <Barcode size={20} />
                      <span className="text-gray-400">{t_prof.addCarrier}</span>
                    </button>
                  )}
                </div>
              </div>
              {/* 第二張卡片：條款、隱私權、客服中心、常見問題 */}
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4 mt-6">
                <button 
                  onClick={() => navigate('/terms')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span>{t.termsAndConditions}</span>
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                <button 
                  onClick={() => navigate('/privacypolicy')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span>{t.privacyPolicy}</span>
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                <button 
                  onClick={() => window.open('https://line.me/R/ti/p/@canet', '_blank')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span>{t.customerService}</span>
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                <button 
                  onClick={() => navigate('/faq')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span>{t.faq}</span>
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            </>
          )}
          {/* 編輯信用卡提示彈窗 */}
          {showEditCardAlert && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
              <div className="bg-white rounded-xl p-8 shadow-lg max-w-xs w-full flex flex-col items-center">
                <div className="text-base mb-4 text-gray-500 font-normal">{t_prof.deleteCardAlert}</div>
                <button
                  onClick={() => setShowEditCardAlert(false)}
                  className="mt-2 px-6 py-2 bg-line-gradient hover:bg-line-gradient-hover text-white rounded-full font-medium"
                >
                  {t_prof.confirm}
                </button>
              </div>
            </div>
          )}
          {/* 新增Email彈窗 */}
          {showEmailModal && createPortal(
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
              <div className="bg-white rounded-xl p-8 shadow-lg max-w-xs w-full flex flex-col items-center">
                <div className="text-base mb-4 text-gray-700 font-medium">{t_prof.enterEmailTitle}</div>
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => {
                    setEmailInput(e.target.value);
                    const re = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i;
                    setEmailInputValid(re.test(e.target.value));
                  }}
                  placeholder={t_prof.emailPlaceholder}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CD964] focus:border-transparent mb-2${emailInput && !emailInputValid ? ' border-red-400' : ''}`}
                />
                <span className="text-xs text-gray-400 mt-1 flex items-center mb-4">
                  <Info size={14} className="mr-1" />
                  {t_prof.emailInfo}
                </span>
                {emailSaveError && <div className="text-red-500 text-sm mb-2">{emailSaveError}</div>}
                <div className="flex w-full gap-3 mt-2">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="flex-1 px-6 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors font-medium"
                    disabled={emailSaveLoading}
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleSaveEmail}
                    className={`flex-1 px-6 py-2 bg-line-gradient hover:bg-line-gradient-hover text-white rounded-full font-medium transition-colors${!emailInputValid || emailSaveLoading ? ' opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!emailInputValid || emailSaveLoading}
                  >
                    {emailSaveLoading ? t_prof.saving : t.confirmation.save}
                  </button>
                </div>
              </div>
            </div>,
            document.getElementById('modal-root')
          )}
          {/* 新增載具號碼彈窗 */}
          {showCarrierModal && createPortal(
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
              <div className="bg-white rounded-xl p-8 shadow-lg max-w-xs w-full flex flex-col items-center">
                <div className="text-base mb-4 text-gray-700 font-medium">{t_prof.enterCarrierTitle}</div>
                <input
                  type="text"
                  value={carrierInput}
                  onChange={e => {
                    setCarrierInput(e.target.value);
                    const re = /^\/[A-Z0-9!@#$%^&*()_+\-=\[\]{};':",.<>/?]{7}$/;
                    setCarrierInputValid(re.test(e.target.value));
                  }}
                  placeholder={t_prof.carrierPlaceholder}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CD964] focus:border-transparent mb-2${carrierInput && !carrierInputValid ? ' border-red-400' : ''}`}
                />
                <span className="text-xs text-gray-400 mt-1 flex items-center mb-4">
                  <Info size={14} className="mr-1" />
                  {t_prof.carrierInfo}
                </span>
                {carrierSaveError && <div className="text-red-500 text-sm mb-2">{carrierSaveError}</div>}
                <div className="flex w-full gap-3 mt-2">
                  <button
                    onClick={() => setShowCarrierModal(false)}
                    className="flex-1 px-6 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors font-medium"
                    disabled={carrierSaveLoading}
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleSaveCarrier}
                    className={`flex-1 px-6 py-2 bg-line-gradient hover:bg-line-gradient-hover text-white rounded-full font-medium transition-colors${!carrierInputValid || carrierSaveLoading ? ' opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!carrierInputValid || carrierSaveLoading}
                  >
                    {carrierSaveLoading ? t_prof.saving : t.confirmation.save}
                  </button>
                </div>
              </div>
            </div>,
            document.getElementById('modal-root')
          )}
          {isDeleting && createPortal(<DeletingOverlay />, document.getElementById('modal-root'))}
        </>
      )}
    </div>
  );
} 