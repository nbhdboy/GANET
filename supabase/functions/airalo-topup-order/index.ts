import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { submitAiraloTopupOrder } from '../_shared/airalo.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

console.log("Hello from Airalo Topup Order Function!");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    const { package_id, iccid, user_id, description, sell_price, discount_code, discount_rate } = data;
    if (!package_id || !iccid || !user_id) {
      return new Response(JSON.stringify({ success: false, error: '缺少 package_id、iccid 或 user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    // 呼叫 Airalo Topup 下單
    const airaloOrder = await submitAiraloTopupOrder({ package_id, iccid, description });
    const esimData = airaloOrder.data;
    // 寫入資料庫
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    // 寫入 esim_orders
    const sellPrice = Math.round(Number(sell_price || esimData.sell_price || esimData.price));
    const orderData = {
      user_id,
      order_id: esimData.id,
      order_code: esimData.code,
      package_id: esimData.package_id,
      package_name: esimData.package,
      data: esimData.data,
      validity: esimData.validity,
      price: sellPrice,
      sell_price: sellPrice,
      discount_code: discount_code || null,
      discount_rate: discount_rate || null,
      currency: esimData.currency,
      description: esimData.description,
      type: esimData.type, // 'topup'
      iccid: iccid, // topup 對象 ICCID
      esim_type: esimData.esim_type,
      created_at: esimData.created_at,
      manual_installation: esimData.manual_installation,
      qrcode_installation: esimData.qrcode_installation,
      installation_guides: esimData.installation_guides,
      brand_settings_name: esimData.brand_settings_name,
      raw_response: airaloOrder
    };
    const orderRes = await supabase.from('esim_orders').insert([orderData]).select().single();
    // 組裝發票資料並呼叫 issue-invoice
    // === 以下同步 process-payment 發票欄位組裝邏輯 ===
    // carrier 欄位動態判斷
    console.log('DEBUG carrier input:', data.carrier);
    console.log('carrier regex test (手機條碼):', /^\/[A-Z0-9.+\-]{7}$/.test(data.carrier));
    console.log('carrier regex test (自然人憑證):', /^[A-Z]{2}[0-9]{14}$/.test(data.carrier));
    let carrierField;
    if (data.carrier && /^\/[A-Z0-9.+\-]{7}$/.test(data.carrier)) {
      // 手機條碼載具
      carrierField = { type: 1, number: data.carrier };
    } else if (data.carrier && /^[A-Z]{2}[0-9]{14}$/.test(data.carrier)) {
      // 自然人憑證載具
      carrierField = { type: 2, number: data.carrier };
    } else {
      // 會員載具
      carrierField = { type: 0 };
    }
    // description 欄位 country-package_id
    let descriptionField = '';
    if (data.country && String(data.country).trim() !== '') {
      descriptionField = data.country + '-' + (data.package_id || '');
    } else {
      descriptionField = data.package_id || '';
    }
    // buyer_email 來源優化
    const buyerEmail = String(data.cardholder?.email || data.buyer_email || data.email || '').trim();
    console.log('DEBUG buyer_email:', buyerEmail, typeof buyerEmail);
    const invoicePayload = {
      partner_key: Deno.env.get('TAPPAY_PARTNER_KEY'),
      order_number: orderData.order_id,
      order_date: new Date().toISOString().slice(0,10).replace(/-/g, ''),
      seller_name: '森聯科技有限公司',
      seller_identifier: Deno.env.get('SELLER_IDENTIFIER'),
      buyer_email: buyerEmail,
      currency: 'TWD',
      invoice_type: 1,
      sales_amount: sellPrice,
      zero_tax_sales_amount: 0,
      free_tax_sales_amount: 0,
      tax_amount: 0,
      total_amount: sellPrice,
      details: [
        {
          sequence_id: '001',
          sub_amount: sellPrice,
          unit_price: sellPrice,
          quantity: 1,
          description: descriptionField,
          tax_type: 1
        }
      ],
      notify_url: Deno.env.get('INVOICE_NOTIFY_URL'),
      carrier: carrierField,
      issue_notify_email: 'AUTO'
    };
    console.log('送出開立發票 payload:', invoicePayload);
    const invoiceRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/issue-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') },
      body: JSON.stringify(invoicePayload)
    });
    const invoiceResult = await invoiceRes.json();
    console.log('開立發票結果:', invoiceResult);
    return new Response(JSON.stringify({
      success: true,
      message: 'Top up 下單成功',
      esim: esimData,
      invoice: invoiceResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Top up 下單失敗:', err);
    return new Response(JSON.stringify({ success: false, error: 'Top up 下單失敗', detail: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 