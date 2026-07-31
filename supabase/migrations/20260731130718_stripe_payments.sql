-- Stripe cutover is additive: historical provider identifiers remain dormant
-- until the final legacy subscription has been migrated. Existing access and
-- download records are preserved while all new writes use Stripe columns.

alter table usagentleads.purchases
  alter column lemon_squeezy_order_id drop not null,
  add column if not exists billing_provider text not null default 'legacy',
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_customer_id text,
  add column if not exists currency text not null default 'usd',
  add column if not exists amount_refunded integer not null default 0,
  add column if not exists fulfillment_email_sent_at timestamptz;

alter table usagentleads.purchases
  drop constraint if exists purchases_billing_provider_check,
  add constraint purchases_billing_provider_check
    check (billing_provider in ('legacy', 'stripe')),
  drop constraint if exists purchases_amount_refunded_check,
  add constraint purchases_amount_refunded_check
    check (amount_refunded >= 0 and amount_refunded <= amount_paid);

-- The ADD COLUMN default backfills preserved rows as legacy. All future writes
-- are Stripe-first, including any maintenance script that omits the column.
alter table usagentleads.purchases
  alter column billing_provider set default 'stripe';

create unique index if not exists idx_purchases_stripe_checkout_session
  on usagentleads.purchases (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index if not exists idx_purchases_stripe_payment_intent
  on usagentleads.purchases (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

alter table usagentleads.subscriptions
  alter column lemon_squeezy_subscription_id drop not null,
  alter column lemon_squeezy_customer_id drop not null,
  add column if not exists billing_provider text not null default 'legacy',
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_price_id text,
  add column if not exists provider_status text;

alter table usagentleads.subscriptions
  drop constraint if exists subscriptions_billing_provider_check,
  add constraint subscriptions_billing_provider_check
    check (billing_provider in ('legacy', 'stripe'));

alter table usagentleads.subscriptions
  alter column billing_provider set default 'stripe';

create unique index if not exists idx_subscriptions_stripe_subscription
  on usagentleads.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists idx_subscriptions_stripe_customer
  on usagentleads.subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;

-- A user-scoped claim prevents two hosted subscription pages (including two
-- different plans) from being payable before the first webhook is processed.
create table if not exists usagentleads.stripe_checkout_attempts (
  user_id                     uuid primary key references auth.users(id) on delete cascade,
  purchase_type               text not null
                              check (purchase_type in ('subscription', 'subscription_api')),
  attempt_id                  uuid not null unique,
  stripe_checkout_session_id  text unique,
  expires_at                  timestamptz not null,
  created_at                  timestamptz not null default now()
);

alter table usagentleads.stripe_checkout_attempts enable row level security;

create table if not exists usagentleads.stripe_webhook_events (
  id            text primary key,
  event_type    text not null,
  processed_at  timestamptz not null default now()
);

alter table usagentleads.stripe_webhook_events enable row level security;

grant usage on schema usagentleads to service_role;
grant select, insert, update, delete on usagentleads.stripe_checkout_attempts to service_role;
grant select, insert, update, delete on usagentleads.stripe_webhook_events to service_role;
revoke all on usagentleads.stripe_checkout_attempts from anon, authenticated;
revoke all on usagentleads.stripe_webhook_events from anon, authenticated;
