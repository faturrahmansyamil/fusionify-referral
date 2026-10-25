-- Fusionify Referral — skema awal (mengikuti diagrams/erd.puml)
-- Semua objek di schema `referral` supaya tidak bentrok dengan umkm-auto-order (schema public) di project Supabase yang sama.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions; -- no-op jika sudah terpasang (di schema mana pun)
create schema if not exists referral;
set search_path = referral, extensions, public;
grant usage on schema referral to anon, authenticated, service_role;

create type referral.app_role as enum ('admin','reseller');
create type referral.reseller_status as enum ('pending','active','banned');
create type referral.order_status as enum ('pending','paid','cancelled','refunded');
create type referral.commission_status as enum ('pending','approved','paid','void');
create type referral.payout_status as enum ('draft','paid');

-- Profil 1:1 dengan auth.users. Dibuat otomatis oleh trigger saat signup.
create table referral.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role referral.app_role not null default 'reseller',
  status referral.reseller_status not null default 'pending',
  full_name text not null default '' check (char_length(full_name) <= 80),
  whatsapp text check (whatsapp ~ '^62[0-9]{8,13}$'),
  payout_method text check (char_length(payout_method) <= 40),
  payout_account text check (char_length(payout_account) <= 60),
  created_at timestamptz not null default now()
);

create table referral.referral_codes (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null references referral.profiles(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z0-9]{3,20}$'), -- disimpan UPPERCASE
  discount_percent integer not null default 0 check (discount_percent between 0 and 50),
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table referral.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price integer not null check (price > 0),
  commission_type text not null check (commission_type in ('percent','flat')),
  commission_value integer not null check (commission_value >= 0),
  active boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  check (commission_type <> 'percent' or commission_value <= 100)
);

create table referral.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table referral.clicks (
  id bigint generated always as identity primary key,
  code_id uuid not null references referral.referral_codes(id) on delete cascade,
  campaign_id uuid references referral.campaigns(id) on delete set null,
  visitor_hash text,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index clicks_code_idx on referral.clicks(code_id, created_at);

create table referral.orders (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null unique,
  product_id uuid not null references referral.products(id),
  qty integer not null check (qty between 1 and 50),
  unit_price integer not null,
  discount integer not null default 0 check (discount >= 0),
  total integer not null check (total >= 0),
  buyer_name text not null check (char_length(buyer_name) between 1 and 80),
  buyer_wa text not null check (buyer_wa ~ '^62[0-9]{8,13}$'),
  code_id uuid references referral.referral_codes(id),
  reseller_id uuid references referral.profiles(id),
  campaign_id uuid references referral.campaigns(id),
  attribution text not null default 'none' check (attribution in ('none','link','code')),
  ip_hash text,
  risk_flags text[] not null default '{}',
  status referral.order_status not null default 'pending',
  paid_at timestamptz,
  paid_by uuid references referral.profiles(id),
  created_at timestamptz not null default now()
);
create index orders_code_idx on referral.orders(code_id, created_at);

create table referral.payouts (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null references referral.profiles(id),
  total integer not null check (total >= 0),
  status referral.payout_status not null default 'draft',
  proof_url text check (proof_url ~ '^https://'),
  slip_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table referral.commissions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references referral.orders(id), -- 1 order = maks 1 komisi (anti atribusi ganda)
  reseller_id uuid not null references referral.profiles(id),
  order_ref text not null,
  product_name text not null,
  order_total integer not null,
  amount integer not null check (amount >= 0),
  status referral.commission_status not null default 'pending',
  hold_until timestamptz not null,
  risk_flags text[] not null default '{}',
  payout_id uuid references referral.payouts(id),
  created_at timestamptz not null default now()
);
create index commissions_reseller_idx on referral.commissions(reseller_id, status);

create table referral.audit_log (
  id bigint generated always as identity primary key,
  actor uuid,
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ===== Helper =====
create or replace function referral.is_admin() returns boolean
language sql stable security definer set search_path = referral, extensions, public as $$
  select exists (select 1 from referral.profiles where id = auth.uid() and role = 'admin' and status = 'active')
$$;

create or replace function referral.handle_new_user() returns trigger
language plpgsql security definer set search_path = referral, extensions, public as $$
begin
  -- Hanya signup dari app referral (metadata app='referral'). User umkm-auto-order tidak tersentuh.
  if coalesce(new.raw_user_meta_data->>'app', '') <> 'referral' then return new; end if;
  insert into referral.profiles (id, email, full_name)
  values (new.id, new.email, left(coalesce(new.raw_user_meta_data->>'full_name', ''), 80));
  return new;
end $$;
create trigger referral_on_auth_user_created after insert on auth.users
  for each row execute function referral.handle_new_user();

-- ===== RLS =====
alter table referral.profiles enable row level security;
alter table referral.referral_codes enable row level security;
alter table referral.products enable row level security;
alter table referral.campaigns enable row level security;
alter table referral.clicks enable row level security;
alter table referral.orders enable row level security;
alter table referral.commissions enable row level security;
alter table referral.payouts enable row level security;
alter table referral.audit_log enable row level security;

create policy profiles_select on referral.profiles for select to authenticated using (id = auth.uid() or referral.is_admin());
create policy profiles_update_own on referral.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- Kolom role/status/email TIDAK bisa diubah user sendiri; status diubah lewat RPC admin.

create policy codes_select on referral.referral_codes for select to authenticated using (reseller_id = auth.uid() or referral.is_admin());
create policy codes_admin on referral.referral_codes for all to authenticated using (referral.is_admin()) with check (referral.is_admin());

create policy products_public on referral.products for select to anon, authenticated using (active or referral.is_admin());
create policy products_admin on referral.products for all to authenticated using (referral.is_admin()) with check (referral.is_admin());

create policy campaigns_admin on referral.campaigns for all to authenticated using (referral.is_admin()) with check (referral.is_admin());

create policy clicks_select on referral.clicks for select to authenticated
  using (referral.is_admin() or code_id in (select id from referral.referral_codes where reseller_id = auth.uid()));

create policy orders_admin_select on referral.orders for select to authenticated using (referral.is_admin());
create policy commissions_select on referral.commissions for select to authenticated using (reseller_id = auth.uid() or referral.is_admin());
create policy payouts_select on referral.payouts for select to authenticated using (reseller_id = auth.uid() or referral.is_admin());
create policy audit_admin on referral.audit_log for select to authenticated using (referral.is_admin());

-- Tabel transaksi hanya boleh diubah lewat RPC security definer.
-- Hak tabel eksplisit (default privileges Supabase hanya berlaku di public).
revoke all on all tables in schema referral from anon, authenticated;
grant select on all tables in schema referral to authenticated;
grant update (full_name, whatsapp, payout_method, payout_account) on referral.profiles to authenticated;
grant insert, update, delete on referral.referral_codes, referral.products, referral.campaigns to authenticated; -- dibatasi RLS admin
grant select on referral.products to anon;
grant all on all tables in schema referral to service_role;
grant usage, select on all sequences in schema referral to service_role;
