import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  maybeSingle: vi.fn(),
  createSignedUrl: vi.fn(),
  rpc: vi.fn(),
  insertAttempt: vi.fn(),
  insertDownloadLog: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: mocks.createServiceClient,
}))

import {
  authorizeDownload,
  getDownloadAccess,
  STATE_SIGNED_URL_SECONDS,
} from "@/lib/downloads/access"

const TOKEN = "123e4567-e89b-42d3-a456-426614174000"

function purchase(overrides: Record<string, unknown> = {}) {
  return {
    id: "purchase-id",
    user_id: null,
    guest_email: "buyer@example.com",
    purchase_type: "state",
    state_code: "CA",
    status: "completed",
    expires_at: "2099-01-01T00:00:00.000Z",
    download_count: 1,
    download_limit: 5,
    ...overrides,
  }
}

describe("download access", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const purchaseQuery = {
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      maybeSingle: mocks.maybeSingle,
    }
    const from = vi.fn((table: string) => {
      if (table === "purchases") return purchaseQuery
      if (table === "download_attempts") {
        return { insert: mocks.insertAttempt }
      }
      if (table === "download_logs") {
        return { insert: mocks.insertDownloadLog }
      }
      throw new Error(`Unexpected table: ${table}`)
    })
    mocks.createServiceClient.mockReturnValue({
      schema: vi.fn(() => ({ from, rpc: mocks.rpc })),
      storage: {
        from: vi.fn(() => ({ createSignedUrl: mocks.createSignedUrl })),
      },
    })
    mocks.maybeSingle.mockResolvedValue({ data: purchase(), error: null })
    mocks.createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://storage.example/CA.csv" },
      error: null,
    })
    mocks.rpc.mockResolvedValue({
      data: [
        {
          purchase_id: "purchase-id",
          authorized_download_count: 2,
          authorized_download_limit: 5,
        },
      ],
      error: null,
    })
    mocks.insertAttempt.mockResolvedValue({ error: null })
    mocks.insertDownloadLog.mockResolvedValue({ error: null })
  })

  it("does not query the database for malformed tokens", async () => {
    await expect(getDownloadAccess("bad-token")).resolves.toEqual({
      status: "invalid",
      purchase: null,
    })
    expect(mocks.createServiceClient).not.toHaveBeenCalled()
  })

  it("reports remaining access without consuming it", async () => {
    const access = await getDownloadAccess(TOKEN)

    expect(access.status).toBe("available")
    expect(access.purchase?.download_count).toBe(1)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it("reports expired and exhausted purchases", async () => {
    mocks.maybeSingle
      .mockResolvedValueOnce({
        data: purchase({ expires_at: "2020-01-01T00:00:00.000Z" }),
        error: null,
      })
      .mockResolvedValueOnce({
        data: purchase({ download_count: 5 }),
        error: null,
      })

    await expect(getDownloadAccess(TOKEN)).resolves.toMatchObject({ status: "expired" })
    await expect(getDownloadAccess(TOKEN)).resolves.toMatchObject({ status: "limit_reached" })
  })

  it("signs the file before atomically reserving an authorization", async () => {
    const result = await authorizeDownload({
      token: TOKEN,
      ip: "192.0.2.5",
      userAgent: "Test Browser",
      requestId: "request-id",
    })

    expect(result).toEqual({ ok: true, signedUrl: "https://storage.example/CA.csv" })
    expect(mocks.createSignedUrl).toHaveBeenCalledWith(
      "states/CA.csv",
      STATE_SIGNED_URL_SECONDS,
      { download: "CA.csv" }
    )
    expect(mocks.createSignedUrl.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.rpc.mock.invocationCallOrder[0]
    )
    expect(mocks.rpc).toHaveBeenCalledWith("authorize_purchase_download", {
      p_access_token: TOKEN,
    })
    expect(mocks.insertAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        purchase_id: "purchase-id",
        outcome: "authorized",
        download_count: 2,
        ip_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      })
    )
  })

  it("does not consume an authorization when Storage signing fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mocks.createSignedUrl.mockResolvedValueOnce({
      data: null,
      error: new Error("Storage unavailable"),
    })

    await expect(
      authorizeDownload({
        token: TOKEN,
        ip: "192.0.2.5",
        userAgent: null,
        requestId: "request-id",
      })
    ).resolves.toEqual({ ok: false, reason: "storage_error" })
    expect(mocks.rpc).not.toHaveBeenCalled()
    expect(mocks.insertAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "storage_error" })
    )
  })

  it("rejects a concurrent request that loses the atomic reservation", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [], error: null })

    await expect(
      authorizeDownload({
        token: TOKEN,
        ip: "192.0.2.5",
        userAgent: null,
        requestId: "request-id",
      })
    ).resolves.toEqual({ ok: false, reason: "claim_conflict" })
    expect(mocks.insertAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "claim_conflict" })
    )
  })
})
