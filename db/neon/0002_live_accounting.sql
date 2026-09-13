alter table normalized_trades add column if not exists quote_amount_usd numeric(38,18);
alter table normalized_trades add column if not exists cost_basis_usd numeric(38,18);
alter table normalized_trades add column if not exists proceeds_usd numeric(38,18);
alter table normalized_trades add column if not exists realized_pnl_usd numeric(38,18);

alter table positions add column if not exists current_price_usd numeric(38,18) not null default 0;
alter table positions add column if not exists market_value_usd numeric(38,18) not null default 0;
alter table positions add column if not exists unrealized_pnl_usd numeric(38,18) not null default 0;

alter table agent_metrics add column if not exists pnl_7d numeric(38,18) not null default 0;
alter table agent_metrics add column if not exists pnl_30d numeric(38,18) not null default 0;
alter table agent_metrics add column if not exists best_trade_usd numeric(38,18) not null default 0;
alter table agent_metrics add column if not exists worst_trade_usd numeric(38,18) not null default 0;
alter table agent_metrics add column if not exists max_drawdown numeric(20,8) not null default 0;
alter table agent_metrics add column if not exists profit_factor numeric(20,8) not null default 0;
alter table agent_metrics add column if not exists average_win_usd numeric(38,18) not null default 0;
alter table agent_metrics add column if not exists average_loss_usd numeric(38,18) not null default 0;

create index if not exists transactions_hash_idx on transactions(tx_hash);
create index if not exists prices_asset_time_idx on asset_prices(asset_address,observed_at desc);
create index if not exists metrics_roi_idx on agent_metrics(roi desc);
