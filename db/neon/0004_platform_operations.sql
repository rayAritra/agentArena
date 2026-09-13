alter table agents add column if not exists framework text;
alter table agents add column if not exists trading_universe text;
alter table agents add column if not exists risk_limit text;
alter table agents add column if not exists rebalance_frequency text;
create table if not exists notification_deliveries(id uuid primary key default gen_random_uuid(),alert_event_id uuid not null references alert_events(id) on delete cascade,channel text not null default 'in_app',status text not null default 'delivered',created_at timestamptz not null default now(),unique(alert_event_id,channel));
create table if not exists api_rate_limits(bucket_key text not null,window_start timestamptz not null,count integer not null,expires_at timestamptz not null,primary key(bucket_key,window_start));
create index if not exists api_rate_limits_expiry_idx on api_rate_limits(expires_at);
