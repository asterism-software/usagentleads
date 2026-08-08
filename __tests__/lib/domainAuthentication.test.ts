import { describe, expect, it, vi } from "vitest"
import { analyzeDomainAuthentication, normalizeDomain } from "@/lib/tools/domainAuthentication"
import { decodeDnsTxtData, readTxtRecordsOverHttps } from "@/lib/tools/domainAuthenticationDns"

describe("normalizeDomain", () => {
  it("accepts a conventional public domain and normalizes case", () => {
    expect(normalizeDomain(" Example.COM. ")).toBe("example.com")
  })

  it("rejects URLs, email addresses, localhost, and malformed labels", () => {
    expect(normalizeDomain("https://example.com")).toBeNull()
    expect(normalizeDomain("hello@example.com")).toBeNull()
    expect(normalizeDomain("localhost")).toBeNull()
    expect(normalizeDomain("bad_domain.example")).toBeNull()
  })
})

describe("analyzeDomainAuthentication", () => {
  it("recognizes a single SPF record and a DMARC policy", () => {
    const result = analyzeDomainAuthentication(
      "example.com",
      ["google-site-verification=abc", "v=spf1 include:_spf.google.com ~all"],
      ["v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"]
    )

    expect(result.spf.status).toBe("present")
    expect(result.dmarc).toMatchObject({ status: "present", policy: "quarantine" })
    expect(result.dkim.status).toBe("not_checked")
  })

  it("calls out missing records and multiple SPF records without certifying a result", () => {
    const result = analyzeDomainAuthentication(
      "example.com",
      ["v=spf1 include:one.example ~all", "v=spf1 include:two.example ~all"],
      []
    )

    expect(result.spf.status).toBe("attention")
    expect(result.dmarc.status).toBe("missing")
    expect(result.dmarc.policy).toBeNull()
  })
})

describe("decodeDnsTxtData", () => {
  it("joins segmented TXT strings and decodes DNS escapes", () => {
    expect(decodeDnsTxtData('"v=spf1 include:_spf." "google.com ~all"')).toBe(
      "v=spf1 include:_spf.google.com ~all"
    )
    expect(decodeDnsTxtData('"hello\\032world"')).toBe("hello world")
  })

  it("preserves providers that return unquoted TXT data", () => {
    expect(decodeDnsTxtData("v=DMARC1; p=reject")).toBe("v=DMARC1; p=reject")
  })
})

describe("readTxtRecordsOverHttps", () => {
  it("returns decoded TXT answers from the primary provider", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          Status: 0,
          Answer: [
            { type: 5, data: "alias.example.com." },
            { type: 16, data: '"v=spf1 include:_spf." "example.com ~all"' },
          ],
        }),
        { status: 200 }
      )
    )

    await expect(readTxtRecordsOverHttps("example.com", fetchMock)).resolves.toEqual([
      "v=spf1 include:_spf.example.com ~all",
    ])
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("dns.google/resolve")
  })

  it("uses the fallback provider when the primary provider fails", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("Unavailable", { status: 503 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ Status: 0, Answer: [{ type: 16, data: '"v=DMARC1; p=reject"' }] }),
          { status: 200 }
        )
      )

    await expect(readTxtRecordsOverHttps("_dmarc.example.com", fetchMock)).resolves.toEqual([
      "v=DMARC1; p=reject",
    ])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("cloudflare-dns.com/dns-query")
  })

  it("treats NXDOMAIN and an empty answer as missing records", async () => {
    const nxdomainFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ Status: 3 }), { status: 200 }))
    const emptyFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ Status: 0 }), { status: 200 }))

    await expect(readTxtRecordsOverHttps("missing.example", nxdomainFetch)).resolves.toEqual([])
    await expect(readTxtRecordsOverHttps("example.com", emptyFetch)).resolves.toEqual([])
  })

  it("fails only after both HTTPS resolvers fail", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error("network unavailable"))
      .mockResolvedValueOnce(new Response("Unavailable", { status: 503 }))

    await expect(readTxtRecordsOverHttps("example.com", fetchMock)).rejects.toThrow(
      "DNS-over-HTTPS lookup failed"
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
