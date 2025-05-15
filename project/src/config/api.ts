// API 端點配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:54321/functions/v1';

export const bindCardUrl = `${API_BASE_URL}/bind-card`;
export const processPaymentUrl = `${API_BASE_URL}/process-payment`; 