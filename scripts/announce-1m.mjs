#!/usr/bin/env node
// One-off campaign: announce crossing 1,000,000 contacts to every captured
// sample lead and past purchaser.
//
// Deliverability notes (the goal is Gmail's Primary tab, not Promotions):
//  - plain personal-note styling — no banner, no buttons, no images, minimal
//    links. Heavy branded HTML is the strongest Promotions-tab signal.
//  - both a text/plain part and matching minimal HTML.
//  - personal from-name, reply-able address.
//  - List-Unsubscribe + one-click POST headers (Gmail bulk-sender rules).
//  - make sure open/click tracking is OFF for the domain in the Resend
//    dashboard — rewritten tracking links push mail to Promotions.
//
// Usage:
//   node scripts/announce-1m.mjs --dry-run [--env FILE]   # print audience, send nothing
//   node scripts/announce-1m.mjs --test    [--env FILE]   # send only to TEST_RECIPIENT
//   node scripts/announce-1m.mjs --send    [--env FILE]   # send to the full audience
//
// IMPORTANT: run with the PRODUCTION env (vercel env pull --environment=production)
// via --env — unsubscribe tokens are HMACed with CRON_SECRET, and the local
// .env value differs from production, so locally-minted links would not verify
// on the live /api/unsubscribe endpoint.
import crypto from "node:crypto"
import { appendFileSync, existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import {
  EMAIL_SENDERS,
  SUPPORT_REPLY_TO,
  formatEmailAddress,
} from "../lib/resend/email-config.ts"
import { loadEnv } from "./ingest/lib.mjs"

const TEST_RECIPIENT = "ricciflow.io@gmail.com"
const SITE_URL = "https://www.usagentleads.com"
const SUBJECT = "We just crossed 1,000,000 real estate agent contacts"

// Already-sent log makes --send safe to re-run after a partial failure.
const SENT_LOG = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  ".announce-1m.sent.log"
)

// ── Unsubscribe links — must mirror lib/utils/unsubscribe.ts exactly ──

function unsubSecret() {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET
  if (!secret) {
    throw new Error("UNSUBSCRIBE_SECRET or CRON_SECRET must be configured")
  }
  return secret
}

function unsubscribeUrl(email) {
  const token = crypto
    .createHmac("sha256", unsubSecret())
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, 32)
  return `${SITE_URL}/api/unsubscribe?e=${encodeURIComponent(email.trim().toLowerCase())}&t=${token}`
}

// ── Email content ────────────────────────────────────────────────────

function textBody(email) {
  return `Hi there,

Nabeel here, from USAgentLeads. Quick note — the database just passed a big milestone: over 1,000,000 verified real estate agent contacts, covering all 50 states plus Washington, DC.

The newest additions came from complete state licensing data for Michigan and Virginia, along with refreshed records across the rest of the country. Every record has the same four clean fields: full name, email, phone, and state.

If you've been meaning to try the data, now is a good time — a single state is $99 and the full 1M+ database is $399, both instant CSV downloads backed by a 30-day money-back guarantee:

${SITE_URL}/pricing

And if you've already purchased from us: thank you — you helped get it to a million. If there's a state, field, or format you wish we covered, just hit reply. I read every response.

— Nabeel
Founder, USAgentLeads

--
You're receiving this because you downloaded a free sample or made a purchase from USAgentLeads.
Unsubscribe: ${unsubscribeUrl(email)}
`
}

