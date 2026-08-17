export interface Persona {
  slug: string
  name: string
  title: string
  headline: string
  description: string
  painPoints: string[]
  useCases: string[]
  cta: string
  keywords: string[]
  relatedBlogSlugs: string[]
  faqs: { question: string; answer: string }[]
}

export const PERSONAS: readonly Persona[] = [
  {
    slug: "coaches",
    name: "Real Estate Coaches & Trainers",
    title: "Real Estate Agent Email List for Coaches",
    headline: "Fill Your Coaching Pipeline with Verified Agent Contacts",
    description:
      "You run coaching programs, sell courses, or offer certifications to real estate agents. Growing your pipeline means reaching agents directly — not waiting for them to find you. Our database gives you verified email addresses and phone numbers for agents across all 50 states, so you can run targeted outreach and fill your programs faster.",
    painPoints: [
      "Spending hours on LinkedIn trying to find agent contacts one by one",
      "Paying for Facebook or Google ads with unpredictable cost-per-lead",
      "Buying lists from brokers who recycle the same stale data",
      "No way to segment outreach by state or region",
    ],
    useCases: [
      "Launch email campaigns promoting your coaching programs state by state",
      "Build lookalike audiences from verified agent emails for paid ads",
      "Cold call agents in states where you're expanding",
      "Invite agents to free webinars or workshops as a top-of-funnel play",
    ],
    cta: "Start reaching agents who need your coaching",
    keywords: [
      "real estate agent email list for coaches",
      "realtor email list for coaching",
      "real estate coaching leads",
      "email list for real estate trainers",
      "agent contacts for coaching programs",
      "real estate coach marketing",
    ],
    faqs: [
      {
        question: "Can I email agents directly to promote my coaching program?",
        answer:
          "Yes. The contacts are licensed professionals with publicly available business information. Most coaches use our data for cold email outreach, webinar invitations, and course promotions. Follow CAN-SPAM guidelines: include your business address, a clear unsubscribe link, and accurate subject lines.",
      },
      {
        question: "How do I target agents most likely to need coaching?",
        answer:
          "Start with smaller states or states where you already have testimonials. Newer agents (identifiable by cross-referencing license dates) tend to be more receptive to coaching. You can also segment by state to match your program's geographic focus.",
      },
      {
        question: "What format is the data in?",
        answer:
          "You get a clean CSV file with Full Name, Email, Phone, and State columns. It imports directly into any email tool (Mailchimp, ActiveCampaign, Instantly, Smartlead) or CRM (HubSpot, Close, Salesforce) without reformatting.",
      },
    ],
    relatedBlogSlugs: [
      "real-estate-coach-marketing-agent-pipeline",
      "real-estate-cold-email-templates",
      "how-to-build-realtor-email-list",
    ],
  },
  {
    slug: "saas-companies",
    name: "SaaS & PropTech Companies",
    title: "Real Estate Agent Database for SaaS Companies",
    headline: "Reach Every Agent Who Needs Your Software",
    description:
      "You built a product for real estate agents — a CRM, website builder, transaction tool, or lead gen platform. The hard part isn't the product, it's distribution. Our database gives your sales team direct access to the inboxes and phone numbers of agents across every US state, so you can run outbound at scale without paying per lead.",
    painPoints: [
      "High CAC from relying on paid ads and inbound alone",
      "SDRs spending half their day researching contacts instead of selling",
      "Third-party lead databases charging per contact or per month",
      "No reliable way to reach agents outside your existing network",
    ],
    useCases: [
      "Run cold email sequences introducing your product to agents state by state",
      "Build targeted outbound lists for your SDR team without per-lead costs",
      "Seed your CRM with verified contacts for nurture campaigns",
      "Upload agent emails as custom audiences for retargeting ads",
    ],
    cta: "Get the agent contacts your sales team needs",
    keywords: [
      "real estate agent database for saas",
      "realtor email list for software companies",
      "proptech agent outreach",
      "real estate agent contacts for b2b sales",
      "agent email list for saas marketing",
      "sell to real estate agents",
    ],
    faqs: [
      {
        question: "How many contacts will my team actually be able to reach?",
        answer:
          "The full database includes 1,100,000+ contacts. Over 90% carry an email address and over 90% carry a phone number. The data is verified against state licensing records, so bounce rates stay low.",
      },
      {
        question: "Can I integrate this with my CRM or outbound tool?",
        answer:
          "The CSV format works with any tool. Import directly into HubSpot, Salesforce, Close, Outreach, Salesloft, Apollo, Instantly, or Smartlead. No API integration needed — just upload the file.",
      },
      {
        question: "How does pricing compare to ZoomInfo or Apollo?",
        answer:
          "A single state costs $99. The full 50-state database is $399 — one-time, not a subscription. That's typically far less than what you'd pay for the same contacts on ZoomInfo, Apollo, or similar platforms.",
      },
    ],
    relatedBlogSlugs: [
      "proptech-sales-sell-software-real-estate-agents",
      "import-real-estate-contacts-hubspot",
      "b2b-real-estate-marketing",
    ],
  },
  {
    slug: "mortgage-lenders",
    name: "Mortgage Lenders & Title Companies",
    title: "Real Estate Agent Email List for Mortgage Lenders",
    headline: "Build Referral Partnerships with Agents at Scale",
    description:
      "Your business depends on agent referrals. The more agents who know your name and trust your service, the more deals come through your door. Instead of waiting for agents to come to you, reach out directly with verified contact data covering every licensed agent in the states you serve.",
    painPoints: [
      "Relying on a small network of referring agents for most of your volume",
      "Attending networking events and open houses hoping to meet new agents",
      "No systematic way to introduce your services to agents in your market",
      "Competitors locking up the top-producing agents before you get to them",
    ],
    useCases: [
      "Email agents in your service area to introduce your rates and programs",
      "Send market updates and rate sheets to stay top-of-mind with agents",
      "Invite agents to co-branded events, lunch-and-learns, or CE classes",
      "Build a drip campaign targeting agents you want referral relationships with",
    ],
    cta: "Start building agent relationships today",
    keywords: [
      "real estate agent email list for mortgage lenders",
      "realtor contacts for loan officers",
      "agent email list for title companies",
      "mortgage marketing to real estate agents",
      "realtor referral partnerships",
      "agent outreach for mortgage brokers",
    ],
    faqs: [
      {
        question: "Can I target agents in just my local market?",
        answer:
          "Yes. Buy individual state packs for $99 each, so you only pay for the markets you serve. If you operate in five or more states, the full database at $399 is the better deal.",
      },
      {
        question: "Is this data compliant with real estate marketing regulations?",
        answer:
          "The data comes from publicly available state licensing records. It's business contact information for licensed professionals, not consumer data. Standard business email outreach rules apply (CAN-SPAM compliance).",
      },
      {
        question: "How do loan officers typically use this data?",
        answer:
          "The most common approach: import the state CSV into your email tool, write a short intro email about your rates or a co-marketing opportunity, and follow up with value-add content like market reports. Agents respond well to loan officers who bring them something useful.",
      },
    ],
    relatedBlogSlugs: [
      "mortgage-lenders-contact-real-estate-agents",
      "real-estate-cold-email-templates",
      "cold-outreach-realtors-compliance",
    ],
  },
  {
    slug: "marketing-agencies",
    name: "Marketing Agencies",
    title: "Real Estate Agent Email List for Marketing Agencies",
    headline: "Scale Your Real Estate Clients' Outreach Overnight",
    description:
      "Your agency serves real estate clients — brokerages, PropTech companies, or real estate service providers. They need to reach agents, and you need reliable data to deliver results. Our database gives you clean, verified agent contacts you can use across campaigns without recurring per-contact fees eating into your margins.",
    painPoints: [
      "Clients expecting you to source contacts but unwilling to pay for expensive data subscriptions",
      "Manually building lists from LinkedIn or public directories for each campaign",
      "Poor deliverability from low-quality purchased lists",
      "Needing fresh data for every new client engagement",
    ],
    useCases: [
      "Run email campaigns for brokerage clients recruiting agents",
      "Build custom audiences for real estate ad campaigns",
      "Power direct mail campaigns targeting agents by state",
      "Provide data as a value-add in your agency retainer packages",
    ],
    cta: "Get campaign-ready agent data for your clients",
    keywords: [
      "real estate agent email list for agencies",
      "realtor database for marketing agencies",
      "agent contacts for email campaigns",
      "real estate marketing data",
      "bulk realtor email list",
      "agent outreach data for agencies",
    ],
    faqs: [
      {
        question: "Can I use this data for multiple clients?",
        answer:
          "Yes. Once purchased, the data is yours to use. There are no per-use restrictions. Many agencies buy the full database once and use it across multiple client engagements.",
      },
      {
        question: "How often is the data updated?",
        answer:
          "The database is refreshed regularly against state licensing records. Typical bounce rates run under 5%. For the freshest data, you can re-purchase periodically — at $399 for all 50 states, the cost remains low compared to subscription-based alternatives.",
      },
      {
        question: "Can I white-label or resell this data?",
        answer:
          "The data is for your business use, including use on behalf of clients. You can incorporate it into campaigns and deliverables. If you want to resell the raw data itself, reach out to discuss licensing.",
      },
    ],
    relatedBlogSlugs: [
      "real-estate-marketing-strategies",
      "real-estate-cold-email-templates",
      "b2b-real-estate-marketing",
    ],
  },
  {
    slug: "brokerages",
    name: "Real Estate Brokerages",
    title: "Real Estate Agent Email List for Brokerages",
    headline: "Recruit Agents and Grow Your Brokerage Faster",
    description:
      "Growing a brokerage means recruiting agents. You need to reach licensed agents in your market with a compelling value proposition — better splits, better tools, better culture. Our database puts every licensed agent's contact information at your fingertips, so your recruiting team can run targeted outreach instead of hoping agents come to them.",
    painPoints: [
      "Recruiting pipeline depends on word-of-mouth and who you already know",
      "Competing with national franchises that have dedicated recruiting budgets",
      "No easy way to identify and contact agents at competing brokerages",
      "Paying recruiters or headhunters high fees per successful hire",
    ],
    useCases: [
      "Email agents in your state about your brokerage's value proposition",
      "Run recruitment campaigns targeting specific state markets you're entering",
      "Build awareness with agents through drip email sequences",
      "Invite agents to informational sessions or brokerage open houses",
    ],
    cta: "Start recruiting agents in your market",
    keywords: [
      "real estate agent email list for recruiting",
      "realtor database for brokerages",
      "agent recruitment email list",
      "recruit real estate agents",
      "brokerage recruiting contacts",
      "real estate agent recruiting data",
    ],
    faqs: [
      {
        question: "Can I find agents from specific competing brokerages?",
        answer:
          "Our data includes agent name, email, phone, and state. It doesn't include current brokerage affiliation. However, you can cross-reference with MLS data or public brokerage rosters to target specific firms.",
      },
      {
        question: "Is it legal to recruit agents from other brokerages via email?",
        answer:
          "Yes. Real estate agents are independent contractors, and recruiting them is a standard industry practice. Use professional, CAN-SPAM compliant outreach, and agents are free to explore opportunities.",
      },
      {
        question: "What's the best approach for brokerage recruiting emails?",
        answer:
          "Lead with your differentiator — commission splits, technology, culture, or support. Keep the first email short and specific. Agents get recruited constantly, so generic \"join our team\" emails get ignored. Be specific about what makes your brokerage different.",
      },
    ],
    relatedBlogSlugs: [
      "how-to-build-realtor-email-list",
      "real-estate-cold-email-templates",
      "real-estate-agent-email-list-all-states",
    ],
  },
  {
    slug: "lead-generation",
    name: "Lead Generation Companies",
    title: "Real Estate Agent Database for Lead Gen Companies",
    headline: "Source Verified Agent Contacts Without the Scraping",
    description:
      "You sell leads or build contact databases for clients who target real estate agents. The data sourcing is usually the most expensive and time-consuming part. Our pre-built database saves you the scraping, cleaning, and verification work — you get 1,100,000+ verified contacts ready to use or resell as part of your offering.",
    painPoints: [
      "Spending engineering time building and maintaining scrapers for state licensing sites",
      "High costs for data cleaning and email verification at scale",
      "State licensing sites changing formats and breaking your data pipeline",
      "Clients expecting fresh, complete data but your coverage has gaps",
    ],
    useCases: [
      "Use as a foundation for your own lead gen products targeting real estate",
      "Supplement your existing database with verified state licensing data",
      "Offer agent contact lists as an add-on to your existing services",
      "Build enriched profiles by combining our data with your own sources",
    ],
    cta: "Get the raw data your business needs",
    keywords: [
      "real estate agent database for lead gen",
      "bulk realtor email list",
      "real estate agent data provider",
      "wholesale agent contact data",
      "realtor lead list",
      "real estate agent email database bulk",
    ],
    faqs: [
      {
        question: "What's the data coverage like?",
        answer:
          "1,100,000+ licensed real estate agents across all 50 US states. Over 90% carry an email address and over 90% carry a phone number. Data is sourced from state licensing authorities.",
      },
      {
        question: "Can I use this data in my own products?",
        answer:
          "The data is yours once purchased. You can incorporate it into your products, enrich it with your own data sources, and use it as part of your service delivery. For raw resale licensing, contact us to discuss terms.",
      },
      {
        question: "How does this compare to scraping the data myself?",
        answer:
          "Building and maintaining scrapers for 50 state licensing sites costs thousands in engineering time, plus ongoing maintenance as sites change. Our database gives you the same result for $399, verified and formatted, with regular updates.",
      },
    ],
    relatedBlogSlugs: [
      "real-estate-contact-database-free-vs-paid",
      "realtor-database-download-guide",
      "find-real-estate-agent-email-addresses",
    ],
  },
  {
    slug: "home-services",
    name: "Home Services Companies",
    title: "Real Estate Agent Email List for Home Services Companies",
    headline: "Turn Agents Into Your Referral Engine",
    description:
      "You run a home services business — contracting, roofing, landscaping, cleaning, staging, or inspections. Real estate agents are the single best referral source in your market: every listing they take needs work done before it sells, and every buyer they close needs vendors afterward. Our database gives you the verified email addresses and phone numbers of every licensed agent in the states you serve, so you can build those referral relationships systematically instead of waiting for word-of-mouth.",
    painPoints: [
      "Referrals depend on a handful of agents you happen to know personally",
      "Homeowner advertising (Google Ads, Angi, Thumbtack) keeps getting more expensive per lead",
      "No direct channel to introduce your services to the agents driving transactions in your area",
      "Competitors with agent relationships get called first for pre-listing work",
    ],
    useCases: [
      "Email agents in your service area introducing your pre-listing services",
      "Offer agents a fast-turnaround guarantee for inspection-repair items",
      "Send seasonal maintenance content agents can forward to their clients",
      "Build a vendor-referral list one state (or one $99 pack) at a time",
    ],
    cta: "Reach the agents who refer work",
    keywords: [
      "real estate agent email list for contractors",
      "realtor contacts for home services",
      "agent referrals for home improvement",
      "real estate agent list for staging companies",
      "realtor email list for home inspectors",
      "agent partnerships for service businesses",
    ],
    faqs: [
      {
        question: "Can I buy contacts for just my local market?",
        answer:
          "Yes — state packs are $99 each, so a single-market service business only pays for its own state. Operations covering five or more states do better with the full database at $399.",
      },
      {
        question: "What's the best first email to send agents?",
        answer:
          "Lead with something concrete an agent can use this week: pre-listing turnaround times, a repair-quote SLA for inspection items, or a co-branded checklist for their sellers. Agents ignore generic 'partner with us' emails but respond to vendors who make their listings move faster.",
      },
      {
        question: "What data do I get for each agent?",
        answer:
          "Each record includes the agent's full name, email address, phone number where available (over 90% of records), and state — delivered as a standard CSV that opens in Excel, Google Sheets, or any CRM.",
      },
    ],
    relatedBlogSlugs: [
      "real-estate-cold-email-templates",
      "b2b-real-estate-marketing",
      "how-to-build-realtor-email-list",
    ],
  },
  {
    slug: "insurance-agencies",
    name: "Insurance Agencies",
    title: "Real Estate Agent Email List for Insurance Agencies",
    headline: "Get Introduced Before the Closing Date",
    description:
      "Every home purchase needs a homeowner's insurance policy — and the real estate agent is often the one the buyer asks for a recommendation. If you sell home, flood, or title insurance, agents are a compounding referral channel: win one agent's trust and you're in front of every client they close. Our database gives you verified contact data for licensed agents across all 50 states so you can build that channel deliberately.",
    painPoints: [
      "Buyers pick whichever insurer their agent or lender happens to mention",
      "No scalable way to introduce your agency to the agents active in your market",
      "Carrier-provided leads are shared with competing agents and close poorly",
      "Referral relationships take years to build one networking event at a time",
    ],
    useCases: [
      "Introduce your agency to agents in your state with quote-turnaround guarantees",
      "Send agents closing-friendly content: binder timelines, flood-zone explainers, premium trends",
      "Build drip campaigns for agents in zip codes where you want more policies",
      "Reach agents in newly licensed states as you expand",
    ],
    cta: "Start building agent referral relationships",
    keywords: [
      "real estate agent email list for insurance",
      "realtor contacts for insurance agents",
      "agent referrals for homeowners insurance",
      "insurance marketing to real estate agents",
      "realtor referral partnerships insurance",
      "agent email list for insurance agencies",
    ],
    faqs: [
      {
        question: "Why market to real estate agents instead of homebuyers directly?",
        answer:
          "Buyers shop for insurance once; agents transact all year. A single agent who trusts your agency can refer dozens of policies annually, and the introduction arrives exactly when the buyer needs a policy — before closing.",
      },
      {
        question: "Can I target only the states where I'm licensed?",
        answer:
          "Yes. Buy individual state packs at $99 each for the states where you hold licenses. Records include the agent's state, so multi-state agencies can also segment the $399 full database by the state column.",
      },
      {
        question: "Is emailing agents compliant?",
        answer:
          "The contacts are licensed professionals whose business information comes from public sources. Standard B2B email rules apply — follow CAN-SPAM: accurate subject lines, your business address, and a working unsubscribe link.",
      },
    ],
    relatedBlogSlugs: [
      "mortgage-lenders-contact-real-estate-agents",
      "real-estate-cold-email-templates",
      "cold-outreach-realtors-compliance",
    ],
  },
  {
    slug: "photographers",
    name: "Real Estate Photographers & Media",
    title: "Real Estate Agent Email List for Photographers",
    headline: "Book More Listing Shoots with Direct Agent Outreach",
    description:
      "You shoot listings — photography, video walkthroughs, drone, 3D tours, or floor plans. Your clients are real estate agents, and the difference between a full calendar and a slow month is how many agents know your name when they take a listing. Our database gives you every licensed agent's verified contact info in your market, so you can pitch your portfolio directly instead of hoping referrals find you.",
    painPoints: [
      "Bookings cluster around a few loyal agents — one lost client hurts",
      "Instagram posts reach other photographers, not the agents who hire you",
      "Marketplace platforms take a cut and race everyone to the bottom on price",
      "No efficient way to announce new services (drone, 3D tours) to agents at scale",
    ],
    useCases: [
      "Email agents in your metro with your portfolio and listing-day turnaround times",
      "Announce new offerings — twilight shoots, 3D tours, reels — to every agent in your state",
      "Rebook past markets when you travel or expand coverage areas",
      "Offer new-agent discounts to agents who just got licensed in your area",
    ],
    cta: "Put your portfolio in agents' inboxes",
    keywords: [
      "real estate agent email list for photographers",
      "realtor contacts for real estate photography",
      "market photography services to real estate agents",
      "real estate videographer client outreach",
      "agent email list for media companies",
      "get real estate photography clients",
    ],
    faqs: [
      {
        question: "I only serve one metro area — is a state list too broad?",
        answer:
          "The data is segmented by state, and at $99 per state it remains an affordable targeted B2B list. Many photographers email the full state and let the subject line do the geographic filtering ('Listing photography in the Austin metro — 24-hour turnaround').",
      },
      {
        question: "What should a photography pitch email include?",
        answer:
          "Three things agents care about: 2–4 of your best listing shots, your turnaround time, and simple pricing. Keep it under 100 words with a link to your portfolio. Agents book vendors who make them look good with minimal friction.",
      },
      {
        question: "How current is the contact data?",
        answer:
          "The dataset is refreshed on a regular cycle from public licensing and listing sources — the current refresh date is shown on the site. Cleanup passes remove duplicates and malformed records between refreshes.",
      },
    ],
    relatedBlogSlugs: [
      "real-estate-cold-email-templates",
      "how-to-build-realtor-email-list",
      "real-estate-marketing-strategies",
    ],
  },
  {
    slug: "moving-companies",
    name: "Moving Companies",
    title: "Real Estate Agent Email List for Moving Companies",
    headline: "Be the Mover Every Agent Recommends",
    description:
      "Every closed transaction ends with a move — and 'do you know a good mover?' is one of the most common questions agents get from clients. If your moving company isn't the one agents mention, a competitor is. Our database of licensed agent contacts lets you introduce your company to every agent in your service area and stay top-of-mind through the busy season.",
    painPoints: [
      "Lead aggregators sell the same customer to five competing movers",
      "Agent referrals convert far better than paid leads, but you only know a few agents",
      "Seasonal demand swings while your marketing stays static",
      "New offices in new cities start with zero local referral network",
    ],
    useCases: [
      "Introduce your company to agents with a client-discount referral offer",
      "Send pre-summer capacity updates so agents know you have crews available",
      "Launch new service areas by emailing every agent in the new state",
      "Offer agents co-branded moving checklists they can share with clients",
    ],
    cta: "Get in front of agents before moving season",
    keywords: [
      "real estate agent email list for movers",
      "realtor contacts for moving companies",
      "agent referrals for moving company",
      "moving company marketing to real estate agents",
      "realtor partnership moving services",
      "moving leads from real estate agents",
    ],
    faqs: [
      {
        question: "Why are agent referrals better than purchased moving leads?",
        answer:
          "Purchased leads are typically resold to multiple movers and arrive price-shopping. An agent referral arrives with trust already transferred — the client asked their agent for a recommendation. One good agent relationship can produce referrals for years.",
      },
      {
        question: "Can I buy just the states we operate in?",
        answer:
          "Yes. State packs are $99 each, so a regional mover buys only its operating states. National carriers and franchises usually take the full 50-state database at $399.",
      },
      {
        question: "When should I run agent outreach campaigns?",
        answer:
          "Ahead of peak season — most moves happen in late spring and summer, so agents are deciding which movers to recommend in early spring. A second touch in fall catches the year-end relocation wave.",
      },
    ],
    relatedBlogSlugs: [
      "real-estate-cold-email-templates",
      "b2b-real-estate-marketing",
      "how-to-build-realtor-email-list",
    ],
  },
] as const

export function getPersonaBySlug(slug: string): Persona | undefined {
  return PERSONAS.find((p) => p.slug === slug)
}
