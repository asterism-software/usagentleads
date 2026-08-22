-- queryAgents() asks PostgREST for an exact count and orders the first page by
-- name. On nano compute, the source index set forced a parallel heap scan of all
-- 1.17M rows and could exceed the Data API statement timeout. This compact
-- partial B-tree both represents the validity predicate and supplies name order,
-- allowing an index-only count plus an immediate first page.

create index if not exists idx_leads_valid_name_id
  on usagentleads.leads using btree (name, id)
  where name is not null
    and name <> ''
    and name ~ '[a-zA-Z]{2,}';

analyze usagentleads.leads;
