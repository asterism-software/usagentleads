export type EmailTemplate = {
  subject: string
  html: string
  text: string
}

export type MarketingEmailOptions = {
  unsubscribeUrl: string
  postalAddress: string
  reason: string
}

export type NurtureCoupon = {
  code: string
  label: string
  expiresAt: string
}

type CallToAction = {
  label: string
  url: string
}

type RenderEmailParams = {
  subject: string
  preheader: string
  eyebrow: string
  title: string
  bodyHtml: string
  bodyText: string
  cta?: CallToAction
  marketing?: MarketingEmailOptions
  internal?: boolean
}

const WEB_URL = "https://www.usagentleads.com"
const SUPPORT_EMAIL = "support@usagentleads.com"

const COLORS = {
  page: "#F8F9FB",
  surface: "#FFFFFF",
  subtle: "#F1F3F7",
  border: "#E2E5EB",
  borderStrong: "#C9CDD6",
  accent: "#1D4ED8",
  accentLight: "#EEF2FF",
  accentMid: "#BFDBFE",
  accentHover: "#1E40AF",
  ink: "#0F1623",
  body: "#374151",
  tertiary: "#4B5563",
  muted: "#6B7280",
  success: "#15803D",
  successBg: "#F0FDF4",
  warning: "#B45309",
  warningBg: "#FFFBEB",
  danger: "#B91C1C",
  dangerBg: "#FEF2F2",
} as const

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function formatDate(value: string, includeYear = true): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  })
}

function paragraph(content: string, options?: { muted?: boolean; small?: boolean }): string {
  const color = options?.muted ? COLORS.tertiary : COLORS.body
  const size = options?.small ? "13px" : "15px"
  return `<p style="margin:0 0 18px;color:${color};font-family:Poppins,Arial,sans-serif;font-size:${size};line-height:1.75;">${content}</p>`
}

function callout(
  title: string,
  content: string,
  tone: "info" | "success" | "warning" | "danger" = "info"
): string {
  const tones = {
    info: { background: COLORS.accentLight, border: COLORS.accentMid, title: COLORS.accent },
    success: { background: COLORS.successBg, border: "#BBF7D0", title: COLORS.success },
    warning: { background: COLORS.warningBg, border: "#FDE68A", title: COLORS.warning },
    danger: { background: COLORS.dangerBg, border: "#FECACA", title: COLORS.danger },
  }
  const colors = tones[tone]
  return `<div style="margin:22px 0;padding:18px 20px;background:${colors.background};border:1px solid ${colors.border};border-radius:10px;">
    <p style="margin:0 0 5px;color:${colors.title};font-family:'Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${escapeHtml(title)}</p>
    <div style="color:${COLORS.body};font-family:Poppins,Arial,sans-serif;font-size:14px;line-height:1.65;">${content}</div>
  </div>`
}

function detailTable(rows: Array<{ label: string; value: string }>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border:1px solid ${COLORS.border};border-radius:10px;border-collapse:separate;overflow:hidden;">
    ${rows.map((row, index) => `<tr>
      <td style="padding:12px 16px;${index ? `border-top:1px solid ${COLORS.border};` : ""}background:${COLORS.subtle};color:${COLORS.muted};font-family:'Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;width:34%;">${escapeHtml(row.label)}</td>
      <td style="padding:12px 16px;${index ? `border-top:1px solid ${COLORS.border};` : ""}color:${COLORS.ink};font-family:Poppins,Arial,sans-serif;font-size:14px;font-weight:500;line-height:1.5;">${escapeHtml(row.value)}</td>
    </tr>`).join("")}
  </table>`
}

function bulletList(items: string[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 22px;">
    ${items.map((item) => `<tr>
      <td valign="top" style="padding:5px 10px 5px 0;color:${COLORS.accent};font-family:Arial,sans-serif;font-size:16px;font-weight:700;">✓</td>
      <td style="padding:5px 0;color:${COLORS.body};font-family:Poppins,Arial,sans-serif;font-size:14px;line-height:1.6;">${escapeHtml(item)}</td>
    </tr>`).join("")}
  </table>`
}

