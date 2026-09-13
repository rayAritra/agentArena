alter table agents add column if not exists identity_type text not null default 'verified_registration' check(identity_type in('verified_registration','observed_wallet'));
alter table agents add column if not exists data_source text not null default 'owner_registration';
create index if not exists agents_identity_type_idx on agents(identity_type,created_at desc);
