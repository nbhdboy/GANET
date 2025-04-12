import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsAndConditionsProps {
  onBack: () => void;
}

export function TermsAndConditions({ onBack }: TermsAndConditionsProps) {
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto" lang="zh-Hant">
      <div className="bg-line-gradient text-white sticky top-0">
        <div className="container mx-auto px-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 py-4"
          >
            <ArrowLeft size={20} />
            返回
          </button>
          <h1 className="text-2xl font-bold pb-6">一般條款與條件</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="prose max-w-none">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold">森聯科技有限公司一般條款與條件</h2>
            <p className="text-gray-600 mt-2">最後更新時間：2025 年 1 月 31 日</p>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">1. 條款與條件效力</h3>
              <div className="space-y-4">
                <p>本條款與條件（下稱「條款」）為您（下稱「客戶」或「您」）與森聯科技有限公司（以下簡稱「森聯科技」、「我們」）之間所訂立具法律約束力之協議，適用於您對我們之網站、行動應用程式及我們所提供的 eSIM 服務（下稱「服務」）的使用。</p>
                <p>註冊帳戶、下載或使用應用程式、勾選「我同意」等按鈕，即表示您同意本條款內容。如您不同意，請勿使用本服務。</p>
              </div>
            </section>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">2. 使用服務與帳戶註冊</h3>
              <div className="space-y-4">
                <p>您需建立帳戶方可使用我們的 eSIM 服務。建立帳戶時，請提供正確且最新的資訊，包括姓名、電子郵件、手機號碼等。您應妥善保管帳號與密碼，所有使用帳戶所發生的行為均由您負責。</p>
                <p>若您代表公司使用本服務，您保證具備授權代表公司同意本條款的法律資格，並同意條款內容對該公司具法律約束力。</p>
              </div>
            </section>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">3. 服務內容與使用限制</h3>
              <div className="space-y-4">
                <p>森聯科技所提供之服務為讓用戶購買並安裝 eSIM 至相容設備上以進行海外上網。</p>
                <p>使用本服務，您應保證您的裝置為 eSIM 相容且已解鎖。我們會提供相容裝置清單，請您在購買前確認。如您勾選「我確認我的裝置相容 eSIM」即代表您自行承擔後續風險與責任。</p>
              </div>
            </section>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">4. 費用與付款</h3>
              <div className="space-y-4">
                <p>服務之費用會於網站或應用程式上清楚標示，所有付款將透過第三方金流服務（如信用卡、LINE Pay 等）進行處理。除非另有說明，所有價格均不含稅。</p>
                <p>一旦完成購買並收到 eSIM 安裝說明，即視為交易完成，費用不退。</p>
              </div>
            </section>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">5. eSIM 發送與啟用</h3>
              <p>您購買成功後，eSIM 將會顯示於帳戶的「我的 eSIM」頁面，並提供啟用教學。請務必於指定期限內完成啟用，否則 eSIM 將會過期，且不得退費或再次啟用。</p>
            </section>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">6. 退款與取消政策</h3>
              <div className="space-y-4">
                <p>若因我們的系統錯誤導致您無法使用 eSIM，您可於購買日起 30 天內申請退款。若您已安裝 eSIM 或已使用部分流量，則無法退款。退款前，我們可能會請您提供裝置截圖、網路設定等技術資訊以進行判斷。</p>
                <div>
                  <p className="mb-2">我們不接受以下情形之退款：</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>裝置不相容或未解鎖</li>
                    <li>使用者誤操作</li>
                    <li>透過第三方通路購買（請聯繫該通路退款）</li>
                    <li>已超過申請期限</li>
                    <li>已安裝 eSIM</li>
                  </ul>
                </div>
                <p>退款若獲核准，可選擇原付款方式退還，或折抵下次購買。</p>
              </div>
            </section>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">7. 客戶責任</h3>
              <p>您不得利用本服務從事任何違法、詐欺、濫用或損害他人網路安全之行為。若您違反本條款，我們有權中止或終止您的帳戶與服務，並不予退費。</p>
            </section>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">8. 國際使用與資料傳輸</h3>
              <p>雖然我們的公司位於台灣，eSIM 服務將使用於國外，因此，您同意您的個人資料可能因服務提供需求傳輸至其他國家或區域。無論資料處理地為何，我們將採取合理安全措施保護您的資訊。</p>
            </section>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">9. 條款變更</h3>
              <p>我們保留隨時修訂本條款之權利。任何重大變更將以網站公告或電子郵件通知。請定期查閱本條款以掌握最新版本。</p>
            </section>

            <hr className="my-8" />

            <section>
              <h3 className="text-xl font-bold mb-4">10. 聯絡我們</h3>
              <p className="mb-4">如有任何關於本條款之疑問、帳戶或交易問題，請聯絡我們：</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">森聯科技有限公司</p>
                <p>電子郵件：</p>
                <p>地址：</p>
                <p>服務時間：週一至週五 09:00–18:00</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}