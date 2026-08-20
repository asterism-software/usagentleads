import crypto from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import {
  EMAIL_SENDERS,
  SUPPORT_REPLY_TO,
  formatEmailAddress,
} from "../lib/resend/email-config.ts"
import { downloadReadyTemplate } from "../lib/resend/email-templates.ts"

const DEFAULT_RECIPIENT = "ricciflow.io@gmail.com"
const DEFAULT_STATE = "CA"
const SITE_URL = "https://www.usagentleads.com"

function required(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}

async function main() {
  const recipient = process.argv[2] || DEFAULT_RECIPIENT
  const stateCode = (process.argv[3] || DEFAULT_STATE).toUpperCase()
  if (!/^[A-Z]{2}$/.test(stateCode)) throw new Error("State code must contain two letters")

  const supabase = createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  ).schema("usagentleads")
  const resend = new Resend(required("RESEND_API_KEY"))
  const purchaseId = crypto.randomUUID()
  const pageToken = crypto.randomUUID()
  const downloadToken = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1_000).toISOString()
  const downloadUrl = `${SITE_URL}/download?token=${pageToken}`

  const { error: insertError } = await supabase.from("purchases").insert({
    id: purchaseId,
    guest_email: recipient,
    purchase_type: "state",
    state_code: stateCode,
    amount_paid: 0,
    status: "completed",
    download_token: downloadToken,
    page_token: pageToken,
    token_used: false,
    expires_at: expiresAt,
    billing_provider: "stripe",
    currency: "usd",
    metadata: {
      test_delivery: "true",
      test_recipient: recipient,
    },
  })
  if (insertError) throw new Error(`Unable to create test entitlement: ${insertError.message}`)

  try {
    const pageResponse = await fetch(downloadUrl, {
      redirect: "follow",
      headers: { "user-agent": "USAgentLeads download delivery check" },
    })
    const pageHtml = await pageResponse.text()
    if (!pageResponse.ok || !pageHtml.includes("Your data is ready")) {
      throw new Error(
        `Live download page check failed (${pageResponse.status}); test email was not sent`
      )
    }

    const template = downloadReadyTemplate({
      downloadUrl,
      productName: stateCode === "CA" ? "California" : stateCode,
      purchaseType: "state",
    })
    const { data, error } = await resend.emails.send(
      {
        from: formatEmailAddress(EMAIL_SENDERS.downloads),
        replyTo: formatEmailAddress(SUPPORT_REPLY_TO),
        to: recipient,
        subject: `[Test] ${template.subject}`,
        html: template.html,
        text: template.text,
      },
      { idempotencyKey: `test-download:${purchaseId}` }
    )
    if (error) throw new Error(`Resend rejected the email: ${error.message}`)

    const { error: updateError } = await supabase
      .from("purchases")
      .update({ fulfillment_email_sent_at: new Date().toISOString() })
      .eq("id", purchaseId)
    if (updateError) {
      console.warn(`Email sent, but fulfillment timestamp was not recorded: ${updateError.message}`)
    }

    console.log(JSON.stringify({
      recipient,
      stateCode,
      purchaseId,
      emailId: data?.id || null,
      expiresAt,
    }))
  } catch (error) {
    await supabase.from("purchases").delete().eq("id", purchaseId)
    throw error
  }
}

await main()
