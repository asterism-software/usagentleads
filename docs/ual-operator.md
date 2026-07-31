USAgentLeads Operator Documentation


Core Business Logic:

USAgentLeads sells realtor email lists (name, state, email, phone). Also offers dashboard access where users can view the lists or via API as well.


Services/Repos and Hosting:

USAgentLeads Web app is hosted on Vercel
Deployed Repo: https://github.com/asterism-software/usagentleads

USAgentLeads Leads table (1M+ records) is hosted on Hetzner VPS
Project: usagentleads
Service: leads-postgres

Ingestion scripts used to extract data exist in repo scripts/ingest dir which upsert data to leads-postgres db on Hetzner VPS

Scheduled Jobs:


Scheduled jobs related to UAL are github actions/workflow which run periodically. Please see actions tab of repo “usagentleads”.
See them here: https://github.com/asterism-software/usagentleads/actions

update-state-counts.yml — Mondays 02:00 UTC. Single call to /api/cron/update-state-counts so Supabase's state_count catches up with whatever new rows landed in leads.

generate-csvs.yml — Mondays 03:00 UTC, deliberately an hour after the counts job. The only non-trivial one: it implements the full 3-step flow — bare call to get the state-code worklist, then a ?state=XX call per state in a loop (tallying failures and exiting non-zero if any), then ?combine=true to rebuild the full-database CSV. This is the reference implementation for the "bare call only lists states" gotcha.

indexnow.yml — daily 07:00 UTC. Pings /api/cron/indexnow to submit URLs to IndexNow for search-engine discovery; 10-minute curl timeout since the submission is slow.

All three also have workflow_dispatch, so you can trigger any of them manually — which is what you'd use after a mid-week ingest.


DB Layer:

Auth, DB layer is handled by Supabase only leads table exists in Hetzner VPS. In Supabase project “apisafe” look for schema “usagentleads”, this contains all the db layer for UAL. Supabase storage buckets contains CSVs for each state and also the full database csv which are served to users after payment success.

Data Flow:

Ingestion scripts to leads table -> Github Workflows generate state csvs and full database csv from leads table and host it into Supabase Storage Bucket + Frontend queries leads table and display data in dashboard or serve through API

Third-party services:

Resend for Emails
IndexNow key for submitting URLs to search engines
Lemon Squeezy for payments
Posthog/Bing/GSC for Analytics
Upstash for Redis


Deployment Flow:

App: This is a next.js app, push commits to repo “usagentleads” to trigger deploys on Vercel

Regular maintenance tasks:

There is no regular maintenance in particular except for answering to user emails or queries and refreshing the data after some weeks or months using ingest scripts or finding new data sources.


Common Failures and Recovery:

Not anything in particular but sometimes github workflows generating CSVs time out or fail, but happens rarely


Further messages from the seller:
I already mentioned it in the doc, that i use ingest scripts found in scripts/ingest dir in repo.

Those repos extract the leads, cleans and upserts them to leads db hosted on hetzner.

So whenever you feel like, you need to update the db or refresh it to find new leads, then run those scripts.

Now as I had stated this earlier that I didn't have any pipeline system in place for this. I had one-time scripts, I developed gradually and kept stacking the leads and refreshing them occasionally.

You can reuse the same scripts and also find new sources as well if you want to increase the total leads.

Initially I had like 500k+ and the. I increased them to 1M+.


Also you can use residential.com and keller williams (kw) as sources.

I had scripts for these, but lost them on a VPS where it was deploed and don't have access to the vps