"use client"

import { Star } from "lucide-react"

const testimonials = [
  {
    name: "David R.",
    role: "Marketing Agency Owner",
    text: "We needed a reliable agent database for our real estate SaaS clients. The data quality is solid and the price can't be beat — saved us thousands compared to other providers.",
    rating: 5,
  },
  {
    name: "Jessica M.",
    role: "Mortgage Loan Officer",
    text: "I bought the Florida state pack and had it in my CRM within 10 minutes. Already booked 3 meetings from my first outreach campaign. The $99 price point made it a no-brainer.",
    rating: 5,
  },
  {
    name: "Kevin L.",
    role: "PropTech Founder",
    text: "The full database at $399 is incredible value. We've used other providers charging $500+ for less data. CSV format works perfectly with our marketing stack.",
    rating: 5,
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} size={14} className="fill-amber-400 text-amber-400" aria-hidden="true" />
      ))}
    </div>
  )
}

export function Testimonials() {
  return (
    <section className="bg-white py-28 max-sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="section-header text-center flex flex-col items-center">
          <p className="label-eyebrow">Testimonials</p>
          <h2 className="section-heading">Trusted by Marketers & Agencies</h2>
          <p className="section-sub max-w-xl">
            Real feedback from customers using our agent data for outreach.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto reveal-stagger">
          {testimonials.map((t) => (
            <blockquote key={t.name} className="card p-7 flex flex-col">
              <StarRating rating={t.rating} />
              <p className="text-[14px] text-body leading-relaxed mt-4 flex-1">
                &ldquo;{t.text}&rdquo;
              </p>
              <footer className="mt-5 pt-5 border-t border-border">
                <cite className="not-italic">
                  <p className="text-[15px] font-semibold text-ink">{t.name}</p>
                  <p className="text-[13px] text-tertiary">{t.role}</p>
                </cite>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
