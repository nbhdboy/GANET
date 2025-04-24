import { serve } from 'https://deno.fresh.runtime.dev/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

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
  // 處理 CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prime, line_user_id, cardholder } = await req.json() as BindCardRequest;

    // 驗證必要參數
    if (!prime || !line_user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 呼叫 TapPay Bind Card API
    const tappayResponse = await fetch('https://sandbox.tappaysdk.com/tpc/card/bind', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('TAPPAY_PARTNER_KEY') || ''
      },
      body: JSON.stringify({
        prime,
        partner_key: Deno.env.get('TAPPAY_PARTNER_KEY'),
        merchant_id: Deno.env.get('TAPPAY_MERCHANT_ID'),
        amount: 0,
        currency: 'TWD',
        order_number: `BIND_${Date.now()}`,
        cardholder,
        remember: true
      })
    });

    const tappayData = await tappayResponse.json();

    // 檢查 TapPay 回應
    if (tappayData.status !== 0) {
      return new Response(
        JSON.stringify({ error: tappayData.msg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 創建 Supabase 客戶端
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // 儲存卡片資訊到資料庫
    const { data: cardData, error: dbError } = await supabaseClient
      .from('user_cards')
      .insert({
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
        is_default: false
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save card information' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 回傳成功結果
    return new Response(
      JSON.stringify({
        status: 0,
        msg: 'Success',
        card: cardData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 