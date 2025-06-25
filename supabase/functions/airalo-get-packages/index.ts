import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 取得查詢參數 country_code
    const url = new URL(req.url);
    const countryCodeParam = url.searchParams.get('country_code');
    const countryCodeQuery = countryCodeParam ? `eq.${countryCodeParam}` : undefined;

    // 只查詢 DB，回傳細分專案給前端
    // 只回傳 country_code, operator, data, day, sell_price
    if (SUPABASE_URL && SERVICE_ROLE_KEY) {
      let dbUrl = `${SUPABASE_URL}/rest/v1/esim_packages?select=package_id,country_code,operator,data,day,sell_price`;
      if (countryCodeQuery) {
        dbUrl += `&country_code=${countryCodeQuery}`;
      }
      const dbRes = await fetch(dbUrl, {
        method: "GET",
        headers: {
          "apikey": SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json"
        }
      });
      const dbData = await dbRes.json();
      return new Response(JSON.stringify(dbData), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    } else {
      return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SERVICE_ROLE_KEY" }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }
  } catch (error) {
    // 若 error.message 包含 Unauthenticated，回傳 401
    if (error.message && error.message.includes("Unauthenticated")) {
      return new Response(JSON.stringify({ error: "Unauthenticated" }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}); 