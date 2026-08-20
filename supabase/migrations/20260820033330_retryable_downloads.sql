-- Email security scanners and browser retries can follow a link before the
-- customer. Keep access time-bound, but allow a small number of authorizations
-- and only count explicit POST requests from the download page.

alter table usagentleads.purchases
  add column if not exists download_count integer not null default 0,
  add column if not exists download_limit integer not null default 10,
  add column if not exists first_downloaded_at timestamptz,
  add column if not exists last_downloaded_at timestamptz;

update usagentleads.purchases
set download_count = 1,
    first_downloaded_at = coalesce(first_downloaded_at, created_at),
    last_downloaded_at = coalesce(last_downloaded_at, created_at)
where token_used = true
  and download_count = 0;

alter table usagentleads.purchases
  drop constraint if exists purchases_download_count_check,
  add constraint purchases_download_count_check
    check (download_count >= 0),
  drop constraint if exists purchases_download_limit_check,
  add constraint purchases_download_limit_check
    check (download_limit between 1 and 50),
  drop constraint if exists purchases_download_count_limit_check,
  add constraint purchases_download_count_limit_check
    check (download_count <= download_limit);

create table if not exists usagentleads.download_attempts (
  id              uuid primary key default gen_random_uuid(),
  purchase_id     uuid not null references usagentleads.purchases(id) on delete cascade,
  outcome         text not null check (
                    outcome in (
                      'authorized',
                      'pending',
                      'expired',
                      'limit_reached',
                      'storage_error',
                      'claim_conflict'
                    )
                  ),
  download_count  integer,
  request_id      text,
  user_agent      text,
  ip_hash         text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_download_attempts_purchase_created
  on usagentleads.download_attempts (purchase_id, created_at desc);

alter table usagentleads.download_attempts enable row level security;

grant select, insert on usagentleads.download_attempts to service_role;
revoke all on usagentleads.download_attempts from anon, authenticated;

-- The service-role-only RPC makes the counter update atomic. It accepts the
-- durable page token used by new emails and the legacy download token used by
-- already-delivered emails.
create or replace function usagentleads.authorize_purchase_download(
  p_access_token uuid
)
returns table (
  purchase_id uuid,
  authorized_download_count integer,
  authorized_download_limit integer
)
language sql
security invoker
set search_path = ''
as $$
  update usagentleads.purchases as purchase
  set download_count = purchase.download_count + 1,
      token_used = true,
      first_downloaded_at = coalesce(purchase.first_downloaded_at, now()),
      last_downloaded_at = now()
  where (
      purchase.page_token = p_access_token
      or purchase.download_token = p_access_token
    )
    and purchase.status = 'completed'
    and (purchase.expires_at is null or purchase.expires_at > now())
    and purchase.download_count < purchase.download_limit
  returning
    purchase.id,
    purchase.download_count,
    purchase.download_limit;
$$;

revoke execute on function usagentleads.authorize_purchase_download(uuid)
  from public, anon, authenticated;
grant execute on function usagentleads.authorize_purchase_download(uuid)
  to service_role;
