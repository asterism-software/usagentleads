# Hetzner to Supabase Leads Migration Runbook

## Decision

The migration is feasible with no planned customer-visible downtime.

The selected target is the same production Supabase project already used by the
application:

| Item | Value |
|---|---|
| Project | `US Agent Leads` |
| Project ref | `vgbzldrsuxhzjxibyatw` |
| Organization / plan | `Ricci Flow Pro` / Pro |
| Region | Singapore (`ap-southeast-1`) |
| PostgreSQL | 17.6 |
| Existing compute | nano (`t4g.nano`) |

Only `usagentleads.leads` and a read-only `refresh_states()` RPC will be added.
Auth, billing, purchases, API keys, state counts, existing RLS policies, and the
`agent-csvs` Storage bucket are explicitly out of scope.

The application continued reading from Hetzner while the Supabase copy was
loaded, indexed, secured, and tested. Cutover deployed a code change making
`createLeadsClient()` use the project's existing `NEXT_PUBLIC_SUPABASE_URL` and
server-only `SUPABASE_SERVICE_ROLE_KEY`. No production secret was copied or
re-entered. The Hetzner deployment remains available for rollback.

## Confirmed facts and current status

- The owner confirmed there is no ongoing ingestion and no data will be written
  to the leads database.
- Code review found normal site, directory, dashboard, API, and CSV lead access is
  read-only.
- The former `refresh_states()` RPC on Hetzner contains `UPDATE` and `DELETE`
  statements. Its GitHub workflow, `Update State Counts`, was disabled before
  migration and subsequently removed from the repository with all other GitHub
  Actions.
- The CSV workflow reads leads and writes generated files only to Supabase Storage:
  `states/<CODE>.csv` and `full/usa_agents_full.zip`. The free sample is stored at
  `free-sample/free-sample-data.csv`.
- The Hetzner Data API currently reports exactly 1,168,815 lead rows.
- The live Supabase project is healthy. At preflight it was 18 MB before import,
  about 12% disk, 2% CPU, 45% RAM, and 8/60 connections. A backup was about 12
  hours old.
- `usagentleads.leads` is absent on the target. The ten existing application
  tables are present and have RLS enabled.
- The `usagentleads` schema is already exposed through the Data API because the
  application uses its existing tables.
- Trusted direct SSH/PostgreSQL access to Hetzner is unavailable. The host key is
  not in the operator's known-hosts file, so SSH host-key verification must not be
  bypassed.

Execution artifacts:

- pre-load migration:
  `supabase/migrations/20260822072249_restore_leads_to_primary_project.sql`;
- post-load migration:
  `supabase/migrations/20260822072406_finalize_leads_restore.sql`; and
- exact-count performance migration:
  `supabase/migrations/20260822081535_optimize_leads_exact_count.sql`; and
- resumable copy tool: `scripts/migrate/copy-leads-rest.mjs`.

Execution results recorded on 2026-08-22:

- the pre-load migration was applied and verified;
- 1,168,815 rows were copied, with every batch read back and compared across all
  17 columns by deterministic digest;
- source and target exact row/email/phone counts and timestamp boundaries match;
- all 51 per-state row/email/phone aggregates match the existing `state_count`
  table;
- there are zero null/invalid/whitespace states and zero duplicate phone-only
  groups;
- all constraints and 11 indexes (PK, email unique constraint, eight source
  secondary indexes, and the exact-count performance index) are valid and ready;
- the table was vacuumed/analyzed and is about 497 MB before the final performance
  index is included in the size reading;
- the Data API denies service-role writes with PostgreSQL code `42501` and denies
  anon reads, while the read-only RPC succeeds;
- the RPC returns 51 states totaling 1,168,815 rows;
- after performance tuning, three representative exact-count API requests took
  810 ms, 355 ms, and 491 ms without a timeout; and
- Security and Performance Advisors report zero errors and no warning naming the
  migrated table, function, or indexes. Existing warnings concern other project
  objects and are outside this migration's scope.

### Production cutover record

The Supabase-backed application was promoted to production on 2026-08-22:

| Item | Value |
|---|---|
| Production deployment | `dpl_Ahy1guz86HEiq9UWS7C2TKTuSViG` |
| Deployment URL | `usagentleads-55wibdqpe-ricci-flow.vercel.app` |
| Production aliases | `www.usagentleads.com`, `usagentleads.com`, `usagentleads.vercel.app`, `usagentleads-ricci-flow.vercel.app` |
| Hetzner rollback deployment | `dpl_3wyEANNdiuJufqj5aCHPZkyvSJFB` |
| Rollback deployment URL | `usagentleads-3kncm5g7z-ricci-flow.vercel.app` |