function numberedSteps(items: string[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 24px;">
    ${items.map((item, index) => `<tr>
      <td valign="top" style="padding:7px 12px 7px 0;width:28px;">
        <div style="width:26px;height:26px;border-radius:7px;background:${COLORS.accentLight};border:1px solid ${COLORS.accentMid};color:${COLORS.accent};font-family:'Courier New',monospace;font-size:12px;font-weight:700;line-height:26px;text-align:center;">${index + 1}</div>
      </td>
      <td style="padding:9px 0;color:${COLORS.body};font-family:Poppins,Arial,sans-serif;font-size:14px;line-height:1.55;">${escapeHtml(item)}</td>
    </tr>`).join("")}
  </table>`
}

function pricingTable(countLabel: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border:1px solid ${COLORS.border};border-radius:10px;border-collapse:separate;overflow:hidden;">
    <tr>
      <td style="padding:16px;background:${COLORS.surface};border-bottom:1px solid ${COLORS.border};">
        <p style="margin:0 0 3px;color:${COLORS.ink};font-family:Poppins,Arial,sans-serif;font-size:14px;font-weight:600;">Single state</p>
        <p style="margin:0;color:${COLORS.tertiary};font-family:Poppins,Arial,sans-serif;font-size:13px;">One CRM-ready CSV</p>
      </td>
      <td align="right" style="padding:16px;background:${COLORS.surface};border-bottom:1px solid ${COLORS.border};color:${COLORS.ink};font-family:'Courier New',monospace;font-size:19px;font-weight:700;">$99</td>
    </tr>
    <tr>
      <td style="padding:16px;background:${COLORS.accentLight};">
        <p style="margin:0 0 3px;color:${COLORS.ink};font-family:Poppins,Arial,sans-serif;font-size:14px;font-weight:600;">Full U.S. database</p>
        <p style="margin:0;color:${COLORS.tertiary};font-family:Poppins,Arial,sans-serif;font-size:13px;">All 50 states · ${escapeHtml(countLabel)} contacts</p>
      </td>
      <td align="right" style="padding:16px;background:${COLORS.accentLight};color:${COLORS.accent};font-family:'Courier New',monospace;font-size:19px;font-weight:700;">$399</td>
    </tr>
  </table>`
}

function ctaButton(cta: CallToAction): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 22px;">
    <tr><td bgcolor="${COLORS.accent}" style="border-radius:8px;box-shadow:0 1px 3px rgba(15,22,35,.08);">
      <a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:13px 22px;color:#FFFFFF;font-family:Poppins,Arial,sans-serif;font-size:15px;font-weight:600;line-height:1.2;text-decoration:none;border-radius:8px;">${escapeHtml(cta.label)} →</a>
    </td></tr>
  </table>
  <p style="margin:0 0 22px;color:${COLORS.muted};font-family:Poppins,Arial,sans-serif;font-size:12px;line-height:1.6;word-break:break-all;">If the button does not work, open:<br><a href="${escapeHtml(cta.url)}" style="color:${COLORS.accent};text-decoration:underline;">${escapeHtml(cta.url)}</a></p>`
}

function renderEmail({
  subject,
  preheader,
  eyebrow,
  title,
  bodyHtml,
  bodyText,
  cta,
  marketing,
  internal,
}: RenderEmailParams): EmailTemplate {
  const marketingFooterHtml = marketing
    ? `<p style="margin:0 0 8px;color:${COLORS.muted};font-family:Poppins,Arial,sans-serif;font-size:11px;line-height:1.6;">Advertisement · ${escapeHtml(marketing.reason)}</p>
       <p style="margin:0 0 8px;color:${COLORS.muted};font-family:Poppins,Arial,sans-serif;font-size:11px;line-height:1.6;">USAgentLeads · ${escapeHtml(marketing.postalAddress)}</p>
       <p style="margin:0;color:${COLORS.muted};font-family:Poppins,Arial,sans-serif;font-size:11px;line-height:1.6;"><a href="${escapeHtml(marketing.unsubscribeUrl)}" style="color:${COLORS.muted};text-decoration:underline;">Unsubscribe from promotional emails</a></p>`
    : internal
      ? `<p style="margin:0;color:${COLORS.muted};font-family:Poppins,Arial,sans-serif;font-size:11px;line-height:1.6;">Internal USAgentLeads support notification</p>`
      : `<p style="margin:0;color:${COLORS.muted};font-family:Poppins,Arial,sans-serif;font-size:11px;line-height:1.6;">Need help? Reply to this email or contact <a href="mailto:${SUPPORT_EMAIL}" style="color:${COLORS.muted};text-decoration:underline;">${SUPPORT_EMAIL}</a>.</p>`

  const footerText = marketing
    ? `Advertisement · ${marketing.reason}\nUSAgentLeads · ${marketing.postalAddress}\nUnsubscribe: ${marketing.unsubscribeUrl}`
    : internal
      ? "Internal USAgentLeads support notification"
      : `Need help? Reply to this email or contact ${SUPPORT_EMAIL}.`

  const ctaText = cta ? `\n${cta.label}: ${cta.url}\n` : ""

  return {
    subject,
    text: `${title}\n\n${bodyText}${ctaText}\n${footerText}`,
    html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(subject)}</title>
  <style>
    body { margin:0 !important; padding:0 !important; width:100% !important; background:${COLORS.page}; }
    table { border-spacing:0; }
    a { color:${COLORS.accent}; }
    @media only screen and (max-width:620px) {
      .email-shell { width:100% !important; }
      .email-card { border-left:0 !important; border-right:0 !important; border-radius:0 !important; }
      .email-pad { padding-left:24px !important; padding-right:24px !important; }
      .email-title { font-size:26px !important; }
    }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:${COLORS.page};">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="email-shell email-card" style="width:600px;max-width:600px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:14px;box-shadow:0 4px 12px rgba(15,22,35,.06);overflow:hidden;">
        <tr><td class="email-pad" style="padding:22px 36px;border-bottom:1px solid ${COLORS.border};">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:32px;height:32px;">
              <img src="${WEB_URL}/icon-192.png" width="32" height="32" alt="USAgentLeads" style="display:block;width:32px;height:32px;border:0;border-radius:8px;outline:none;text-decoration:none;">
            </td>
            <td style="padding-left:11px;color:${COLORS.ink};font-family:Poppins,Arial,sans-serif;font-size:17px;font-weight:700;letter-spacing:-.02em;">USAgentLeads</td>
          </tr></table>
        </td></tr>
        <tr><td class="email-pad" style="padding:38px 36px 34px;">
          <p style="margin:0 0 10px;color:${COLORS.accent};font-family:'Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>
          <h1 class="email-title" style="margin:0 0 22px;color:${COLORS.ink};font-family:Poppins,Arial,sans-serif;font-size:30px;font-weight:600;letter-spacing:-.035em;line-height:1.15;">${escapeHtml(title)}</h1>
          ${bodyHtml}
          ${cta ? ctaButton(cta) : ""}
        </td></tr>
        <tr><td class="email-pad" style="padding:22px 36px;background:${COLORS.subtle};border-top:1px solid ${COLORS.border};">
          ${marketingFooterHtml}
        </td></tr>
      </table>
      <p style="margin:16px 0 0;color:${COLORS.muted};font-family:Poppins,Arial,sans-serif;font-size:11px;">${internal ? "USAgentLeads operations" : `Sent by USAgentLeads · ${WEB_URL.replace("https://", "")}`}</p>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

export function magicLinkTemplate({ confirmationUrl }: { confirmationUrl: string }): EmailTemplate {
  return renderEmail({
    subject: "Your USAgentLeads sign-in link",
    preheader: "Use this secure, one-time link to sign in to your account.",
    eyebrow: "Account access",
    title: "Sign in to your account",
    bodyHtml:
      paragraph("A sign-in link was requested for your USAgentLeads account. Use the button below to continue.") +
      callout("Secure link", "This link expires in 24 hours and can be used once. If you did not request it, no action is needed."),
    bodyText: "A sign-in link was requested for your USAgentLeads account. This secure link expires in 24 hours and can be used once. If you did not request it, no action is needed.",
    cta: { label: "Sign in securely", url: confirmationUrl },
  })
}

export function confirmSignupTemplate({ confirmationUrl }: { confirmationUrl: string }): EmailTemplate {
  return renderEmail({
    subject: "Confirm your USAgentLeads email",
    preheader: "Confirm your email address to finish creating your account.",
    eyebrow: "Account setup",
    title: "Confirm your email address",
    bodyHtml:
      paragraph("Finish creating your USAgentLeads account by confirming this email address.") +
      callout("Security note", "This link expires in 24 hours. If you did not create an account, you can ignore this message."),
    bodyText: "Finish creating your USAgentLeads account by confirming this email address. The link expires in 24 hours. If you did not create an account, you can ignore this message.",
    cta: { label: "Confirm email address", url: confirmationUrl },
  })
}

export function downloadReadyTemplate({
  downloadUrl,
  productName,
  purchaseType,
}: {
  downloadUrl: string
  productName: string
  purchaseType: "state" | "full_database"
}): EmailTemplate {
  const isFullDatabase = purchaseType === "full_database"
  const format = isFullDatabase ? "ZIP archive with numbered CSV parts" : "CSV file"
  const archiveNote = isFullDatabase
    ? callout(
        "Excel-ready archive",
        "The full database is split into numbered CSV files so every part stays within Excel’s row limit. Extract the ZIP, then open or import each part separately."
      )
    : ""
  return renderEmail({
    subject: `Your ${productName} data is ready`,
    preheader: "Your purchase is confirmed. Download your real estate agent data.",
    eyebrow: "Order ready",
    title: "Your download is ready",
    bodyHtml:
      paragraph(`Your purchase is confirmed. The <strong style="color:${COLORS.ink};">${escapeHtml(productName)}</strong> real estate agent data is ready.`) +
      detailTable([
        { label: "Product", value: productName },
        { label: "Format", value: format },
        { label: "Fields", value: "Name · Email · Phone · State" },
        { label: "Link", value: "Expires in 48 hours · one use" },
      ]) +
      archiveNote,
    bodyText: `Your purchase is confirmed.\n\nProduct: ${productName}\nFormat: ${format}\nFields: Name, Email, Phone, State\nDownload link: expires in 48 hours and can be used once.${isFullDatabase ? "\n\nThe ZIP contains numbered CSV parts so each file opens safely in Excel." : ""}`,
    cta: { label: isFullDatabase ? "Download database files" : "Download CSV", url: downloadUrl },
  })
}

export function subscriptionWelcomeTemplate({
  planName,
  countLabel,
}: {
  planName: "Pro Dashboard" | "Pro API"
  countLabel: string
}): EmailTemplate {
  const isApiPlan = planName === "Pro API"
  const destination = isApiPlan ? `${WEB_URL}/dashboard/api-keys` : `${WEB_URL}/dashboard`
  const features = [
    `Browse ${countLabel} verified real estate agent records`,
    "Search and filter by state",
    ...(isApiPlan ? ["10,000 REST API requests each month"] : []),
    "Access continuously refreshed data",
    "Manage or cancel from your dashboard",
  ]
  return renderEmail({
    subject: `Your USAgentLeads ${planName} access is active`,
    preheader: `Your ${planName} subscription is active and ready to use.`,
    eyebrow: "Subscription active",
    title: `${planName} is ready`,
    bodyHtml:
      paragraph(`Your <strong style="color:${COLORS.ink};">USAgentLeads ${escapeHtml(planName)}</strong> subscription is active.`) +
      bulletList(features),
    bodyText: `Your USAgentLeads ${planName} subscription is active.\n\n${features.map((feature) => `- ${feature}`).join("\n")}`,
    cta: { label: isApiPlan ? "Manage API keys" : "Open dashboard", url: destination },
  })
}

export function subscriptionCancelledTemplate({ accessUntil }: { accessUntil: string | null }): EmailTemplate {
  const accessValue = accessUntil ? formatDate(accessUntil) : "End of the current billing period"
  return renderEmail({
    subject: "Your USAgentLeads cancellation is confirmed",
    preheader: `Your subscription is cancelled. Access continues through ${accessValue}.`,
    eyebrow: "Subscription update",
    title: "Cancellation confirmed",
    bodyHtml:
      paragraph("Your USAgentLeads Pro subscription has been cancelled. You will not be charged for another billing period.") +
      detailTable([{ label: "Access through", value: accessValue }]) +
      paragraph(`You can restart access at any time from the <a href="${WEB_URL}/pricing" style="color:${COLORS.accent};font-weight:600;">pricing page</a>. If you have feedback, reply to this email.`, { small: true, muted: true }),
    bodyText: `Your USAgentLeads Pro subscription has been cancelled. You will not be charged for another billing period.\n\nAccess through: ${accessValue}\n\nYou can restart access at any time: ${WEB_URL}/pricing`,
  })
}

export function subscriptionRenewedTemplate({ nextRenewal }: { nextRenewal: string | null }): EmailTemplate {
  const nextRenewalValue = nextRenewal ? formatDate(nextRenewal) : "Shown in your billing portal"
  return renderEmail({
    subject: "Your USAgentLeads subscription renewed",
    preheader: `Your subscription renewed successfully. Next renewal: ${nextRenewalValue}.`,
    eyebrow: "Billing confirmation",
    title: "Renewal confirmed",
    bodyHtml:
      paragraph("Your USAgentLeads Pro subscription renewed successfully. Your access remains active.") +
      detailTable([
        { label: "Status", value: "Active" },
        { label: "Next renewal", value: nextRenewalValue },
      ]),
    bodyText: `Your USAgentLeads Pro subscription renewed successfully.\n\nStatus: Active\nNext renewal: ${nextRenewalValue}`,
    cta: { label: "Open dashboard", url: `${WEB_URL}/dashboard` },
  })
}

export function contactNotificationTemplate({
  name,
  email,
  subject,
  message,
}: {
  name: string
  email: string
  subject: string
  message: string
}): EmailTemplate {
  return renderEmail({
    subject: `Support request: ${subject || "New message"} — ${name}`,
    preheader: `New support request from ${email}.`,
    eyebrow: "Support inbox",
    title: "New support request",
    bodyHtml:
      detailTable([
        { label: "Name", value: name },
        { label: "Email", value: email },
        { label: "Subject", value: subject || "Not specified" },
      ]) +
      `<p style="margin:24px 0 8px;color:${COLORS.ink};font-family:'Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Message</p>` +
      `<div style="padding:18px 20px;background:${COLORS.subtle};border:1px solid ${COLORS.border};border-radius:10px;color:${COLORS.body};font-family:Poppins,Arial,sans-serif;font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</div>`,
    bodyText: `Name: ${name}\nEmail: ${email}\nSubject: ${subject || "Not specified"}\n\nMessage:\n${message}`,
    internal: true,
  })
}

