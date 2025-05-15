import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { getAiraloAccessToken, redisDel } from "../_shared/airalo.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 白名單：只比對 data/day，不含價格，key 為英文國家名稱
const ALLOWED_PACKAGES: Record<string, Array<{ data: string, day: number }>> = {
  'Japan': [
    { data: '1GB', day: 7 },
    { data: '2GB', day: 15 },
    { data: '3GB', day: 30 },
    { data: '5GB', day: 30 },
    { data: '10GB', day: 30 },
    { data: '20GB', day: 30 },
  ],
  'South Korea': [
    { data: '1GB', day: 7 },
    { data: '2GB', day: 15 },
    { data: '3GB', day: 30 },
    { data: '5GB', day: 30 },
    { data: '10GB', day: 30 },
    { data: '20GB', day: 30 },
  ],
  // ... 其餘國家依你需求補齊 ...
};

// ===== 新增：賣價對照表 =====
const COUNTRY_CODE_SELL_PRICE: Record<string, Record<string, number>> = {
  JP: {
    "moshi-moshi-7days-1gb": 4.8,
    "moshi-moshi-15days-2gb": 7,
    "moshi-moshi-30days-3gb": 10,
    "moshi-moshi-30days-5gb": 15,
    "moshi-moshi-30days-10gb": 22,
    "moshi-moshi-30days-20gb": 32,
  },
  KR: {
    "jang-7days-1gb": 4.0,
    "jang-15days-2gb": 7,
    "jang-30days-3gb": 10,
    "jang-30days-5gb": 15,
    "jang-30days-10gb": 22,
    "jang-30days-20gb": 40,
  },
  HK: {
    "hkmobile-7days-1gb": 4.5,
    "hkmobile-15days-2gb": 7,
    "hkmobile-30days-3gb": 8.5,
    "hkmobile-30days-5gb": 13,
    "hkmobile-30days-10gb": 22,
    "hkmobile-10days-unlimited": 55,
  },
  MO: {
    "macau-mobile-7days-1gb": 3.5,
    "macau-mobile-15days-2gb": 6,
    "macau-mobile-30days-3gb": 8.5,
    "macau-mobile-30days-5gb": 13,
    "macau-mobile-30days-10gb": 24,
    "macau-mobile-30days-20gb": 44,
  },
  SG: {
    "connect-lah-7days-1gb": 4.5,
    "connect-lah-15days-2gb": 6.5,
    "connect-lah-30days-3gb": 8.5,
    "connect-lah-30days-5gb": 13,
    "connect-lah-30days-10gb": 22,
    "connect-lah-30days-20gb": 40,
    "connect-lah-10days-unlimited": 55,
  },
  TH: {
    "maew-7-days-1gb": 4.5,
    "maew-15-days-2gb": 5,
    "maew-30-days-3gb": 6.5,
    "maew-30-days-5gb": 10,
    "maew-30-days-10gb": 14,
    "maew-30-days-20gb": 20,
    "maew-30days-50gb": 42,
  },
  VN: {
    "xin-chao-7days-1gb": 4.5,
    "xin-chao-15days-2gb": 7.5,
    "xin-chao-30days-3gb": 10,
    "xin-chao-30days-5gb": 15,
    "xin-chao-30days-10gb": 29,
    "xin-chao-30days-20gb": 50,
  },
  MY: {
    "sambungkan-7days-1gb": 4.5,
    "sambungkan-15days-2gb": 8,
    "sambungkan-30days-3gb": 11,
    "sambungkan-30days-5gb": 15,
    "sambungkan-30days-10gb": 27,
    "sambungkan-30days-20gb": 42,
    "sambungkan-10days-unlimited": 50,
  },
  CN: {
    "chinacom-7days-1gb": 5.5,
    "chinacom-15days-2gb": 9,
    "chinacom-30days-3gb": 12,
    "chinacom-30days-5gb": 17,
    "chinacom-30days-10gb": 30,
    "chinacom-30days-20gb": 50,
    "chinam-mobile-10days-unlimited": 55,
  },
  PH: {
    "alpas-mobile-7days-1gb": 4.5,
    "alpas-mobile-15days-2gb": 8,
    "alpas-mobile-30days-3gb": 10,
    "alpas-mobile-30days-5gb": 15,
    "alpas-mobile-30days-10gb": 27,
    "alpas-mobile-30days-20gb": 50,
  },
  KH: {
    "connect-cambodia-7days-1gb": 4.5,
    "connect-cambodia-15days-2gb": 7.5,
    "connect-cambodia-30days-3gb": 10,
    "connect-cambodia-30days-5gb": 15,
    "connect-cambodia-30days-10gb": 27,
    "connect-cambodia-30days-20gb": 50,
  },
  US: {
    "change-7days-1gb": 5.5,
    "change-15days-2gb": 9,
    "change-30days-3gb": 12,
    "change-30days-5gb": 17,
    "change-30days-10gb": 30,
    "change-30days-20gb": 50,
  },
  GB: {
    "uki-mobile-7days-1gb": 5,
    "uki-mobile-15days-2gb": 7.5,
    "uki-mobile-30days-3gb": 10,
    "uki-mobile-30days-5gb": 15,
    "uki-mobile-30days-10gb": 22.5,
    "uki-mobile-30days-20gb": 36,
  },
  DE: {
    "hallo-mobil-7days-1gb": 4.5,
    "hallo-mobil-15days-2gb": 6,
    "hallo-mobil-30days-3gb": 8.5,
    "hallo-mobil-30days-5gb": 13,
    "hallo-mobil-30days-10gb": 23,
    "hallo-mobil-30days-20gb": 40,
  },
  IT: {
    "mamma-mia-7days-1gb": 4.5,
    "mamma-mia-15days-2gb": 8,
    "mamma-mia-30days-3gb": 8.5,
    "mamma-mia-30days-5gb": 13,
    "mamma-mia-30days-10gb": 23,
    "mamma-mia-30days-20gb": 40,
  },
  ID: {
    "indotel-7days-1gb": 5.5,
    "indotel-15days-2gb": 8,
    "indotel-30days-3gb": 11,
    "indotel-30days-5gb": 16.5,
    "indotel-30days-10gb": 25,
    "indotel-30days-20gb": 50,
    "indotel-10days-unlimited": 50,
  },
};

