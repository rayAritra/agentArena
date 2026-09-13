create table if not exists schema_migrations(version text primary key,applied_at timestamptz not null default now());

create table if not exists wallet_sync_state(
  wallet_id uuid primary key references agent_wallets(id) on delete cascade,
  cursor_block bigint not null default 0,
  status text not null default 'idle' check(status in('idle','running','retrying','failed')),
  locked_until timestamptz,
  attempt_count integer not null default 0,
  next_retry_at timestamptz,
  last_started_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);
create index if not exists wallet_sync_retry_idx on wallet_sync_state(status,next_retry_at);

create table if not exists token_transfers(
  id uuid primary key default gen_random_uuid(),wallet_id uuid not null references agent_wallets(id) on delete cascade,
  tx_hash text not null,block_number bigint not null,log_index integer not null,direction text not null check(direction in('in','out')),
  token_address text not null,symbol text not null,decimals integer not null,raw_value numeric(78,0) not null,
  counterparty text not null,block_timestamp timestamptz not null,created_at timestamptz not null default now(),
  unique(wallet_id,tx_hash,log_index,direction)
);
create index if not exists token_transfers_wallet_block_idx on token_transfers(wallet_id,block_number desc);
create index if not exists token_transfers_token_time_idx on token_transfers(token_address,block_timestamp desc);

create table if not exists position_lots(
  id uuid primary key default gen_random_uuid(),agent_id uuid not null references agents(id) on delete cascade,
  asset_address text not null,symbol text not null,source_trade_id uuid references normalized_trades(id) on delete set null,
  quantity numeric(78,18) not null,unit_cost_usd numeric(38,18) not null,opened_at timestamptz not null,
  updated_at timestamptz not null default now()
);
create index if not exists position_lots_agent_asset_idx on position_lots(agent_id,asset_address,opened_at);

create table if not exists agent_metric_snapshots(
  id uuid primary key default gen_random_uuid(),agent_id uuid not null references agents(id) on delete cascade,
  portfolio_value_usd numeric(38,18) not null,realized_pnl_usd numeric(38,18) not null,unrealized_pnl_usd numeric(38,18) not null,
  roi numeric(20,8) not null,win_rate numeric(10,6) not null,max_drawdown numeric(20,8) not null,
  trade_count bigint not null,volume_usd numeric(38,18) not null,captured_at timestamptz not null default now()
);
create index if not exists agent_metric_snapshots_agent_time_idx on agent_metric_snapshots(agent_id,captured_at desc);

create table if not exists agent_score_snapshots(
  id uuid primary key default gen_random_uuid(),agent_id uuid not null references agents(id) on delete cascade,
  arena_score integer not null check(arena_score between 0 and 1000),return_score numeric(8,4) not null,pnl_score numeric(8,4) not null,
  risk_score numeric(8,4) not null,win_rate_score numeric(8,4) not null,consistency_score numeric(8,4) not null,
  activity_score numeric(8,4) not null,longevity_score numeric(8,4) not null,battle_score numeric(8,4) not null,
  rank integer not null,sample_size integer not null,eligible boolean not null,calculation_version text not null,
  captured_at timestamptz not null default now()
);
create index if not exists agent_scores_agent_time_idx on agent_score_snapshots(agent_id,captured_at desc);
create index if not exists agent_scores_rank_time_idx on agent_score_snapshots(rank,captured_at desc);

create table if not exists agent_behavior_profiles(
  agent_id uuid primary key references agents(id) on delete cascade,aggression integer not null,patience integer not null,
  diversification integer not null,consistency integer not null,momentum_bias integer not null,risk_control integer not null,activity integer not null,
  primary_archetype text not null,secondary_archetype text,typical_hold_minutes numeric(20,4),trade_frequency_daily numeric(20,4) not null,
  average_trade_usd numeric(38,18) not null,turnover numeric(20,8) not null,concentration numeric(20,8) not null,
  favorite_asset text,most_profitable_asset text,most_traded_asset text,risk_level text not null,sample_size integer not null,
  calculation_version text not null,calculated_at timestamptz not null default now()
);

create table if not exists agent_events(
  id uuid primary key default gen_random_uuid(),agent_id uuid references agents(id) on delete cascade,event_type text not null,
  event_timestamp timestamptz not null,transaction_hash text,token_address text,metadata jsonb not null default '{}',
  severity text not null default 'info' check(severity in('info','positive','warning','critical')),dedupe_key text not null unique,created_at timestamptz not null default now()
);
create index if not exists agent_events_time_idx on agent_events(event_timestamp desc);
create index if not exists agent_events_agent_time_idx on agent_events(agent_id,event_timestamp desc);
create index if not exists agent_events_type_time_idx on agent_events(event_type,event_timestamp desc);

