import { Resend } from "resend"
import {
  EMAIL_SENDERS,
  SUPPORT_INBOX,
  SUPPORT_REPLY_TO,
  formatEmailAddress,
  type EmailSenderKey,
} from "@/lib/resend/email-config"
import {
  confirmSignupTemplate,
  contactNotificationTemplate,
  downloadReadyTemplate,
  freeSampleTemplate,
  magicLinkTemplate,
  nurtureFinalTemplate,
  nurtureImportTemplate,
  nurtureQualityTemplate,
  paymentFailedTemplate,
  subscriptionCancelledTemplate,
  subscriptionRenewedTemplate,
  subscriptionWelcomeTemplate,
  type EmailTemplate,
  type NurtureCoupon,
} from "@/lib/resend/email-templates"
import { getAgentCount, formatAgentCountLabel } from "@/lib/utils/agent-count"
import { unsubscribeUrl } from "@/lib/utils/unsubscribe"

export type { NurtureCoupon } from "@/lib/resend/email-templates"

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

interface IdempotentEmailParams {
  idempotencyKey?: string
}

interface DeliverCustomerEmailParams extends IdempotentEmailParams {
  sender: EmailSenderKey
  to: string
  template: EmailTemplate
  headers?: Record<string, string>
}

async function deliverCustomerEmail({
  sender,
  to,
  template,
  headers,
  idempotencyKey,
}: DeliverCustomerEmailParams): Promise<void> {
  const message = {
    from: formatEmailAddress(EMAIL_SENDERS[sender]),
    replyTo: formatEmailAddress(SUPPORT_REPLY_TO),
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    ...(headers ? { headers } : {}),
  }

  if (idempotencyKey) {
    await resend.emails.send(message, { idempotencyKey })
  } else {
    await resend.emails.send(message)
  }
}

function marketingHeaders(email: string): Record<string, string> {
  const url = unsubscribeUrl(email)
  return {
    "List-Unsubscribe": `<${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  }
}

function marketingOptions(email: string, reason: string) {
  const postalAddress = process.env.EMAIL_POSTAL_ADDRESS?.trim()
  if (!postalAddress) {
    throw new Error(
      "EMAIL_POSTAL_ADDRESS must be configured before sending promotional email"
    )
  }
  return {
    unsubscribeUrl: unsubscribeUrl(email),
    postalAddress,
    reason,
  }
}

export async function sendMagicLink({
  to,
  confirmationUrl,
}: {
  to: string
  confirmationUrl: string
}) {
  await deliverCustomerEmail({
    sender: "accounts",
    to,
    template: magicLinkTemplate({ confirmationUrl }),
  })
}

export async function sendConfirmSignup({
  to,
  confirmationUrl,
}: {
  to: string
  confirmationUrl: string
}) {
  await deliverCustomerEmail({
    sender: "accounts",
    to,
    template: confirmSignupTemplate({ confirmationUrl }),
  })
}

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
  await deliverCustomerEmail({
    sender: "downloads",
    to,
    template: downloadReadyTemplate({ downloadUrl, productName, purchaseType }),
    idempotencyKey,
  })
}

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
  await deliverCustomerEmail({
    sender: "billing",
    to,
    template: subscriptionWelcomeTemplate({ planName, countLabel }),
    idempotencyKey,
  })
}

interface SendSubscriptionCancelledParams extends IdempotentEmailParams {
  to: string
  accessUntil: string | null
}

export async function sendSubscriptionCancelled({
  to,
  accessUntil,
  idempotencyKey,
}: SendSubscriptionCancelledParams) {
  await deliverCustomerEmail({
    sender: "billing",
    to,
    template: subscriptionCancelledTemplate({ accessUntil }),
    idempotencyKey,
  })
}

interface SendSubscriptionRenewedParams extends IdempotentEmailParams {
  to: string
  nextRenewal: string | null
}

export async function sendSubscriptionRenewed({
  to,
  nextRenewal,
  idempotencyKey,
}: SendSubscriptionRenewedParams) {
  await deliverCustomerEmail({
    sender: "billing",
    to,
    template: subscriptionRenewedTemplate({ nextRenewal }),
    idempotencyKey,
  })
}

export async function sendContactEmail({
  name,
  email,
  subject,
  message,
}: {
  name: string
  email: string
  subject: string
  message: string
}) {
  const safeName = name.replace(/[\r\n\t]/g, "").slice(0, 100)
  const safeSubject = (subject || "New message").replace(/[\r\n\t]/g, "").slice(0, 200)
  const safeReplyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? email
    : formatEmailAddress(SUPPORT_REPLY_TO)
  const template = contactNotificationTemplate({
    name: safeName,
    email,
    subject: safeSubject,
    message,
  })

  await resend.emails.send({
    from: formatEmailAddress(EMAIL_SENDERS.support),
    to: formatEmailAddress(SUPPORT_INBOX),
    replyTo: safeReplyTo,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })
}

export async function sendFreeSampleEmail({
  to,
  downloadUrl,
}: {
  to: string
  downloadUrl: string
}) {
  const countLabel = formatAgentCountLabel(await getAgentCount())
  await deliverCustomerEmail({
    sender: "samples",
    to,
    template: freeSampleTemplate({ downloadUrl, countLabel }),
  })
}

export async function sendNurtureImport({ to }: { to: string }) {
  const countLabel = formatAgentCountLabel(await getAgentCount())
  await deliverCustomerEmail({
    sender: "updates",
    to,
    template: nurtureImportTemplate({
      countLabel,
      marketing: marketingOptions(
        to,
        "You requested a free sample from USAgentLeads."
      ),
    }),
    headers: marketingHeaders(to),
  })
}

export async function sendNurtureQuality({ to }: { to: string }) {
  await deliverCustomerEmail({
    sender: "updates",
    to,
    template: nurtureQualityTemplate({
      marketing: marketingOptions(
        to,
        "You requested a free sample from USAgentLeads."
      ),
    }),
    headers: marketingHeaders(to),
  })
}

export async function sendNurtureFinal({
  to,
  coupon,
}: {
  to: string
  coupon?: NurtureCoupon
}) {
  const countLabel = formatAgentCountLabel(await getAgentCount())
  await deliverCustomerEmail({
    sender: "updates",
    to,
    template: nurtureFinalTemplate({
      countLabel,
      coupon,
      marketing: marketingOptions(
        to,
        "You requested a free sample from USAgentLeads."
      ),
    }),
    headers: marketingHeaders(to),
  })
}

interface SendPaymentFailedParams extends IdempotentEmailParams {
  to: string
  planName?: "Pro Dashboard" | "Pro API"
}

export async function sendPaymentFailed({
  to,
  planName = "Pro Dashboard",
  idempotencyKey,
}: SendPaymentFailedParams) {
  await deliverCustomerEmail({
    sender: "billing",
    to,
    template: paymentFailedTemplate({ planName }),
    idempotencyKey,
  })
}
