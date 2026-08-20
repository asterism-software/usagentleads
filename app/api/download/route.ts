import crypto from "crypto"
import { NextResponse } from "next/server"
import { authorizeDownload } from "@/lib/downloads/access"
import { isSameOriginRequest, isValidUUID } from "@/lib/utils/security"
import { rateLimit } from "@/lib/utils/rateLimit"

function downloadPageUrl(request: Request, token: string, status?: string): URL {
  const url = new URL("/download", request.url)
  url.searchParams.set("token", token)
  if (status) url.searchParams.set("status", status)
  return url
}

function expectsJson(request: Request): boolean {
  return request.headers.get("accept")?.includes("application/json") ?? false
}

function jsonHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {
    "Cache-Control": "private, no-store",
  }
  const origin = request.headers.get("origin")
  if (origin) {
    // This route reaches Vercel at www after Cloudflare preserves an apex POST.
    // isSameOriginRequest has already restricted this to a first-party origin.
    headers["Access-Control-Allow-Origin"] = origin
    headers.Vary = "Origin"
  }
  return headers
}

const authorizationErrors: Record<string, string> = {
  invalid: "This download link is invalid. Reopen the complete link from your email.",
  pending: "Your purchase is still being prepared. Please try again shortly.",
  expired: "This download link has expired. Contact support for a refreshed link.",
  limit_reached: "This link has reached its download allowance. Contact support for help.",
  storage_error: "The file service is temporarily unavailable. Your allowance was not used; please try again.",
  claim_conflict: "Another download request was processed at the same time. Please try again.",
}

// Backward compatibility for links already delivered by email. GET is now
// scanner-safe: it only opens the download page and never consumes access.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")
  if (!token || !isValidUUID(token)) {
    return NextResponse.redirect(new URL("/download?status=invalid", request.url), 303)
  }
  return NextResponse.redirect(downloadPageUrl(request, token), 303)
}

// Only an explicit form submission authorizes a download. Email scanners and
// link previewers normally issue GET/HEAD requests and cannot consume access.
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    console.warn(JSON.stringify({
      level: "warning",
      message: "Download request origin rejected",
      requestOrigin: new URL(request.url).origin,
      origin: request.headers.get("origin"),
      fetchSite: request.headers.get("sec-fetch-site"),
      forwardedHost: request.headers.get("x-forwarded-host"),
      host: request.headers.get("host"),
      requestId: request.headers.get("x-vercel-id"),
    }))
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const { success } = await rateLimit(`download:${ip}`, 15)
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: jsonHeaders(request) }
    )
  }

  const formData = await request.formData()
  const tokenValue = formData.get("token")
  const token = typeof tokenValue === "string" ? tokenValue : ""
  if (!isValidUUID(token)) {
    if (expectsJson(request)) {
      return NextResponse.json(
        { error: authorizationErrors.invalid, reason: "invalid" },
        { status: 400, headers: jsonHeaders(request) }
      )
    }
    return NextResponse.redirect(new URL("/download?status=invalid", request.url), 303)
  }

  const requestId = request.headers.get("x-vercel-id") || crypto.randomUUID()
  const authorization = await authorizeDownload({
    token,
    ip,
    userAgent: request.headers.get("user-agent"),
    requestId,
  })

  if (!authorization.ok) {
    if (expectsJson(request)) {
      const status = authorization.reason === "storage_error" ? 503 : 409
      return NextResponse.json(
        {
          error: authorizationErrors[authorization.reason],
          reason: authorization.reason,
        },
        { status, headers: jsonHeaders(request) }
      )
    }
    return NextResponse.redirect(
      downloadPageUrl(request, token, authorization.reason),
      303
    )
  }

  if (expectsJson(request)) {
    return NextResponse.json(
      { downloadUrl: authorization.signedUrl },
      { headers: jsonHeaders(request) }
    )
  }

  return NextResponse.redirect(authorization.signedUrl, 303)
}
