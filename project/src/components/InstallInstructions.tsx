import React, { useEffect, useState } from 'react';
import { ArrowLeft, QrCode, Smartphone, Info, Link as LinkIcon, Globe, Copy } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';

interface InstallInstructionsProps {
  onBack: () => void;
  iccid?: string;
  name?: string;
  flagUrl?: string;
}

interface StepMap {
  [key: string]: string;
}

interface InstallationMethod {
  model?: string | null;
  version?: string | null;
  installation_via_qr_code?: {
    steps: StepMap;
    qr_code_data?: string;
    qr_code_url?: string;
    direct_apple_installation_url?: string;
  };
  installation_manual?: {
    steps: StepMap;
    smdp_address_and_activation_code?: string;
    activation_code?: string;
  };
  network_setup?: {
    steps: StepMap;
    apn_type?: string;
    apn_value?: string;
    is_roaming?: boolean;
  };
}

interface Instructions {
  language: string;
  ios?: InstallationMethod[];
  android?: InstallationMethod[];
}

interface ApiResponse {
  data: {
    instructions: Instructions;
    name?: string;
    iccid?: string;
    flag_url?: string;
  };
}

// 解析 LPA 格式
function parseLpaString(lpa: string) {
  if (!lpa?.startsWith('LPA:1$')) return { smdp: lpa, code: '' };
  const parts = lpa.split('$');
  return {
    smdp: parts[1] || '',
    code: parts[2] || '',
  };
}

// localStorage 快取設定
const CACHE_PREFIX = 'esim_install_instructions_';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 天（毫秒）
function getCacheKey(iccid: string, language: string) {
  return `${CACHE_PREFIX}${iccid}_${language}`;
}
function setCache(iccid: string, language: string, data: any) {
  localStorage.setItem(getCacheKey(iccid, language), JSON.stringify({ data, ts: Date.now() }));
}
function getCache(iccid: string, language: string) {
  const raw = localStorage.getItem(getCacheKey(iccid, language));
  if (!raw) return null;
  try {
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL) {
      return data;
    }
    localStorage.removeItem(getCacheKey(iccid, language));
    return null;
  } catch {
    return null;
  }
}

