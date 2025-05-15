import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

console.log("airalo-webhook function loaded");

const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";
const TEST_USER_ID = "U6d8c55f194cdabf3dec7bf47c9e485a1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
console.log("SUPABASE_URL:", SUPABASE_URL);
console.log("SUPABASE_ANON_KEY set:", !!SUPABASE_ANON_KEY);
console.log("LINE_CHANNEL_ACCESS_TOKEN set:", !!LINE_CHANNEL_ACCESS_TOKEN);

const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_ANON_KEY ?? "");

const messages: Record<string, string> = {
  data_90: "提醒您，您正在使用的 eSIM 數據剩餘不足 10%。若您需要繼續使用，請盡快前往加值；若無需再使用，請忽略此訊息。",
  expire_1: "提醒您，您所購買的 eSIM 將於一天後到期。若您計劃繼續使用，請儘速完成數據使用；若無需再使用，請忽略此訊息。"
};

serve(async (req) => {
  console.log("airalo-webhook function started");
  if (req.method === "HEAD") {
    return new Response("ok", { status: 200 });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  try {
    const body = await req.json();
    console.log("收到 Airalo webhook payload:", JSON.stringify(body, null, 2));

    // 資料表寫入
    const insertData = {
      iccid: body.iccid ?? null,
      airalo_user_id: body.user_id ?? null,
      package_slug: body.package_slug ?? null,
      level: body.level ?? null,
      remaining_percentage: body.remaining_percentage ?? null,
      received_at: new Date().toISOString(),
    };
    const { data, error: dbError } = await supabase.from("low_data_notifications").insert([insertData]);
    console.log("Supabase insert result:", data, dbError);
    if (dbError) {
      console.error("寫入 low_data_notifications 失敗:", dbError);
    } else {
      console.log("已寫入 low_data_notifications");
    }

    const { type, level } = body;
    // fallback 條件：type 為 data_90 或 level 為 90% 都推播 LINE
    if (
      type === "data_90" ||
      level === "90%" ||
      type === "expire_1" ||
      level === "1" ||
      level === "1day"
    ) {
      if (!LINE_CHANNEL_ACCESS_TOKEN) {
        console.error("LINE_CHANNEL_ACCESS_TOKEN 未設定");
        return new Response("LINE access token not set", { status: 500 });
      }
      // 根據 type 或 level 決定訊息內容
      let text = messages[type];
      if (!text && level === "90%") text = messages["data_90"];
      if (!text && (level === "1" || level === "1day")) text = messages["expire_1"];
      // === 正式環境推播 userId 查詢邏輯（備註） ===
      // 1. 用 iccid 查 esim_order_detail 拿到 order_id
      // 2. 用 order_id 查 esim_orders 拿到 user_id（這就是 LINE userId）
      // 3. 推播時用查出來的 userId
      // 範例：
      // let userId = null;
      // const { data: detailRows, error: detailErr } = await supabase
      //   .from("esim_order_detail")
      //   .select("order_id")
      //   .eq("iccid", body.iccid)
      //   .maybeSingle();
      // if (!detailErr && detailRows && detailRows.order_id) {
      //   const { data: orderRows, error: orderErr } = await supabase
      //     .from("esim_orders")
      //     .select("user_id")
      //     .eq("id", detailRows.order_id)
      //     .maybeSingle();
      //   if (!orderErr && orderRows && orderRows.user_id) {
      //     userId = orderRows.user_id;
      //   }
      // }
      // if (!userId) {
      //   console.error("查無對應 userId，無法推播");
      //   return new Response("No userId found", { status: 200 });
      // }
      // === 正式環境推播 userId 查詢邏輯結束 ===
      // 發送 LINE 推播
      const res = await fetch(LINE_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          to: TEST_USER_ID,
          messages: [{ type: "text", text }],
        }),
      });
      const lineResult = await res.text();
      console.log("LINE API response:", lineResult);
    }
    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("解析 webhook payload 失敗:", e);
    return new Response("Bad Request", { status: 400 });
  }
}); 