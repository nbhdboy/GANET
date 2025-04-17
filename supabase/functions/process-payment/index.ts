// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

console.log("Hello from Process Payment Function!")

interface TapPayRequest {
  prime: string;
  amount: number;
  currency: string;
  details?: string;
  cardholder?: {
    phone_number?: string;
    name?: string;
    email?: string;
  };
  redirect_url?: string;
  notify_url?: string;
}

interface TapPayResponse {
  status: number;
  msg: string;
  rec_trade_id?: string;
  order_number?: string;
  transaction_time_millis?: number;
  bank_transaction_id?: string;
  bank_result_code?: string;
  bank_result_msg?: string;
}

serve(async (req) => {
  // 獲取所有請求頭
  const headers = Object.fromEntries(req.headers.entries());
  console.log('=== 完整請求信息 ===');
  console.log('請求 Headers:', JSON.stringify(headers, null, 2));

  // 處理 OPTIONS 請求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    console.log('收到的請求數據:', {
      ...data,
      prime: '***' // 隱藏敏感信息
    });
    
    // 檢查必要欄位
    if (!data.prime) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '缺少 prime',
          debug: { receivedData: { ...data, prime: undefined } }
        }), 
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    if (!data.amount) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '缺少 amount',
          debug: { receivedData: { ...data, prime: undefined } }
        }), 
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const partnerKey = Deno.env.get('TAPPAY_PARTNER_KEY');
    const merchantId = Deno.env.get('TAPPAY_MERCHANT_ID');

    if (!partnerKey || !merchantId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '缺少 TapPay 配置資訊'
        }), 
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // TapPay API 配置
    const tapPayUrl = 'https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime';
    const tapPayHeaders = {
      'Content-Type': 'application/json',
      'x-api-key': partnerKey
    };

    // 準備 TapPay 請求數據
    const tapPayData = {
      prime: data.prime,
      partner_key: partnerKey,
      merchant_id: merchantId,
      amount: data.amount,
      currency: data.currency || 'TWD',
      details: 'eSIM Payment',
      cardholder: {
        phone_number: '+886900000000',
        name: 'Test User',
        email: 'test@example.com'
      },
      remember: false
    };

    console.log('準備發送到 TapPay 的數據:', {
      ...tapPayData,
      prime: '***',
      partner_key: '***',
      merchant_id: '***'
    });

    // 發送請求到 TapPay
    const tapPayResponse = await fetch(tapPayUrl, {
      method: 'POST',
      headers: tapPayHeaders,
      body: JSON.stringify(tapPayData)
    });

    const tapPayResult = await tapPayResponse.json();
    console.log('TapPay 響應:', {
      status: tapPayResult.status,
      msg: tapPayResult.msg,
      rec_trade_id: tapPayResult.rec_trade_id
    });

    if (tapPayResult.status === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: '支付成功',
          transaction_id: tapPayResult.rec_trade_id,
          details: tapPayResult
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } else {
      throw new Error(tapPayResult.msg || '支付處理失敗');
    }
  } catch (error) {
    console.error('支付處理錯誤:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || '支付處理失敗',
        timestamp: new Date().toISOString()
      }), 
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});