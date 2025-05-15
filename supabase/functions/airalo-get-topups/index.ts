import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { getAiraloTopupPackages } from "../_shared/airalo.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Top up 售價白名單（移除日本，只保留其他國家）
const TOPUP_SELL_PRICE_WHITELIST: Record<string, Record<string, Record<string, number>>> = {
  '韓國': {
    '1GB': { '7': 4.0 },
    '2GB': { '15': 7 },
    '3GB': { '30': 10 },
    '5GB': { '30': 15 },
    '10GB': { '30': 22 },
    '20GB': { '30': 40 },
  },
  '香港': {
    '1GB': { '7': 4.5 },
    '2GB': { '15': 7 },
    '3GB': { '30': 8.5 },
    '5GB': { '30': 13 },
    '10GB': { '30': 22 },
    'unlimited': { '10': 55 },
  },
  '澳門': {
    '1GB': { '7': 3.5 },
    '2GB': { '15': 6 },
    '3GB': { '30': 8.5 },
    '5GB': { '30': 13 },
    '10GB': { '30': 24 },
    '20GB': { '30': 44 },
  },
  '新家坡': {
    '1GB': { '7': 4.5 },
    '2GB': { '15': 6.5 },
    '3GB': { '30': 8.5 },
    '5GB': { '30': 13 },
    '10GB': { '30': 22 },
    '20GB': { '30': 40 },
    'unlimited': { '10': 55 },
  },
  '泰國': {
    '1GB': { '7': 4.5 },
    '2GB': { '15': 5 },
    '3GB': { '30': 6.5 },
    '5GB': { '30': 10 },
    '10GB': { '30': 14 },
    '20GB': { '30': 20 },
    '50GB': { '30': 42 },
  },
  '越南': {
    '1GB': { '7': 4.5 },
    '2GB': { '15': 7.5 },
    '3GB': { '30': 10 },
    '5GB': { '30': 15 },
    '10GB': { '30': 29 },
    '20GB': { '30': 50 },
  },
  '馬來西亞': {
    '1GB': { '7': 4.5 },
    '2GB': { '15': 8 },
    '3GB': { '30': 11 },
    '5GB': { '30': 16 },
    '10GB': { '30': 27 },
    '20GB': { '30': 42 },
    'unlimited': { '10': 50 },
  },
  '中國': {
    '1GB': { '7': 5.5 },
    '2GB': { '15': 9 },
    '3GB': { '30': 12 },
    '5GB': { '30': 17 },
    '10GB': { '30': 30 },
    '20GB': { '30': 50 },
    'unlimited': { '10': 55 },
  },
  '菲律賓': {
    '1GB': { '7': 4.5 },
    '2GB': { '15': 8 },
    '3GB': { '30': 10 },
    '5GB': { '30': 15 },
    '10GB': { '30': 27 },
    '20GB': { '30': 50 },
  },
  '柬埔寨': {
    '1GB': { '7': 4.5 },
    '2GB': { '15': 7.5 },
    '3GB': { '30': 10 },
    '5GB': { '30': 15 },
    '10GB': { '30': 27 },
    '20GB': { '30': 50 },
  },
  '英國': {
    '1GB': { '7': 5 },
    '2GB': { '15': 7.5 },
    '3GB': { '30': 10 },
    '5GB': { '30': 15 },
    '10GB': { '30': 22.5 },
    '20GB': { '30': 36 },
  },
  '德國': {
    '1GB': { '7': 4.5 },
    '2GB': { '15': 6 },
    '3GB': { '30': 8.5 },
    '5GB': { '30': 13 },
    '10GB': { '30': 23 },
    '20GB': { '30': 40 },
  },
  '義大利': {
    '1GB': { '7': 4.5 },
    '2GB': { '15': 8 },
    '3GB': { '30': 10 },
    '5GB': { '30': 14.5 },
    '10GB': { '30': 25 },
    '20GB': { '30': 40 },
  },
  '印尼': {
    '1GB': { '7': 5.5 },
    '2GB': { '15': 8 },
    '3GB': { '30': 11 },
    '5GB': { '30': 16.5 },
    '10GB': { '30': 25 },
    '20GB': { '30': 50 },
    'unlimited': { '10': 50 },
  },
  '歐洲地區': {
    '1GB': { '7': 5.5 },
    '2GB': { '15': 10 },
    '3GB': { '30': 14 },
    '5GB': { '30': 21 },
    '10GB': { '30': 38 },
    '20GB': { '30': 55 },
    '50GB': { '90': 150 },
    '100GB': { '180': 290 },
    'unlimited': { '10': 50 },
  },
  '北美地區': {
    '1GB': { '7': 7 },
    '2GB': { '15': 12.5 },
    '3GB': { '30': 18 },
    '5GB': { '30': 30 },
    '10GB': { '30': 50 },
  },
  '亞洲地區': {
    '1GB': { '7': 5.5 },
    '2GB': { '15': 10 },
    '3GB': { '30': 14 },
    '5GB': { '30': 21 },
    '10GB': { '30': 38 },
    '20GB': { '30': 55 },
    '50GB': { '90': 130 },
    '100GB': { '180': 250 },
  },
  '大洋洲': {
    '1GB': { '7': 5 },
    '2GB': { '15': 9.5 },
    '3GB': { '30': 14 },
    '5GB': { '30': 21 },
    '10GB': { '30': 38 },
    '20GB': { '30': 55 },
  },
  '非洲': {
    '1GB': { '30': 27.5 },
    '3GB': { '30': 60 },
  },
};

