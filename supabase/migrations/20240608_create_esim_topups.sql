CREATE TABLE IF NOT EXISTS public.esim_topups (
    id BIGSERIAL PRIMARY KEY,
    iccid VARCHAR(32) NOT NULL,
    package_id VARCHAR(128) NOT NULL,
    type VARCHAR(32),
    net_price NUMERIC,
    sell_price NUMERIC,
    amount INTEGER,
    day INTEGER,
    is_unlimited BOOLEAN,
    title VARCHAR(255),
    data VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_esim_topups_iccid ON public.esim_topups(iccid); 