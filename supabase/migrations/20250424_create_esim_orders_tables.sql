-- 建立 eSIM 訂單主表
create table if not exists public.esim_orders (
    id uuid default gen_random_uuid() primary key,
    user_id text not null,
    order_id integer not null, -- Airalo 訂單 id
    order_code text,
    package_id text,
    package_name text,
    data text,
    validity integer,
    price numeric,
    currency text,
    description text,
    type text, -- 新增，記錄訂單型態 sim/topup
    iccid text, -- 新增，記錄加值對象 ICCID
    esim_type text,
    created_at timestamptz, -- Airalo 訂單建立時間
    manual_installation text,
    qrcode_installation text,
    installation_guides jsonb,
    brand_settings_name text,
    raw_response jsonb,
    sell_price numeric, -- 新增，加購或主卡實際售價
    discount_code text, -- 新增，紀錄使用的折扣碼
    discount_rate numeric, -- 新增，紀錄折扣比例（如 0.9 代表 9 折）
    rec_invoice_id varchar(32), -- 新增，發票唯一識別碼
    invoice_number varchar(16), -- 新增，發票號碼
    invoice_date varchar(8),    -- 新增，發票日期
    invoice_time varchar(8),    -- 新增，發票時間
    inserted_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 建立 eSIM 訂單明細表
create table if not exists public.esim_order_detail (
    id uuid default gen_random_uuid() primary key,
    order_id integer not null, -- 關聯 esim_orders.order_id
    sim_id integer not null,   -- Airalo sims.id
    iccid text,
    lpa text,
    matching_id text,
    qrcode text,
    qrcode_url text,
    direct_apple_installation_url text,
    apn_type text,
    apn_value text,
    is_roaming boolean,
    confirmation_code text,
    created_at timestamptz,    -- eSIM 建立時間（來自 Airalo）
    inserted_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 建立 eSIM 安裝說明明細表，支援 iOS/Android 分流
create table if not exists public.esim_install_instructions (
    id uuid default gen_random_uuid() primary key,
    order_id integer not null,      -- 關聯 esim_orders.order_id
    iccid text not null,            -- 關聯 esim_order_detail.iccid
    os_type text not null,          -- 'ios' 或 'android'
    install_type text not null,     -- 'manual'、'qrcode'、'network_setup' 等
    version text,                   -- <--- 新增，對應 instructions.version
    content jsonb,                  -- <--- 型態改 jsonb，存 steps 或 HTML/JSON
    qrcode_url text,
    direct_apple_installation_url text,
    apn_type text,
    apn_value text,
    is_roaming boolean,
    inserted_at timestamptz default now(),
    updated_at timestamptz default now()
); 