import { corsHeaders } from '../_shared/cors.ts';
import { getAiraloAccessToken, redisDel } from '../_shared/airalo.ts';

Deno.serve(async (req) => {
  const { searchParams } = new URL(req.url);
  const iccid = searchParams.get('iccid');
  if (!iccid) {
    return new Response(JSON.stringify({ error: '缺少 iccid 參數' }), { status: 400, headers: corsHeaders });
  }
  try {
    let token = await getAiraloAccessToken();
    const url = `https://sandbox-partners-api.airalo.com/v2/sims/${iccid}/usage`;
    let res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    let data = await res.json();
    if (res.status === 401) {
      // token 失效，清除 Redis 並重試
      console.log('[Airalo API] 401 Unauthorized，清除 Redis token 並重試');
      await redisDel('airalo_access_token');
      token = await getAiraloAccessToken();
      res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      data = await res.json();
    }
    if (!res.ok) {
      console.log('[Airalo API Error]', res.status, JSON.stringify(data));
      return new Response(JSON.stringify({ error: data, status: res.status }), { status: res.status, headers: corsHeaders });
    }
    // 新增 log：成功取得 usage 資料
    console.log('[Airalo API][Usage][Success]', iccid, JSON.stringify(data));
    return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
}); 