Production verification after promotion:

- `/directory/california` returned HTTP 200;
- state browse and filtered directory queries returned 25 masked rows with no raw
  email or phone fields;
- unauthenticated `/api/agents` returned HTTP 401;
- no Vercel warning/error log entries appeared for the new deployment during the
  initial observation window, and a later 30-minute error-only query returned no
  logs; and
- Supabase remained healthy at about 4% CPU, 15% disk, 58% RAM, and 15/60 database
  connections.

An authenticated customer dashboard/API session and a paid download were not
available for a non-destructive production test. `/dashboard` correctly redirected
the available signed-out browser session to `/pricing`; these customer-authenticated
paths remain stabilization checks.

The production deployment was created from the local
`features/migrate-db` workspace before these changes were committed. Commit and
merge this migration before the next normal Git-triggered production deployment;
otherwise a deployment from an older branch revision can restore the former
Hetzner client behavior.

## Why the REST copy is appropriate

`LEADS_REST_URL` and `LEADS_REST_KEY` are PostgREST credentials, not a PostgreSQL
connection string. Because the source is static, the selected transfer is a
server-to-server REST copy instead of `pg_dump`/`pg_restore`:

- rows are read in stable UUID primary-key order using keyset pagination;
- the target insert uses `on_conflict=id`, making a checkpointed retry safe;
- the default batch size is 500 with a short delay to limit pressure on the shared
  production Supabase project;
- the checkpoint contains only a last UUID and counters and is stored under
  `/tmp`; no PII dump is written to disk;
- retries use bounded exponential backoff;
- every inserted batch is read back and compared column-for-column using a
  deterministic SHA-256 digest without logging row data;
- the script refuses any target except project `vgbzldrsuxhzjxibyatw`; and
- an exact source count change stops a resumed transfer.

This method gives less database-internal evidence than direct PostgreSQL access:
write counters, active sessions, source relation sizes, and server-side checksums
cannot be queried through PostgREST. That limitation is acceptable here only
because the owner confirmed the source is static and the known mutating workflow
is disabled. Repeated exact counts and timestamp boundaries are used as the
immutability checks.

The transfer contains names, emails, and phone numbers. Both endpoints must use
TLS. Never log rows or credentials, commit a checkpoint, or store an export in the
repository.

## Shared-project safeguards

Importing 1.17 million rows and building two trigram GIN indexes shares CPU,
memory, disk I/O, and the 60-connection budget with production Auth and billing.
Use these controls:

1. Customer reads stay on Hetzner throughout staging.
2. The pre-load table has only its primary key and source unique-email constraint.
3. The loader is throttled and uses one source request and one target write at a
   time.
4. Build secondary indexes off-peak and monitor project CPU, RAM, connections,
   disk, and API errors.
5. Stop on sustained saturation. The new table is not production-critical until
   cutover.
6. Do not resize compute or incur new cost without separate approval.
7. Do not run the CSV generation workflow during the load or index-build window.

## Target security and schema design

Do not apply the self-hosted roles in `infra/leads-db/db/00-roles.sh`. Supabase
uses its own `anon`, `authenticated`, and `service_role` roles.

The pre-load migration:

- creates the source columns, primary key, and unique-email constraint;
- enables RLS with no `anon` or `authenticated` policies;
- revokes table access from `PUBLIC`, `anon`, and `authenticated`;
- temporarily grants `SELECT, INSERT` only to `service_role` for the copy; and
- replaces the mutating Hetzner RPC with a `STABLE`, `SECURITY INVOKER`, read-only
  aggregation returning the same columns.

The final migration:

- creates the eight source performance indexes;
- runs `ANALYZE`;
- revokes the temporary `INSERT` privilege; and
- leaves `service_role` with only `SELECT` on `leads` and `EXECUTE` on the
  read-only RPC.

The performance migration adds `idx_leads_valid_name_id`, a partial `(name,id)`
B-tree matching the validity predicate used by `queryAgents()`. The source's
eight-index set left its unfiltered exact-count path on a full heap scan; that can
exceed the Supabase nano Data API statement timeout.

The modern service key remains server-only. It must never use a `NEXT_PUBLIC_*`
name or reach browser code.

## Execution plan

### Phase 0 — Baseline and go/no-go