export function InstallInstructions({ onBack, iccid, name, flagUrl }: InstallInstructionsProps) {
  const { language } = useStore();
  const t = translations[language];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<Instructions | null>(null);
  const [tab, setTab] = useState<'ios' | 'android'>('ios');
  const [subTab, setSubTab] = useState<'direct' | 'qrcode' | 'manual'>('direct');
  const [meta, setMeta] = useState<{ name?: string; iccid?: string; flag_url?: string }>({});
  const [rawApiData, setRawApiData] = useState<any>(null);

  useEffect(() => {
    if (!iccid) return;
    setLoading(true);
    setError(null);
    // 先檢查 localStorage 快取
    const cached = getCache(iccid, language);
    if (cached && cached.instructions) {
      setInstructions(cached.instructions);
      setMeta({
        name: cached.name,
        iccid: cached.iccid,
        flag_url: cached.flag_url,
      });
      setLoading(false);
      return;
    }
    // 沒有快取才發 API
    fetch(`https://lcfsxxncgqrhjtbfmtig.functions.supabase.co/airalo-install-instructions?iccid=${iccid}&language=${language}`)
      .then(res => {
        if (!res.ok) throw new Error('API 請求失敗');
        return res.json();
      })
      .then((json: any) => {
        console.log('[InstallInstructions] API 回傳：', json);
        let data = json.data || json;
        console.log('data:', data, 'typeof data:', typeof data, 'isArray:', Array.isArray(data));
        if (Array.isArray(data)) {
          data = data[0];
          console.log('data[0]:', data);
        }
        if (!data || !data.instructions) {
          console.log('進入 setInstructions(null)');
          setInstructions(null);
          setLoading(false);
          return;
        }
        setCache(iccid, language, data); // 寫入快取
        setInstructions(data.instructions);
        setMeta({
          name: data.name,
          iccid: data.iccid,
          flag_url: data.flag_url,
        });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [iccid, language]);

  // 取得目前 OS 的 instructions（只取 version 為 null 的第一筆）
  const currentInstruction = instructions
    ? (tab === 'ios'
        ? Array.isArray(instructions.ios) ? instructions.ios.filter(item => item.version === '16.0')[0] : null
        : Array.isArray(instructions.android) ? instructions.android.filter(item => !item.version)[0] : null)
    : null;

  // 警告提示
  const warning = (
    <div className="bg-green-100 text-green-900 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
      <span className="font-bold text-xl">⚠️</span>
      <span>警告！大多數的 eSIM 只能安裝一次。若將 eSIM 從裝置中移除，就無法再次安裝。</span>
    </div>
  );

  // 分頁標籤
  const subTabs = tab === 'ios'
    ? [
        { key: 'direct', label: t.direct || '直接' },
        { key: 'qrcode', label: t.qrcode || '行動條碼' },
        { key: 'manual', label: t.manual || '手動' },
      ]
    : [
        { key: 'qrcode', label: t.qrcode || '行動條碼' },
        { key: 'manual', label: t.manual || '手動' },
      ];

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="bg-line-gradient text-white sticky top-0">
        <div className="container mx-auto px-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 py-4"
          >
            <ArrowLeft size={20} />
            {t.back}
          </button>
          <h1 className="text-2xl font-bold pb-2">{t.installInstructions}</h1>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        {/* 卡片資訊 */}
        <div className="flex items-center gap-4 mb-6">
          {meta.flag_url && <img src={meta.flag_url} alt="flag" className="w-8 h-8 rounded" />}
          <div>
            <div className="font-bold text-lg">{meta.name || name || 'eSIM'}</div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Globe size={14} />
              <span>ICCID: {meta.iccid || iccid}</span>
              <button
                className="ml-1 text-gray-400 hover:text-gray-700"
                onClick={() => {
                  navigator.clipboard.writeText(meta.iccid || iccid || '');
                }}
                title="複製 ICCID"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* OS 分頁 */}
        <div className="relative mb-6">
          <div className="flex justify-between border-b border-gray-200">
            {[{ key: 'ios', label: t.ios || 'iOS' }, { key: 'android', label: t.android || 'Android' }].map((tabItem, idx) => (
              <button
                key={tabItem.key}
                className={`flex-1 py-3 text-center font-bold transition-colors duration-200
                  ${tab === tabItem.key ? 'text-green-500' : 'text-gray-400'}`}
                onClick={() => setTab(tabItem.key as 'ios' | 'android')}
                style={{ minWidth: 100 }}
              >
                {tabItem.label}
              </button>
            ))}
          </div>
          {/* indicator */}
          <div
            className="absolute bottom-0 left-0 h-1 rounded bg-gradient-to-r from-green-400 to-green-500 transition-all duration-200"
            style={{
              width: '50%',
              left: tab === 'ios' ? '0%' : '50%'
            }}
          />
        </div>

        {/* 次層分頁 */}
        <div className="flex gap-4 mb-6">
          {subTabs.map((st, idx) => (
            <button
              key={st.key}
              className={`flex-1 py-3 text-center font-bold rounded-xl transition-all duration-200 text-base
                ${subTab === st.key
                  ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow'
                  : 'bg-green-50 text-green-500'}
              `}
              onClick={() => setSubTab(st.key as any)}
              style={{ minWidth: 90 }}
            >
              {st.label}
            </button>
          ))}
        </div>

        {loading && <div className="text-center text-gray-500 py-8">載入中…</div>}
        {error && <div className="text-center text-red-500 py-8">{error}</div>}
        {!loading && !error && currentInstruction && (
          <div className="space-y-8">
            {warning}
            {/* 直接安裝（iOS 專屬） */}
            {subTab === 'direct' && currentInstruction.direct_apple_installation_url && (
              <div className="border rounded-lg shadow-md bg-white p-6">
                <div className="font-bold text-lg mb-2">步驟 1/2 - 直接安裝 eSIM</div>
                <div className="mb-4 flex items-center gap-2">
                  <Smartphone size={18} className="text-line" />
                  <a href={currentInstruction.direct_apple_installation_url} target="_blank" rel="noopener noreferrer" className="text-green-600 underline break-all">Apple 直接安裝連結</a>
                </div>
                {/* 你可以根據需要補充更多步驟說明 */}
                <hr className="my-6" />
              </div>
            )}
            {/* 行動條碼安裝 */}
            {subTab === 'qrcode' && currentInstruction.installation_via_qr_code && (
              <div className="border rounded-lg shadow-md bg-white p-6">
                <div className="font-bold text-lg mb-2">步驟 1/2 - 安裝 eSIM</div>
                {currentInstruction.installation_via_qr_code.qr_code_url && (
                  <div className="mb-4 flex flex-col items-center">
                    <img src={currentInstruction.installation_via_qr_code.qr_code_url} alt="QR Code" className="w-40 h-40 border" />
                    <a href={currentInstruction.installation_via_qr_code.qr_code_url} download className="text-green-600 underline mt-2">下載 QR Code 圖片</a>
                  </div>
                )}
                <ol className="list-decimal pl-6 space-y-1">
                  {Object.entries(currentInstruction.installation_via_qr_code.steps).map(([k, v]) => (
                    <li key={k}>{v}</li>
                  ))}
                </ol>
                <hr className="my-6" />
              </div>
            )}
            {/* 手動安裝 */}
            {subTab === 'manual' && currentInstruction.installation_manual && (
              <>
                {/* SM-DP+ 地址與啟用碼獨立卡片區塊 */}
                {currentInstruction.installation_manual.smdp_address_and_activation_code && (() => {
                  const lpa = currentInstruction.installation_manual.smdp_address_and_activation_code;
                  const { smdp, code } = parseLpaString(lpa);
                  return (
                    <div className="mb-6 bg-white rounded-xl shadow p-4 border">
                      <div className="mb-2">
                        <div className="text-xs text-gray-500 font-bold">SM-DP+ 地址</div>
                        <div className="flex items-center gap-2 text-base font-mono">
                          {smdp}
                          <button
                            className="ml-1 text-gray-400 hover:text-gray-700"
                            onClick={() => {
                              navigator.clipboard.writeText(smdp || '');
                            }}
                            title="複製 SM-DP+ 地址"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="text-xs text-gray-500 font-bold">啟用碼</div>
                        <div className="flex items-center gap-2 text-base font-mono">
                          {code}
                          <button
                            className="ml-1 text-gray-400 hover:text-gray-700"
                            onClick={() => {
                              navigator.clipboard.writeText(code || '');
                            }}
                            title="複製啟用碼"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">複製此資訊並手動輸入詳細資訊，以安裝您的 eSIM。*安裝前請先確定您的裝置有穩定的網路連線。</div>
                    </div>
                  );
                })()}
                <div className="border rounded-lg shadow-md bg-white p-6">
                  <div className="font-bold text-lg mb-2">步驟 1/2 - 手動安裝 eSIM</div>
                  <ol className="list-decimal pl-6 space-y-1">
                    {Object.entries(currentInstruction.installation_manual.steps).map(([k, v]) => (
                      <li key={k}>{v}</li>
                    ))}
                  </ol>
                  <hr className="my-6" />
                </div>
              </>
            )}
          </div>
        )}
        {/* fallback 格式渲染 */}
        {!loading && !error && !currentInstruction && (
          <div className="text-center text-gray-400 py-8">查無安裝說明</div>
        )}
      </div>
    </div>
  );
}