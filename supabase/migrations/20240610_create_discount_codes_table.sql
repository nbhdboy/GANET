-- 建立一次性折扣碼 table
create table if not exists public.discount_codes (
    id uuid default gen_random_uuid() primary key,
    code text not null unique, -- 折扣碼
    rate numeric not null,     -- 折扣比例（如 0.9 代表 9折）
    used boolean not null default false, -- 是否已用過
    used_at timestamptz,       -- 使用時間
    used_by text,              -- 使用者ID（可為null）
    created_at timestamptz default now()
); 