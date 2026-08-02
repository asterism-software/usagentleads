import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { isSameOriginRequest, isValidStateCode } from "@/lib/utils/security"
import { rateLimit } from "@/lib/utils/rateLimit"

const preferencesSchema = z.object({
  defaultState: z.string().refine(isValidStateCode).nullable(),
  defaultPageSize: z.union([z.literal(25), z.literal(50), z.literal(100)]),
})

export async function PUT(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { success } = await rateLimit(`dashboard-preferences:${user.id}`, 10)
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

  let input: unknown
  try { input = await request.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }
  const parsed = preferencesSchema.safeParse(input)
  if (!parsed.success) return NextResponse.json({ error: "Invalid preferences" }, { status: 400 })

  const { error } = await createServiceClient()
    .schema("usagentleads")
    .from("user_preferences")
    .upsert({
      user_id: user.id,
      default_state: parsed.data.defaultState,
      default_page_size: parsed.data.defaultPageSize,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })

  if (error) {
    console.error("Dashboard preference update error:", error)
    return NextResponse.json({ error: "Unable to save preferences" }, { status: 500 })
  }
  return NextResponse.json({ preferences: parsed.data })
}
