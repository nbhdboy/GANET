import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  console.log('【Function 入口】收到請求', req.method, req.url);

  if (req.method === "OPTIONS") {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { line_user_id } = await req.json();
    if (!line_user_id) {
      return new Response(JSON.stringify({ error: "Missing line_user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 查詢 user_cards 資料表，撈最新一筆（用 updated_at 排序）
    const { data: cards, error } = await supabase
      .from("user_cards")
      .select("*")
      .eq("line_user_id", line_user_id)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error || !cards || cards.length === 0) {
      // 如果查無資料，回傳 200 並帶 success: true
      return new Response(JSON.stringify({ success: true, message: '卡片已不存在' }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const latestCard = cards[0];
    const card_key = latestCard.card_key;
    const card_token = latestCard.card_token;

    // 準備 TapPay payload 並 log 出來
    const tappayPayload = {
      partner_key: Deno.env.get("TAPPAY_PARTNER_KEY"),
      card_key: latestCard.card_key,
      card_token: latestCard.card_token
    };
    console.log('【TapPay】準備送出刪除卡片 payload:', tappayPayload);

    // 呼叫 TapPay API
    const tappayRes = await fetch("https://sandbox.tappaysdk.com/tpc/card/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("TAPPAY_PARTNER_KEY")
      },
      body: JSON.stringify(tappayPayload)
    });
    const tappayData = await tappayRes.json();
    console.log('【TapPay】API 回傳:', tappayData);

    if (tappayData.status !== 0) {
      return new Response(JSON.stringify({ error: tappayData.msg || "TapPay remove card failed", tappay: tappayData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TapPay 刪除成功後，從 Supabase user_cards 資料表刪除該卡片
    const { error: deleteError } = await supabase
      .from("user_cards")
      .delete()
      .eq("id", latestCard.id);
    if (deleteError) {
      return new Response(JSON.stringify({ error: "TapPay 刪除成功但資料庫刪除失敗", detail: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 再次確認該 user 沒有殘留卡片
    const { data: remainCards } = await supabase
      .from("user_cards")
      .select("id")
      .eq("line_user_id", line_user_id);
    if (remainCards && remainCards.length > 0) {
      console.warn(`刪除後仍有殘留卡片:`, remainCards);
    }

    return new Response(JSON.stringify({ success: true, tappay: tappayData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 