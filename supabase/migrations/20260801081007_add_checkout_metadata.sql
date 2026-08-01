-- Keep the normalized first-touch and checkout context with the business row.
-- Historical rows use an empty object; new checkout writes supply a snapshot.
alter table usagentleads.purchases
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table usagentleads.subscriptions
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Subscription Checkout can safely retry a Stripe idempotency key only when
-- every parameter, including IP and attribution, is identical to the first try.
alter table usagentleads.stripe_checkout_attempts
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table usagentleads.purchases
  drop constraint if exists purchases_metadata_object_check,
  add constraint purchases_metadata_object_check
    check (jsonb_typeof(metadata) = 'object');

alter table usagentleads.subscriptions
  drop constraint if exists subscriptions_metadata_object_check,
  add constraint subscriptions_metadata_object_check
    check (jsonb_typeof(metadata) = 'object');

alter table usagentleads.stripe_checkout_attempts
  drop constraint if exists stripe_checkout_attempts_metadata_object_check,
  add constraint stripe_checkout_attempts_metadata_object_check
    check (jsonb_typeof(metadata) = 'object');