export function freeSampleTemplate({
  downloadUrl,
  countLabel,
}: {
  downloadUrl: string
  countLabel: string
}): EmailTemplate {
  return renderEmail({
    subject: "Your 500-contact sample is ready",
    preheader: "Download your free CSV sample of real estate agent contacts.",
    eyebrow: "Sample ready",
    title: "Your sample is ready",
    bodyHtml:
      paragraph("Your free sample contains 500 real estate agent records in the same clean format as the full database.") +
      detailTable([
        { label: "Records", value: "500 contacts" },
        { label: "Fields", value: "Name · Email · Phone · State" },
        { label: "Format", value: "CSV · CRM-ready" },
        { label: "Link", value: "Expires in 7 days" },
      ]) +
      paragraph(`Need broader coverage later? The full database includes <strong style="color:${COLORS.ink};">${escapeHtml(countLabel)}</strong> contacts across all 50 states. <a href="${WEB_URL}/pricing" style="color:${COLORS.accent};font-weight:600;">Compare coverage and pricing</a>.`, { small: true, muted: true }),
    bodyText: `Your free sample contains 500 real estate agent records.\n\nFields: Name, Email, Phone, State\nFormat: CRM-ready CSV\nLink: expires in 7 days\n\nFull database pricing: ${WEB_URL}/pricing`,
    cta: { label: "Download sample CSV", url: downloadUrl },
  })
}

