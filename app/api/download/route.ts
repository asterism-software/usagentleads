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
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const { success } = await rateLimit(`download:${ip}`, 15)
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const formData = await request.formData()
  const tokenValue = formData.get("token")
  const token = typeof tokenValue === "string" ? tokenValue : ""
  if (!isValidUUID(token)) {
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
    return NextResponse.redirect(
      downloadPageUrl(request, token, authorization.reason),
      303
    )
  }

  return NextResponse.redirect(authorization.signedUrl, 303)
}
