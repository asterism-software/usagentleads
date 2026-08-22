-- Restore the static leads table to the existing US Agent Leads Supabase project.
--
-- This is deliberately the pre-load migration. Only the primary key and the
-- source unique-email constraint are created here so the REST copy does not pay
-- the cost of maintaining the eight read indexes row by row. The follow-up
-- migration creates those indexes and removes the temporary INSERT grant.

create extension if not exists pgcrypto;

create schema if not exists usagentleads;

create table if not exists usagentleads.leads (
  id                uuid primary key default gen_random_uuid(),
  email             text unique,
  name              text,
  email1_sent_at    timestamptz,
  email2_sent_at    timestamptz,
  email3_sent_at    timestamptz,
  email4_sent_at    timestamptz,
  email5_sent_at    timestamptz,
  email6_sent_at    timestamptz,
  email_status      text default 'PENDING',
  email_error       text,
  email_message_id  text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  replied           boolean not null default false,
  state             text,
  phone             text
);

comment on table usagentleads.leads is
  'Static customer leads snapshot migrated from the retired Hetzner Postgres service.';

alter table usagentleads.leads enable row level security;

-- The table is server-only. RLS remains enabled as defense in depth, with no
-- anon/authenticated policies. The service role bypasses RLS, so SQL privileges
-- are the effective read/write gate for that role.
revoke all on table usagentleads.leads from public, anon, authenticated, service_role;
grant usage on schema usagentleads to service_role;
grant select, insert on table usagentleads.leads to service_role;

-- Preserve the old RPC interface without the old UPDATE/DELETE cleanup. The
-- source and target are static, and the scheduled caller is disabled.
create or replace function usagentleads.refresh_states()
returns table(state text, count int, total_emails int, total_phones int)
language sql
stable
security invoker
set search_path = ''
as $function$
  select
    l.state,
    count(*)::int,
    count(l.email)::int,
    count(l.phone)::int
  from usagentleads.leads as l
  where l.state is not null
  group by l.state
$function$;

revoke all on function usagentleads.refresh_states() from public, anon, authenticated;
grant execute on function usagentleads.refresh_states() to service_role;

notify pgrst, 'reload schema';
