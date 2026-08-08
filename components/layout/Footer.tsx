import Link from "next/link"
import { LogoIcon } from "@/components/ui/Logo"
import { US_STATES } from "@/lib/utils/states"

const footerSections = [
  {
    title: "Explore Data",
    links: [
      { href: "/states", label: "Browse States" },
      { href: "/directory", label: "Agent Directory" },
      { href: "/data-sources", label: "Data Sources" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/for", label: "Use Cases" },
      { href: "/compare", label: "Compare" },
      { href: "/alternatives", label: "Alternatives" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/guides", label: "Import Guides" },
      { href: "/faq", label: "FAQ" },
      { href: "/glossary", label: "Glossary" },
      { href: "/blog", label: "Blog" },
      { href: "/docs", label: "API Docs" },
    ],
  },
  {
    title: "Free Tools",
    links: [
      { href: "/tools", label: "All Free Tools" },
      { href: "/tools/agent-outreach-campaign-planner", label: "Agent Outreach Planner" },
      { href: "/tools/cold-email-compliance-checker", label: "Cold Email Compliance" },
      { href: "/tools/real-estate-email-subject-line-tester", label: "Email Subject Line Tester" },
      { href: "/tools/email-domain-authentication-checker", label: "Domain Authentication" },
      { href: "/tools/brokerage-recruiting-roi-calculator", label: "Brokerage Recruiting ROI" },
      { href: "/tools/agent-partnership-value-calculator", label: "Agent Partnership Value" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/contact", label: "Contact Us" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "https://climate.stripe.com/vgZr1l", label: "Stripe Climate" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      {
        href: "https://billing.stripe.com/p/login/bJeeVe00f94z4lM14N9EI00",
        label: "Manage Subscription",
        external: true,
      },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
        {/* Top columns */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-3">
            <Link href="/" className="mb-4 flex items-center gap-2 text-[19px] font-semibold tracking-tight w-fit">
              <LogoIcon className="h-7 w-7" />
              <span>
                <span className="text-white">USAgent</span>
                <span className="text-accent-mid">Leads</span>
              </span>
            </Link>
            <p className="text-[14px] text-gray-300 leading-relaxed max-w-55">
              Verified real estate agent contacts across all 50 US states.
            </p>
          </div>

          <nav aria-label="Footer navigation" className="grid grid-cols-1 gap-x-8 gap-y-9 min-[400px]:grid-cols-2 md:grid-cols-3 lg:col-span-9">
            {footerSections.map((section) => (
              <div key={section.title}>
                <p className="mb-4 text-[12px] font-mono uppercase tracking-wider text-gray-300">
                  {section.title}
                </p>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-[15px] text-gray-300 transition-colors hover:text-white"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className="text-[15px] text-gray-300 transition-colors hover:text-white">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-dark-border my-8" />

        {/* All 50 states SEO list */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-8">
          <p className="text-[12px] font-mono uppercase tracking-wider text-gray-400 w-full mb-2">
            All States
          </p>
          {US_STATES.map((s) => (
            <Link
              key={s.code}
              href={`/states/${s.slug}`}
              className="text-[13px] font-mono text-gray-400 hover:text-gray-200 transition-colors"
            >
              {s.name}
            </Link>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-dark-border pt-6 flex justify-between items-center flex-wrap gap-4">
          <p className="text-[13px] text-gray-400">
            &copy; {new Date().getFullYear()} USAgentLeads. Not affiliated with NAR or any MLS.
          </p>
        </div>
      </div>
    </footer>
  )
}