create table if not exists market_snapshots(
  id uuid primary key default gen_random_uuid(),token_address text not null,symbol text not null,price_usd numeric(38,18),reference_price_usd numeric(38,18) not null,
  volume_24h_usd numeric(38,18),liquidity_usd numeric(38,18),source text not null,captured_at timestamptz not null default now(),
  unique(token_address,source,captured_at)
);
create index if not exists market_snapshots_token_time_idx on market_snapshots(token_address,captured_at desc);

alter table battles add column if not exists status text not null default 'scheduled';
alter table battles add column if not exists scoring_mode text not null default 'total_return';
alter table battles add column if not exists created_by text references profiles(id) on delete set null;
alter table battle_participants add column if not exists baseline_equity_usd numeric(38,18);
alter table battle_participants add column if not exists baseline_arena_score integer;
alter table battle_participants add column if not exists baseline_trade_count bigint;
alter table battle_participants add column if not exists baseline_captured_at timestamptz;
create table if not exists battle_events(id uuid primary key default gen_random_uuid(),battle_id uuid not null references battles(id) on delete cascade,agent_id uuid references agents(id) on delete set null,event_type text not null,event_timestamp timestamptz not null,metadata jsonb not null default '{}',dedupe_key text not null unique);
create index if not exists battle_events_battle_time_idx on battle_events(battle_id,event_timestamp desc);
create table if not exists battle_results(battle_id uuid primary key references battles(id) on delete cascade,winner_agent_id uuid references agents(id) on delete set null,results jsonb not null,calculation_version text not null,finalized_at timestamptz not null default now());

create table if not exists achievements(id text primary key,name text not null,description text not null,icon text not null,criteria jsonb not null,created_at timestamptz not null default now());
create table if not exists agent_achievements(achievement_id text not null references achievements(id),agent_id uuid not null references agents(id) on delete cascade,unlocked_at timestamptz not null default now(),metadata jsonb not null default '{}',evidence_reference text,primary key(achievement_id,agent_id));

create table if not exists watchlists(id uuid primary key default gen_random_uuid(),owner_id text not null references profiles(id) on delete cascade,name text not null default 'My Watchlist',created_at timestamptz not null default now(),unique(owner_id,name));
create table if not exists watchlist_items(id uuid primary key default gen_random_uuid(),watchlist_id uuid not null references watchlists(id) on delete cascade,item_type text not null check(item_type in('agent','wallet','token','battle')),item_key text not null,created_at timestamptz not null default now(),unique(watchlist_id,item_type,item_key));
create table if not exists alert_rules(id uuid primary key default gen_random_uuid(),owner_id text not null references profiles(id) on delete cascade,event_type text not null,target_type text not null,target_key text,threshold numeric(38,18),enabled boolean not null default true,created_at timestamptz not null default now());
create table if not exists alert_events(id uuid primary key default gen_random_uuid(),rule_id uuid not null references alert_rules(id) on delete cascade,agent_event_id uuid references agent_events(id) on delete cascade,created_at timestamptz not null default now(),read_at timestamptz,unique(rule_id,agent_event_id));

create table if not exists api_keys(id uuid primary key default gen_random_uuid(),owner_id text not null references profiles(id) on delete cascade,name text not null,prefix text not null,key_hash text not null unique,permissions text[] not null default '{read}',rate_limit_tier text not null default 'free',created_at timestamptz not null default now(),last_used_at timestamptz,revoked_at timestamptz);
create table if not exists api_usage(id bigserial primary key,api_key_id uuid references api_keys(id) on delete set null,request_id uuid not null,route text not null,status integer not null,latency_ms integer not null,created_at timestamptz not null default now());
create index if not exists api_usage_key_time_idx on api_usage(api_key_id,created_at desc);

create table if not exists webhook_endpoints(id uuid primary key default gen_random_uuid(),owner_id text not null references profiles(id) on delete cascade,url text not null,secret_ciphertext text not null,enabled boolean not null default true,created_at timestamptz not null default now());
create table if not exists webhook_subscriptions(endpoint_id uuid not null references webhook_endpoints(id) on delete cascade,event_type text not null,primary key(endpoint_id,event_type));
create table if not exists webhook_deliveries(id uuid primary key default gen_random_uuid(),endpoint_id uuid not null references webhook_endpoints(id) on delete cascade,agent_event_id uuid references agent_events(id) on delete set null,status text not null default 'pending',attempt_count integer not null default 0,next_attempt_at timestamptz not null default now(),response_status integer,last_error text,created_at timestamptz not null default now(),delivered_at timestamptz);
create index if not exists webhook_delivery_retry_idx on webhook_deliveries(status,next_attempt_at);
