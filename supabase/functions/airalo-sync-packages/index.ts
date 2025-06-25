import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { getAiraloAccessToken, redisDel } from "../_shared/airalo.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ===== 新增：賣價對照表 =====
const COUNTRY_CODE_SELL_PRICE: Record<string, Record<string, number>> = {
  JP: {
    "moshi-moshi-7days-1gb": Math.round(4.8 * 31),
    "moshi-moshi-15days-2gb": Math.round(7 * 31),
    "moshi-moshi-30days-3gb": Math.round(10 * 31),
    "moshi-moshi-30days-5gb": Math.round(15 * 31),
    "moshi-moshi-30days-10gb": Math.round(22 * 31),
    "moshi-moshi-30days-20gb": Math.round(32 * 31),
  },
  KR: {
    "jang-7days-1gb": Math.round(4.0 * 31),
    "jang-15days-2gb": Math.round(7 * 31),
    "jang-30days-3gb": Math.round(10 * 31),
    "jang-30days-5gb": Math.round(15 * 31),
    "jang-30days-10gb": Math.round(22 * 31),
    "jang-30days-20gb": Math.round(40 * 31),
  },
  HK: {
    "hkmobile-7days-1gb": Math.round(4.5 * 31),
    "hkmobile-15days-2gb": Math.round(7 * 31),
    "hkmobile-30days-3gb": Math.round(8.5 * 31),
    "hkmobile-30days-5gb": Math.round(13 * 31),
    "hkmobile-30days-10gb": Math.round(22 * 31),
    "hkmobile-10days-unlimited": Math.round(55 * 31),
  },
  MO: {
    "macau-mobile-7days-1gb": Math.round(3.5 * 31),
    "macau-mobile-15days-2gb": Math.round(6 * 31),
    "macau-mobile-30days-3gb": Math.round(8.5 * 31),
    "macau-mobile-30days-5gb": Math.round(13 * 31),
    "macau-mobile-30days-10gb": Math.round(24 * 31),
    "macau-mobile-30days-20gb": Math.round(44 * 31),
  },
  SG: {
    "connect-lah-7days-1gb": Math.round(4.5 * 31),
    "connect-lah-15days-2gb": Math.round(6.5 * 31),
    "connect-lah-30days-3gb": Math.round(8.5 * 31),
    "connect-lah-30days-5gb": Math.round(13 * 31),
    "connect-lah-30days-10gb": Math.round(22 * 31),
    "connect-lah-30days-20gb": Math.round(40 * 31),
    "connect-lah-10days-unlimited": Math.round(55 * 31),
  },
  TH: {
    "maew-7-days-1gb": Math.round(4.5 * 31),
    "maew-15-days-2gb": Math.round(5 * 31),
    "maew-30-days-3gb": Math.round(6.5 * 31),
    "maew-30-days-5gb": Math.round(10 * 31),
    "maew-30-days-10gb": Math.round(14 * 31),
    "maew-30-days-20gb": Math.round(20 * 31),
    "maew-30days-50gb": Math.round(42 * 31),
  },
  VN: {
    "xin-chao-7days-1gb": Math.round(4.5 * 31),
    "xin-chao-15days-2gb": Math.round(7.5 * 31),
    "xin-chao-30days-3gb": Math.round(10 * 31),
    "xin-chao-30days-5gb": Math.round(15 * 31),
    "xin-chao-30days-10gb": Math.round(29 * 31),
    "xin-chao-30days-20gb": Math.round(50 * 31),
  },
  MY: {
    "sambungkan-7days-1gb": Math.round(4.5 * 31),
    "sambungkan-15days-2gb": Math.round(8 * 31),
    "sambungkan-30days-3gb": Math.round(11 * 31),
    "sambungkan-30days-5gb": Math.round(15 * 31),
    "sambungkan-30days-10gb": Math.round(27 * 31),
    "sambungkan-30days-20gb": Math.round(42 * 31),
    "sambungkan-10days-unlimited": Math.round(50 * 31),
  },
  CN: {
    "chinacom-7days-1gb": Math.round(5.5 * 31),
    "chinacom-15days-2gb": Math.round(9 * 31),
    "chinacom-30days-3gb": Math.round(12 * 31),
    "chinacom-30days-5gb": Math.round(17 * 31),
    "chinacom-30days-10gb": Math.round(30 * 31),
    "chinacom-30days-20gb": Math.round(50 * 31),
    "chinam-mobile-10days-unlimited": Math.round(55 * 31),
  },
  PH: {
    "alpas-mobile-7days-1gb": Math.round(4.5 * 31),
    "alpas-mobile-15days-2gb": Math.round(8 * 31),
    "alpas-mobile-30days-3gb": Math.round(10 * 31),
    "alpas-mobile-30days-5gb": Math.round(15 * 31),
    "alpas-mobile-30days-10gb": Math.round(27 * 31),
    "alpas-mobile-30days-20gb": Math.round(50 * 31),
  },
  KH: {
    "connect-cambodia-7days-1gb": Math.round(4.5 * 31),
    "connect-cambodia-15days-2gb": Math.round(7.5 * 31),
    "connect-cambodia-30days-3gb": Math.round(10 * 31),
    "connect-cambodia-30days-5gb": Math.round(15 * 31),
    "connect-cambodia-30days-10gb": Math.round(27 * 31),
    "connect-cambodia-30days-20gb": Math.round(50 * 31),
  },
  US: {
    "change-7days-1gb": Math.round(5.5 * 31),
    "change-15days-2gb": Math.round(9 * 31),
    "change-30days-3gb": Math.round(12 * 31),
    "change-30days-5gb": Math.round(17 * 31),
    "change-30days-10gb": Math.round(30 * 31),
    "change-30days-20gb": Math.round(50 * 31),
  },
  GB: {
    "uki-mobile-7days-1gb": Math.round(5 * 31),
    "uki-mobile-15days-2gb": Math.round(7.5 * 31),
    "uki-mobile-30days-3gb": Math.round(10 * 31),
    "uki-mobile-30days-5gb": Math.round(15 * 31),
    "uki-mobile-30days-10gb": Math.round(22.5 * 31),
    "uki-mobile-30days-20gb": Math.round(36 * 31),
  },
  DE: {
    "hallo-mobil-7days-1gb": Math.round(4.5 * 31),
    "hallo-mobil-15days-2gb": Math.round(6 * 31),
    "hallo-mobil-30days-3gb": Math.round(8.5 * 31),
    "hallo-mobil-30days-5gb": Math.round(13 * 31),
    "hallo-mobil-30days-10gb": Math.round(23 * 31),
    "hallo-mobil-30days-20gb": Math.round(40 * 31),
  },
  IT: {
    "mamma-mia-7days-1gb": Math.round(4.5 * 31),
    "mamma-mia-15days-2gb": Math.round(8 * 31),
    "mamma-mia-30days-3gb": Math.round(8.5 * 31),
    "mamma-mia-30days-5gb": Math.round(13 * 31),
    "mamma-mia-30days-10gb": Math.round(23 * 31),
    "mamma-mia-30days-20gb": Math.round(40 * 31),
  },
  ID: {
    "indotel-7days-1gb": Math.round(5.5 * 31),
    "indotel-15days-2gb": Math.round(8 * 31),
    "indotel-30days-3gb": Math.round(11 * 31),
    "indotel-30days-5gb": Math.round(16.5 * 31),
    "indotel-30days-10gb": Math.round(25 * 31),
    "indotel-30days-20gb": Math.round(50 * 31),
    "indotel-10days-unlimited": Math.round(50 * 31),
  },
};

