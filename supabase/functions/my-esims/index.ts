import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    let user_id = '';
    if (req.method === 'POST') {
      const body = await req.json();
      user_id = body.user_id;
    } else {
      const url = new URL(req.url);
      user_id = url.searchParams.get('user_id') || '';
    }
    console.log('[my-esims] user_id:', user_id);
    if (!user_id) {
      return new Response(JSON.stringify({ error: "缺少 user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SERVICE_ROLE_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // 查詢 esim_orders
    const ordersRes = await fetch(`${SUPABASE_URL}/rest/v1/esim_orders?select=order_id,package_id,package_name,data,validity,sell_price,currency,brand_settings_name,created_at,type,iccid&user_id=eq.${user_id}`, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json"
      }
    });
    const orders = await ordersRes.json();
    console.log('[my-esims] orders:', orders);
    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // 取得所有 order_id（int 型別，不加雙引號）
    const orderIds = orders.map((o: any) => o.order_id);
    console.log('[my-esims] orderIds:', orderIds);
    if (!orderIds.length) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // 查詢 esim_order_detail（只查存在的欄位）
    const detailRes = await fetch(`${SUPABASE_URL}/rest/v1/esim_order_detail?select=order_id,iccid,apn_value,apn_type,lpa,matching_id,qrcode,qrcode_url,direct_apple_installation_url,is_roaming,confirmation_code,created_at&order_id=in.(${orderIds.join(',')})`, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json"
      }
    });
    let details = await detailRes.json();
    console.log('[my-esims] details:', details);
    if (!Array.isArray(details)) details = [];
    // 取得所有 package_id
    const packageIds = orders.map((o: any) => o.package_id).filter(Boolean);
    console.log('[my-esims] packageIds:', packageIds);
    let packagesMap: Record<string, { country: string, country_code: string }> = {};
    if (packageIds.length) {
      // 修正 in.() 查詢語法，不加單引號
      const inQuery = packageIds.join(',');
      const queryUrl = `${SUPABASE_URL}/rest/v1/esim_packages?select=package_id,country,country_code&package_id=in.(${inQuery})`;
      console.log('[my-esims] 查詢語法:', queryUrl);
      const packagesRes = await fetch(queryUrl, {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json"
        }
      });
      const packages = await packagesRes.json();
      console.log('[my-esims] packages:', packages);
      if (Array.isArray(packages)) {
        packagesMap = Object.fromEntries(packages.map((p: any) => [p.package_id, { country: p.country, country_code: p.country_code }]));
      }
    }
    // 先分主卡與 topup
    const mainEsims = orders.filter((order: any) => order.type === 'sim');
    const topups = orders.filter((order: any) => order.type === 'topup');
    console.log('[my-esims] topups:', topups);
    // 幫每張主卡加上 addOnPackages
    const result = mainEsims.map((order: any) => {
      const detail = details.find((d: any) => d.order_id === order.order_id) || {};
      const pkgInfo = packagesMap[order.package_id] || {};
      // 找出所有屬於這張主卡的 topup（iccid 相同）
      const addOnPackages = topups.filter(t => t.iccid && t.iccid === detail.iccid).map(t => {
        // 統一 dataAmount 格式為 "X GB"
        let dataAmount = t.data || t.dataAmount || '';
        if (typeof dataAmount === 'number') dataAmount = `${dataAmount} GB`;
        if (typeof dataAmount === 'string' && !dataAmount.includes('GB')) dataAmount = `${dataAmount} GB`;
        // 統一 validity 格式為 "X天"
        let validity = t.validity;
        if (typeof validity === 'number') validity = `${validity}天`;
        if (typeof validity === 'string' && !validity.includes('天')) validity = `${validity}天`;
        return {
          created_at: t.created_at,
          dataAmount,
          validity,
          sell_price: t.sell_price,
          country: pkgInfo.country || '',
          countryCode: pkgInfo.country_code || ''
        };
      });
      // 主卡 data 統一格式
      let data = order.data;
      if (typeof data === 'number') data = `${data} GB`;
      if (typeof data === 'string' && !data.includes('GB')) data = `${data} GB`;
      // 主卡 validity 統一格式
      let validity = order.validity;
      if (typeof validity === 'number') validity = `${validity}天`;
      if (typeof validity === 'string' && !validity.includes('天')) validity = `${validity}天`;
      // 新增 totalData 欄位：主卡 data + 所有加購 dataAmount 的加總
      const parseGB = (str) => {
        if (!str) return 0;
        if (typeof str === 'number') return str;
        const match = String(str).match(/([\d.]+)\s*GB/i);
        return match ? parseFloat(match[1]) : 0;
      };
      const mainGB = parseGB(data);
      const addOnGB = addOnPackages.reduce((sum, a) => sum + parseGB(a.dataAmount), 0);
      const totalData = `${mainGB + addOnGB} GB`;
      return {
        order_id: order.order_id,
        package_id: order.package_id,
        package_name: order.package_name,
        data,
        validity,
        totalData,
        price: order.sell_price,
        sell_price: order.sell_price,
        currency: order.currency,
        brand_settings_name: order.brand_settings_name,
        created_at: order.created_at,
        type: order.type,
        iccid: detail.iccid || '',
        apn_value: detail.apn_value || '',
        apn_type: detail.apn_type || '',
        lpa: detail.lpa || '',
        matching_id: detail.matching_id || '',
        qrcode: detail.qrcode || '',
        qrcode_url: detail.qrcode_url || '',
        direct_apple_installation_url: detail.direct_apple_installation_url || '',
        is_roaming: detail.is_roaming || false,
        confirmation_code: detail.confirmation_code || '',
        sim_created_at: detail.created_at || '',
        country: pkgInfo.country || '',
        countryCode: pkgInfo.country_code || '',
        addOnPackages
      };
    });
    console.log('[my-esims] result:', result);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('[my-esims] error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 