function htmlBody(email) {
  const p = (s) => `<p style="margin:0 0 16px 0;">${s}</p>`
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px 16px;">
${p("Hi there,")}
${p("Nabeel here, from USAgentLeads. Quick note &mdash; the database just passed a big milestone: <strong>over 1,000,000 verified real estate agent contacts</strong>, covering all 50 states plus Washington, DC.")}
${p("The newest additions came from complete state licensing data for Michigan and Virginia, along with refreshed records across the rest of the country. Every record has the same four clean fields: full name, email, phone, and state.")}
${p(`If you've been meaning to try the data, now is a good time &mdash; a single state is $99 and the full 1M+ database is $399, both instant CSV downloads backed by a 30-day money-back guarantee: <a href="${SITE_URL}/pricing" style="color:#1D4ED8;">usagentleads.com/pricing</a>`)}
${p("And if you've already purchased from us: thank you &mdash; you helped get it to a million. If there's a state, field, or format you wish we covered, just hit reply. I read every response.")}
${p("&mdash; Nabeel<br>Founder, USAgentLeads")}
<p style="margin:28px 0 0 0;padding-top:16px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;">
You're receiving this because you downloaded a free sample or made a purchase from USAgentLeads.
<a href="${unsubscribeUrl(email)}" style="color:#94a3b8;">Unsubscribe</a>
</p>
</div>`
}

// ── Audience ─────────────────────────────────────────────────────────

async function buildAudience() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { db: { schema: "usagentleads" } }
  )

  const [{ data: leads, error: e1 }, { data: buyers, error: e2 }] = await Promise.all([
    supabase.from("sample_leads").select("email, status"),
    supabase.from("purchases").select("guest_email").eq("status", "completed"),
  ])
  if (e1) throw new Error(`sample_leads: ${e1.message}`)
  if (e2) throw new Error(`purchases: ${e2.message}`)

  const unsubscribed = new Set(
    leads.filter((l) => l.status === "unsubscribed").map((l) => l.email.toLowerCase())
  )

  const audience = new Set()
  for (const raw of [
    ...leads.filter((l) => l.status !== "unsubscribed").map((l) => l.email),
    ...buyers.map((b) => b.guest_email),
  ]) {
    const email = (raw ?? "").trim().toLowerCase()
    if (!email || email.endsWith("@example.com") || unsubscribed.has(email)) continue
    audience.add(email)
  }
  return [...audience].sort()
}

// ── Send ─────────────────────────────────────────────────────────────

async function sendOne(resend, to) {
  const { error } = await resend.emails.send({
    from: formatEmailAddress(EMAIL_SENDERS.updates),
    to,
    replyTo: formatEmailAddress(SUPPORT_REPLY_TO),
    subject: SUBJECT,
    text: textBody(to),
    html: htmlBody(to),
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl(to)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  })
  if (error) throw new Error(error.message ?? JSON.stringify(error))
}

function loadEnvFile(file) {
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
  }
}

async function main() {
  const argv = process.argv.slice(2)
  const envIdx = argv.indexOf("--env")
  const envFile = envIdx !== -1 ? argv.splice(envIdx, 2)[1] : null
  const mode = argv[0]
  if (!["--dry-run", "--test", "--send"].includes(mode)) {
    console.error("usage: node scripts/announce-1m.mjs --dry-run | --test | --send [--env FILE]")
    process.exit(2)
  }

  if (envFile) loadEnvFile(envFile)
  loadEnv()
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not set")
  if (!envFile && ["--test", "--send"].includes(mode)) {
    console.warn(
      "WARNING: no --env file given — unsubscribe links are minted with the LOCAL " +
        "CRON_SECRET, which does not match production. Pass the pulled production env."
    )
  }

  if (mode === "--test") {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await sendOne(resend, TEST_RECIPIENT)
    console.log(`test email sent to ${TEST_RECIPIENT}`)
    return
  }

  const audience = await buildAudience()
  const alreadySent = new Set(
    existsSync(SENT_LOG)
      ? readFileSync(SENT_LOG, "utf8").split("\n").filter(Boolean)
      : []
  )
  const pending = audience.filter((e) => !alreadySent.has(e))

  console.log(`audience: ${audience.length} (${alreadySent.size} already sent, ${pending.length} pending)`)
  for (const e of pending) console.log(`  ${e}`)

  if (mode === "--dry-run") {
    console.log("\n[dry-run] no emails sent")
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  let sent = 0
  let failed = 0
  for (const email of pending) {
    try {
      await sendOne(resend, email)
      appendFileSync(SENT_LOG, email + "\n")
      sent++
      console.log(`sent    ${email}`)
    } catch (err) {
      failed++
      console.error(`FAILED  ${email}: ${err.message}`)
    }
    // Resend allows 2 req/s — stay under it.
    await new Promise((r) => setTimeout(r, 600))
  }
  console.log(`\ndone: ${sent} sent, ${failed} failed`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
