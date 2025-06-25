-- 建立 eSIM 方案資料表
create table if not exists public.esim_packages (
    id uuid default gen_random_uuid() primary key,
    package_id text not null, -- Airalo 套餐 package_id
    country text not null,
    country_code text,
    operator text,
    data text not null,
    amount numeric,
    day int not null,
    net_price numeric,
    sell_price numeric,
    is_unlimited boolean,
    fair_usage_policy text,
    type VARCHAR(32) DEFAULT 'sim', -- 新增，標記方案型態
    updated_at timestamp with time zone default now()
);

create index idx_esim_packages_country on public.esim_packages(country);
create index idx_esim_packages_data_day on public.esim_packages(data, day); 