const TITLE_SELL_PRICE: Record<string, Record<string, number>> = {
  "Europe": {
    "eurolink-7days-1gb": Math.round(5.5 * 31),
    "eurolink-15days-2gb": Math.round(10 * 31),
    "eurolink-30days-3gb": Math.round(14 * 31),
    "eurolink-30days-5gb": Math.round(21 * 31),
    "eurolink-30days-10gb": Math.round(38 * 31),
    "eurolink-30days-20gb": Math.round(55 * 31),
    "eurolink-90days-50gb": Math.round(150 * 31),
    "eurolink-180days-100gb": Math.round(290 * 31),
    "eurolink-10days-unlimited": Math.round(50 * 31),
  },
  "North America": {
    "americanmex-7days-1gb": Math.round(7 * 31),
    "americanmex-15days-2gb": Math.round(12.5 * 31),
    "americanmex-30days-3gb": Math.round(18 * 31),
    "americanmex-30days-5gb": Math.round(30 * 31),
    "americanmex-30days-10gb": Math.round(50 * 31),
  },
  "Asia": {
    "asialink-7days-1gb": Math.round(5.5 * 31),
    "asialink-15days-2gb": Math.round(10 * 31),
    "asialink-30days-3gb": Math.round(14 * 31),
    "asialink-30days-5gb": Math.round(21 * 31),
    "asialink-30days-10gb": Math.round(38 * 31),
    "asialink-30days-20gb": Math.round(55 * 31),
    "asialink-90days-50gb": Math.round(130 * 31),
    "asialink-180days-100gb": Math.round(250 * 31),
  },
  "Oceania": {
    "oceanlink-7days-1gb": Math.round(5 * 31),
    "oceanlink-15days-2gb": Math.round(9.5 * 31),
    "oceanlink-30days-3gb": Math.round(14 * 31),
    "oceanlink-30days-5gb": Math.round(21 * 31),
    "oceanlink-30days-10gb": Math.round(38 * 31),
    "oceanlink-30days-20gb": Math.round(55 * 31),
  },
  "Africa": {
    "hello-africa-30days-1gb": Math.round(27.5 * 31),
    "hello-africa-30days-3gb": Math.round(60 * 31),
  },
};

