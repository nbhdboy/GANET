create table if not exists conversations (
  id bigserial primary key,
  user_id text not null,
  role text not null check (role in ('user', 'assistant')),
  message text not null,
  created_at timestamptz not null default now(),
  session_id text
); 