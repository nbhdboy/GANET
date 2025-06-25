import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, user_id } = await req.json();
    console.log('[LOG] 收到驗證請求 code:', code, 'user_id:', user_id);
    if (!code) {
      return new Response(JSON.stringify({ success: false, error: '缺少折扣碼' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    // 查詢折扣碼
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code)
      .maybeSingle();
    console.log('[LOG] 查詢結果:', data, 'error:', error);
    if (error || !data) {
      return new Response(JSON.stringify({ success: false, error: '折扣碼不存在' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (data.used) {
      console.log('[LOG] 折扣碼已被使用:', data);
      return new Response(JSON.stringify({ success: false, error: '折扣碼已被使用' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    // 標記為已用過
    const { error: updateError } = await supabase
      .from('discount_codes')
      .update({ used: true, used_at: new Date().toISOString(), used_by: user_id || null })
      .eq('id', data.id);
    console.log('[LOG] update 結果:', updateError);
    if (updateError) {
      return new Response(JSON.stringify({ success: false, error: '標記折扣碼失敗' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ success: true, rate: data.rate }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.log('[LOG] 例外錯誤:', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 