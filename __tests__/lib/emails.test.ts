import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  getAgentCount: vi.fn(),
  formatAgentCountLabel: vi.fn(),
}))

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.send }
  },
}))
vi.mock("@/lib/utils/agent-count", () => ({
  getAgentCount: mocks.getAgentCount,
  formatAgentCountLabel: mocks.formatAgentCountLabel,
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
    mocks.getAgentCount.mockResolvedValue(1_100_000)
    mocks.formatAgentCountLabel.mockReturnValue("1.1M+")
  })

  it("explains the Excel-safe multipart ZIP for Full Database purchases", async () => {
    await sendDownloadEmail({
      to: "buyer@example.com",
      downloadUrl: "https://www.usagentleads.com/download?token=token",
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
    expect(message.html).toContain("Open secure download page")
    expect(message.html).toContain("up to 10 downloads")
    expect(message.html).toContain("ZIP archive with numbered CSV parts")
    expect(message.html).toContain("open or import each part separately")
    expect(message.text).toContain("numbered CSV parts")
    expect(options).toEqual({ idempotencyKey: "download:session" })
  })

  it("keeps State Pack delivery as a single CSV", async () => {
    await sendDownloadEmail({
      to: "buyer@example.com",
      downloadUrl: "https://www.usagentleads.com/download?token=token",
      productName: "Texas",
      purchaseType: "state",
    })

    const [message] = mocks.send.mock.calls[0]
    expect(message.html).toContain("Open secure download page")
    expect(message.html).toContain("up to 10 downloads")
    expect(message.html).toContain("CSV file")
    expect(message.html).not.toContain("Excel-ready archive")
  })
})

describe("email sender identities", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.UNSUBSCRIBE_SECRET = "email-test-secret"
    process.env.EMAIL_POSTAL_ADDRESS = "123 Test Street, Test City, TS 00000"
    mocks.send.mockResolvedValue({ data: { id: "email-id" }, error: null })
    mocks.getAgentCount.mockResolvedValue(1_100_000)
    mocks.formatAgentCountLabel.mockReturnValue("1.1M+")
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
    expect(message.text).toContain("500 real estate agent records")
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
    expect(message.html).toContain("Advertisement")
    expect(message.html).toContain("123 Test Street")
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