const TITLE_SELL_PRICE: Record<string, Record<string, number>> = {
  "Europe": {
    "eurolink-7days-1gb": 5.5,
    "eurolink-15days-2gb": 10,
    "eurolink-30days-3gb": 14,
    "eurolink-30days-5gb": 21,
    "eurolink-30days-10gb": 38,
    "eurolink-30days-20gb": 55,
    "eurolink-90days-50gb": 150,
    "eurolink-180days-100gb": 290,
    "eurolink-10days-unlimited": 50,
  },
  "North America": {
    "americanmex-7days-1gb": 7,
    "americanmex-15days-2gb": 12.5,
    "americanmex-30days-3gb": 18,
    "americanmex-30days-5gb": 30,
    "americanmex-30days-10gb": 50,
  },
  "Asia": {
    "asialink-7days-1gb": 5.5,
    "asialink-15days-2gb": 10,
    "asialink-30days-3gb": 14,
    "asialink-30days-5gb": 21,
    "asialink-30days-10gb": 38,
    "asialink-30days-20gb": 55,
    "asialink-90days-50gb": 130,
    "asialink-180days-100gb": 250,
  },
  "Oceania": {
    "oceanlink-7days-1gb": 5,
    "oceanlink-15days-2gb": 9.5,
    "oceanlink-30days-3gb": 14,
    "oceanlink-30days-5gb": 21,
    "oceanlink-30days-10gb": 38,
    "oceanlink-30days-20gb": 55,
  },
  "Africa": {
    "hello-africa-30days-1gb": 27.5,
    "hello-africa-30days-3gb": 60,
  },
};

function getSellPrice(country_code: string, title: string, package_id: string, net_price: number): number | undefined {
  if (COUNTRY_CODE_SELL_PRICE[country_code]?.[package_id]) {
    return COUNTRY_CODE_SELL_PRICE[country_code][package_id];
  }
  if (TITLE_SELL_PRICE[title]?.[package_id]) {
    return TITLE_SELL_PRICE[title][package_id];
  }
  // fallback: 沒有對照價就用 net_price * 1.5
  if (typeof net_price === 'number' && !isNaN(net_price)) {
    return Math.round(net_price * 1.5 * 10) / 10;
  }
  return undefined;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// ===== 新增：白名單 country_code 與 title =====
const ALLOWED_COUNTRY_CODES = [
  'JP','KR','HK','MO','SG','TH','VN','MY','CN','PH','KH','US','GB','DE','IT','ID'
];
const ALLOWED_TITLES = [
  'Europe','North America','Asia','Oceania','Africa'
];

serve(async (req) => {
  console.log('airalo-sync-packages triggered');
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log('開始拉取 Airalo API 資料');
    // 1. 拉取 Airalo API 資料（新版 endpoint + Bearer token）
    const token = await getAiraloAccessToken();
    const airaloRes = await fetch('https://sandbox-partners-api.airalo.com/v2/packages', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    });
    const airaloJson = await airaloRes.json();
    const rawPackages = airaloJson.data || [];
    // console.log('Airalo API 回傳資料:', rawPackages);

    console.log('開始篩選白名單 package');
    // 2. 依據 ALLOWED_PACKAGES 白名單篩選
    const filteredPackages = rawPackages.filter(pkg => {
      const allowed = ALLOWED_PACKAGES[pkg.country];
      if (!allowed) return false;
      return allowed.some(rule => rule.data === pkg.data && rule.day === pkg.day);
    });
    // console.log('白名單 package:', filteredPackages);

    console.log('開始 upsert DB');
    // 查詢現有 package_id
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: existingRows, error: queryError } = await supabase
      .from('esim_packages')
      .select('package_id');
    if (queryError) {
      console.log('查詢現有 package_id 發生錯誤:', queryError);
      throw queryError;
    }
    const existingIds = (existingRows || []).map(r => r.package_id);
    // 篩選出 DB 沒有的新 package
    const newPackages = (filteredPackages || []).filter(pkg => !existingIds.includes(pkg.package_id));
    if (newPackages.length === 0) {
      console.log('無新專案更新');
    } else {
      const { data: result, error: upsertError } = await supabase
        .from('esim_packages')
        .upsert(newPackages, { onConflict: ['package_id'] });
      if (upsertError) {
        console.log('upsert DB 發生錯誤:', upsertError);
        throw upsertError;
      }
      console.log('已新增 package_id:', newPackages.map(pkg => pkg.package_id));
    }
    return new Response(JSON.stringify({ ok: true, message: newPackages.length === 0 ? '無新專案更新' : `已新增 ${newPackages.length} 筆 package`, newPackageIds: newPackages.map(pkg => pkg.package_id) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log('同步失敗，錯誤內容:', error);
    if (error.message && error.message.includes("Unauthenticated")) {
      return new Response(JSON.stringify({ error: "Unauthenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 