function getSellPrice(country_code: string, title: string, package_id: string, net_price: number): number | undefined {
  if (COUNTRY_CODE_SELL_PRICE[country_code]?.[package_id]) {
    return COUNTRY_CODE_SELL_PRICE[country_code][package_id];
  }
  if (TITLE_SELL_PRICE[title]?.[package_id]) {
    return TITLE_SELL_PRICE[title][package_id];
  }
  // fallback: 沒有對照價就用 net_price * 1.5 * 31，最後四捨五入
  if (typeof net_price === 'number' && !isNaN(net_price)) {
    return Math.round(net_price * 1.5 * 31);
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
    console.log('Airalo API 回傳 package 數量:', rawPackages.length);
    console.log('Airalo API 回傳資料:', JSON.stringify(rawPackages, null, 2));

    console.log('開始篩選白名單 package');
    // 展開所有國家下的 operator 與 package，攤平成一維陣列
    const flattenedPackages = [];
    for (const country of rawPackages) {
      for (const operator of (country.operators || [])) {
        for (const pkg of (operator.packages || [])) {
          flattenedPackages.push({
            package_id: pkg.id,
            country: country.title,
            country_code: country.country_code,
            operator: operator.title,
            data: pkg.data,
            amount: pkg.amount,
            day: pkg.day,
            net_price: pkg.net_price,
            sell_price: getSellPrice(country.country_code, country.title, pkg.id, pkg.net_price),
            is_unlimited: pkg.is_unlimited,
            fair_usage_policy: pkg.fair_usage_policy,
            type: pkg.type,
            // updated_at 由 DB 自動產生
          });
        }
      }
    }

    // 篩選白名單
    const filteredPackages = flattenedPackages.filter(pkg => {
      const allowedByCode = ALLOWED_COUNTRY_CODES.includes(pkg.country_code);
      const allowedByTitle = ALLOWED_TITLES.includes(pkg.country);
      return allowedByCode || allowedByTitle;
    });
    console.log('白名單篩選後 package 數量:', filteredPackages.length);

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
    console.log('本次要 upsert 新 package 數量:', newPackages.length);
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