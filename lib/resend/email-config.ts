export type EmailAddress = {
  email: string
  name: string
}

/**
 * Public sender identities. These addresses are send-only; replies are routed
 * to SUPPORT_REPLY_TO by the Resend transport.
 */
export const EMAIL_SENDERS = {
  accounts: {
    email: "accounts@mail.usagentleads.com",
    name: "USAgentLeads Accounts",
  },
  downloads: {
    email: "downloads@mail.usagentleads.com",
    name: "USAgentLeads Downloads",
  },
  billing: {
    email: "billing@mail.usagentleads.com",
    name: "USAgentLeads Billing",
  },
  samples: {
    email: "samples@mail.usagentleads.com",
    name: "USAgentLeads Samples",
  },
  support: {
    email: "support@mail.usagentleads.com",
    name: "USAgentLeads Support",
  },
  updates: {
    email: "updates@mail.usagentleads.com",
    name: "USAgentLeads Updates",
  },
} as const satisfies Record<string, EmailAddress>

export type EmailSenderKey = keyof typeof EMAIL_SENDERS

/** The real, monitored inbox used for every customer reply. */
export const SUPPORT_REPLY_TO = {
  email: "support@usagentleads.com",
  name: "USAgentLeads Support",
} as const satisfies EmailAddress

/** The same inbox when it is the recipient of an internal notification. */
export const SUPPORT_INBOX = {
  email: "support@usagentleads.com",
  name: "Support Team",
} as const satisfies EmailAddress

export function formatEmailAddress(address: EmailAddress): string {
  return `${address.name} <${address.email}>`
}
