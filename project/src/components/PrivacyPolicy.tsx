import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
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
          <h1 className="text-2xl font-bold pb-6">隱私權政策</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="prose max-w-none">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-8">
              <p className="text-gray-600 mb-4">生效日期：2024 年 6 月 3 日</p>
              <p className="mb-4">森聯科技有限公司（以下簡稱「我們」或「森聯科技」）非常重視您的隱私權。本《隱私權政策》說明我們如何收集、使用、分享和保護您的個人資訊，以及您擁有的相關權利與選項。</p>
              <p>透過註冊帳戶、使用我們的網站、應用程式、或其他與我們互動的方式，即表示您已閱讀並同意本政策內容。</p>
            </div>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">1. 適用範圍</h3>
              <p className="mb-4">本政策適用於所有使用我們服務的用戶，無論您是透過我們的網站、應用程式，或其他方式與我們互動。本政策適用對象包含：</p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>使用我們服務的個人用戶</li>
                <li>透過我們網站與我們互動的訪客</li>
                <li>向我們應徵職位的個人</li>
              </ul>
              <p>我們目前在台灣提供服務，但我們的 eSIM 產品可用於多數國家與地區，因此，您的個人資訊可能會在台灣以外地區處理或儲存。</p>
            </section>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">2. 我們如何收集與使用個人資訊</h3>
              <p className="mb-4">我們可能透過下列方式收集您的資訊：</p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>您主動提供給我們的資訊，例如註冊帳戶、訂購服務、填寫表單、與客服聯繫。</li>
                <li>我們自動透過 Cookie 或伺服器日誌收集的資訊，例如您的 IP 位址、裝置資訊、瀏覽行為等。</li>
                <li>從第三方或合作夥伴（如支付業者）取得的資訊，例如交易紀錄或身分驗證結果。</li>
              </ul>
              <p>我們會根據法令、業務需要以及您的同意，合理使用這些資料，包含但不限於帳戶建立、服務提供、客服支援、法遵需求與行銷用途。</p>
            </section>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">3. 我們收集的資訊類型</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">帳戶註冊資訊</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>收集項目：姓名、聯絡資訊（如電子郵件）</li>
                    <li>使用目的：提供帳戶功能、儲存偏好與交易紀錄、履行契約</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">生物識別資訊</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>收集項目：證件照片與自拍照中的生物特徵</li>
                    <li>使用目的：在您明確同意下，執行 eKYC 法規身分驗證流程</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">企業使用者資訊</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>收集項目：員工姓名、聯絡方式（電子郵件、電話、地址）</li>
                    <li>使用目的：業務聯繫與帳務處理</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">必要的線上追蹤技術</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>收集項目：瀏覽器類型、作業系統、IP 位址、使用紀錄等</li>
                    <li>使用目的：確保網站正常與安全運作</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">非必要追蹤技術（需同意）</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>收集項目：用戶與網站互動行為</li>
                    <li>使用目的：分析網站使用、行為式行銷與廣告追蹤</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">人口統計資訊</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>收集項目：年齡、地理位置等</li>
                    <li>使用目的：提供更精準的客製化服務</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">求職者資訊</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>收集項目：聯絡資料、教育背景、工作經歷</li>
                    <li>使用目的：評估職位適配性、履歷審核、法令遵循</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">意見回饋與客服支援</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>收集項目：姓名、電子郵件、使用者來信內容</li>
                    <li>使用目的：處理您的詢問、支援與意見回饋</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">行動裝置信息</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>收集項目：裝置識別碼、平台資訊</li>
                    <li>使用目的：追蹤流量來源與不重複訪客</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">訂單與付款資訊</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>收集項目：姓名、地址、電子郵件、電話、信用卡資訊</li>
                    <li>使用目的：處理訂單、付款與服務提供</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">合作夥伴促銷活動資訊</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>收集項目：您主動提供的報名或參與資料</li>
                    <li>使用目的：活動管理與聯名行銷</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">問卷調查資料</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>收集項目：您在調查中填寫的資料（視每次活動而定）</li>
                    <li>使用目的：了解使用者需求與偏好、優化產品服務</li>
                  </ul>
                </div>
              </div>
            </section>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">4. 資料保留原則</h3>
              <p className="mb-4">我們會在達成資料蒐集目的所需期間內保留您的個人資訊，並依法律、稽核或爭議處理的需要保留更長時間。我們會參考以下條件評估保留期間：</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>資料類型與敏感程度</li>
                <li>處理目的是否已完成</li>
                <li>是否有法定保留義務</li>
                <li>潛在爭議的處理需求</li>
              </ul>
            </section>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">5. 我們如何使用個人資訊</h3>
              <p className="mb-4">除了提供您所需的產品與服務外，我們亦可能基於以下目的使用資料：</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>驗證您的身分</li>
                <li>處理付款與訂單</li>
                <li>傳送服務與帳戶通知</li>
                <li>提供行銷活動與促銷訊息（您可選擇取消訂閱）</li>
                <li>分析網站使用行為，優化產品體驗</li>
                <li>預防詐騙與非法活動</li>
                <li>符合法律或主管機關要求</li>
                <li>其他經您授權同意的用途</li>
              </ul>
            </section>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">6. 個人資訊分享對象</h3>
              <p className="mb-4">我們可能會將您的資訊提供給以下對象：</p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>第三方服務供應商（如付款處理商、雲端服務、KYC 驗證平台）</li>
                <li>我們的合作夥伴（如促銷活動執行單位）</li>
                <li>主管機關（在法律要求或授權下）</li>
                <li>當我們與其他公司進行業務轉讓、併購或資產交易時</li>
                <li>經您明確授權的其他情況</li>
              </ul>
              <p>我們不會將您的個人資訊出售給任何第三方。</p>
            </section>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">7. 您的權利</h3>
              <p className="mb-4">根據台灣相關個資法，您擁有以下權利：</p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>查詢或請求閱覽您的個人資料</li>
                <li>請求更正或補充</li>
                <li>請求刪除</li>
                <li>拒絕行銷或撤回同意</li>
              </ul>
              <p>若您希望行使上述權利，請透過本政策底部聯絡方式與我們聯繫，我們將在合理時間內回應並處理您的申請。</p>
            </section>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">8. 資料跨境傳輸</h3>
              <p className="mb-4">由於我們的服務（如 eSIM 使用）涉及在全球各地連網與身份驗證，您的個人資料可能會傳輸至台灣以外的國家/地區，並於當地儲存或處理。</p>
              <p>這些地區的隱私法可能與您所居住國不同，但我們將確保在資訊傳輸時，適當使用標準合約條款與安全措施，以保護您的資料安全。</p>
            </section>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">9. 資訊安全</h3>
              <p>我們採取各種技術性與組織性措施來保護您的個人資訊，包括資料加密、身份驗證與存取控管等。然而，任何網路傳輸皆無法保證百分之百安全，若您發現帳號異常，請立即通知我們。</p>
            </section>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">10. 政策更新</h3>
              <p>我們可能會因應法令或營運需要，隨時更新本政策。如有重大變更，我們會透過網站公告或電子郵件通知。建議您定期查看本政策。</p>
            </section>

            <hr className="my-8" />

            <section className="mb-8">
              <h3 className="text-xl font-bold mb-4">11. 兒童隱私</h3>
              <p>我們不會有意蒐集 13 歲以下兒童的個人資訊，若發現無意間蒐集，將立即刪除相關資料。</p>
            </section>

            <hr className="my-8" />

            <section>
              <h3 className="text-xl font-bold mb-4">12. 聯絡我們</h3>
              <p className="mb-4">如有任何與隱私權政策有關的疑問、要求或申訴，歡迎透過以下方式與我們聯繫：</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">森聯科技有限公司</p>
                <p>電子郵件：</p>
                <p>聯絡地址：</p>
                <p>服務時間：週一至週五 09:00–18:00</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}