// Top up 售價白名單（日本用 package_id 當 key）
const JP_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'moshi-moshi-7days-1gb-topup': 4.8,
  'moshi-moshi-15days-2gb-topup': 7,
  'moshi-moshi-30days-3gb-topup': 10,
  'moshi-moshi-30days-5gb-topup': 15,
  'moshi-moshi-30days-10gb-topup': 22,
  'moshi-moshi-30days-20gb-topup': 32,
};

// 南韓
const KR_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'jang-7days-1gb-topup': 4.0,
  'jang-15days-2gb-topup': 7,
  'jang-30days-3gb-topup': 10,
  'jang-30days-5gb-topup': 15,
  'jang-30days-10gb-topup': 22,
  'jang-30days-20gb-topup': 40,
};
// 香港
const HK_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'hkmobile-7days-1gb-topup': 4.5,
  'hkmobile-15days-2gb-topup': 7,
  'hkmobile-30days-3gb-topup': 8.5,
  'hkmobile-30days-5gb-topup': 13,
  'hkmobile-30days-10gb-topup': 22,
  'hkmobile-10days-unlimited-topup': 55,
};
// 澳門
const MO_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'macau-mobile-7days-1gb-topup': 3.5,
  'macau-mobile-15days-2gb-topup': 6,
  'macau-mobile-30days-3gb-topup': 8.5,
  'macau-mobile-30days-5gb-topup': 13,
  'macau-mobile-30days-10gb-topup': 24,
  'macau-mobile-30days-20gb-topup': 44,
};
// 新加坡
const SG_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'connect-lah-7days-1gb-topup': 4.5,
  'connect-lah-15days-2gb-topup': 6.5,
  'connect-lah-30days-3gb-topup': 8.5,
  'connect-lah-30days-5gb-topup': 13,
  'connect-lah-30days-10gb-topup': 22,
  'connect-lah-30days-20gb-topup': 40,
  'connect-lah-10days-unlimited-topup': 55,
};
// 泰國
const TH_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'maew-7-days-1gb-topup': 4.5,
  'maew-15-days-2gb-topup': 5,
  'maew-30-days-3gb-topup': 6.5,
  'maew-30-days-5gb-topup': 10,
  'maew-30-days-10gb-topup': 14,
  'maew-30-days-20gb-topup': 20,
  'maew-30days-50gb-topup': 42,
};
// 越南
const VN_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'xin-chao-7days-1gb-topup': 4.5,
  'xin-chao-15days-2gb-topup': 7.5,
  'xin-chao-30days-3gb-topup': 10,
  'xin-chao-30days-5gb-topup': 15,
  'xin-chao-30days-10gb-topup': 29,
  'xin-chao-30days-20gb-topup': 50,
};
// 馬來西亞
const MY_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'sambungkan-7days-1gb-topup': 4.5,
  'sambungkan-15days-2gb-topup': 8,
  'sambungkan-30days-3gb-topup': 11,
  'sambungkan-30days-5gb-topup': 15,
  'sambungkan-30days-10gb-topup': 27,
  'sambungkan-30days-20gb-topup': 42,
  'sambungkan-10days-unlimited-topup': 50,
};
// 中國
const CN_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'chinacom-7days-1gb-topup': 5.5,
  'chinacom-15days-2gb-topup': 9,
  'chinacom-30days-3gb-topup': 12,
  'chinacom-30days-5gb-topup': 17,
  'chinacom-30days-10gb-topup': 30,
  'chinacom-30days-20gb-topup': 50,
  'chinam-mobile-10days-unlimited-topup': 55,
};
// 菲律賓
const PH_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'alpas-mobile-7days-1gb-topup': 4.5,
  'alpas-mobile-15days-2gb-topup': 8,
  'alpas-mobile-30days-3gb-topup': 10,
  'alpas-mobile-30days-5gb-topup': 15,
  'alpas-mobile-30days-10gb-topup': 27,
  'alpas-mobile-30days-20gb-topup': 50,
};
// 柬埔寨
const KH_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'connect-cambodia-7days-1gb-topup': 4.5,
  'connect-cambodia-15days-2gb-topup': 7.5,
  'connect-cambodia-30days-3gb-topup': 10,
  'connect-cambodia-30days-5gb-topup': 15,
  'connect-cambodia-30days-10gb-topup': 27,
  'connect-cambodia-30days-20gb-topup': 50,
};
// 美國（US）例外：key 不加 -topup
const US_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'change-7days-1gb-topup-20221229215302': 5.5,
  'change-15days-2gb-topup-20221229215309': 9,
  'change-30days-3gb-topup': 12,
  'change-30days-5gb-topup-20221229215440': 17,
  'change-30days-10gb-topup-20221229215338': 30,
  'change-30days-20gb-topup-20221229215352': 50,
};
// 英國（GB）例外：key 不加 -topup
const GB_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'uki-mobile-7days-1gb-topup-20241126133945': 5,
  'uki-mobile-15days-2gb-topup-20241126133955': 7.5,
  'uki-mobile-30days-3gb-topup-20241126134006': 10,
  'uki-mobile-30days-5gb-topup-20241126134018': 15,
  'uki-mobile-30days-10gb-topup-20241126134023': 22.5,
  'uki-mobile-30days-20gb-topup-20241126134039': 36,
};
// 德國
const DE_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'hallo-mobil-7days-1gb-topup': 4.5,
  'hallo-mobil-15days-2gb-topup': 6,
  'hallo-mobil-30days-3gb-topup': 8.5,
  'hallo-mobil-30days-5gb-topup': 13,
  'hallo-mobil-30days-10gb-topup': 23,
  'hallo-mobil-30days-20gb-topup': 40,
};
// 義大利
const IT_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'mamma-mia-7days-1gb-topup': 4.5,
  'mamma-mia-15days-2gb-topup': 8,
  'mamma-mia-30days-3gb-topup': 8.5,
  'mamma-mia-30days-5gb-topup': 13,
  'mamma-mia-30days-10gb-topup': 23,
  'mamma-mia-30days-20gb-topup': 40,
};
// 印尼
const ID_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'indotel-7days-1gb-topup': 5.5,
  'indotel-15days-2gb-topup': 8,
  'indotel-30days-3gb-topup': 11,
  'indotel-30days-5gb-topup': 16.5,
  'indotel-30days-10gb-topup': 25,
  'indotel-30days-20gb-topup': 50,
  'indotel-10days-unlimited-topup': 50,
};
// 歐洲地區
const EU_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'eurolink-7days-1gb-topup': 5.5,
  'eurolink-15days-2gb-topup': 10,
  'eurolink-30days-3gb-topup': 14,
  'eurolink-30days-5gb-topup': 21,
  'eurolink-30days-10gb-topup': 38,
  'eurolink-30days-20gb-topup': 55,
  'eurolink-90days-50gb-topup': 150,
  'eurolink-180days-100gb-topup': 290,
  'eurolink-10days-unlimited-topup': 50,
};
// 北美地區
const NA_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'americanmex-7days-1gb-topup': 7,
  'americanmex-15days-2gb-topup': 12.5,
  'americanmex-30days-3gb-topup': 18,
  'americanmex-30days-5gb-topup': 30,
  'americanmex-30days-10gb-topup': 50,
};
// 亞洲地區
const AS_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'asialink-7days-1gb-topup': 5.5,
  'asialink-15days-2gb-topup': 10,
  'asialink-30days-3gb-topup': 14,
  'asialink-30days-5gb-topup': 21,
  'asialink-30days-10gb-topup': 38,
  'asialink-30days-20gb-topup': 55,
  'asialink-90days-50gb-topup': 130,
  'asialink-180days-100gb-topup': 250,
};
// 大洋洲
const OC_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'oceanlink-7days-1gb-topup': 5,
  'oceanlink-15days-2gb-topup': 9.5,
  'oceanlink-30days-3gb-topup': 14,
  'oceanlink-30days-5gb-topup': 21,
  'oceanlink-30days-10gb-topup': 38,
  'oceanlink-30days-20gb-topup': 55,
};
// 非洲
const AF_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'hello-africa-30days-1gb-topup': 27.5,
  'hello-africa-30days-3gb-topup': 60,
};

