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

import { sendDownloadEmail } from "@/lib/resend/emails"

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
