-- 建立 low_data_notifications table
CREATE TABLE low_data_notifications (
    id SERIAL PRIMARY KEY, -- 主鍵
    iccid VARCHAR(32) NOT NULL, -- eSIM 卡號
    airalo_user_id INTEGER, -- Airalo 傳來的 user_id
    package_slug VARCHAR(64), -- 方案識別碼
    level VARCHAR(8), -- 觸發等級（如 '75%）
    remaining_percentage INTEGER, -- 剩餘百分比
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- 收到時間
);

-- 為查詢效率建立 index
CREATE INDEX idx_low_data_notifications_iccid ON low_data_notifications(iccid); 