import { NextRequest, NextResponse } from "next/server"
import { isAuthorizedCron } from "@/lib/utils/cronAuth"
import { createServiceClient } from "@/lib/supabase/server"
import { sendNurtureImport, sendNurtureQuality, sendNurtureFinal, type NurtureCoupon } from "@/lib/resend/emails"
import { createStateDiscount } from "@/lib/stripe/client"

export const dynamic = "force-dynamic"
export const maxDuration = 60

interface Gate {
  stage: number
  minDays: number
  next: number
  withCoupon?: boolean
  send: (args: { to: string; coupon?: NurtureCoupon }) => Promise<void>
}

// Drip schedule: a lead at `stage`, older than `minDays`, gets the stage email
// and advances to `next`. Run daily; each lead advances at most one stage per run.
// The final stage mints a unique, single-use discount per lead.
const GATES: Gate[] = [
  { stage: 0, minDays: 2, next: 1, send: sendNurtureImport },
  { stage: 1, minDays: 4, next: 2, send: sendNurtureQuality },
  { stage: 2, minDays: 6, next: 3, send: sendNurtureFinal, withCoupon: true },
]

const BATCH_PER_STAGE = 100

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Suppress anyone who already bought — a converted lead shouldn't keep getting
  // "please buy" emails.
  const { data: buyers } = await supabase
    .schema("usagentleads")
    .from("purchases")
    .select("guest_email")
    .eq("status", "completed")
  const buyerEmails = new Set(
    (buyers ?? []).map((b) => (b.guest_email ?? "").toLowerCase()).filter(Boolean)
  )

  const result = { sent: 0, converted: 0, failed: 0 }
  // A lead advanced by an earlier gate must not be picked up by a later gate in
  // the same run, or it would receive two drip emails at once.
  const touched = new Set<string>()

  for (const gate of GATES) {
    const cutoff = new Date(Date.now() - gate.minDays * 24 * 60 * 60 * 1000).toISOString()
    const { data: leads, error } = await supabase
      .schema("usagentleads")
      .from("sample_leads")
      .select("id, email")
      .eq("drip_stage", gate.stage)
      .in("status", ["new", "active"])
      .lte("created_at", cutoff)
      .order("created_at", { ascending: true })
      .limit(BATCH_PER_STAGE)

    if (error || !leads) continue

    for (const lead of leads) {
      if (touched.has(lead.id)) continue
      touched.add(lead.id)

      const email = (lead.email ?? "").toLowerCase()
      if (!email) continue

      // Already purchased → mark converted, stop the drip.
      if (buyerEmails.has(email)) {
        await supabase
          .schema("usagentleads")
          .from("sample_leads")
          .update({ status: "converted", converted: true })
          .eq("id", lead.id)
        result.converted++
        continue
      }

      try {
        const update: Record<string, unknown> = {
          drip_stage: gate.next,
          status: "active",
          last_emailed_at: new Date().toISOString(),
        }
        // Final stage: mint a unique, single-use discount for this lead. If it
        // fails, still send the email without a coupon rather than
        // block the lead — and record the code on the row if minted.
        let coupon: NurtureCoupon | undefined
        if (gate.withCoupon) {
          const discount = await createStateDiscount()
          if (discount) {
            coupon = {
              code: discount.code,
              label: `$${discount.amountCents / 100} off a state pack`,
              expiresAt: discount.expiresAt,
            }
            update.coupon_code = discount.code
            update.coupon_expires_at = discount.expiresAt
          }
        }
        await gate.send({ to: email, coupon })
        await supabase
          .schema("usagentleads")
          .from("sample_leads")
          .update(update)
          .eq("id", lead.id)
        result.sent++
      } catch (e) {
        console.error(`nurture-drip send failed (stage ${gate.stage}):`, e)
        result.failed++
      }
    }
  }

  return NextResponse.json({ success: true, ...result })
}
