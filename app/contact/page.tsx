import type { Metadata } from "next"
import { Mail, MessageSquare, Clock } from "lucide-react"
import { ContactForm } from "@/components/ContactForm"

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with USAgentLeads. Questions about our real estate agent database, pricing, or data quality? We're here to help.",
  alternates: {
    canonical: "https://www.usagentleads.com/contact",
    languages: {
      "en-US": "https://www.usagentleads.com/contact",
      "x-default": "https://www.usagentleads.com/contact",
    },
  },
  openGraph: {
    locale: "en_US",
    title: "Contact Us | USAgentLeads",
    description:
      "Get in touch with USAgentLeads. Questions about our real estate agent database, pricing, or data quality?",
    url: "https://www.usagentleads.com/contact",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | USAgentLeads",
    description:
      "Get in touch with USAgentLeads. Questions about our real estate agent database, pricing, or data quality?",
    images: ["https://www.usagentleads.com/twitter-image"],
  },
}

export default function ContactPage() {
  return (
    <div className="bg-page min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-28 max-sm:py-16 sm:px-6">
        {/* Header */}
        <div className="section-header text-center flex flex-col items-center mb-14">
          <p className="label-eyebrow">Contact</p>
          <h1 className="section-heading">Get in Touch</h1>
          <p className="section-sub max-w-lg">
            Questions about data quality, pricing, or custom solutions? Reach out below.
          </p>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-14">
          {[
            {
              icon: Mail,
              title: "Email Us",
              detail: "support@usagentleads.com",
              sub: "We reply within 24 hours",
            },
            {
              icon: MessageSquare,
              title: "General Inquiries",
              detail: "Sales & partnerships",
              sub: "Bulk pricing available",
            },
            {
              icon: Clock,
              title: "Response Time",
              detail: "< 24 hours",
              sub: "Mon – Fri, 9am – 6pm EST",
            },
          ].map((item) => (
            <div key={item.title} className="card p-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-accent-light border border-accent-mid flex items-center justify-center mx-auto mb-4">
                <item.icon size={20} className="text-accent" />
              </div>
              <h3 className="text-[15px] font-semibold text-ink mb-1">{item.title}</h3>
              <p className="text-[14px] font-medium text-accent mb-0.5">{item.detail}</p>
              <p className="text-[13px] text-tertiary">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Contact form */}
        <div className="card p-7 sm:p-10">
          <h2 className="text-[20px] font-semibold text-ink mb-1">Send Us a Message</h2>
          <p className="text-[14px] text-tertiary mb-8">
            We typically respond within 24 hours.
          </p>

          <ContactForm />
        </div>
      </div>
    </div>
  )
}
