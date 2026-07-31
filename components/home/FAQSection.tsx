"use client"

import { useState } from "react"
import { generateFAQSchema } from "@/lib/utils/seo"
import { TOTAL_AGENTS } from "@/lib/utils/states"
import { DATA_LAST_REFRESHED } from "@/lib/utils/site"
import { Plus } from "lucide-react"

function getFaqs(totalCount: number) {
  const countLabel = totalCount > 0 ? totalCount.toLocaleString() + "+" : TOTAL_AGENTS.toLocaleString() + "+"
  return [
    {
      question: "What data fields are included?",
      answer:
        "Each record contains: Full Name, Email Address, Phone Number, and State. All records are in CSV format, ready to import into any CRM or spreadsheet.",
    },
    {
      question: "Do I need to create an account?",
      answer:
        "No. State CSV and full database purchases are guest checkouts — just enter your email at checkout and we email you the download link.",
    },
    {
      question: "How quickly do I receive my data?",
      answer:
        "Your download link is sent to your email within minutes of payment confirmation.",
    },
    {
      question: "How often is the data updated?",
      answer:
        `The current dataset was last refreshed in ${DATA_LAST_REFRESHED}. We also run cleanup passes to remove obvious duplicates and malformed records.`,
    },
    {
      question: "What is the Pro Dashboard subscription?",
      answer:
        `For $49/month, you get access to an in-app browser where you can search and filter all ${countLabel} agents by state, name, or email. No CSV download — this tier is designed for teams that need a searchable interface.`,
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer:
        "Yes. You can cancel from the Stripe billing portal at any time with no penalties or questions.",
    },
    {
      question: "Is the data compliant for outreach?",
      answer:
        "All contact data is sourced from publicly available professional directories. As the sender, you must comply with CAN-SPAM regulations.",
    },
    {
      question: "What format is the CSV?",
      answer:
        "Standard UTF-8 CSV. Opens directly in Excel, Google Sheets, or any CRM that accepts CSV import.",
    },
  ]
}

function FAQItem({ question, answer, id }: { question: string; answer: string; id: string }) {
  const [open, setOpen] = useState(false)
  const buttonId = `faq-btn-${id}`
  const panelId = `faq-panel-${id}`

  return (
    <div className="border-b border-border last:border-0">
      <h3>
        <button
          id={buttonId}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={panelId}
          className="w-full flex items-center justify-between py-5 text-left group"
        >
          <span className="text-[15px] font-medium text-ink group-hover:text-accent transition-colors pr-8">
            {question}
          </span>
          <span className={`text-accent transition-transform duration-200 shrink-0 ${open ? "rotate-45" : "rotate-0"}`}>
            <Plus size={16} strokeWidth={2.5} />
          </span>
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        aria-hidden={!open}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-75 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-[14px] text-tertiary leading-[1.8]">{answer}</p>
      </div>
    </div>
  )
}

export function FAQSection({ totalCount }: { totalCount: number }) {
  const faqs = getFaqs(totalCount)
  const faqSchema = generateFAQSchema(faqs)

  // Split FAQs into two columns
  const mid = Math.ceil(faqs.length / 2)
  const col1 = faqs.slice(0, mid)
  const col2 = faqs.slice(mid)

  return (
    <section className="bg-white py-28 max-sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="section-header max-w-[480px]">
          <p className="label-eyebrow">FAQ</p>
          <h2 className="section-heading">Common Questions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-16 gap-y-0 reveal">
          <div>
            {col1.map((faq, i) => (
              <FAQItem key={i} id={`l-${i}`} question={faq.question} answer={faq.answer} />
            ))}
          </div>
          <div>
            {col2.map((faq, i) => (
              <FAQItem key={i} id={`r-${i}`} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
