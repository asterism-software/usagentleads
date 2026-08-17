import { PlanGroups } from "@/components/pricing/PlanGroups"

export function PricingCards({ totalCount, totalEmails, totalPhones }: { totalCount: number; totalEmails: number; totalPhones: number }) {
  return (
    <section className="bg-page py-28 max-sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="section-header text-center flex flex-col items-center">
          <p className="label-eyebrow">Pricing</p>
          <h2 className="section-heading">Simple, Transparent Pricing</h2>
          <p className="section-sub max-w-xl">
            Buy a one-time CSV download and keep it forever. No subscription or hidden fees.
          </p>
        </div>

        <div className="reveal">
          <PlanGroups
            totalCount={totalCount}
            totalEmails={totalEmails}
            totalPhones={totalPhones}
            variant="home"
            headingLevel="h3"
          />
        </div>
      </div>
    </section>
  )
}
