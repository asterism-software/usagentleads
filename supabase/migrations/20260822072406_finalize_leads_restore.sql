-- Run only after the REST copy and data-integrity checks have completed.
-- The target is not serving leads traffic yet, so non-concurrent index builds
-- are intentional and keep this migration transaction-compatible.

create extension if not exists pg_trgm;
create extension if not exists btree_gin;

create index if not exists idx_leads_email
  on usagentleads.leads using btree (email);

create index if not exists idx_leads_state
  on usagentleads.leads using btree (state);

create index if not exists idx_leads_state_name_id
  on usagentleads.leads using btree (state, name, id);

create index if not exists idx_leads_state_name_trgm
  on usagentleads.leads using gin (state, name gin_trgm_ops);

create index if not exists idx_leads_name_trgm
  on usagentleads.leads using gin (name gin_trgm_ops);

create index if not exists idx_leads_first_time
  on usagentleads.leads using btree (created_at)
  where email1_sent_at is null;

create unique index if not exists leads_phone_only_key
  on usagentleads.leads using btree (phone)
  where email is null;

create index if not exists idx_leads_followup
  on usagentleads.leads using btree (email1_sent_at)
  where email1_sent_at is not null;

analyze usagentleads.leads;

-- End the temporary import window. The production application keeps SELECT and
-- RPC access but can no longer mutate the static table through the Data API.
revoke insert, update, delete, truncate, references, trigger
  on table usagentleads.leads from service_role;
grant select on table usagentleads.leads to service_role;

notify pgrst, 'reload schema';
