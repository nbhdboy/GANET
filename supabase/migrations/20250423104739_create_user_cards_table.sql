-- 創建用戶卡片表
create table if not exists public.user_cards (
    id uuid default gen_random_uuid() primary key,
    line_user_id text not null,
    card_key text,
    card_token text,
    last_four text,
    brand text,
    expiry_month text,
    expiry_year text,
    is_default boolean default false,
    email text,
    carrier text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 創建更新時間觸發器
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_user_cards_updated_at
    before update on public.user_cards
    for each row
    execute function update_updated_at_column();

-- 創建索引
create index idx_user_cards_line_user_id on public.user_cards(line_user_id);