export function nurtureImportTemplate({
  countLabel,
  marketing,
}: {
  countLabel: string
  marketing: MarketingEmailOptions
}): EmailTemplate {
  const steps = [
    "Open the CSV in Excel or Google Sheets and review the column headers.",
    "Map Name, Email, Phone, and State to the matching CRM fields.",
    "Import a small test batch before uploading the full file.",
  ]
  return renderEmail({
    subject: "Three steps to import your agent sample",
    preheader: "Move the sample into your CRM without creating duplicate or mismatched fields.",
    eyebrow: "Sample guide · 1 of 3",
    title: "Import the sample cleanly",
    bodyHtml:
      paragraph("Your sample is ready for HubSpot, Salesforce, GoHighLevel, Mailchimp, or any CRM that accepts CSV files.") +
      numberedSteps(steps) +
      callout("Need more coverage?", `The same four-column format is available for all 50 states and ${escapeHtml(countLabel)} contacts.`),
    bodyText: `Your sample is ready for any CRM that accepts CSV files.\n\n${steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}\n\nThe same format is available for all 50 states and ${countLabel} contacts.`,
    cta: { label: "Compare data options", url: `${WEB_URL}/pricing` },
    marketing,
  })
}

export function nurtureQualityTemplate({ marketing }: { marketing: MarketingEmailOptions }): EmailTemplate {
  const checks = [
    "Spot-check several records against public licensing or brokerage sources.",
    "Run sample addresses through an independent email verification service.",
    "Confirm every field maps cleanly into your CRM before scaling the import.",
  ]
  return renderEmail({
    subject: "Three ways to check the sample data",
    preheader: "Evaluate accuracy, deliverability, and CRM compatibility before buying.",
    eyebrow: "Sample guide · 2 of 3",
    title: "Check the data for yourself",
    bodyHtml:
      paragraph("You should be able to evaluate a data product before spending money. Use the sample to check the three things that matter most.") +
      numberedSteps(checks) +
      callout("Purchase protection", "Every purchase includes a 30-day money-back guarantee.", "success"),
    bodyText: `Use the sample to evaluate the data before buying.\n\n${checks.map((check, index) => `${index + 1}. ${check}`).join("\n")}\n\nEvery purchase includes a 30-day money-back guarantee.`,
    cta: { label: "Browse state coverage", url: `${WEB_URL}/states` },
    marketing,
  })
}

