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
    const { package_id, iccid, user_id, description } = data;
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
    const orderData = {
      user_id,
      order_id: esimData.id,
      order_code: esimData.code,
      package_id: esimData.package_id,
      package_name: esimData.package,
      data: esimData.data,
      validity: esimData.validity,
      price: esimData.price,
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
    return new Response(JSON.stringify({
      success: true,
      message: 'Top up 下單成功',
      esim: esimData
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