# Self-hosted `leads` database (Hetzner)

> **Retired from production on 2026-08-22.** The complete static snapshot now
> lives in Supabase project `vgbzldrsuxhzjxibyatw`, and the deployed app reads it
> with the existing Supabase service credential. Keep this Hetzner service
> read-only for 7–14 days as a rollback source, then decommission it only after a
> separately approved backup and deletion plan. The instructions below document
> the former deployment; do not use them to configure a new production read path.

> **As actually deployed (2026-07-14):** provisioned inside **Coolify** on the
> Hetzner box (project `usagentleads`), not via the standalone compose below.
> - **Postgres**: Coolify-managed `postgres:16-alpine` (resource `leads-postgres`,
>   internal host `jv0tsd8pl7267c5vhwwpjzin:5432`, db `leads`).
> - **PostgREST**: Coolify service `leads-postgrest`, on the shared `coolify`
>   Traefik network, with custom Traefik labels for `letsencrypt` TLS **and a
>   `stripprefix` middleware removing `/rest/v1`** (supabase-js prefixes every
>   request with `/rest/v1`; PostgREST serves at root, so without the strip every
>   query 404s). Serves
>   **`https://postgrest-ickon4toi8r3ls08j7fjh2dp.89.167.116.36.sslip.io`**.
> - Roles/schema/`refresh_states()` from `db/01-schema.sql` were applied via
>   `docker exec … psql`; data was streamed with `pg_dump | psql` (PG17→PG16, the
>   `SET transaction_timeout` line stripped); indexes from `post-load/indexes.sql`.
> - The app formerly read via `LEADS_REST_URL` / `LEADS_REST_KEY` (Vercel env).
>
> The `docker-compose.yml` + `Caddyfile` in this folder are the **standalone
> alternative** (own proxy on 80/443) — kept for reference / portability. The SQL
> files and the migration approach match what was deployed.



The `usagentleads.leads` table (~500 MB, ~963k rows) was the entire reason the
Supabase project sat at the 500 MB free-tier cap. It's moved here — to our own
Postgres on the VPS, fronted by **PostgREST** so the app's existing `supabase-js`
query builder keeps working with only a changed endpoint. **Everything else
(auth, subscriptions, purchases, api_keys, state_count, sample_leads, Storage)
stays on Supabase.**

```
                         ┌─────────────────────────── Supabase (free tier, now ~17 MB)
   Vercel (Next.js)      │   auth.*  ·  usagentleads.{subscriptions, purchases,
   ├── createServiceClient() ──▶      api_keys, state_count, sample_leads, ...}  ·  Storage
   │
   └── createLeadsClient() ───▶ ┌──── Hetzner VPS (this bundle) ────────────────┐
                            HTTPS│  Caddy :443 ─▶ PostgREST :3000 ─▶ Postgres    │
                                 │                    usagentleads.leads (500 MB)│
                                 └───────────────────────────────────────────────┘
```

## What talks to `leads`
All access is **server-side** and now goes through `createLeadsClient()`:

| File | Uses `leads` for |
| --- | --- |
| `lib/queries/directory.ts` | public directory search |
| `lib/queries/agents.ts` | `/api/agents` + `/api/v1/agents` |
| `app/api/cron/generate-csvs/route.ts` | per-state CSV export (reads) |
| `app/api/cron/generate-free-sample/route.ts` | free-sample CSV (reads) |
| `app/api/cron/update-state-counts/route.ts` | calls the `refresh_states()` RPC |

The table is effectively **read-only from the app** — the only writes are the
hygiene inside `refresh_states()`, which runs on the VPS.

> ⚠️ **Ingestion:** new leads are loaded by `scripts/ingest/*.mjs` (state
> licensing bulk data), which upsert through this PostgREST endpoint using the
> same `LEADS_REST_URL`/`LEADS_REST_KEY` — see `scripts/ingest/README.md`.

---

## Prerequisites
- A Hetzner VPS with **Docker + Docker Compose** installed.
- A subdomain (e.g. `leads-db.usagentleads.com`) with an **A/AAAA record → VPS IP**.
- Firewall: allow inbound **80** and **443** (for Caddy/TLS). Do **not** expose 5432.

