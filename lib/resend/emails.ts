import { Resend } from "resend"
import {
  EMAIL_SENDERS,
  SUPPORT_INBOX,
  SUPPORT_REPLY_TO,
  formatEmailAddress,
  type EmailSenderKey,
} from "@/lib/resend/email-config"
import { escapeHtml } from "@/lib/utils/security"
import { unsubscribeUrl } from "@/lib/utils/unsubscribe"
import { SITE_URL } from "@/lib/utils/site"
import { getAgentCount, formatAgentCountLabel } from "@/lib/utils/agent-count"

const resendClient = new Resend(process.env.RESEND_API_KEY)

// Resend reports API failures in a resolved `{ error }` result. Normalize that
// into a rejection so callers (especially Stripe webhooks) can retry safely.
const resend = {
  emails: {
    async send(...args: Parameters<typeof resendClient.emails.send>) {
      const result = await resendClient.emails.send(...args)
      if (result.error) {
        throw new Error(`Resend email delivery failed: ${result.error.message}`)
      }
      return result
    },
  },
}

function customerEnvelope(sender: EmailSenderKey) {
  return {
    from: formatEmailAddress(EMAIL_SENDERS[sender]),
    replyTo: formatEmailAddress(SUPPORT_REPLY_TO),
  }
}

function marketingHeaders(email: string) {
  return {
    "List-Unsubscribe": `<${unsubscribeUrl(email)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  }
}

// ── Shared email layout ──────────────────────────────────────────────

const BRAND_COLOR = "#1D4ED8"
const BRAND_DARK = "#1E40AF"

function emailLayout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8fafc;">
  <!-- Header -->
  <div style="background-color: ${BRAND_COLOR}; padding: 28px 32px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">USAgentLeads</h1>
  </div>

  <!-- Body -->
  <div style="background-color: #ffffff; padding: 36px 32px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
    ${body}
  </div>

  <!-- Footer -->
  <div style="padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="margin: 0 0 6px 0; color: #64748b; font-size: 13px;">
      USAgentLeads
    </p>
    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
      Questions? Reply to this email or contact us at ${SUPPORT_REPLY_TO.email}
    </p>
  </div>
</body>
</html>`
}

function primaryButton(url: string, label: string): string {
  return `<div style="text-align: center; margin: 28px 0;">
    <a href="${escapeHtml(url)}" style="background-color: ${BRAND_COLOR}; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; mso-padding-alt: 0; text-align: center;">
      <!--[if mso]><i style="mso-font-width: 150%; mso-text-raise: 21pt;">&nbsp;</i><![endif]-->
      <span style="mso-text-raise: 10pt;">${escapeHtml(label)}</span>
      <!--[if mso]><i style="mso-font-width: 150%;">&nbsp;</i><![endif]-->
    </a>
  </div>`
}

function infoBox(content: string): string {
  return `<div style="background-color: #EEF2FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
    ${content}
  </div>`
}

interface IdempotentEmailParams {
  idempotencyKey?: string
}

// ── Magic link email (auth) ──────────────────────────────────────────

interface SendMagicLinkParams {
  to: string
  confirmationUrl: string
}

export async function sendMagicLink({
  to,
  confirmationUrl,
}: SendMagicLinkParams) {
  const body = `
    <p style="margin: 0 0 16px 0; font-size: 15px;">Hi there,</p>

    <p style="margin: 0 0 8px 0; font-size: 15px;">
      You requested a magic link to sign in to your USAgentLeads account. Click the button below to continue.
    </p>

    ${primaryButton(confirmationUrl, "Sign In to USAgentLeads")}

    ${infoBox(`
      <p style="margin: 0; font-size: 14px; color: #1e3a5f;">
        This link will expire in 24 hours and can only be used once. If you didn't request this email, you can safely ignore it.
      </p>
    `)}

    <p style="color: #6B7280; font-size: 13px; margin: 24px 0 0 0;">
      If the button above doesn't work, copy and paste this URL into your browser:
    </p>
    <p style="color: ${BRAND_COLOR}; font-size: 13px; word-break: break-all; margin: 4px 0 0 0;">
      ${escapeHtml(confirmationUrl)}
    </p>`

  await resend.emails.send({
    ...customerEnvelope("accounts"),
    to,
    subject: "Sign in to USAgentLeads",
    html: emailLayout(body),
  })
}

// ── Confirm signup email (auth) ─────────────────────────────────────

interface SendConfirmSignupParams {
  to: string
  confirmationUrl: string
}

export async function sendConfirmSignup({
  to,
  confirmationUrl,
}: SendConfirmSignupParams) {
  const body = `
    <p style="margin: 0 0 16px 0; font-size: 15px;">Welcome to USAgentLeads!</p>

    <p style="margin: 0 0 8px 0; font-size: 15px;">
      Please confirm your email address to get started. Click the button below to verify your account.
    </p>

    ${primaryButton(confirmationUrl, "Confirm Email Address")}

    ${infoBox(`
      <p style="margin: 0; font-size: 14px; color: #1e3a5f;">
        This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
      </p>
    `)}

    <p style="color: #6B7280; font-size: 13px; margin: 24px 0 0 0;">
      If the button above doesn't work, copy and paste this URL into your browser:
    </p>
    <p style="color: ${BRAND_COLOR}; font-size: 13px; word-break: break-all; margin: 4px 0 0 0;">
      ${escapeHtml(confirmationUrl)}
    </p>`

  await resend.emails.send({
    ...customerEnvelope("accounts"),
    to,
    subject: "Confirm your USAgentLeads account",
    html: emailLayout(body),
  })
}

// ── Download email (state pack or full database purchase) ────────────

interface SendDownloadEmailParams extends IdempotentEmailParams {
  to: string
  downloadUrl: string
  productName: string
  purchaseType: "state" | "full_database"
}

export async function sendDownloadEmail({
  to,
  downloadUrl,
  productName,
  purchaseType,
  idempotencyKey,
}: SendDownloadEmailParams) {
  const isFullDatabase = purchaseType === "full_database"
  const fileFormat = isFullDatabase ? "ZIP archive with CSV parts" : "CSV"
  const downloadLabel = isFullDatabase ? "Download Your Files" : "Download Your CSV"
  const subject = `Your ${productName} Real Estate Agent Data is Ready`

  const body = `
    <p style="margin: 0 0 16px 0; font-size: 15px;">Hi there,</p>

    <p style="margin: 0 0 8px 0; font-size: 15px;">
      Your purchase is confirmed! Your <strong>${escapeHtml(productName)}</strong> real estate agent data is ready for download.
    </p>

    ${primaryButton(downloadUrl, downloadLabel)}

    <p style="color: #dc2626; font-weight: 600; font-size: 14px; text-align: center; margin: 0 0 24px 0;">
      This link expires in 48 hours and can only be used once.
    </p>

    ${infoBox(`
      <p style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px; color: #1e3a5f;">What's included:</p>
      <table style="width: 100%; font-size: 14px; color: #334155;">
        <tr><td style="padding: 3px 0;">Full Name</td></tr>
        <tr><td style="padding: 3px 0;">Email Address</td></tr>
        <tr><td style="padding: 3px 0;">Phone Number</td></tr>
        <tr><td style="padding: 3px 0;">State</td></tr>
      </table>
    `)}

    ${isFullDatabase ? infoBox(`
      <p style="margin: 0; font-size: 14px; color: #1e3a5f;">
        Excel limits each worksheet to 1,048,576 rows, so the Full U.S. Database is provided as a ZIP archive with numbered CSV parts. Extract the ZIP and open each part separately. Every part includes the same column headers.
      </p>
    `) : ""}

    <p style="color: #64748b; font-size: 13px; margin: 0;">
      File format: ${escapeHtml(fileFormat)} (opens in Excel, Google Sheets, or any CRM)
    </p>`

  await resend.emails.send(
    {
      ...customerEnvelope("downloads"),
      to,
      subject,
      html: emailLayout(body),
    },
    idempotencyKey ? { idempotencyKey } : undefined
  )
}

// ── Subscription welcome email ───────────────────────────────────────

interface SendSubscriptionWelcomeParams extends IdempotentEmailParams {
  to: string
  planName?: "Pro Dashboard" | "Pro API"
}

export async function sendSubscriptionWelcome({
  to,
  planName = "Pro Dashboard",
  idempotencyKey,
}: SendSubscriptionWelcomeParams) {
  const countLabel = formatAgentCountLabel(await getAgentCount())
  const isApiPlan = planName === "Pro API"
  const body = `
    <p style="margin: 0 0 16px 0; font-size: 15px;">Hi there,</p>

    <p style="margin: 0 0 16px 0; font-size: 15px;">
      Welcome to <strong>USAgentLeads ${escapeHtml(planName)}</strong>! Your subscription is now active.
    </p>

    ${infoBox(`
      <p style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px; color: #1e3a5f;">Your Pro access includes:</p>
      <table style="width: 100%; font-size: 14px; color: #334155;">
        <tr><td style="padding: 3px 0;">Browse ${countLabel} verified agents in-app</td></tr>
        <tr><td style="padding: 3px 0;">Search & filter by state</td></tr>
        ${isApiPlan ? '<tr><td style="padding: 3px 0;">10,000 REST API requests per month</td></tr>' : ""}
        <tr><td style="padding: 3px 0;">Real-time updated data</td></tr>
        <tr><td style="padding: 3px 0;">Cancel anytime</td></tr>
      </table>
    `)}

    ${primaryButton(isApiPlan ? "https://www.usagentleads.com/dashboard/api-keys" : "https://www.usagentleads.com/dashboard", isApiPlan ? "Manage API Keys" : "Go to Dashboard")}

    <p style="color: #64748b; font-size: 13px; margin: 0;">
      Manage your subscription anytime from the dashboard sidebar.
    </p>`

  await resend.emails.send(
    {
      ...customerEnvelope("billing"),
      to,
      subject: `Welcome to USAgentLeads ${planName}`,
      html: emailLayout(body),
    },
    idempotencyKey ? { idempotencyKey } : undefined
  )
}

// ── Subscription cancelled email ─────────────────────────────────────

interface SendSubscriptionCancelledParams extends IdempotentEmailParams {
  to: string
  accessUntil: string | null
}

export async function sendSubscriptionCancelled({
  to,
  accessUntil,
  idempotencyKey,
}: SendSubscriptionCancelledParams) {
  const accessNote = accessUntil
    ? `You'll continue to have full access until <strong>${new Date(accessUntil).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>.`
    : "You'll continue to have access until the end of your current billing period."

  const body = `
    <p style="margin: 0 0 16px 0; font-size: 15px;">Hi there,</p>

    <p style="margin: 0 0 16px 0; font-size: 15px;">
      Your USAgentLeads Pro Dashboard subscription has been cancelled.
    </p>

    <p style="margin: 0 0 16px 0; font-size: 15px;">${accessNote}</p>

    ${infoBox(`
      <p style="margin: 0; font-size: 14px; color: #1e3a5f;">
        Changed your mind? You can resubscribe anytime from our
        <a href="https://www.usagentleads.com/pricing" style="color: ${BRAND_COLOR}; text-decoration: none; font-weight: 500;">pricing page</a>.
      </p>
    `)}

    <p style="color: #64748b; font-size: 13px; margin: 0;">
      If you have feedback on how we can improve, we'd love to hear from you &mdash; just reply to this email.
    </p>`

  await resend.emails.send(
    {
      ...customerEnvelope("billing"),
      to,
      subject: "Your USAgentLeads Subscription Has Been Cancelled",
      html: emailLayout(body),
    },
    idempotencyKey ? { idempotencyKey } : undefined
  )
}

// ── Subscription renewed email ───────────────────────────────────────

interface SendSubscriptionRenewedParams extends IdempotentEmailParams {
  to: string
  nextRenewal: string | null
}

export async function sendSubscriptionRenewed({
  to,
  nextRenewal,
  idempotencyKey,
}: SendSubscriptionRenewedParams) {
  const renewalNote = nextRenewal
    ? `Your next renewal is on <strong>${new Date(nextRenewal).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>.`
    : ""

  const body = `
    <p style="margin: 0 0 16px 0; font-size: 15px;">Hi there,</p>

    <p style="margin: 0 0 16px 0; font-size: 15px;">
      Your USAgentLeads Pro Dashboard subscription has been renewed successfully. ${renewalNote}
    </p>

    ${primaryButton("https://www.usagentleads.com/dashboard", "Go to Dashboard")}

    <p style="color: #64748b; font-size: 13px; margin: 0;">
      Thanks for being a Pro member!
    </p>`

  await resend.emails.send(
    {
      ...customerEnvelope("billing"),
      to,
      subject: "Your USAgentLeads Subscription Has Been Renewed",
      html: emailLayout(body),
    },
    idempotencyKey ? { idempotencyKey } : undefined
  )
}

// ── Contact form email ──────────────────────────────────────────────

interface SendContactEmailParams {
  name: string
  email: string
  subject: string
  message: string
}

export async function sendContactEmail({
  name,
  email,
  subject,
  message,
}: SendContactEmailParams) {
  const body = `
    <p style="margin: 0 0 16px 0; font-size: 15px;">New contact form submission:</p>

    ${infoBox(`
      <table style="width: 100%; font-size: 14px; color: #334155;">
        <tr><td style="padding: 4px 0; font-weight: 600; width: 80px;">Name</td><td style="padding: 4px 0;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding: 4px 0; font-weight: 600;">Email</td><td style="padding: 4px 0;">${escapeHtml(email)}</td></tr>
        <tr><td style="padding: 4px 0; font-weight: 600;">Subject</td><td style="padding: 4px 0;">${escapeHtml(subject || "Not specified")}</td></tr>
      </table>
    `)}

    <p style="margin: 16px 0 8px 0; font-weight: 600; font-size: 14px;">Message:</p>
    <p style="margin: 0; font-size: 15px; white-space: pre-wrap;">${escapeHtml(message)}</p>`

  // Sanitize subject line inputs: strip control chars, truncate
  const safeName = name.replace(/[\r\n\t]/g, "").slice(0, 100)
  const safeSubject = (subject || "New Message").replace(/[\r\n\t]/g, "").slice(0, 200)
  // Validate replyTo is a plausible email before using it
  const safeReplyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined

  await resend.emails.send({
    from: formatEmailAddress(EMAIL_SENDERS.support),
    to: formatEmailAddress(SUPPORT_INBOX),
    replyTo: safeReplyTo || formatEmailAddress(SUPPORT_REPLY_TO),
    subject: `Contact Form: ${safeSubject} — ${safeName}`,
    html: emailLayout(body),
  })
}

// ── Payment failed email ─────────────────────────────────────────────

interface SendPaymentFailedParams extends IdempotentEmailParams {
  to: string
  planName?: "Pro Dashboard" | "Pro API"
}

// ── Free sample download email ────────────────────────────────────────

interface SendFreeSampleEmailParams {
  to: string
  downloadUrl: string
}

export async function sendFreeSampleEmail({
  to,
  downloadUrl,
}: SendFreeSampleEmailParams) {
  const countLabel = formatAgentCountLabel(await getAgentCount())
  const body = `
    <p style="margin: 0 0 16px 0; font-size: 15px;">Hi there,</p>

    <p style="margin: 0 0 8px 0; font-size: 15px;">
      Thanks for your interest in USAgentLeads! Here's your <strong>free sample</strong> of 500 verified real estate agent contacts.
    </p>

    ${primaryButton(downloadUrl, "Download Free Sample (CSV)")}

    <p style="color: #dc2626; font-weight: 600; font-size: 14px; text-align: center; margin: 0 0 24px 0;">
      This link expires in 7 days.
    </p>

    ${infoBox(`
      <p style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px; color: #1e3a5f;">What's included:</p>
      <table style="width: 100%; font-size: 14px; color: #334155;">
        <tr><td style="padding: 3px 0;">500 verified agent records</td></tr>
        <tr><td style="padding: 3px 0;">Full Name, Email, Phone, State</td></tr>
        <tr><td style="padding: 3px 0;">Ready for Excel, Google Sheets, or any CRM</td></tr>
      </table>
    `)}

    <p style="margin: 0 0 8px 0; font-size: 15px;">
      Want access to our <strong>full database of ${countLabel} agents</strong>?
    </p>

    ${primaryButton("https://www.usagentleads.com/pricing", "View Pricing Plans")}

    <p style="color: #64748b; font-size: 13px; margin: 0;">
      Questions? Reply to this email and we'll be happy to help.
    </p>`

  await resend.emails.send({
    ...customerEnvelope("samples"),
    to,
    subject: "Your Free Sample — 500 Real Estate Agent Contacts",
    html: emailLayout(body),
  })
}

// ── Nurture drip (sample-lead follow-ups) ────────────────────────────

/** Opt-out footer required on marketing email — see lib/utils/unsubscribe.ts. */
function unsubFooter(email: string): string {
  return `<p style="color: #94a3b8; font-size: 12px; margin: 28px 0 0 0; text-align: center; line-height: 1.6;">
    You're receiving this because you downloaded a free sample from USAgentLeads.<br>
    <a href="${escapeHtml(unsubscribeUrl(email))}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe from these emails</a>
  </p>`
}

/** Drip #1 (~day 2): help them actually use the sample and introduce the full DB. */
export async function sendNurtureImport({ to }: { to: string }) {
  const countLabel = formatAgentCountLabel(await getAgentCount())
  const body = `
    <p style="margin: 0 0 16px 0; font-size: 15px;">Hi there,</p>

    <p style="margin: 0 0 8px 0; font-size: 15px;">
      Thanks for grabbing the USAgentLeads free sample. Here's how to put it to work in a couple of minutes:
    </p>

    ${infoBox(`
      <p style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px; color: #1e3a5f;">Import in 3 steps</p>
      <table style="width: 100%; font-size: 14px; color: #334155;">
        <tr><td style="padding: 3px 0;">1. Open the CSV in Excel or Google Sheets</td></tr>
        <tr><td style="padding: 3px 0;">2. Map the columns: Full Name, Email, Phone, State</td></tr>
        <tr><td style="padding: 3px 0;">3. Import into HubSpot, Salesforce, GoHighLevel, or Mailchimp</td></tr>
      </table>
    `)}

    <p style="margin: 0 0 8px 0; font-size: 15px;">
      The sample is 500 rows. The full database covers <strong>all 50 states and ${countLabel} verified agents</strong> in the same clean format &mdash; one CSV, instant download, no account needed.
    </p>

    ${primaryButton(`${SITE_URL}/pricing`, "See Pricing")}

    <p style="color: #64748b; font-size: 13px; margin: 0;">
      Questions about the data or your use case? Just reply to this email.
    </p>

    ${unsubFooter(to)}`

  await resend.emails.send({
    ...customerEnvelope("updates"),
    to,
    subject: "How to import your real estate agent list into your CRM",
    html: emailLayout(body),
    headers: marketingHeaders(to),
  })
}

/** Drip #2 (~day 4): handle the "is the data any good?" objection. */
export async function sendNurtureQuality({ to }: { to: string }) {
  const body = `
    <p style="margin: 0 0 16px 0; font-size: 15px;">Hi there,</p>

    <p style="margin: 0 0 16px 0; font-size: 15px;">
      The most common question we get is a fair one: <em>is the data actually usable?</em> Here's how to check for yourself before you spend a dollar.
    </p>

    ${infoBox(`
      <table style="width: 100%; font-size: 14px; color: #334155;">
        <tr><td style="padding: 4px 0;">Spot-check a few records against public licensing or brokerage sources</td></tr>
        <tr><td style="padding: 4px 0;">Run the sample emails through NeverBounce or ZeroBounce</td></tr>
        <tr><td style="padding: 4px 0;">Confirm the fields map cleanly to your CRM</td></tr>
      </table>
    `)}

    <p style="margin: 0 0 16px 0; font-size: 15px;">
      Our records are compiled from public licensing records and professional directories, then cleaned, deduplicated, and verified for 90%+ deliverability. And every purchase is backed by a <strong>30-day money-back guarantee</strong> &mdash; if the data doesn't work for you, you get a refund.
    </p>

    ${primaryButton(`${SITE_URL}/states`, "Browse State Data")}

    ${unsubFooter(to)}`

  await resend.emails.send({
    ...customerEnvelope("updates"),
    to,
    subject: "Not sure the data's any good? Here's how to check",
    html: emailLayout(body),
    headers: marketingHeaders(to),
  })
}

/** A per-lead discount minted at send time — see createStateDiscount(). */
export interface NurtureCoupon {
  code: string
  label: string
  expiresAt: string
}

/** Drip #3 (~day 6): final nudge, with a dynamic per-lead coupon when provided. */
export async function sendNurtureFinal({ to, coupon }: { to: string; coupon?: NurtureCoupon }) {
  const countLabel = formatAgentCountLabel(await getAgentCount())
  const expiryText = coupon
    ? new Date(coupon.expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : ""

  const couponBlock = coupon
    ? infoBox(`
        <p style="margin: 0 0 6px 0; font-weight: 600; font-size: 15px; color: #1e3a5f;">Use code ${escapeHtml(coupon.code)} at checkout for ${escapeHtml(coupon.label)}</p>
        <p style="margin: 0; font-size: 13px; color: #475569;">Enter it in the "Add discount code" field on the checkout page. This code is yours alone and expires ${escapeHtml(expiryText)}.</p>
      `)
    : ""

  const subject = coupon
    ? `Your code for ${coupon.label} is inside (expires ${expiryText})`
    : "Ready when you are — a quick recap"

  const body = `
    <p style="margin: 0 0 16px 0; font-size: 15px;">Hi there,</p>

    <p style="margin: 0 0 16px 0; font-size: 15px;">
      Whenever you're ready, USAgentLeads gives you a complete, CRM-ready list of licensed real estate agents &mdash; name, email, phone, and state on every record.
    </p>

    ${infoBox(`
      <table style="width: 100%; font-size: 14px; color: #334155;">
        <tr><td style="padding: 3px 0;">Single state &mdash; $99 CSV download</td></tr>
        <tr><td style="padding: 3px 0;">All 50 states &mdash; $399, ${countLabel} verified contacts</td></tr>
        <tr><td style="padding: 3px 0;">Instant delivery &middot; no account &middot; 30-day money-back guarantee</td></tr>
      </table>
    `)}

    ${couponBlock}

    ${primaryButton(`${SITE_URL}/pricing`, "View Pricing")}

    <p style="color: #64748b; font-size: 13px; margin: 0;">
      This is the last email in this series &mdash; no more follow-ups after today.
    </p>

    ${unsubFooter(to)}`

  await resend.emails.send({
    ...customerEnvelope("updates"),
    to,
    subject,
    html: emailLayout(body),
    headers: marketingHeaders(to),
  })
}

// ── Payment failed email ─────────────────────────────────────────────

export async function sendPaymentFailed({
  to,
  planName = "Pro Dashboard",
  idempotencyKey,
}: SendPaymentFailedParams) {
  const body = `
    <p style="margin: 0 0 16px 0; font-size: 15px;">Hi there,</p>

    <p style="margin: 0 0 16px 0; font-size: 15px;">
      We were unable to process your latest payment for the USAgentLeads ${escapeHtml(planName)} subscription.
    </p>

    <p style="margin: 0 0 16px 0; font-size: 15px;">
      Please update your payment method to avoid losing access to your dashboard.
    </p>

    ${primaryButton("https://billing.stripe.com/p/login/bJeeVe00f94z4lM14N9EI00", "Update Payment Method")}

    ${infoBox(`
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>Important:</strong> If payment isn't resolved, your subscription will be paused and you'll lose dashboard access.
      </p>
    `)}

    <p style="color: #64748b; font-size: 13px; margin: 0;">
      If you believe this is an error, reply to this email and we'll help sort it out.
    </p>`

  await resend.emails.send(
    {
      ...customerEnvelope("billing"),
      to,
      subject: "Action Required: Payment Failed for USAgentLeads",
      html: emailLayout(body),
    },
    idempotencyKey ? { idempotencyKey } : undefined
  )
}
