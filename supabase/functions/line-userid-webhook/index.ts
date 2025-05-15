import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  if (req.method === "HEAD") {
    return new Response("ok", { status: 200 });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  try {
    const body = await req.json();
    console.log("收到 LINE webhook event:", JSON.stringify(body, null, 2));
    if (body.events && Array.isArray(body.events)) {
      for (const event of body.events) {
        if (event.source && event.source.userId) {
          console.log("LINE userId:", event.source.userId);
        }
      }
    }
    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("解析 webhook event 失敗:", e);
    return new Response("Bad Request", { status: 400 });
  }
}); 