## 1. Configure secrets
```bash
cd infra/leads-db
cp .env.example .env
# generate strong values:
openssl rand -base64 36   # POSTGRES_PASSWORD
openssl rand -base64 36   # AUTHENTICATOR_PASSWORD
openssl rand -base64 36   # PGRST_JWT_SECRET  (>= 32 chars)
# edit .env, set those + LEADS_DOMAIN
```

## 2. Start the stack
```bash
docker compose up -d
docker compose logs -f caddy   # watch it obtain the TLS cert (needs DNS + :80/:443)
```
First boot runs `db/00-roles.sh` (roles, extensions, schema) then `db/01-schema.sql`
(the `leads` table + `refresh_states()`). No secondary indexes yet.

## 3. Migrate the data
Get Supabase's **Session pooler** connection string (Dashboard → Project Settings
→ Database → Connection string → *Session* mode, port 5432 — the pooler is
IPv4-reachable; the "Direct connection" is IPv6-only).

```bash
SUPABASE_DB_URL='postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres' \
  ./scripts/migrate-leads.sh
```
This streams the ~165 MB of rows in, builds the 8 secondary indexes, then prints
the VPS row count. Confirm it matches Supabase:
```sql
-- on Supabase (SQL editor):
SELECT count(*) FROM usagentleads.leads;   -- expect ~963,112
```

## 4. Mint the app token
```bash
PGRST_JWT_SECRET='<same value as .env>' node scripts/mint-jwt.mjs
# prints the JWT → this is LEADS_REST_KEY
```

Smoke-test the endpoint end-to-end (should return one row as JSON):
```bash
curl -s "https://$LEADS_DOMAIN/leads?limit=1" \
  -H "Authorization: Bearer <LEADS_REST_KEY>" \
  -H "Accept-Profile: usagentleads"
# and confirm no-token access is denied:
curl -s -o /dev/null -w '%{http_code}\n' "https://$LEADS_DOMAIN/leads?limit=1" -H "Accept-Profile: usagentleads"
```

## 5. Point the app at it & deploy
Set these in **Vercel (Production + Preview)** and your local `.env`:
```
LEADS_REST_URL=https://leads-db.usagentleads.com
LEADS_REST_KEY=<token from step 4>
```
Deploy the `move-leads-to-vps` branch. Verify against the live VPS data:
- a state directory page (e.g. `/states/tx`) lists agents,
- `/api/v1/agents?state=TX` returns rows + an exact count,
- `GET /api/cron/update-state-counts` (with `CRON_SECRET`) returns fresh totals
  and Supabase `state_count` updates.

## 6. Reclaim the space on Supabase
Only after the app is verified against the VPS:
```sql
-- on Supabase:
DROP TABLE usagentleads.leads;                 -- frees ~500 MB immediately
DROP FUNCTION usagentleads.update_state_counts(); -- superseded by VPS refresh_states()
```
Supabase drops to ~17 MB. Check: **Dashboard → Settings → Usage → Database size**.

---

## Rollback
Before step 6 the Supabase `leads` table is untouched, so rollback is just:
un-set `LEADS_REST_URL`/`LEADS_REST_KEY` intent — revert the branch (restores
`createServiceClient()` for leads) and redeploy. After step 6 you'd need to
restore `leads` from a dump first.

## Ongoing operations
- **Backups** (your data now lives here, not on Supabase's managed backups):
  ```bash
  # nightly cron on the VPS:
  docker compose exec -T db pg_dump -U postgres -d leads -Fc -t usagentleads.leads \
    > /backups/leads-$(date +%F).dump
  ```
  Keep a rotation and copy off-box (e.g. Hetzner Storage Box / S3).
- **Security:** Postgres is never published (only Caddy's 80/443). The JWT is the
  gate — unauthenticated requests hit `leads_anon`, which has no grants. Rotate by
  changing `PGRST_JWT_SECRET`, `docker compose up -d`, re-mint, update Vercel env.
- **Upgrades:** `docker compose pull && docker compose up -d`.
- **Disk:** the table grows as leads are added — a VPS has room, but keep an eye
  on `df -h` and Postgres data volume size.
