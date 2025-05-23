# TapPay 支付功能整合開發記錄

## 開發目標
實現 LINE LIFF 應用中的 TapPay 信用卡支付功能。

## 主要功能
1. 信用卡表單驗證
2. TapPay SDK 整合
3. 支付處理 Edge Function
4. 錯誤處理和用戶反饋

## 技術棧
- 前端：React + TypeScript + Vite
- 後端：Supabase Edge Functions
- 支付：TapPay SDK v5.19.2

## 關鍵實現步驟

### 1. TapPay SDK 整合
```typescript
// PaymentPage.tsx
useEffect(() => {
  const loadTapPay = async () => {
    const script = document.createElement('script');
    script.src = 'https://js.tappaysdk.com/sdk/tpdirect/v5.19.2';
    script.async = true;
    document.body.appendChild(script);
    
    await new Promise(resolve => script.onload = resolve);
    
    TPDirect.setupSDK(
      import.meta.env.VITE_TAPPAY_APP_ID,
      import.meta.env.VITE_TAPPAY_APP_KEY,
      'sandbox'
    );
  };
  
  loadTapPay();
}, []);
```

### 2. 信用卡表單處理
```typescript
TPDirect.card.setup({
  fields: {
    number: {
      element: '#card-number',
      placeholder: '**** **** **** ****'
    },
    expirationDate: {
      element: '#card-expiration-date',
      placeholder: 'MM / YY'
    },
    ccv: {
      element: '#card-ccv',
      placeholder: 'CCV'
    }
  },
  styles: {
    // 樣式設置...
  }
});
```

### 3. 支付處理
```typescript
const handlePurchase = async () => {
  const prime = await new Promise((resolve, reject) => {
    TPDirect.card.getPrime((result) => {
      if (result.status !== 0) {
        reject(new Error(result.msg));
        return;
      }
      resolve(result.card.prime);
    });
  });

  const response = await fetch(`${import.meta.env.VITE_API_URL}/process-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      prime,
      amount: calculateAmount(),
      currency: 'TWD'
    })
  });
};
```

### 4. Edge Function 實現
```typescript
// process-payment/index.ts
serve(async (req) => {
  const data = await req.json();
  
  const tapPayResponse = await fetch(tapPayUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': Deno.env.get('TAPPAY_PARTNER_KEY')
    },
    body: JSON.stringify({
      prime: data.prime,
      merchant_id: Deno.env.get('TAPPAY_MERCHANT_ID'),
      amount: data.amount,
      currency: data.currency
    })
  });
  
  // 處理響應...
});
```

## 問題解決記錄

### CORS 問題
1. 問題描述：
   - 前端請求被 CORS 策略阻止
   - URL 路徑重複（functions/v1/functions/v1）

2. 解決方案：
   - 修正 API URL 配置
   - 更新 CORS 頭部設置
   ```typescript
   export const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
     'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
   };
   ```

### Prime 獲取問題
1. 問題描述：
   - Invalid arguments: prime 錯誤

2. 解決方案：
   - 使用正確的回調方式處理 getPrime
   - 確保信用卡欄位驗證通過

## 測試記錄

### 測試卡號
- 卡號：4242 4242 4242 4242
- 到期日：05/25
- CCV：123

### 測試案例
1. 正常支付流程 ✅
2. 卡號錯誤處理 ✅
3. 網絡錯誤處理 ✅
4. 表單驗證 ✅

## 部署記錄

### Edge Function 部署
```bash
supabase functions deploy process-payment
```

### 前端部署
```bash
git push -f origin main
```

## 環境變數配置

### 前端 (.env)
```env
VITE_TAPPAY_APP_ID=159452
VITE_TAPPAY_APP_KEY=app_key
VITE_API_URL=https://project.supabase.co/functions/v1
VITE_SUPABASE_ANON_KEY=anon_key
```

### Edge Function
- TAPPAY_PARTNER_KEY
- TAPPAY_MERCHANT_ID

## 未來優化建議
1. 添加交易記錄儲存
2. 實現退款功能
3. 加強錯誤處理
4. 添加支付結果通知
5. 實現定期付款功能

## 相關文檔
- [TapPay SDK 文檔](https://docs.tappaysdk.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions) 