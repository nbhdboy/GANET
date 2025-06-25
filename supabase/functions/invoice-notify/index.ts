import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';
import nodemailer from "npm:nodemailer@6.9.11";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const data = await req.json();

    // 1. 寫入異常通知紀錄
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    await supabase.from('invoice_notify_logs').insert([{
      order_number: data.order_number,
      rec_invoice_id: data.rec_invoice_id,
      invoice_number: data.invoice_number,
      status: data.status,
      msg: data.msg,
      raw_payload: data
    }]);

    // 2. 寄送 email 通知管理者
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: Deno.env.get('ADMIN_EMAIL'),
        pass: Deno.env.get('ADMIN_EMAIL_PASS')
      }
    });

    const mailOptions = {
      from: Deno.env.get('ADMIN_EMAIL'),
      to: Deno.env.get('ADMIN_EMAIL'),
      subject: '【警告】電子發票異常通知',
      text: `收到 TapPay 發票異常通知\n\norder_number: ${data.order_number}\nrec_invoice_id: ${data.rec_invoice_id}\nstatus: ${data.status}\nmsg: ${data.msg}\n\n完整內容：\n${JSON.stringify(data, null, 2)}`
    };

    await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 