1. Verify no GitHub workflow or other scheduler invokes state-count, CSV, ingest,
   enrichment, or cold-email operations.
2. Run the read-only source preflight twice, separated by an observation period:

   ```bash
   npm run migrate:leads:preflight
   ```

   Both runs must match for exact row count, non-null email/phone counts, and
   minimum/maximum `created_at` and `updated_at`.
3. Reconfirm the target is healthy, a recent backup exists, and
   `usagentleads.leads` is absent.
4. Record the current Vercel production deployment and retain its Hetzner
   environment snapshot for rollback.

Go/no-go: stop if source metrics differ, the workflow is enabled, the target table
is non-empty, the backup is unavailable, or target resources are already under
pressure.

### Phase 1 — Create the empty target table

Apply only:

```text
supabase/migrations/20260822072249_restore_leads_to_primary_project.sql
```

Then verify:

- the table has the expected 17 columns, primary key, and unique-email constraint;
- RLS is enabled;
- `anon` and `authenticated` cannot select it;
- `service_role` can select and insert during this temporary import window; and
- existing production tables and their grants are unchanged.

### Phase 2 — Copy the static snapshot

Run:

```bash
npm run migrate:leads:execute
```

Operational options include `--batch-size=<1..1000>`, `--delay-ms=<n>`,
`--max-batches=<n>` for a controlled canary, and
`--checkpoint=<absolute-path>`. The default checkpoint is
`/tmp/usagentleads-rest-copy-checkpoint.json`.

Start with a small `--max-batches` canary, check Supabase health and inserted
column fidelity, then resume without deleting the checkpoint. Do not use
`--reset-checkpoint` against a non-empty target.

The script must finish with an exact target count equal to the source count.
At any checkpoint, a complete read-only re-verification can be run with:

```bash
npm run migrate:leads:verify
```

### Phase 3 — Validate data, build indexes, and lock writes

Before the final migration, compare:

- exact row count;
- non-null email and phone counts;
- minimum/maximum `created_at` and `updated_at`;
- per-state row/email/phone counts;
- primary-key and email uniqueness;
- phone uniqueness where `email is null`;
- distinct state values, whitespace variants, and null states; and
- deterministic ID-bucket aggregates plus spot checks covering every cold-email
  tracking column.

Do not invoke the Hetzner `refresh_states()` function; it mutates the source.

Apply the post-load migration off-peak:

```text
supabase/migrations/20260822072406_finalize_leads_restore.sql
```

Verify all indexes are valid:

- `idx_leads_email`;
- `idx_leads_state`;
- `idx_leads_state_name_id`;
- `idx_leads_state_name_trgm`;
- `idx_leads_name_trgm`;
- `idx_leads_first_time`;
- `leads_phone_only_key`; and
- `idx_leads_followup`.

Then benchmark the unfiltered exact-count path. If it times out or uses a parallel
sequential scan, apply:

```text
supabase/migrations/20260822081535_optimize_leads_exact_count.sql
```

Verify `idx_leads_valid_name_id` is valid and the exact-count query uses an
index-only scan.

Then prove Data API `INSERT`, `UPDATE`, and `DELETE` fail with the service key,
while `SELECT` and the read-only RPC succeed. Run Supabase Security and Performance
Advisors and resolve findings that affect this table or function.

### Phase 4 — Performance and application rehearsal

Use an access-protected Vercel preview built from the new client code. It must use
the preview environment's existing `NEXT_PUBLIC_SUPABASE_URL` and server-only
`SUPABASE_SERVICE_ROLE_KEY`; do not repurpose or overwrite the legacy
`LEADS_REST_*` rollback values.

Test:

- pure state browse ordered by `name,id`;
- global trigram name search;
- state-scoped trigram name search;
- dashboard/API pagination and exact count;
- masked public results;
- signed-in dashboard behavior;
- authenticated `/api/v1/agents` quota and rate-limit behavior;
- free-sample read path;
- one small-state CSV read path without regenerating every export; and
- the read-only `refresh_states()` RPC directly, without re-enabling its workflow.

Use `EXPLAIN (ANALYZE, BUFFERS)` and project metrics to confirm the expected
indexes are used and latency is acceptable. If nano compute is insufficient, stop
and request a compute/cost decision before cutover.

### Phase 5 — Atomic production cutover

Immediately before cutover, repeat the source baseline and target integrity
checks. They must still match.

