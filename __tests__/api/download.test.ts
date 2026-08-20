import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  authorizeDownload: vi.fn(),
  rateLimit: vi.fn(),
}))

vi.mock("@/lib/downloads/access", () => ({
  authorizeDownload: mocks.authorizeDownload,
}))
vi.mock("@/lib/utils/rateLimit", () => ({
  rateLimit: mocks.rateLimit,
}))

import { GET, POST } from "@/app/api/download/route"

const TOKEN = "123e4567-e89b-42d3-a456-426614174000"

function postRequest(token = TOKEN, headers: Record<string, string> = {}) {
  const body = new URLSearchParams({ token })
  return new Request("https://www.usagentleads.com/api/download", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      ...headers,
    },
    body,
  })
}

describe("/api/download", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.rateLimit.mockResolvedValue({ success: true, remaining: 14 })
    mocks.authorizeDownload.mockResolvedValue({
      ok: true,
      signedUrl: "https://storage.example/CA.csv",
    })
  })

  it("turns legacy GET links into scanner-safe page redirects", async () => {
    const response = await GET(
      new Request(`https://www.usagentleads.com/api/download?token=${TOKEN}`)
    )

    expect(response.status).toBe(303)
    expect(response.headers.get("location")).toBe(
      `https://www.usagentleads.com/download?token=${TOKEN}`
    )
    expect(mocks.authorizeDownload).not.toHaveBeenCalled()
    expect(mocks.rateLimit).not.toHaveBeenCalled()
  })

  it("authorizes only an explicit POST and redirects to Storage", async () => {
    const response = await POST(
      postRequest(TOKEN, {
        "x-forwarded-for": "192.0.2.5",
        "user-agent": "Test Browser",
        "x-vercel-id": "iad1::request-id",
      })
    )

    expect(response.status).toBe(303)
    expect(response.headers.get("location")).toBe("https://storage.example/CA.csv")
    expect(mocks.authorizeDownload).toHaveBeenCalledWith({
      token: TOKEN,
      ip: "192.0.2.5",
      userAgent: "Test Browser",
      requestId: "iad1::request-id",
    })
  })

  it("accepts the apex-domain form POST when the proxy reports www", async () => {
    const response = await POST(
      postRequest(TOKEN, {
        origin: "https://usagentleads.com",
        referer: `https://usagentleads.com/download?token=${TOKEN}`,
        "sec-fetch-site": "same-origin",
      })
    )

    expect(response.status).toBe(303)
    expect(response.headers.get("location")).toBe("https://storage.example/CA.csv")
    expect(mocks.authorizeDownload).toHaveBeenCalledOnce()
  })

  it("returns customers to the page with a recoverable failure state", async () => {
    mocks.authorizeDownload.mockResolvedValueOnce({
      ok: false,
      reason: "storage_error",
    })

    const response = await POST(postRequest())

    expect(response.status).toBe(303)
    expect(response.headers.get("location")).toBe(
      `https://www.usagentleads.com/download?token=${TOKEN}&status=storage_error`
    )
  })

  it("rejects browser cross-site POST requests", async () => {
    const response = await POST(
      postRequest(TOKEN, {
        origin: "https://attacker.example",
        "sec-fetch-site": "cross-site",
      })
    )

    expect(response.status).toBe(403)
    expect(mocks.authorizeDownload).not.toHaveBeenCalled()
  })

  it("rejects malformed tokens without calling authorization", async () => {
    const response = await POST(postRequest("not-a-token"))

    expect(response.status).toBe(303)
    expect(response.headers.get("location")).toBe(
      "https://www.usagentleads.com/download?status=invalid"
    )
    expect(mocks.authorizeDownload).not.toHaveBeenCalled()
  })
})
