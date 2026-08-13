import { beforeEach, describe, expect, it, vi } from "vitest"
import type { NextRequest } from "next/server"

const mocks = vi.hoisted(() => ({
  isAuthorizedCron: vi.fn(),
  createServiceClient: vi.fn(),
  createLeadsClient: vi.fn(),
  list: vi.fn(),
  download: vi.fn(),
  upload: vi.fn(),
}))

vi.mock("@/lib/utils/cronAuth", () => ({
  isAuthorizedCron: mocks.isAuthorizedCron,
}))
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: mocks.createServiceClient,
}))
vi.mock("@/lib/supabase/leads", () => ({
  createLeadsClient: mocks.createLeadsClient,
}))

import { GET } from "@/app/api/cron/generate-csvs/route"

describe("GET /api/cron/generate-csvs?combine=true", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isAuthorizedCron.mockReturnValue(true)
    mocks.list.mockResolvedValue({
      data: [{ name: "TX.csv" }, { name: "AL.csv" }, { name: "ignore.txt" }],
      error: null,
    })
    mocks.download.mockImplementation(async (path: string) => {
      const csv = path.endsWith("AL.csv")
        ? "name,email,phone,state\nAl One,al@example.com,111,Alabama\n"
        : "name,email,phone,state\nTx One,tx@example.com,222,Texas\nTx Two,tx2@example.com,333,Texas\n"
      return { data: new Blob([csv]), error: null }
    })
    mocks.upload.mockResolvedValue({ error: null })

    const storageApi = {
      list: mocks.list,
      download: mocks.download,
      upload: mocks.upload,
    }
    mocks.createServiceClient.mockReturnValue({
      storage: { from: vi.fn(() => storageApi) },
    })
    mocks.createLeadsClient.mockReturnValue({})
  })

  it("uploads a ZIP containing Excel-safe CSV parts", async () => {
    const response = await GET({
      nextUrl: new URL("https://www.usagentleads.com/api/cron/generate-csvs?combine=true"),
    } as NextRequest)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      success: true,
      files: 2,
      totalRows: 3,
      parts: [{ fileName: "usa_agents_part_001.csv", dataRows: 3 }],
    })
    expect(mocks.download.mock.calls.map(([path]) => path)).toEqual([
      "states/AL.csv",
      "states/TX.csv",
    ])
    expect(mocks.upload).toHaveBeenCalledWith(
      "full/usa_agents_full.zip",
      expect.any(Buffer),
      { contentType: "application/zip", upsert: true }
    )
  })
})