// 只用 id 判斷白名單
function getSellPrice(package_id: string, price: number): number {
  // 依序查詢所有國家白名單
  const allMaps = [
    JP_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    KR_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    HK_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    MO_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    SG_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    TH_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    VN_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    MY_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    CN_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    PH_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    KH_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    US_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    GB_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    DE_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    IT_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    ID_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    EU_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    NA_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    AS_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    OC_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
    AF_TOPUP_SELL_PRICE_BY_PACKAGE_ID,
  ];
  for (const map of allMaps) {
    if (map[package_id]) return map[package_id];
  }
  // fallback
  return Math.round(price * 1.5 * 10) / 10;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const iccid = url.searchParams.get("iccid");
    if (!iccid) {
      return new Response(JSON.stringify({ error: "缺少 iccid 參數" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await getAiraloTopupPackages(iccid);

    // 新增：將查詢到的 top up 方案 upsert 進資料庫，並將 upsert 結果與錯誤直接回傳
    let upsertResult = null;
    let upsertError = null;
    try {
      // upsert 時自動帶入 sell_price
      const upsertRows = (data.data || []).map((item: any) => {
        const net_price = Number(item.price);
        const sell_price = getSellPrice(item.id, net_price);
        return {
          iccid,
          package_id: item.id,
          type: item.type,
          net_price,
          sell_price,
          amount: item.amount,
          day: item.day,
          is_unlimited: item.is_unlimited,
          title: item.title,
          data: item.data,
        };
      });
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      const { data: result, error } = await supabaseAdmin.from('esim_topups').upsert(upsertRows, { onConflict: 'iccid,package_id' });
      upsertResult = result;
      upsertError = error;
    } catch (dbErr) {
      upsertError = dbErr?.message || dbErr;
      console.log('upsert esim_topups 失敗:', dbErr?.message || dbErr);
    }

    return new Response(JSON.stringify({
      data,
      upsertResult,
      upsertError
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "伺服器錯誤", detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 