import React from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';

interface FAQProps {
  onBack: () => void;
}

export function FAQ({ onBack }: FAQProps) {
  const { language } = useStore();
  const t = translations[language];

  const faqs = [
    {
      question: '可以撥打電話或傳簡訊嗎？',
      answer: '目前eSIM的服務，尙不支援撥打，接通電話與發送簡訊，但您仍然可以使用iMessage。',
    },
    {
      question: '會有其他額外費用產生嗎？',
      answer: '使用森聯科技的eSIM，不會產生額外費用，請放心。',
    },
    {
      question: '要如何查詢目前的流量使用狀況？',
      answer: '如您的流量過低，我們會即時透過LINE 官方帳號通知您，您也可以直接在Mini app中，「我的eSIM」查看目前使用狀況，隨時進行加值。',
    },
    {
      question: '沒辦法正常上網時，該如何解決？',
      answer: `1. 在「設定」→「行動服務」→確認「行動數據」是否有顯示你嘗試啟用的號碼，如有顯示，請關閉該號碼，再重新開啟。
2.「行動服務SIM卡」→「eSIM」→檢查數據漫遊是否有開啟。
3. 檢查APN設定是否正確，若錯誤請手動修改，您可以在Mini app中的「我的eSIM」→「eSIM細節」中查看。
4. 在「電信選擇」中關閉自動選擇，手動選擇支持的電信網路。
5. 重置網路設定：「設定」>「一般」>「轉移或重置iPhone」>「重置網路設定」。
6.請重新啟動您的裝置。

若以上步驟後仍無法成功連接網路，請聯繫我們的LINE官方帳號為您提供協助。`,
    },
    {
      question: '可以啟用熱點嗎？',
      answer: '我們的eSIM沒有限制熱點分享，但為避免因大量數據使用造成您需要購買更多流量，建議不要長時間分享熱點。',
    },
    {
      question: '有哪些地區的網速較緩慢呢？',
      answer: '網路速度可能會因當地的訊號強度和網路覆蓋情況而有所不同。由於不同區域的電信基站配置及使用人數影響，可能導致速度波動。此外，若您處於訊號較弱的地區或死角，例如機場、地下室等，可能會進一步影響網速，特別是部分機場因安全考量屏蔽信號。建議您移動至開放區域或訊號較強的位置，通常可改善網速體驗。',
    },
    {
      question: 'eSIM只要一啟用就開始計算使用流量了嗎？',
      answer: '為確保正確啟用eSIM服務，請於出發當日在國內掃描綁定於手機裝置。一旦抵達旅遊國家後，連接當地訊號此刻的時間點即為服務的開始並開始計算使用流量。',
    },
    {
      question: '不小心刪除了已安裝的eSIM該怎麼辦？',
      answer: 'QR Code綁定成功後，請切記不要自行將eSIM刪除，因刪除後將無法再次使用。如有任何操作問題，請務必先與我們聯繫。',
    },
    {
      question: '使用完畢後該如何刪除eSIM呢？',
      answer: `蘋果手機 :
1. 設定→行動服務→點擊eSIM→關閉此號碼→刪除eSIM
2. 返回行動服務頁面→eSIM狀態顯示無SIM卡點擊→更新聯絡人→設備列表完全移除

安卓手機 :
1.設定→網路與網際網路→停用SIM卡→清除SIM卡`,
    },
    {
      question: '出現「PDP 認證失敗」該怎麼辦？',
      answer: `PDP 身份驗證失敗可能與您的設定或 eSIM 資料/有效性有關。 請檢查您是否符合以下情況：

APN 已視需要根據 eSIM 安裝頁面資訊完成設定 (字元全部小寫，只有一個字串)
eSIM 還有剩餘的數據：若您嘗試連線，卻沒有剩餘數據可用，則可能會發生此錯誤。
您已按照 eSIM 安裝頁面建議的指示連接支援網路
如要找到 eSIM 安裝頁面和所有詳細資料，請前往我的 eSIM > 詳細資料 > 安裝 eSIM，然後向下捲動頁面。 如果上述步驟並未解決問題，請嘗試重設網路設定*。

前往裝置上的「設定」
前往「一般」
前往「重置」
前往「重置網路設定」
重新啟動裝置
QR Code綁定成功後，請切記不要自行將eSIM刪除，因刪除後將無法再次使用。如有任何操作問題，請務必先透過官方LINE帳號與我們團隊聯絡。`,
    },
    {
      question: '我無法掃描行動條碼該怎麼辦？',
      answer: `若無法掃描所提供的行動條碼，Android 裝置可手動輸入 eSIM 安裝詳細資料來安裝 eSIM。 若您使用的是 iOS 裝置，則可選擇直接方法在同一部裝置上安裝 eSIM 或採用手動方法。您也可以依據個人偏好，按照以下步驟繼續手動安裝 eSIM：

在 iOS 上：

1.前往我的 eSIM 分頁，並透過應用程式或網站尋找手動安裝的詳細資料。
2.前往裝置上的設定
3.前往行動服務
4.新增行動方案
5.選擇手動輸入詳細資訊。 您將被要求輸入：
SM-DP+ 位址
啟用碼
確認碼 (如有)
6.在行動方案下啟用您的 eSIM
7.選擇要用於行動數據的 eSIM
8.Enable Data Roaming (Please turn off your primary line to avoid roaming charges from your carrier provider when overseas)
9.如有需要，在裝置上設定 APN (存取點名稱)。 若您的 eSIM 需要設定 APN 設定，則可在 eSIM 安裝詳細資料中找到 APN 詳細資料

在 Android 上：

1.前往我的 eSIM 分頁，並透過應用程式或網站尋找手動安裝的詳細資料。
2.在裝置上前往設定
3.Tap on Network & Internet
4.點選行動網路旁的加入圖示
5.系統詢問「沒有 SIM 卡？」時，點選下一步
6.點選手動輸入代碼。 系統會要求您輸入行動條碼資訊 (SM-DP+ 地址)，您可在 eSIM 安裝頁面上的「手動安裝」分頁中找到這項資訊。
7.在行動網路下啟用 eSIM
8.啟用 行動資料
9.Enable Data Roaming (Please turn off your primary line to avoid roaming charges from your carrier provider when overseas)
10.如有需要，在裝置上設定 APN (存取點名稱)。 若您的 eSIM 需要設定 APN 設定，則可在 eSIM 安裝詳細資料中找到 APN 詳細資料

如有任何疑問，歡迎透過官方LINE帳號與我們團隊聯絡`,
    },
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
            返回
          </button>
          <h1 className="text-2xl font-bold pb-6">常見問題-問與答</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-center mb-8">常見問題</h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group border-b border-gray-200 last:border-none"
            >
              <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50">
                <span className="font-medium text-gray-900">{faq.question}</span>
                <ChevronDown 
                  className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" 
                />
              </summary>
              <div className="px-6 pb-6 text-gray-600 whitespace-pre-line">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}