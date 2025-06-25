import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const iccid = url.searchParams.get('iccid');
    if (!iccid) {
      return new Response(JSON.stringify({ error: '缺少 iccid 參數' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: topups, error } = await supabase
      .from('esim_orders')
      .select('data, validity, created_at, iccid')
      .eq('iccid', iccid)
      .eq('type', 'topup')
      .order('created_at', { ascending: true });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // 查詢所有 topup iccid 的 sell_price
    const iccids = (topups || []).map(t => t.iccid).filter(Boolean);
    let priceMap = {};
    if (iccids.length > 0) {
      const { data: topupPrices } = await supabase
        .from('esim_topups')
        .select('iccid, sell_price')
        .in('iccid', iccids);
      (topupPrices || []).forEach(tp => { priceMap[tp.iccid] = tp.sell_price; });
    }
    const result = (topups || []).map(t => ({
      ...t,
      sell_price: priceMap[t.iccid] || null
    }));
    return new Response(JSON.stringify({ topups: result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 