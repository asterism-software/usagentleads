import { NextRequest, NextResponse } from "next/server"
import { getDownloadAccess } from "@/lib/downloads/access"
import { isValidUUID } from "@/lib/utils/security"
import { rateLimit } from "@/lib/utils/rateLimit"

// GET — look up a purchase by page_token (only the buyer has this token).
// This read never authorizes or consumes a download.
export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const { success } = await rateLimit(`purchase-lookup:${ip}`, 10)
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const pageToken = request.nextUrl.searchParams.get("pt")
  if (!pageToken || !isValidUUID(pageToken)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 })
  }

  const access = await getDownloadAccess(pageToken)
  if (!access.purchase) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 })
  }

  return NextResponse.json({
    status: access.purchase.status,
    purchaseType: access.purchase.purchase_type,
    stateCode: access.purchase.state_code,
    downloadAvailable: access.status === "available",
    downloadUrl:
      access.status === "available"
        ? `/download?token=${encodeURIComponent(pageToken)}`
        : null,
    downloadsRemaining: Math.max(
      0,
      access.purchase.download_limit - access.purchase.download_count
    ),
    downloadLimit: access.purchase.download_limit,
    expiresAt: access.purchase.expires_at,
  })
}
