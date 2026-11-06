-- Business Factory commerce schema contract.
-- REVIEWED DESIGN ONLY: do not apply to production until Supabase connectivity
-- is healthy, the existing schema has been inspected, and Security Advisor is run.

create extension if not exists pgcrypto;

create table if not exists public.commerce_products (
  id uuid primary key default gen_random_uuid(),
  seller_user_id uuid references auth.users(id) on delete restrict,
  slug text not null unique,
  title text not null,
  description text,
  product_type text not null check (product_type in ('course','digital','automation','factory','agent','subscription','service')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commerce_offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.commerce_products(id) on delete cascade,
  code text not null unique,
  regular_price_kopecks bigint not null check (regular_price_kopecks >= 0),
  sale_price_kopecks bigint not null check (sale_price_kopecks >= 0 and sale_price_kopecks <= regular_price_kopecks),
  platform_fee_bps integer not null default 0 check (platform_fee_bps between 0 and 10000),
  offer_version text not null,
  legal_version text not null,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.commerce_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  buyer_user_id uuid not null references auth.users(id) on delete restrict,
  seller_user_id uuid references auth.users(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','paid','cancelled','refunded','refunded_partial')),
  currency text not null default 'RUB' check (currency = 'RUB'),
  regular_price_kopecks bigint not null check (regular_price_kopecks >= 0),
  sale_price_kopecks bigint not null check (sale_price_kopecks >= 0),
  discount_kopecks bigint not null check (discount_kopecks >= 0),
  platform_fee_bps integer not null check (platform_fee_bps between 0 and 10000),
  platform_fee_kopecks bigint not null check (platform_fee_kopecks >= 0),
  seller_net_kopecks bigint not null check (seller_net_kopecks >= 0),
  offer_version text not null,
  legal_version text not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  constraint commerce_orders_money_balanced
    check (platform_fee_kopecks + seller_net_kopecks = sale_price_kopecks),
  constraint commerce_orders_discount_balanced
    check (regular_price_kopecks - sale_price_kopecks = discount_kopecks)
);

create index if not exists commerce_orders_buyer_idx on public.commerce_orders(buyer_user_id);
create index if not exists commerce_orders_seller_idx on public.commerce_orders(seller_user_id);

create table if not exists public.commerce_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commerce_orders(id) on delete restrict,
  product_id uuid not null references public.commerce_products(id) on delete restrict,
  offer_id uuid references public.commerce_offers(id) on delete restrict,
  product_title_snapshot text not null,
  product_type_snapshot text not null,
  amount_kopecks bigint not null check (amount_kopecks >= 0),
  created_at timestamptz not null default now()
);

create index if not exists commerce_order_items_order_idx on public.commerce_order_items(order_id);

create table if not exists public.commerce_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commerce_orders(id) on delete restrict,
  provider text not null check (provider in ('tochka')),
  provider_operation_id text not null,
  payment_link_id text not null,
  status text not null,
  amount_kopecks bigint not null check (amount_kopecks > 0),
  payment_link text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_operation_id),
  unique(provider, payment_link_id)
);

create index if not exists commerce_payments_order_idx on public.commerce_payments(order_id);

create table if not exists public.commerce_payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.commerce_payments(id) on delete restrict,
  provider text not null check (provider in ('tochka')),
  provider_event_id text not null,
  provider_operation_id text,
  payment_link_id text,
  status text,
  payload_sha256 text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(provider, provider_event_id)
);

create table if not exists public.commerce_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  product_id uuid not null references public.commerce_products(id) on delete restrict,
  order_id uuid not null references public.commerce_orders(id) on delete restrict,
  status text not null default 'active' check (status in ('active','revoked','expired')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, product_id, order_id)
);

create index if not exists commerce_entitlements_user_idx on public.commerce_entitlements(user_id);

create table if not exists public.commerce_seller_ledger (
  id uuid primary key default gen_random_uuid(),
  seller_user_id uuid not null references auth.users(id) on delete restrict,
  order_id uuid not null references public.commerce_orders(id) on delete restrict,
  entry_type text not null check (entry_type in ('sale','refund','adjustment','payout')),
  amount_kopecks bigint not null,
  available_at timestamptz,
  created_at timestamptz not null default now(),
  unique(order_id, entry_type)
);

create index if not exists commerce_seller_ledger_seller_idx on public.commerce_seller_ledger(seller_user_id);

alter table public.commerce_products enable row level security;
alter table public.commerce_offers enable row level security;
alter table public.commerce_orders enable row level security;
alter table public.commerce_order_items enable row level security;
alter table public.commerce_payments enable row level security;
alter table public.commerce_payment_events enable row level security;
alter table public.commerce_entitlements enable row level security;
alter table public.commerce_seller_ledger enable row level security;

-- Public catalog reads. No browser write policies are intentionally defined.
create policy "published products are publicly readable"
on public.commerce_products for select
to anon, authenticated
using (status = 'published');

create policy "active offers are publicly readable"
on public.commerce_offers for select
to anon, authenticated
using (
  active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
  and exists (
    select 1 from public.commerce_products p
    where p.id = product_id and p.status = 'published'
  )
);

-- Buyer-private data.
create policy "buyers read own orders"
on public.commerce_orders for select
to authenticated
using ((select auth.uid()) = buyer_user_id);

create policy "buyers read own order items"
on public.commerce_order_items for select
to authenticated
using (
  exists (
    select 1 from public.commerce_orders o
    where o.id = order_id and o.buyer_user_id = (select auth.uid())
  )
);

create policy "buyers read own payments"
on public.commerce_payments for select
to authenticated
using (
  exists (
    select 1 from public.commerce_orders o
    where o.id = order_id and o.buyer_user_id = (select auth.uid())
  )
);

create policy "users read own entitlements"
on public.commerce_entitlements for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "sellers read own ledger"
on public.commerce_seller_ledger for select
to authenticated
using ((select auth.uid()) = seller_user_id);

-- No anon/authenticated policy is created for commerce_payment_events.
-- No browser INSERT/UPDATE/DELETE policies are created for orders, payments,
-- entitlements or ledger. Those mutations belong to verified server operations.

revoke insert, update, delete on public.commerce_orders from anon, authenticated;
revoke insert, update, delete on public.commerce_order_items from anon, authenticated;
revoke insert, update, delete on public.commerce_payments from anon, authenticated;
revoke all on public.commerce_payment_events from anon, authenticated;
revoke insert, update, delete on public.commerce_entitlements from anon, authenticated;
revoke insert, update, delete on public.commerce_seller_ledger from anon, authenticated;
