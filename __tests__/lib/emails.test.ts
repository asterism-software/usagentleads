import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
}))

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.send }
  },
}))
vi.mock("@/lib/utils/agent-count", () => ({
  getAgentCount: vi.fn(),
  formatAgentCountLabel: vi.fn(),
}))

import {
  sendContactEmail,
  sendDownloadEmail,
  sendFreeSampleEmail,
  sendMagicLink,
  sendNurtureImport,
  sendPaymentFailed,
} from "@/lib/resend/emails"

const SUPPORT_REPLY_TO = "USAgentLeads Support <support@usagentleads.com>"

describe("sendDownloadEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.send.mockResolvedValue({ data: { id: "email-id" }, error: null })
  })

  it("explains the Excel-safe multipart ZIP for Full Database purchases", async () => {
    await sendDownloadEmail({
      to: "buyer@example.com",
      downloadUrl: "https://www.usagentleads.com/api/download?token=token",
      productName: "Full USA",
      purchaseType: "full_database",
      idempotencyKey: "download:session",
    })

    const [message, options] = mocks.send.mock.calls[0]
    expect(message.from).toBe(
      "USAgentLeads Downloads <downloads@mail.usagentleads.com>"
    )
    expect(message.replyTo).toBe(SUPPORT_REPLY_TO)
    expect(message.subject).toContain("Full USA")
    expect(message.html).toContain("Download Your Files")
    expect(message.html).toContain("ZIP archive with numbered CSV parts")
    expect(message.html).toContain("open each part separately")
    expect(message.html).toContain("ZIP archive with CSV parts")
    expect(options).toEqual({ idempotencyKey: "download:session" })
  })

  it("keeps State Pack delivery as a single CSV", async () => {
    await sendDownloadEmail({
      to: "buyer@example.com",
      downloadUrl: "https://www.usagentleads.com/api/download?token=token",
      productName: "Texas",
      purchaseType: "state",
    })

    const [message] = mocks.send.mock.calls[0]
    expect(message.html).toContain("Download Your CSV")
    expect(message.html).toContain("File format: CSV")
    expect(message.html).not.toContain("worksheet to 1,048,576 rows")
  })
})

describe("email sender identities", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.UNSUBSCRIBE_SECRET = "email-test-secret"
    mocks.send.mockResolvedValue({ data: { id: "email-id" }, error: null })
  })

  it("uses the accounts identity for authentication emails", async () => {
    await sendMagicLink({
      to: "customer@example.com",
      confirmationUrl: "https://www.usagentleads.com/auth/confirm?token=token",
    })

    const [message] = mocks.send.mock.calls[0]
    expect(message.from).toBe(
      "USAgentLeads Accounts <accounts@mail.usagentleads.com>"
    )
    expect(message.replyTo).toBe(SUPPORT_REPLY_TO)
  })

  it("uses the billing identity for subscription emails", async () => {
    await sendPaymentFailed({ to: "customer@example.com" })

    const [message] = mocks.send.mock.calls[0]
    expect(message.from).toBe(
      "USAgentLeads Billing <billing@mail.usagentleads.com>"
    )
    expect(message.replyTo).toBe(SUPPORT_REPLY_TO)
  })

  it("uses the samples identity for requested sample delivery", async () => {
    await sendFreeSampleEmail({
      to: "lead@example.com",
      downloadUrl: "https://example.com/sample.csv",
    })

    const [message] = mocks.send.mock.calls[0]
    expect(message.from).toBe(
      "USAgentLeads Samples <samples@mail.usagentleads.com>"
    )
    expect(message.replyTo).toBe(SUPPORT_REPLY_TO)
    expect(message.headers).toBeUndefined()
  })

  it("uses the updates identity and one-click opt-out for nurture email", async () => {
    await sendNurtureImport({ to: "lead@example.com" })

    const [message] = mocks.send.mock.calls[0]
    expect(message.from).toBe(
      "USAgentLeads Updates <updates@mail.usagentleads.com>"
    )
    expect(message.replyTo).toBe(SUPPORT_REPLY_TO)
    expect(message.headers).toEqual({
      "List-Unsubscribe": expect.stringContaining(
        "/api/unsubscribe?e=lead%40example.com&t="
      ),
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    })
  })

  it("routes internal contact notifications to support and replies to the customer", async () => {
    await sendContactEmail({
      name: "Customer",
      email: "customer@example.com",
      subject: "Question",
      message: "Can you help?",
    })

    const [message] = mocks.send.mock.calls[0]
    expect(message.from).toBe(
      "USAgentLeads Support <support@mail.usagentleads.com>"
    )
    expect(message.to).toBe("Support Team <support@usagentleads.com>")
    expect(message.replyTo).toBe("customer@example.com")
  })
})
