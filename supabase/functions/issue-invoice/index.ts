import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

console.log("Hello from Issue Invoice Function!");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    console.log('收到開立發票請求:', data);
    // 必填欄位檢查
    const requiredFields = [
      'partner_key', 'order_number', 'order_date', 'buyer_email', 'currency',
      'invoice_type', 'sales_amount', 'zero_tax_sales_amount', 'free_tax_sales_amount', 'tax_amount', 'total_amount', 'details', 'notify_url', 'carrier', 'issue_notify_email'
    ];
    for (const field of requiredFields) {
      if (data[field] === undefined) {
        return new Response(JSON.stringify({ success: false, error: `缺少欄位: ${field}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    // 發票 API URL
    const url = Deno.env.get('INVOICE_API_URL') || 'https://sandbox-invoice.tappaysdk.com/einvoice/issue';
    const partnerKey = data.partner_key;
    // 移除 partner_key，避免重複
    const { partner_key, ...invoiceBody } = data;
    // 發送請求到 TapPay 發票 API
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': partnerKey
      },
      body: JSON.stringify({ partner_key, ...invoiceBody })
    });
    const requestId = resp.headers.get('request-id');
    console.log('TapPay response request-id:', requestId);
    const respText = await resp.text();
    let respJson: any = {};
    try {
      respJson = JSON.parse(respText);
    } catch (e) {
      respJson = { raw: respText };
    }
    if (resp.ok && respJson.status === 0) {
      // 發票開立成功，寫入 esim_orders
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.7');
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const updateRes = await supabase
          .from('esim_orders')
          .update({
            rec_invoice_id: respJson.rec_invoice_id,
            invoice_number: respJson.invoice_number,
            invoice_date: respJson.invoice_date,
            invoice_time: respJson.invoice_time
          })
          .eq('order_id', data.order_number)
          .select();
        console.log('發票資訊已寫入 esim_orders, 更新內容:', updateRes);
      } catch (e) {
        console.error('寫入發票資訊到 esim_orders 失敗:', e);
      }
      return new Response(JSON.stringify({ success: true, invoice: respJson }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: respJson.msg || '開立發票失敗', detail: respJson }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 