Deploy the migration commit in which `createLeadsClient()` uses the already-set
`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. This avoids copying or
re-entering a secret and makes the endpoint switch atomic with the application
deployment. Leave Auth, Storage, Stripe, and all other environment variables
unchanged.

Retain the old `LEADS_REST_URL` and `LEADS_REST_KEY` values in Vercel during the
stabilization window. The new code does not read them, while the previous Vercel
deployment still contains the old client behavior and can use them on rollback.

Create a new production deployment. The old deployment continues serving Hetzner
while the new deployment builds, and Vercel changes the production alias only
when the deployment is ready. A new deployment is required because
`createLeadsClient()` caches its client inside each server instance.

Smoke-test production in this order:

1. public state directory;
2. public name search with masked contacts;
3. signed-in dashboard;
4. authenticated agents API;
5. existing paid download/CSV path; and
6. production error rate and Supabase load.

Keep state-count generation, ingestion, and enrichment unscheduled.

### Phase 6 — Stabilization and decommission

For at least 7 days, preferably 14:

- keep Hetzner and its credential intact;
- keep both copies read-only;
- monitor Vercel 5xxs and Supabase REST/database errors, connections, CPU, RAM,
  disk, I/O, and slow queries; and
- compare selected query results and aggregates between both copies.

Only after the retention period and a separately approved destructive change:

1. retain or take a final encrypted Hetzner backup;
2. confirm Supabase backups and test a restore in a non-production environment;
3. update architecture and operator documentation;
4. revoke the old Hetzner PostgREST JWT and remove its public route; and
5. stop and later delete the old containers/volume.

Do not delete Hetzner data as part of cutover.

## Acceptance gates

### Data

- Exact source and target counts and aggregate metrics match.
- Constraints, defaults, read-only function, extensions, and all indexes match the
  intended schema.
- All indexes are valid and `ANALYZE` has completed.
- Repeated source baselines remain unchanged.

### Security

- RLS is enabled and there are no public read policies.
- `anon` and `authenticated` cannot read raw leads.
- `service_role` can select but cannot insert, update, delete, or truncate after
  finalization.
- The RPC is read-only and executable only by `service_role`.
- The browser never receives the service key and no log contains credentials or
  raw lead rows.
- Supabase Security Advisor has no unresolved finding affecting the new objects.

### Functional and performance

- Public directory paths pass through the app; authenticated dashboard, API,
  sample, and paid-download paths pass before the stabilization window closes.
- Required queries use the intended B-tree and GIN indexes.
- Target p95 latency and error rate are within the agreed tolerance and the shared
  project is not saturated.
- The old deployment is retained and rollback has been rehearsed.

## Rollback

Rollback triggers include a data mismatch, unauthorized exposure, persistent REST
errors, unacceptable latency, database saturation, disk warnings, or failure of a
customer read path.

While Hetzner is retained and both databases are read-only:

1. use Vercel Instant Rollback to deployment
   `dpl_3wyEANNdiuJufqj5aCHPZkyvSJFB`;
2. verify directory, dashboard, API, and downloads against Hetzner;
3. keep every writer disabled; and
4. leave the Supabase table intact for diagnosis.

Do not repair or delete data during the endpoint switch. If writes are ever
re-enabled on Supabase, this simple rollback plan is no longer valid; define a
delta/replication strategy before the first write.

## References

Project files:

- [`docs/hetzner.md`](./hetzner.md)
- [`docs/ual-operator.md`](./ual-operator.md)
- [`infra/leads-db/README.md`](../infra/leads-db/README.md)
- [`infra/leads-db/db/01-schema.sql`](../infra/leads-db/db/01-schema.sql)
- [`infra/leads-db/post-load/indexes.sql`](../infra/leads-db/post-load/indexes.sql)
- [`lib/supabase/leads.ts`](../lib/supabase/leads.ts)

Platform references, checked 2026-08-22:

- [Migrate from Postgres to Supabase](https://supabase.com/docs/guides/platform/migrating-to-supabase/postgres)
- [Understanding database and disk size](https://supabase.com/docs/guides/platform/database-size)
- [Compute and disk](https://supabase.com/docs/guides/platform/compute-and-disk)
- [Database backups](https://supabase.com/docs/guides/platform/backups)
- [Securing the Data API](https://supabase.com/docs/guides/api/securing-your-api)
- [Using custom schemas](https://supabase.com/docs/guides/api/using-custom-schemas)
- [Supabase API keys](https://supabase.com/docs/guides/api/api-keys)
- [Vercel deployments](https://vercel.com/docs/deployments/overview)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
