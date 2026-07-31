"use client"

import { MousePointerClick, CreditCard, Download } from "lucide-react"

const steps = [
  {
    icon: MousePointerClick,
    number: "01",
    title: "Choose Your Data",
    description: "Pick a single state for $49, grab the full 50-state database for $199, or subscribe to browse data in-app for $49/month.",
  },
  {
    icon: CreditCard,
    number: "02",
    title: "Secure Checkout",
    description: "Pay securely with Stripe. No account needed for one-time purchases.",
  },
  {
    icon: Download,
    number: "03",
    title: "Instant Delivery",
    description: "Receive your clean CSV file via email within minutes. Ready for any CRM or spreadsheet.",
  },
]

export function HowItWorks() {
  return (
    <section className="bg-subtle py-28 max-sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="section-header max-w-[480px]">
          <p className="label-eyebrow">Process</p>
          <h2 className="section-heading">How It Works</h2>
          <p className="section-sub">Three steps from decision to data.</p>
        </div>

        <div className="relative grid gap-6 md:grid-cols-3 reveal-stagger">
          {/* Connecting dashed line (desktop) */}
          <div className="pointer-events-none absolute left-0 right-0 top-[60px] hidden md:block">
            <div className="mx-auto flex max-w-[80%] items-center justify-between px-[16%]">
              <div className="h-px flex-1 border-t border-dashed border-border-strong" />
              <div className="h-px flex-1 border-t border-dashed border-border-strong" />
            </div>
          </div>

          {steps.map((step) => (
            <div
              key={step.number}
              className="card p-8 relative overflow-hidden"
            >
              {/* Decorative step number */}
              <span className="absolute -bottom-2 -right-1 font-mono text-[80px] font-semibold text-border leading-none select-none pointer-events-none">
                {step.number}
              </span>

              {/* Icon */}
              <div className="w-11 h-11 rounded-xl bg-accent-light border border-accent-mid flex items-center justify-center mb-6">
                <step.icon size={20} className="text-accent" />
              </div>

              <h3 className="text-[18px] font-semibold text-ink mb-3">{step.title}</h3>
              <p className="text-[14px] text-tertiary leading-relaxed relative z-10">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
