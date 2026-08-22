import { NextRequest, NextResponse } from "next/server"
import { isAuthorizedCron } from "@/lib/utils/cronAuth"
import { createServiceClient } from "@/lib/supabase/server"
import { createLeadsClient } from "@/lib/supabase/leads"
import { cleanName, isValidName } from "@/lib/utils/clean-name"

function escapeCSV(value: string | null): string {
  if (!value) return ""
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * One-time generation of the free sample CSV (500 rows).
 * Requires CRON_SECRET auth.
 * Usage: GET /api/cron/generate-free-sample
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createServiceClient() // Supabase: Storage upload
    const leadsDb = createLeadsClient()    // Supabase: static leads table

    // Fetch 500 leads with a mix of states
    const { data: leads, error: leadsError } = await leadsDb
      .schema("usagentleads")
      .from("leads")
      .select("name, email, phone, state")
      .not("name", "is", null)
      .neq("name", "")
      .filter("name", "match", "[a-zA-Z]{2,}")
      .limit(500)

    if (leadsError) throw leadsError
    if (!leads || leads.length === 0) {
      return NextResponse.json({ error: "No leads found" }, { status: 404 })
    }

    // Clean names + drop any that fail validation post-clean
    const cleaned = leads
      .map((row) => ({ ...row, name: cleanName(row.name) }))
      .filter((row) => isValidName(row.name))

    // Build CSV
    const csvHeaders = "name,email,phone,state"
    const csvRows = cleaned.map((row) =>
      [
        escapeCSV(row.name),
        escapeCSV(row.email),
        escapeCSV(row.phone),
        escapeCSV(row.state),
      ].join(",")
    )
    const csv = [csvHeaders, ...csvRows].join("\n")

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("agent-csvs")
      .upload("free-sample/free-sample-data.csv", csv, {
        contentType: "text/csv",
        upsert: true,
      })

    if (uploadError) throw uploadError

    return NextResponse.json({
      success: true,
      rows: cleaned.length,
    })
  } catch (error) {
    console.error("Generate free sample error:", error)
    return NextResponse.json(
      { error: "Failed to generate free sample" },
      { status: 500 }
    )
  }
}