export function nurtureFinalTemplate({
  countLabel,
  coupon,
  marketing,
}: {
  countLabel: string
  coupon?: NurtureCoupon
  marketing: MarketingEmailOptions
}): EmailTemplate {
  const expiryText = coupon ? formatDate(coupon.expiresAt, false) : ""
  const couponHtml = coupon
    ? callout(
        coupon.label,
        `<strong style="color:${COLORS.ink};font-family:'Courier New',monospace;font-size:17px;letter-spacing:.04em;">${escapeHtml(coupon.code)}</strong><br><span style="font-size:13px;">Single use · expires ${escapeHtml(expiryText)}</span>`,
        "success"
      )
    : ""
  const subject = coupon ? `${coupon.label}: your code expires ${expiryText}` : "Choose the agent coverage that fits"
  return renderEmail({
    subject,
    preheader: coupon ? `Use ${coupon.code} before ${expiryText}.` : "Compare single-state and nationwide database coverage.",
    eyebrow: "Sample guide · 3 of 3",
    title: "Choose the coverage that fits",
    bodyHtml:
      paragraph("The sample showed you the format. When you need production coverage, choose one state or the full nationwide database.") +
      pricingTable(countLabel) +
      couponHtml +
      paragraph("This is the final message in the sample guide series.", { small: true, muted: true }),
    bodyText: `Choose one state or the full nationwide database.\n\nSingle state: $99\nFull U.S. database: $399 · ${countLabel} contacts${coupon ? `\n\n${coupon.label}\nCode: ${coupon.code}\nExpires: ${expiryText}` : ""}\n\nThis is the final message in the sample guide series.`,
    cta: { label: "View coverage and pricing", url: `${WEB_URL}/pricing` },
    marketing,
  })
}

