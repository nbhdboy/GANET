console.error('BOOT CHECK', Date.now());

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

console.log('==== NEW BUILD @', Date.now(), '====');
console.log('ENV CHECK:', {
  SB_URL: Deno.env.get('SB_URL'),
  SB_SERVICE_ROLE_KEY: Deno.env.get('SB_SERVICE_ROLE_KEY'),
  SUPABASE_URL: Deno.env.get('SUPABASE_URL'), // optional legacy
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  TAPPAY_PARTNER_KEY: Deno.env.get('TAPPAY_PARTNER_KEY'),
  TAPPAY_MERCHANT_ID: Deno.env.get('TAPPAY_MERCHANT_ID')
});

interface BindCardRequest {
  prime: string;
  line_user_id: string;
  cardholder: {
    phone_number?: string;
    name?: string;
    email?: string;
  };
}

serve(async (req) => {
  console.log('[STEP] 1 → 進入函式');

  // 處理 CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('[STEP] 2 → 解析 body OK');
    
    const { prime, line_user_id, cardholder } = requestBody as BindCardRequest;
    console.log('[STEP] 3 → 提取參數完成');

    // 驗證必要參數
    if (!prime || !line_user_id) {
      console.log('[ERROR] 缺少必要參數');
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 從環境變數獲取 TapPay 設定
    const partner_key = Deno.env.get('TAPPAY_PARTNER_KEY');
    const merchant_id = Deno.env.get('TAPPAY_MERCHANT_ID');
    console.log('[STEP] 4 → TapPay 環境變數檢查', {
      hasPartnerKey: Boolean(partner_key),
      hasMerchantId: Boolean(merchant_id)
    });

    if (!partner_key || !merchant_id) {
      console.log('[ERROR] TapPay 設定缺失');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 呼叫 TapPay Bind Card API
    console.log('[STEP] 5 → 準備呼叫 TapPay API');
    const tappayResponse = await fetch('https://sandbox.tappaysdk.com/tpc/card/bind', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': partner_key
      },
      body: JSON.stringify({
        prime,
        partner_key,
        merchant_id,
        amount: 0,
        currency: 'TWD',
        order_number: `BIND_${Date.now()}`,
        cardholder,
        remember: true
      })
    });

    const tappayData = await tappayResponse.json();
    console.log('[STEP] 6 → TapPay 回應狀態:', tappayData.status);

    // 檢查 TapPay 回應
    if (tappayData.status !== 0) {
      console.log('[ERROR] TapPay 回應錯誤:', tappayData.msg);
      return new Response(
        JSON.stringify({ error: tappayData.msg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 創建 Supabase 客戶端
    const supabaseUrl = Deno.env.get('SB_URL') ?? Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SB_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log('[STEP] 7 → Supabase 環境變數檢查', {
      hasUrl: Boolean(supabaseUrl),
      hasKey: Boolean(supabaseKey)
    });

    console.log('KEY START →', (supabaseKey || '').slice(0, 15));

    const supabaseClient = createClient(
      supabaseUrl ?? '',
      supabaseKey ?? ''
    );
    console.log('[STEP] 8 → Supabase client 創建完成');

    // 準備卡片資訊
    const cardInfo = {
      line_user_id,
      card_key: tappayData.card_secret.card_key,
      card_token: tappayData.card_secret.card_token,
      last_four: tappayData.card_info.last_four,
      brand: (() => {
        const cardTypes = {
          1: 'VISA',
          2: 'Mastercard',
          3: 'JCB',
          4: 'Union Pay',
          5: 'AMEX'
        };
        return cardTypes[tappayData.card_info.type] || 'Unknown';
      })(),
      expiry_month: tappayData.card_info.expiry_date.substring(4, 6),
      expiry_year: tappayData.card_info.expiry_date.substring(2, 4),
      is_default: false,
      updated_at: new Date().toISOString()
    };
    console.log('[STEP] 9 → 卡片資訊準備完成');

    // 儲存卡片資訊到資料庫
    console.log('[STEP] 10 → 準備執行資料庫插入');
    console.log('[DEBUG] cardInfo:', cardInfo);
    console.log('[DEBUG] supabaseUrl:', supabaseUrl);
    console.log('[DEBUG] supabaseKey:', supabaseKey);

    try {
      // 先刪除該 user 的所有卡片，只保留一筆
      await supabaseClient
        .from('user_cards')
        .delete()
        .eq('line_user_id', cardInfo.line_user_id);

      // 以 upsert 取代 insert，確保 line_user_id 唯一
      const { error: upsertError } = await supabaseClient
        .from('user_cards')
        .upsert(cardInfo, { onConflict: 'line_user_id' });

      if (upsertError) {
        // 將完整錯誤內容（含 code / message / details）列印到終端機
        console.error('DB UPSERT ERROR →', JSON.stringify(upsertError, null, 2));

        // 同步回傳給前端，方便 curl 直接看到
        return new Response(
          JSON.stringify({ dbError: upsertError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 再嘗試查詢
      const { data, error: selectError } = await supabaseClient
        .from('user_cards')
        .select('*')
        .eq('line_user_id', cardInfo.line_user_id)
        .maybeSingle();

      console.log('[STEP] 11 → 資料庫操作完成', { data, selectError });

      if (selectError) {
        console.error('[DB SELECT ERROR]', selectError);
        return new Response(
          JSON.stringify({ error: selectError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 回傳成功結果
      console.log('[STEP] 12 → 準備返回成功響應');
      return new Response(
        JSON.stringify({
          status: 0,
          msg: 'Success',
          card: data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('[ERROR] 資料庫操作異常:', error);
      return new Response(
        JSON.stringify({
          error: 'Database operation failed',
          message: error.message,
          stack: error.stack
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.log('[ERROR] 捕獲異常:', (error as Error).message || String(error));
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: (error as Error).message || String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 