export const SITE_URL = "https://www.usagentleads.com"
export const SUPPORT_EMAIL = "support@usagentleads.com"

// Data freshness label — always reflects the current month/year (e.g. "July 2026")
// so buyers see an up-to-date "as of" date. Evaluated server-side at build /
// revalidation time, matching the CURRENT_YEAR pattern in lib/utils/states.ts.
export const DATA_LAST_REFRESHED = new Date().toLocaleDateString("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

// Public-facing sources the agent data is compiled from. Shown on the states
// directory and data-sources pages so buyers know where records originate.
export const DATA_SOURCES = [
  "Keller Williams (KW)",
  "Coldwell Banker Realty",
  "Zillow",
  "Realtor.com",
  "MLS listings",
  "Public state licensing records",
] as const

export const CONTENT_LAST_REVIEWED = "2026-07-06"

