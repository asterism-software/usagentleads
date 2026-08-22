# Migrate the leads database to Supabase and remove GitHub Actions

**Date:** 2026-08-22

## Summary

The static US Agent Leads customer dataset now lives in the same Pro Supabase
project as the application's Auth, billing data, state counts, and Storage. The
production application was cut over from the retired Hetzner Postgres/PostgREST
endpoint without planned customer-visible downtime.

All GitHub Actions workflows were subsequently removed. CSV generation,
state-count aggregation, and IndexNow remain authenticated operator endpoints but
are no longer scheduled. Existing customer CSV objects remain in the private
Supabase Storage bucket.

## Database migration

- Selected Supabase project `US Agent Leads` (`vgbzldrsuxhzjxibyatw`) in Singapore
  as the target.
- Restored `usagentleads.leads` with all 17 source columns, defaults, constraints,
  RLS, and a read-only replacement for `refresh_states()`.
- Copied 1,168,815 rows from Hetzner using stable UUID keyset pagination.
- Preserved names, emails, phone strings, cold-email status fields, timestamps,
  IDs, and other source values without normalization or mutation.
- Read every copied batch back from Supabase and compared all columns using a
  deterministic SHA-256 digest.
- Added the source query indexes after loading and added
  `idx_leads_valid_name_id` to prevent exact-count timeouts on nano compute.
- Vacuumed and analyzed the migrated table.
- Revoked the temporary import grant after loading. `service_role` can select
  leads and execute the aggregation RPC but cannot insert, update, delete, or
  truncate lead rows.
- Kept RLS enabled with no raw-lead access for `anon` or `authenticated`.

Migrations:

- `supabase/migrations/20260822072249_restore_leads_to_primary_project.sql`
- `supabase/migrations/20260822072406_finalize_leads_restore.sql`
- `supabase/migrations/20260822081535_optimize_leads_exact_count.sql`

## Migration tooling

- Added `scripts/migrate/copy-leads-rest.mjs`, a project-locked, resumable REST
  copier for the static snapshot.
- Added a mode that performs source preflight checks without writing.
- Added a controlled execute mode with bounded retries, throttling, batch-size and
  canary controls, and a private checkpoint under `/tmp`.
- Added a complete read-only verification mode for checkpointed source and target
  rows.
- Added package commands:
  - `migrate:leads:preflight`
  - `migrate:leads:execute`
  - `migrate:leads:verify`
- Kept `LEADS_REST_URL` and `LEADS_REST_KEY` as temporary migration and rollback
  inputs; the deployed application no longer reads them.

## Application cutover

- Changed `createLeadsClient()` to use the existing
  `NEXT_PUBLIC_SUPABASE_URL` and server-only `SUPABASE_SERVICE_ROLE_KEY`.
- Preserved the dedicated leads-client boundary while using the same Supabase
  project as the rest of the server application.
- Updated CSV, free-sample, and state-count route comments to reflect the static
  Supabase source.
- Replaced the mutating Hetzner `refresh_states()` behavior with a stable,
  read-only aggregation. The route may still upsert the separate `state_count`
  table when deliberately invoked.
- Retained the prior Hetzner-configured Vercel deployment for rollback during the
  stabilization window.

Production deployment:

- Deployment: `dpl_Ahy1guz86HEiq9UWS7C2TKTuSViG`
- Deployment URL: `usagentleads-55wibdqpe-ricci-flow.vercel.app`
- Production aliases include `www.usagentleads.com` and `usagentleads.com`.

Rollback deployment:

- Deployment: `dpl_3wyEANNdiuJufqj5aCHPZkyvSJFB`
- Deployment URL: `usagentleads-3kncm5g7z-ricci-flow.vercel.app`

## GitHub Actions removal

Removed every workflow under `.github/workflows/`:

- `generate-csvs.yml`
- `update-state-counts.yml`
- `indexnow.yml`

Consequences:

- State CSVs and the full-database ZIP are no longer regenerated weekly.
- State-count aggregation is no longer invoked weekly.
- IndexNow submissions are no longer invoked daily.
- These authenticated application endpoints remain available for deliberate
  operator use.
- The daily nurture drip remains scheduled by Vercel Cron and is unaffected.
- Existing Supabase Storage objects were not deleted or replaced by this change.
  All 51 state CSVs, the full-database ZIP, the legacy gzip fallback, and the free
  sample remain available.

Because the leads database is static, removing the recurring state-count and CSV
jobs does not make customer data stale. If ingestion is restored later, derived
data must be regenerated through a separately reviewed, versioned release
process.

## Data validation

Source and target matched on:

- 1,168,815 total rows;
- 1,081,187 non-null emails;
- 1,072,356 non-null phone numbers;
- minimum and maximum `created_at` and `updated_at` values;
- all 51 state-level row, email, and phone aggregates;
- primary-key and email uniqueness; and
- every migrated column in every copied batch.

Additional checks found:

- zero null, whitespace-only, or invalid states;
- zero duplicate phone-only groups;
- 51 read-only RPC rows totaling 1,168,815 leads;
- all constraints and 11 indexes valid and ready;
- no client access to raw leads;
- service-role writes rejected with PostgreSQL code `42501`; and
- no Supabase Security or Performance Advisor error affecting the migrated
  objects.

The mixed legacy phone formats visible in Supabase are identical to the Hetzner
source values and were not introduced by migration.

## Performance and production verification

- Exact-count queries that previously timed out completed in representative runs
  of 810 ms, 355 ms, and 491 ms after index tuning.
- Public state browse, global name search, and state-scoped name search used the
  migrated target successfully.
- The production California directory returned HTTP 200 and masked contact data.
- Unauthenticated `/api/agents` requests returned HTTP 401.
- No error entries were found in the initial Vercel production observation window
  or a later 30-minute error-only log query.
- Supabase remained healthy after cutover at approximately 4% CPU, 15% disk, 58%
  RAM, and 15 of 60 database connections.

## Repository documentation

- Added the complete migration and rollback runbook at
  `docs/hetzner-to-supabase-leads-migration-plan.md`.
- Updated the root README and operator guide to describe the single-project
  Supabase architecture and unscheduled operator endpoints.
- Marked the Hetzner database and PostgREST documentation as rollback-only and
  historical.
- Updated environment-variable guidance to mark `LEADS_REST_*` as temporary
  migration/rollback configuration.
- Updated implementation documentation and cron-route comments that previously
  described Hetzner as the active database.

## Verification

- TypeScript type checking passes.
- ESLint passes with three pre-existing warnings.
- Targeted migration-sensitive tests pass: 16 tests across two files.
- The production Next.js build passes and generated 375 static pages.
- The Vercel preview and production deployments reached Ready.
- Markdown and patch whitespace checks pass.

## Stabilization and follow-up

- Keep Hetzner, its PostgREST credential, and the rollback deployment intact and
  read-only for at least 7 days, preferably 14.
- Continue monitoring production reads, Supabase load, and Vercel errors.
- Authenticated customer dashboard/API and paid-download paths were not exercised
  with a live customer session during cutover and remain stabilization checks.
- Do not remove Hetzner data or credentials without a separately approved backup
  and decommission plan.
- The workflow removals take effect on GitHub only after this commit reaches the
  repository's default branch.
