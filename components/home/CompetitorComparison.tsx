import Link from "next/link"
import { Check, X, ArrowRight } from "lucide-react"

const rows = [
  { feature: "Full US Agent Database", us: true, others: true },
  { feature: "Price (Full Database)", us: "$399", others: "$500 – $1,000+" },
  { feature: "Per-State Purchase Option", us: "$99/state", others: "Rarely offered" },
  { feature: "Live Search Dashboard", us: true, others: false },
  { feature: "Instant CSV Download", us: true, others: true },
  { feature: "No Account Required", us: true, others: false },
  { feature: "Money-Back Guarantee", us: true, others: false },
  { feature: "CRM-Ready Format", us: true, others: true },
]

function renderCell(val: boolean | string) {
  if (val === true) return <Check size={16} className="text-success mx-auto" />
  if (val === false) return <X size={16} className="text-muted mx-auto" />
  return <span className="font-mono text-[14px] text-ink">{val}</span>
}

export function CompetitorComparison() {
  return (
    <section className="bg-white py-28 max-sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="section-header text-center flex flex-col items-center">
          <p className="label-eyebrow">Compare</p>
          <h2 className="section-heading">Why USAgentLeads?</h2>
          <p className="section-sub max-w-xl">
            Same data. Fraction of the price. More flexibility.
          </p>
        </div>

        <div className="max-w-3xl mx-auto card overflow-hidden overflow-x-auto reveal">
          <table className="data-table min-w-[500px]">
            <thead>
              <tr>
                <th scope="col" className="text-left">Feature</th>
                <th scope="col" className="text-center bg-accent-light/50">
                  <span className="text-accent">USAgentLeads</span>
                </th>
                <th scope="col" className="text-center">Other Providers</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.feature}>
                  <td className="text-[14px] text-ink font-medium">{row.feature}</td>
                  <td className="text-center bg-accent-light/30">{renderCell(row.us)}</td>
                  <td className="text-center">{renderCell(row.others)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-8 reveal">
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 text-[15px] font-medium text-accent hover:underline"
          >
            See detailed comparisons vs REDX, ZoomInfo, Apollo & more
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
