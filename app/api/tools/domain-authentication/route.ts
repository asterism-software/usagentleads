import { NextRequest, NextResponse } from "next/server"
import { analyzeDomainAuthentication, normalizeDomain } from "@/lib/tools/domainAuthentication"
import { readTxtRecordsOverHttps } from "@/lib/tools/domainAuthenticationDns"
import { rateLimit } from "@/lib/utils/rateLimit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), timeoutMs)
    promise.then(
      (value) => {
        clearTimeout(timeout)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timeout)
        reject(error)
      }
    )
  })
}

function shouldUseRateLimiter(): boolean {
  return process.env.NODE_ENV === "production" && Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  )
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const domain = normalizeDomain(request.nextUrl.searchParams.get("domain") ?? "")
  if (!domain) {
    return NextResponse.json(
      { error: "Enter a valid domain such as example.com." },
      { status: 400, headers: { "X-Robots-Tag": "noindex" } }
    )
  }

  // Fail open on a transient Redis issue: the route queries only public TXT
  // records, validates a narrow domain format, and has no side effects.
  if (shouldUseRateLimiter()) {
    try {
      const { success } = await withTimeout(
        rateLimit(`domain-authentication:${ip}`, 12, 60_000),
        1_500,
        "Rate limiter timed out"
      )
      if (!success) {
        return NextResponse.json({ error: "Too many checks. Please try again in a minute." }, { status: 429 })
      }
    } catch (error) {
      console.error("Domain authentication rate limiter unavailable, failing open:", error)
    }
  }

  try {
    const [rootTxtRecords, dmarcTxtRecords] = await Promise.all([
      readTxtRecordsOverHttps(domain),
      readTxtRecordsOverHttps(`_dmarc.${domain}`),
    ])

    return NextResponse.json(analyzeDomainAuthentication(domain, rootTxtRecords, dmarcTxtRecords), {
      headers: {
        "X-Robots-Tag": "noindex",
        "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("Domain authentication DNS lookup failed:", error)
    return NextResponse.json(
      { error: "We could not read public DNS records for that domain. Try again shortly." },
      {
        status: 503,
        headers: { "X-Robots-Tag": "noindex", "Retry-After": "5" },
      }
    )
  }
}
