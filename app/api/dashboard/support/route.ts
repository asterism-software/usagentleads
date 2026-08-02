import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { sendContactEmail } from "@/lib/resend/emails"
import { isSameOriginRequest } from "@/lib/utils/security"
import { rateLimit } from "@/lib/utils/rateLimit"

const supportSchema = z.object({
  category: z.enum(["api", "billing", "account", "data", "other"]),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(5000),
})

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { success } = await rateLimit(`dashboard-support:${user.id}`, 5, 60 * 60 * 1000)
  if (!success) return NextResponse.json({ error: "Too many support requests. Please try again later." }, { status: 429 })

  let input: unknown
  try { input = await request.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }
  const parsed = supportSchema.safeParse(input)
  if (!parsed.success) return NextResponse.json({ error: "Please complete every field." }, { status: 400 })

  try {
    const displayName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : user.email.split("@")[0]
    await sendContactEmail({
      name: displayName,
      email: user.email,
      subject: `[Dashboard ${parsed.data.category}] ${parsed.data.subject}`,
      message: `${parsed.data.message}\n\nAccount ID: ${user.id}`,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Authenticated support request error:", error)
    return NextResponse.json({ error: "Unable to send your request" }, { status: 500 })
  }
}
