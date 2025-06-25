import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { getAiraloTopupPackages } from "../_shared/airalo.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Top up 售價白名單（日本用 package_id 當 key）
const JP_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'moshi-moshi-7days-1gb-topup': Math.round(4.8 * 31),
  'moshi-moshi-15days-2gb-topup': Math.round(7 * 31),
  'moshi-moshi-30days-3gb-topup': Math.round(10 * 31),
  'moshi-moshi-30days-5gb-topup': Math.round(15 * 31),
  'moshi-moshi-30days-10gb-topup': Math.round(22 * 31),
  'moshi-moshi-30days-20gb-topup': Math.round(32 * 31),
};

// 南韓
const KR_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'jang-7days-1gb-topup': Math.round(4.0 * 31),
  'jang-15days-2gb-topup': Math.round(7 * 31),
  'jang-30days-3gb-topup': Math.round(10 * 31),
  'jang-30days-5gb-topup': Math.round(15 * 31),
  'jang-30days-10gb-topup': Math.round(22 * 31),
  'jang-30days-20gb-topup': Math.round(40 * 31),
};
// 香港
const HK_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'hkmobile-7days-1gb-topup': Math.round(4.5 * 31),
  'hkmobile-15days-2gb-topup': Math.round(7 * 31),
  'hkmobile-30days-3gb-topup': Math.round(8.5 * 31),
  'hkmobile-30days-5gb-topup': Math.round(13 * 31),
  'hkmobile-30days-10gb-topup': Math.round(22 * 31),
  'hkmobile-10days-unlimited-topup': Math.round(55 * 31),
};
// 澳門
const MO_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'macau-mobile-7days-1gb-topup': Math.round(3.5 * 31),
  'macau-mobile-15days-2gb-topup': Math.round(6 * 31),
  'macau-mobile-30days-3gb-topup': Math.round(8.5 * 31),
  'macau-mobile-30days-5gb-topup': Math.round(13 * 31),
  'macau-mobile-30days-10gb-topup': Math.round(24 * 31),
  'macau-mobile-30days-20gb-topup': Math.round(44 * 31),
};
// 新加坡
const SG_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'connect-lah-7days-1gb-topup': Math.round(4.5 * 31),
  'connect-lah-15days-2gb-topup': Math.round(6.5 * 31),
  'connect-lah-30days-3gb-topup': Math.round(8.5 * 31),
  'connect-lah-30days-5gb-topup': Math.round(13 * 31),
  'connect-lah-30days-10gb-topup': Math.round(22 * 31),
  'connect-lah-30days-20gb-topup': Math.round(40 * 31),
  'connect-lah-10days-unlimited-topup': Math.round(55 * 31),
};
// 泰國
const TH_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'maew-7-days-1gb-topup': Math.round(4.5 * 31),
  'maew-15-days-2gb-topup': Math.round(5 * 31),
  'maew-30-days-3gb-topup': Math.round(6.5 * 31),
  'maew-30-days-5gb-topup': Math.round(10 * 31),
  'maew-30-days-10gb-topup': Math.round(14 * 31),
  'maew-30-days-20gb-topup': Math.round(20 * 31),
  'maew-30days-50gb-topup': Math.round(42 * 31),
};
// 越南
const VN_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'xin-chao-7days-1gb-topup': Math.round(4.5 * 31),
  'xin-chao-15days-2gb-topup': Math.round(7.5 * 31),
  'xin-chao-30days-3gb-topup': Math.round(10 * 31),
  'xin-chao-30days-5gb-topup': Math.round(15 * 31),
  'xin-chao-30days-10gb-topup': Math.round(29 * 31),
  'xin-chao-30days-20gb-topup': Math.round(50 * 31),
};
// 馬來西亞
const MY_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'sambungkan-7days-1gb-topup': Math.round(4.5 * 31),
  'sambungkan-15days-2gb-topup': Math.round(8 * 31),
  'sambungkan-30days-3gb-topup': Math.round(11 * 31),
  'sambungkan-30days-5gb-topup': Math.round(15 * 31),
  'sambungkan-30days-10gb-topup': Math.round(27 * 31),
  'sambungkan-30days-20gb-topup': Math.round(42 * 31),
  'sambungkan-10days-unlimited-topup': Math.round(50 * 31),
};
// 中國
const CN_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'chinacom-7days-1gb-topup': Math.round(5.5 * 31),
  'chinacom-15days-2gb-topup': Math.round(9 * 31),
  'chinacom-30days-3gb-topup': Math.round(12 * 31),
  'chinacom-30days-5gb-topup': Math.round(17 * 31),
  'chinacom-30days-10gb-topup': Math.round(30 * 31),
  'chinacom-30days-20gb-topup': Math.round(50 * 31),
  'chinam-mobile-10days-unlimited-topup': Math.round(55 * 31),
};
// 菲律賓
const PH_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'alpas-mobile-7days-1gb-topup': Math.round(4.5 * 31),
  'alpas-mobile-15days-2gb-topup': Math.round(8 * 31),
  'alpas-mobile-30days-3gb-topup': Math.round(10 * 31),
  'alpas-mobile-30days-5gb-topup': Math.round(15 * 31),
  'alpas-mobile-30days-10gb-topup': Math.round(27 * 31),
  'alpas-mobile-30days-20gb-topup': Math.round(50 * 31),
};
// 柬埔寨
const KH_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'connect-cambodia-7days-1gb-topup': Math.round(4.5 * 31),
  'connect-cambodia-15days-2gb-topup': Math.round(7.5 * 31),
  'connect-cambodia-30days-3gb-topup': Math.round(10 * 31),
  'connect-cambodia-30days-5gb-topup': Math.round(15 * 31),
  'connect-cambodia-30days-10gb-topup': Math.round(27 * 31),
  'connect-cambodia-30days-20gb-topup': Math.round(50 * 31),
};
// 美國（US）例外：key 不加 -topup
const US_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'change-7days-1gb-topup-20221229215302': Math.round(5.5 * 31),
  'change-15days-2gb-topup-20221229215309': Math.round(9 * 31),
  'change-30days-3gb-topup': Math.round(12 * 31),
  'change-30days-5gb-topup-20221229215440': Math.round(17 * 31),
  'change-30days-10gb-topup-20221229215338': Math.round(30 * 31),
  'change-30days-20gb-topup-20221229215352': Math.round(50 * 31),
};
// 英國（GB）例外：key 不加 -topup
const GB_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'uki-mobile-7days-1gb-topup-20241126133945': Math.round(5 * 31),
  'uki-mobile-15days-2gb-topup-20241126133955': Math.round(7.5 * 31),
  'uki-mobile-30days-3gb-topup-20241126134006': Math.round(10 * 31),
  'uki-mobile-30days-5gb-topup-20241126134018': Math.round(15 * 31),
  'uki-mobile-30days-10gb-topup-20241126134023': Math.round(22.5 * 31),
  'uki-mobile-30days-20gb-topup-20241126134039': Math.round(36 * 31),
};
// 德國
const DE_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'hallo-mobil-7days-1gb-topup': Math.round(4.5 * 31),
  'hallo-mobil-15days-2gb-topup': Math.round(6 * 31),
  'hallo-mobil-30days-3gb-topup': Math.round(8.5 * 31),
  'hallo-mobil-30days-5gb-topup': Math.round(13 * 31),
  'hallo-mobil-30days-10gb-topup': Math.round(23 * 31),
  'hallo-mobil-30days-20gb-topup': Math.round(40 * 31),
};
// 義大利
const IT_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'mamma-mia-7days-1gb-topup': Math.round(4.5 * 31),
  'mamma-mia-15days-2gb-topup': Math.round(8 * 31),
  'mamma-mia-30days-3gb-topup': Math.round(8.5 * 31),
  'mamma-mia-30days-5gb-topup': Math.round(13 * 31),
  'mamma-mia-30days-10gb-topup': Math.round(23 * 31),
  'mamma-mia-30days-20gb-topup': Math.round(40 * 31),
};
// 印尼
const ID_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'indotel-7days-1gb-topup': Math.round(5.5 * 31),
  'indotel-15days-2gb-topup': Math.round(8 * 31),
  'indotel-30days-3gb-topup': Math.round(11 * 31),
  'indotel-30days-5gb-topup': Math.round(16.5 * 31),
  'indotel-30days-10gb-topup': Math.round(25 * 31),
  'indotel-30days-20gb-topup': Math.round(50 * 31),
  'indotel-10days-unlimited-topup': Math.round(50 * 31),
};
// 歐洲地區
const EU_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'eurolink-7days-1gb-topup': Math.round(5.5 * 31),
  'eurolink-15days-2gb-topup': Math.round(10 * 31),
  'eurolink-30days-3gb-topup': Math.round(14 * 31),
  'eurolink-30days-5gb-topup': Math.round(21 * 31),
  'eurolink-30days-10gb-topup': Math.round(38 * 31),
  'eurolink-30days-20gb-topup': Math.round(55 * 31),
  'eurolink-90days-50gb-topup': Math.round(150 * 31),
  'eurolink-180days-100gb-topup': Math.round(290 * 31),
  'eurolink-10days-unlimited-topup': Math.round(50 * 31),
};
// 北美地區
const NA_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'americanmex-7days-1gb-topup': Math.round(7 * 31),
  'americanmex-15days-2gb-topup': Math.round(12.5 * 31),
  'americanmex-30days-3gb-topup': Math.round(18 * 31),
  'americanmex-30days-5gb-topup': Math.round(30 * 31),
  'americanmex-30days-10gb-topup': Math.round(50 * 31),
};
// 亞洲地區
const AS_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'asialink-7days-1gb-topup': Math.round(5.5 * 31),
  'asialink-15days-2gb-topup': Math.round(10 * 31),
  'asialink-30days-3gb-topup': Math.round(14 * 31),
  'asialink-30days-5gb-topup': Math.round(21 * 31),
  'asialink-30days-10gb-topup': Math.round(38 * 31),
  'asialink-30days-20gb-topup': Math.round(55 * 31),
  'asialink-90days-50gb-topup': Math.round(130 * 31),
  'asialink-180days-100gb-topup': Math.round(250 * 31),
};
// 大洋洲
const OC_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'oceanlink-7days-1gb-topup': Math.round(5 * 31),
  'oceanlink-15days-2gb-topup': Math.round(9.5 * 31),
  'oceanlink-30days-3gb-topup': Math.round(14 * 31),
  'oceanlink-30days-5gb-topup': Math.round(21 * 31),
  'oceanlink-30days-10gb-topup': Math.round(38 * 31),
  'oceanlink-30days-20gb-topup': Math.round(55 * 31),
};
// 非洲
const AF_TOPUP_SELL_PRICE_BY_PACKAGE_ID: Record<string, number> = {
  'hello-africa-30days-1gb-topup': Math.round(27.5 * 31),
  'hello-africa-30days-3gb-topup': Math.round(60 * 31),
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
  return Math.round(price * 1.5 * 31);
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
        const sell_price = getSellPrice(item.id, Number(item.price));
        return {
          iccid,
          package_id: item.id,
          type: item.type,
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

      // 新增：upsert 完直接查詢 DB，回傳 DB 內容
      const { data: dbTopups, error: dbError } = await supabaseAdmin
        .from('esim_topups')
        .select('id, iccid, package_id, type, sell_price, amount, day, is_unlimited, title, data, created_at')
        .eq('iccid', iccid);

      return new Response(JSON.stringify({
        data: dbTopups, // 回傳 DB 查到的資料
        upsertResult,
        upsertError: dbError || upsertError
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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