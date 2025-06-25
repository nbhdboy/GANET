-- 建立發票異常通知紀錄表
create table if not exists public.invoice_notify_logs (
    id uuid default gen_random_uuid() primary key,
    order_number text,
    rec_invoice_id text,
    invoice_number text,
    status text,
    msg text,
    raw_payload jsonb,
    created_at timestamptz default now()
); 