export function paymentFailedTemplate({ planName }: { planName: "Pro Dashboard" | "Pro API" }): EmailTemplate {
  return renderEmail({
    subject: "Action needed: update your payment method",
    preheader: `We could not process your latest ${planName} subscription payment.`,
    eyebrow: "Billing action required",
    title: "Your payment did not go through",
    bodyHtml:
      paragraph(`We could not process the latest payment for your <strong style="color:${COLORS.ink};">USAgentLeads ${escapeHtml(planName)}</strong> subscription.`) +
      callout("Access at risk", "Update your payment method to prevent your subscription from being paused.", "danger") +
      paragraph("If you believe this is an error, reply to this email and the support team will help.", { small: true, muted: true }),
    bodyText: `We could not process the latest payment for your USAgentLeads ${planName} subscription. Update your payment method to prevent your subscription from being paused. If you believe this is an error, reply to this email.`,
    cta: {
      label: "Update payment method",
      url: "https://billing.stripe.com/p/login/bJeeVe00f94z4lM14N9EI00",
    },
  })
}

export function milestoneAnnouncementTemplate({
  marketing,
}: {
  marketing: MarketingEmailOptions
}): EmailTemplate {
  return renderEmail({
    subject: "The USAgentLeads database passed 1,000,000 contacts",
    preheader: "Nationwide coverage now includes more than one million real estate agent contacts.",
    eyebrow: "Database update",
    title: "More than one million contacts",
    bodyHtml:
      paragraph("The USAgentLeads database now covers more than 1,000,000 real estate agent contacts across all 50 states and Washington, DC.") +
      detailTable([
        { label: "Coverage", value: "All 50 states · Washington, DC" },
        { label: "Fields", value: "Name · Email · Phone · State" },
        { label: "Delivery", value: "Instant CRM-ready CSV" },
      ]) +
      paragraph("Recent additions include complete Michigan and Virginia licensing data, plus refreshed records across the rest of the country."),
    bodyText: "The USAgentLeads database now covers more than 1,000,000 real estate agent contacts across all 50 states and Washington, DC.\n\nFields: Name, Email, Phone, State\nDelivery: Instant CRM-ready CSV\n\nRecent additions include complete Michigan and Virginia licensing data, plus refreshed records nationwide.",
    cta: { label: "Review current pricing", url: `${WEB_URL}/pricing` },
    marketing,
  })
}
