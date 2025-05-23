import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { encode as b64encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";

// 內建 TextEncoder 取代 encoding/utf8.ts
const encodeToUint8Array = (str: string) => new TextEncoder().encode(str);

// HMAC-SHA256 驗證簽名（修正版，使用標準 base64）
async function verifyLineSignature(secret: string, body: string, signature: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    encodeToUint8Array(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    encodeToUint8Array(body)
  );
  const computedSignature = b64encode(new Uint8Array(sig));
  return computedSignature === signature;
}

// FAQ 內容直接寫在程式碼中
const faqs: Array<{ question: string; answer: string }> = [
  { "question": "可以撥打電話或傳簡訊嗎？", "answer": "目前我們的 eSIM 服務不支援撥打和接收電話及簡訊。但您仍然可以使用 iMessage。" },
  { "question": "會有額外費用嗎？", "answer": "使用 CANET eSIM 不會產生任何額外費用。顯示的價格即為最終價格。" },
  { "question": "如何查看目前的數據用量？", "answer": "當您的數據即將用完時，我們會透過 LINE 官方帳號通知您。您也可以在 Mini app 的「我的 eSIM」中查看目前用量，並隨時進行充值。" },
  { "question": "無法連線到網路該怎麼辦？", "answer": "1. 進入「設定」→「行動網路」→ 檢查已啟用的號碼是否顯示，如有則關閉後重新開啟。\n2.「行動網路」→「eSIM」→ 檢查數據漫遊是否已開啟。\n3. 檢查 APN 設定是否正確，如不正確請手動修改。您可以在「我的 eSIM」→「eSIM 詳情」中找到正確設定。\n4. 在「電信業者選擇」中，關閉自動選擇並手動選擇支援的網路。\n5. 重設網路設定：「設定」>「一般」>「傳輸或重設 iPhone」>「重設網路設定」。\n6. 重新啟動裝置。\n\n如果執行以上步驟後仍無法連線，請聯繫我們的 LINE 官方帳號尋求協助。" },
  { "question": "可以開啟熱點分享嗎？", "answer": "是的，您可以使用熱點分享功能。但請注意，開啟熱點分享會增加數據用量。" },
  { "question": "為什麼我的裝置顯示不支援 eSIM？", "answer": "請確認您的裝置型號是否支援 eSIM。您可以在裝置的「設定」→「一般」→「關於本機」中查看是否有 eSIM 相關資訊。如需協助，請聯繫我們的客服。" },
  { "question": "數據用完了怎麼辦？", "answer": "您可以在 Mini app 中購買數據充值包。我們提供多種容量選擇，價格合理且即買即用。" },
  { "question": "可以同時使用多張 eSIM 嗎？", "answer": "是的，但需要您的裝置支援多張 eSIM 同時啟用。請注意，同時啟用多張 eSIM 可能會增加耗電量。" },
  { "question": "如何查看數據用量？", "answer": "您可以在「設定」→「行動網路」→「數據用量」中查看，或在我們的 Mini app 中查看詳細用量統計。" },
  { "question": "安裝 eSIM 時遇到問題怎麼辦？", "answer": "請確保您的裝置已連接到網路，並按照安裝指南的步驟操作。如果仍有問題，請聯繫我們的客服人員協助。" },
  { "question": "如何更換裝置？", "answer": "如需將 eSIM 轉移到新裝置，請先聯繫我們的客服。我們會協助您完成轉移程序。" },
  { "question": "如何聯繫客服？", "answer": "如有任何問題或需要協助，請透過我們的 LINE 官方帳號聯絡。我們的客服團隊服務時間為週一至週五，早上 9 點至下午 6 點。" }
];

// Gemini API 設定
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY environment variable");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY;

// LINE Channel Access Token
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
if (!LINE_CHANNEL_ACCESS_TOKEN) throw new Error("Missing LINE_CHANNEL_ACCESS_TOKEN environment variable");
// LINE Channel Secret
const LINE_CHANNEL_SECRET = Deno.env.get("LINE_CHANNEL_SECRET");
if (!LINE_CHANNEL_SECRET) throw new Error("Missing LINE_CHANNEL_SECRET environment variable");

// LINE webhook handler
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  // 取得原始 body
  const rawBody = await req.text();
  // 取得 LINE 簽名
  const signature = req.headers.get("x-line-signature") || "";
  // 驗證簽名
  const valid = await verifyLineSignature(LINE_CHANNEL_SECRET, rawBody, signature);
  if (!valid) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const body = JSON.parse(rawBody);
    console.log("收到 LINE webhook body:", JSON.stringify(body));
    const events = body.events || [];
    
    for (const event of events) {
      console.log("收到 event:", JSON.stringify(event));
      if (event.type === "message" && event.message.type === "text") {
        const userQuestion = event.message.text;
        // FAQ context 組合
        let context = "以下是常見問題與解答：\n";
        faqs.forEach(faq => {
          context += `Q: ${faq.question}\nA: ${faq.answer}\n`;
        });
        context += `\n請根據上述 FAQ 內容，用繁體中文回答下列問題：${userQuestion}`;
        
        // 呼叫 Gemini API
        const geminiRes = await fetch(GEMINI_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: context }] }
            ]
          })
        });
        const geminiData = await geminiRes.json();
        console.log("Gemini API 回傳:", JSON.stringify(geminiData));
        const answer = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "很抱歉，目前無法回答您的問題。";
        
        // 呼叫 LINE Messaging API reply endpoint
        const lineRes = await fetch("https://api.line.me/v2/bot/message/reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            replyToken: event.replyToken,
            messages: [{ type: "text", text: answer }]
          })
        });
        
        if (!lineRes.ok) {
          console.error("LINE API 回傳錯誤:", await lineRes.text());
        }
        
        console.log("回覆給 LINE:", JSON.stringify({ replyToken: event.replyToken, answer }));
      }
    }
    
    // 回傳 200 OK 給 LINE Platform
    return new Response("ok", {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    console.error("function error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}); 