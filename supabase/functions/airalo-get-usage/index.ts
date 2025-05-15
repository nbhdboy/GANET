import { corsHeaders } from '../_shared/cors.ts';
import { getAiraloAccessToken } from '../_shared/airalo.ts';

Deno.serve(async (req) => {
  const { searchParams } = new URL(req.url);
  const iccid = searchParams.get('iccid');
  if (!iccid) {
    return new Response(JSON.stringify({ error: '缺少 iccid 參數' }), { status: 400, headers: corsHeaders });
  }
  try {
    const token = await getAiraloAccessToken();
    const url = `https://sandbox-partners-api.airalo.com/v2/sims/${iccid}/usage`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: data, status: res.status }), { status: res.status, headers: corsHeaders });
    }
    return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
}); 