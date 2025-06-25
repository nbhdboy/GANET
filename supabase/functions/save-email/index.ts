import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  if (req.method === 'POST') {
    const { line_user_id, email, carrier } = await req.json();
    if (!line_user_id || (email === undefined && carrier === undefined)) {
      return new Response(JSON.stringify({ error: '缺少 line_user_id 或 email/carrier' }), { status: 400, headers: corsHeaders() });
    }
    const updateObj = {};
    if (email !== undefined) updateObj.email = email ? email : null;
    if (carrier !== undefined) updateObj.carrier = carrier ? carrier : null;
    const { error } = await supabase
      .from('user_cards')
      .update(updateObj)
      .eq('line_user_id', line_user_id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders() });
    }
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders() });
  }

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const line_user_id = url.searchParams.get('line_user_id');
    const field = url.searchParams.get('field') || 'email';
    if (!line_user_id) {
      return new Response(JSON.stringify({ error: '缺少 line_user_id' }), { status: 400, headers: corsHeaders() });
    }
    // 取最新一筆有對應欄位的卡片
    const { data, error } = await supabase
      .from('user_cards')
      .select(field)
      .eq('line_user_id', line_user_id)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders() });
    }
    return new Response(JSON.stringify({ [field]: data?.[0]?.[field] || null }), { headers: corsHeaders() });
  }

  return new Response('Method Not Allowed', { status: 405, headers: corsHeaders() });
}); 