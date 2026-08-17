// "Best [X] Alternatives" pages. All competitor pricing and feature claims are
// sourced from vendor pricing pages and third-party pricing guides, verified
// July 2026. Hedge anything quote-based — never state unverified numbers.
export interface AlternativeOption {
  name: string
  isUs?: boolean
  bestFor: string
  pricing: string
  description: string
  pros: string[]
  cons: string[]
}

export interface AlternativesPage {
  slug: string
  competitor: string
  title: string
  headline: string
  intro: string
  /** 2–4 self-contained sentences for the AEO answer box near the top */
  answerBox: string
  whySwitch: { title: string; detail: string }[]
  options: AlternativeOption[]
  howToChoose: string
  /** Matching slug in COMPETITORS for a head-to-head cross-link, if one exists */
  compareSlug?: string
  faqs: { question: string; answer: string }[]
}

const US_OPTION_BASE = {
  name: "USAgentLeads",
  isUs: true as const,
  pricing: "$99 per state or $399 one-time for all 50 states",
}

export const ALTERNATIVES_PAGES: readonly AlternativesPage[] = [
  {
    slug: "zoominfo-alternatives",
    competitor: "ZoomInfo",
    title: "Best ZoomInfo Alternatives for Real Estate Agent Data",
    headline: "ZoomInfo Alternatives: 6 Options Compared",
    intro:
      "ZoomInfo is the biggest name in B2B contact data, but it doesn't publish pricing — reported list prices start around $14,995/year for the Professional tier, and third-party pricing guides report most teams end up spending $30,000–60,000/year once seats and credits are added. If that's more platform than you need, here are six alternatives — starting with the specialized option for teams that only target real estate agents.",
    answerBox:
      "The best ZoomInfo alternative depends on what you're replacing. For US real estate agent data specifically, USAgentLeads delivers 1,100,000+ licensed agent contacts for $399 one-time — versus reported ZoomInfo contracts from about $14,995/year. For multi-industry prospecting with outreach tooling, Apollo.io (free tier; paid from ~$49/user/month annual) is the most common downgrade path, with UpLead and Lusha as credit-based mid-market options.",
    whySwitch: [
      {
        title: "Quote-only pricing and annual contracts",
        detail:
          "There's no self-serve or monthly option — every price comes from a sales quote, and contracts reportedly auto-renew unless you cancel 60–90 days before the renewal date.",
      },
      {
        title: "High minimum spend",
        detail:
          "Reported entry pricing starts around $14,995/year before per-seat add-ons, which third-party guides put at $1,500–2,500 per user per year.",
      },
      {
        title: "Credit-limited exports",
        detail:
          "Bulk exports are governed by annual credit allowances (reportedly 5,000 bulk credits/year on Professional), so pulling large lists can cost extra.",
      },
      {
        title: "You only need one vertical",
        detail:
          "ZoomInfo covers every industry. If your entire market is US real estate agents, you're paying for a database you'll never use 99% of.",
      },
    ],
    options: [
      {
        ...US_OPTION_BASE,
        bestFor: "Teams that specifically target US real estate agents",
        description:
          "A specialized database of 1,100,000+ licensed US real estate agent contacts — name, email, phone, and state — covering all 50 states. One-time purchase, unlimited use, instant CSV download. No seats, no credits, no contract.",
        pros: [
          "$399 one-time vs five-figure annual contracts",
          "No credit system — download everything you paid for",
          "Specialized real estate agent coverage from public licensing and listing sources",
          "Guest checkout, instant delivery, 30-day money-back guarantee",
        ],
        cons: [
          "Real estate agents only — no other industries",
          "No built-in outreach tools (bring your own email platform)",
          "No intent data, org charts, or company profiles",
        ],
      },
      {
        name: "Apollo.io",
        bestFor: "All-in-one prospecting with outreach built in",
        pricing: "Free tier; paid from ~$49/user/mo (annual billing)",
        description:
          "A B2B database plus sequencing, dialer, and CRM integrations. A generous free tier and much lower per-seat prices than ZoomInfo make it the most common downgrade path, though credits expire each billing cycle and phone reveals consume extra credits.",
        pros: [
          "Free tier with unlimited email credits (fair-use capped)",
          "Built-in sequences and dialer",
          "Far cheaper per seat than ZoomInfo",
        ],
        cons: [
          "Credits expire at the end of each billing cycle",
          "Phone numbers cost roughly 8x more credits than emails",
          "Real estate agent coverage is partial — it isn't a licensing-data specialist",
        ],
      },
      {
        name: "UpLead",
        bestFor: "Accuracy-focused B2B prospecting at mid-market prices",
        pricing: "From $99/mo ($74/mo billed annually) with 170 credits/mo",
        description:
          "A credit-based B2B database known for its 95% data accuracy guarantee — invalid emails are refunded in credits. A 7-day free trial is available. Costs work out to roughly $0.44–0.50 per revealed contact, so large lists get expensive.",
        pros: [
          "95% accuracy guarantee with credit refunds",
          "Transparent self-serve pricing",
          "7-day free trial",
        ],
        cons: [
          "Credit-based — unused credits typically expire monthly",
          "Roughly $0.44+ per contact makes bulk lists costly",
          "Not specialized in real estate data",
        ],
      },
      {
        name: "Lusha",
        bestFor: "Individual reps who need occasional contact lookups",
        pricing: "Free plan (40 credits/mo); paid from ~$37/user/mo (annual)",
        description:
          "A lightweight prospecting tool with per-user, credit-based plans. Good for spot lookups, but phone reveals cost 10 credits vs 1 for an email under current published rates, and heavy list building burns through credits quickly.",
        pros: [
          "Free plan to start",
          "Low entry price per user",
          "Simple, fast lookup workflow",
        ],
        cons: [
          "Phone numbers consume 10 credits each",
          "Credit allowances are annualized per seat — bulk exports are impractical",
          "No real estate specialization",
        ],
      },
      {
        name: "Seamless.AI",
        bestFor: "AI-assisted list building across industries",
        pricing: "Free 50 lifetime credits; ~$147/mo reported for entry paid tier; Pro is quote-only",
        description:
          "An AI-driven contact search platform. Third-party pricing guides report the entry paid tier around $147/month, with Pro pricing quote-only. Note that credits are reportedly consumed per lookup attempt — including lookups that return no usable data.",
        pros: [
          "AI-assisted search and list building",
          "Free credits to test",
          "Multi-industry coverage",
        ],
        cons: [
          "Credits are consumed even when a lookup returns nothing usable, per user reports",
          "Reported 60-day cancellation-notice requirement before renewal",
          "Upper tiers are quote-only",
        ],
      },
      {
        name: "RocketReach",
        bestFor: "Lookup-style prospecting with per-lookup budgets",
        pricing: "From $329/year (~$27/mo, email-only); phones from ~$69/mo (annual)",
        description:
          "A large contact-lookup database with individual and team plans. The cheapest tier is email-only with 100 exports/month — phone numbers and CRM integrations require the Pro tier.",
        pros: [
          "Low individual entry price",
          "Straightforward published pricing",
          "Free tier for testing (5 lookups/mo)",
        ],
        cons: [
          "Essentials tier is email-only",
          "Monthly export caps",
          "General-purpose data, not real estate specific",
        ],
      },
    ],
    howToChoose:
      "If you sell into many industries and need workflow tooling, Apollo is the most popular ZoomInfo replacement. If accuracy guarantees matter, look at UpLead. But if your target market is US real estate agents specifically, a specialized one-time database gives you more agent coverage than any general platform at roughly 1% of the annual cost — and you can still import the CSV into Apollo, ZoomInfo, or any outreach tool you already use.",
    compareSlug: "zoominfo-vs-usagentleads",
    faqs: [
      {
        question: "What's the cheapest ZoomInfo alternative for real estate agent contacts?",
        answer:
          "For real estate agents specifically, USAgentLeads is $399 one-time for 1,100,000+ contacts across all 50 states — versus reported ZoomInfo contracts starting around $14,995/year. General-purpose alternatives like Apollo (free tier) or Lusha (free plan) are cheap to start but meter access through monthly credits.",
      },
      {
        question: "Do these alternatives have the same data ZoomInfo has?",
        answer:
          "No alternative replicates ZoomInfo's full company intelligence — org charts, technographics, and intent data. If you only need contact records (name, email, phone), the alternatives above cover that core use case at a fraction of the price. USAgentLeads focuses exclusively on licensed US real estate agents.",
      },
      {
        question: "Can I use USAgentLeads data inside my existing sales stack?",
        answer:
          "Yes. You get a standard UTF-8 CSV with name, email, phone, and state columns. It imports directly into Apollo, HubSpot, Salesforce, Instantly, Smartlead, or any tool that accepts CSV uploads — see our import guides for step-by-step instructions.",
      },
    ],
  },
  {
    slug: "apollo-alternatives",
    competitor: "Apollo.io",
    title: "Best Apollo.io Alternatives for Real Estate Agent Data",
    headline: "Apollo.io Alternatives: 6 Options Compared",
    intro:
      "Apollo.io bundles a big B2B database with sequencing and a dialer, with plans from free to $119/user/month (annual). It's a strong all-rounder — but credits expire monthly, phone reveals cost roughly 8x more than emails, and vertical coverage has gaps. Here are six alternatives depending on what's driving you away.",
    answerBox:
      "For real estate agent outreach, the strongest Apollo alternative is a specialized dataset: USAgentLeads sells all 1,100,000+ licensed US agent contacts for $399 one-time, with no credits or per-seat fees — and the CSV imports back into Apollo if you keep it for sequencing. For general B2B prospecting, UpLead (95% accuracy guarantee, from $99/month) and Hunter.io (email finding, from $34/month annual) lead the credit-based field, while ZoomInfo is the quote-only enterprise upgrade.",
    whySwitch: [
      {
        title: "Credits expire every billing cycle",
        detail:
          "Unused data credits don't roll over, and overage credits reportedly cost $0.20 each with a 250-credit minimum purchase.",
      },
      {
        title: "Phone numbers are expensive",
        detail:
          "Mobile reveals consume roughly 8x more credits than emails, which adds up fast for calling-heavy teams.",
      },
      {
        title: "Per-user pricing",
        detail:
          "Every seat multiplies the cost, and the Organization tier requires a minimum of 3 users.",
      },
      {
        title: "Niche vertical gaps",
        detail:
          "Apollo aggregates general B2B data. Coverage of licensed professionals in niches like real estate is inconsistent, especially in smaller states.",
      },
    ],
    options: [
      {
        ...US_OPTION_BASE,
        bestFor: "Complete coverage of US real estate agents, without credits",
        description:
          "1,100,000+ licensed US real estate agent contacts compiled from public licensing and listing sources. One flat purchase, no per-user fees, no credits — download the CSV and import it into Apollo or any other tool. Many teams keep Apollo for sequencing and buy the agent data here.",
        pros: [
          "One-time $399 for all 50 states — no seats or credits",
          "Phone numbers included at no extra cost (90%+ of records)",
          "Deeper licensed-agent coverage than general B2B databases",
          "Works alongside Apollo — import the CSV and sequence there",
        ],
        cons: [
          "No built-in email sequencing or dialer",
          "Real estate agents only",
          "No company/firmographic enrichment fields",
        ],
      },
      {
        name: "ZoomInfo",
        bestFor: "Enterprise teams that need company intelligence",
        pricing: "Quote-only; reported from ~$14,995/year",
        description:
          "The enterprise upgrade path from Apollo. Deeper company data, org charts, and intent signals — at a much higher, quote-only price with annual contracts.",
        pros: [
          "Deepest B2B company intelligence available",
          "Intent data and buying signals",
          "Enterprise integrations and admin controls",
        ],
        cons: [
          "Reported contracts start around $14,995/year",
          "No self-serve or monthly option",
          "Auto-renewal with long cancellation-notice windows reported",
        ],
      },
      {
        name: "UpLead",
        bestFor: "Higher accuracy guarantees on smaller volumes",
        pricing: "From $99/mo ($74/mo annual) with 170 credits/mo",
        description:
          "Credit-based prospecting with a 95% accuracy guarantee — invalid emails are refunded. Simpler than Apollo, with transparent pricing, but no sequencing tools.",
        pros: [
          "95% accuracy guarantee with credit refunds",
          "Credits reveal email and mobile together",
          "Transparent self-serve plans",
        ],
        cons: [
          "No outreach/sequencing tools",
          "Credits typically expire monthly",
          "Higher per-contact cost than bulk data purchases",
        ],
      },
      {
        name: "Hunter.io",
        bestFor: "Finding and verifying emails by company domain",
        pricing: "Free (25 searches/mo); paid from $34/mo (annual)",
        description:
          "A focused email finder and verifier with cold-email sending built in. Great value per email credit, but it's email-only — no phone numbers — and searches work by company domain rather than by industry list.",
        pros: [
          "Excellent per-credit value (Starter: 2,000 credits)",
          "Strong email verification",
          "Simple, transparent pricing",
        ],
        cons: [
          "No phone numbers at all",
          "Domain-based search doesn't suit list-building by profession",
          "Limited filtering compared to full databases",
        ],
      },
      {
        name: "Lusha",
        bestFor: "Lightweight per-rep lookups",
        pricing: "Free plan (40 credits/mo); paid from ~$37/user/mo (annual)",
        description:
          "Simple credit-based lookups with a free plan. Cheaper entry than Apollo for individuals, but phone reveals cost 10 credits each and bulk list building isn't its strength.",
        pros: ["Free plan available", "Low entry price", "Quick to learn"],
        cons: [
          "Phone reveals cost 10 credits vs 1 for email",
          "Per-seat, credit-metered model",
          "Not built for bulk exports",
        ],
      },
      {
        name: "Seamless.AI",
        bestFor: "AI-assisted real-time contact search",
        pricing: "Free 50 lifetime credits; entry paid tier reported ~$147/mo",
        description:
          "AI-driven contact discovery across industries. Reported pricing puts the entry paid tier around $147/month with Pro quote-only; user reports note credits are consumed per lookup attempt even when no valid contact is returned.",
        pros: ["AI list-building workflow", "Free trial credits", "Multi-industry"],
        cons: [
          "Credits reportedly burn on failed lookups",
          "Quote-only upper tiers",
          "Reported 60-day cancellation-notice requirement",
        ],
      },
    ],
    howToChoose:
      "Keep Apollo if sequencing is central to your workflow — its free and Basic tiers are hard to beat for tooling. Switch to UpLead or Hunter for better data-quality economics, or ZoomInfo if you're scaling into enterprise intelligence. If your market is US real estate agents, buy the specialized dataset once and run it through whichever outreach tool you already like — including Apollo itself.",
    compareSlug: "apollo-vs-usagentleads",
    faqs: [
      {
        question: "Can I import USAgentLeads data into Apollo?",
        answer:
          "Yes. Download the CSV (name, email, phone, state), then use Apollo's CSV import to add the contacts to your workspace and enroll them in sequences. You get specialized agent data plus Apollo's workflow tools.",
      },
      {
        question: "Why not just use Apollo's database for real estate agents?",
        answer:
          "Apollo aggregates general B2B data and doesn't specialize in state licensing records, so agent coverage is inconsistent — especially in smaller states. A specialized database sourced from public licensing and listing data covers licensed agents far more completely.",
      },
      {
        question: "Which alternative is cheapest overall?",
        answer:
          "It depends on volume. For a handful of lookups, free tiers (Apollo, Lusha, Hunter) cost nothing. For bulk real estate agent lists, $399 one-time for 1,100,000+ contacts works out to a fraction of a cent per contact — cheaper than any credit-based plan by orders of magnitude.",
      },
    ],
  },
  {
    slug: "redx-alternatives",
    competitor: "REDX",
    title: "Best REDX Alternatives for Real Estate Leads & Agent Data",
    headline: "REDX Alternatives: 6 Options Compared",
    intro:
      "REDX sells homeowner seller leads — expireds, FSBOs, GeoLeads — to real estate agents, with individual lead types from around $50–130/month and bundles from $199–349/month. The right alternative depends on which side of the market you're on: agents prospecting homeowners have several dedicated options, while businesses trying to reach agents themselves need a different kind of database entirely.",
    answerBox:
      "Agents prospecting homeowners should shortlist Vulcan7 (reported ~$359/month, premium dialer-first suite), Espresso Agent (published pricing from $249/month, no long-term commitment), or Landvoice (budget bundles reported from $87/month). If you're a business trying to reach agents themselves — coaching, lending, recruiting, software — REDX was never the right tool: USAgentLeads sells 1,100,000+ licensed agent contacts for $399 one-time.",
    whySwitch: [
      {
        title: "Costs stack per lead type",
        detail:
          "Each lead type is a separate subscription — an agent wanting expireds, FSBOs, and the multi-line dialer can reportedly end up at $150–200+/month at regular pricing.",
      },
      {
        title: "You want different lead sources",
        detail:
          "Competitors differentiate on data types — pre-foreclosures, neighborhood farming data, or property-owner records REDX doesn't emphasize.",
      },
      {
        title: "You're actually trying to reach agents, not homeowners",
        detail:
          "REDX is for agents prospecting sellers. If you sell products or services to agents — coaching, software, mortgage, title — you need an agent contact database, not homeowner leads.",
      },
    ],
    options: [
      {
        ...US_OPTION_BASE,
        bestFor: "Businesses selling to real estate agents (not homeowner prospecting)",
        description:
          "A different tool for a different job: 1,100,000+ licensed agent contacts across all 50 states, for coaches, lenders, brokerages recruiting, and SaaS companies that sell to agents. If you came to REDX looking for a way to contact agents themselves, this is the direct answer.",
        pros: [
          "One-time $399 for every state — no subscription",
          "Agent emails and phones, ready for any CRM or email tool",
          "Per-state packs at $99 for local campaigns",
          "Instant CSV download, 30-day money-back guarantee",
        ],
        cons: [
          "Not a homeowner-lead service — no expireds or FSBOs",
          "No dialer or prospecting workflow tools",
        ],
      },
      {
        name: "Vulcan7",
        bestFor: "Agents who live on expired listings and want premium contact rates",
        pricing: "Reported ~$359/mo full suite; expireds-only from ~$250/mo",
        description:
          "REDX's most direct premium competitor for expired, FSBO, and FRBO leads with a built-in dialer and CRM. Pricing isn't published publicly; third-party guides report around $359/month for the full suite with discounts for 6–12 month commitments — and note that longer terms are typically required to lock lower rates.",
        pros: [
          "Strong reputation for expired-lead contact data",
          "Built-in dialer and CRM included",
          "FSBO/FRBO coverage",
        ],
        cons: [
          "Reported pricing is roughly double REDX's entry bundles",
          "12-month terms reportedly pushed at signup",
          "No public pricing page detail",
        ],
      },
      {
        name: "Espresso Agent",
        bestFor: "Expired/FSBO calling with published, contract-free pricing",
        pricing: "From $249/mo (GEO) to $399/mo (Platinum); annual ~$223/mo equivalent",
        description:
          "Expired, FSBO, and neighborhood-search leads with a dialer, at published prices and no long-term commitment on monthly plans — no setup or termination fees.",
        pros: [
          "Transparent published pricing",
          "No setup or termination fees; monthly plans without long-term commitment",
          "Annual and semi-annual discounts (up to ~20%)",
        ],
        cons: [
          "Higher entry price than REDX's individual lead subscriptions",
          "Smaller ecosystem than REDX/Vulcan7",
        ],
      },
      {
        name: "Landvoice",
        bestFor: "Budget-friendly expired + FSBO data bundles",
        pricing: "Plans reported from $87–227/mo; expired+FSBO data from ~$120/mo",
        description:
          "A lower-cost source of expired, FSBO, and pre-foreclosure data. Also sells exclusive 'Old Expireds' by zip code and year ($250 per zip/year combination, exclusive to the buyer for 6 months).",
        pros: [
          "Lower entry pricing than REDX bundles",
          "Pre-foreclosure data available",
          "Exclusive old-expired packages",
        ],
        cons: [
          "Fewer built-in calling tools than REDX/Vulcan7",
          "Area-based subscriptions — extra counties cost more",
        ],
      },
      {
        name: "Cole Realty Resource",
        bestFor: "Neighborhood farming — homeowner phone/email data by street",
        pricing: "Starter reported at ~$119.95 + $99.95 setup; Pro $995/yr unlimited downloads",
        description:
          "From Cole Information (founded 1947), best known for geographic farming data — homeowner contact records by neighborhood — plus expired and withdrawn lists. A different prospecting motion than calling expireds.",
        pros: [
          "Strong for geographic farm prospecting",
          "Unlimited downloads on Pro annual plan",
          "Includes emails and phone numbers",
        ],
        cons: [
          "Setup fee on the starter plan",
          "Annual plans for the best rates",
          "Not focused on daily expired-lead delivery",
        ],
      },
      {
        name: "PropStream",
        bestFor: "Investor-grade property data and owner skip tracing",
        pricing: "From $99/mo (Essentials); Pro $199/mo; 7-day trial",
        description:
          "Property-centric data — ownership, equity, distress indicators — with built-in skip tracing and marketing tools. Suits agents and investors who prospect from property criteria rather than listing status.",
        pros: [
          "Deep property and ownership data",
          "Built-in skip tracing and list automation",
          "7-day free trial with 50 leads",
        ],
        cons: [
          "Not an expired/FSBO lead feed",
          "Higher tiers get expensive ($199–699/mo)",
        ],
      },
    ],
    howToChoose:
      "Agents prospecting homeowners should shortlist Vulcan7 (premium, dialer-first), Espresso Agent (transparent pricing), or Landvoice (budget bundles), and PropStream or Cole for property-data-driven farming. If you're a business whose customers are the agents themselves, none of those help — you want a licensed-agent contact database, which is exactly what USAgentLeads is.",
    compareSlug: "redx-vs-usagentleads",
    faqs: [
      {
        question: "Is USAgentLeads a replacement for REDX?",
        answer:
          "Only if your goal is reaching agents rather than homeowners. REDX gives agents homeowner seller leads; USAgentLeads gives businesses the contact data of licensed agents. Coaches, lenders, brokerages, and PropTech companies use it to run outreach to agents directly.",
      },
      {
        question: "Which REDX alternative is cheapest for expired listings?",
        answer:
          "Among researched options, Landvoice reports the lowest entry pricing (plans from around $87–127/month), with Espresso Agent and Vulcan7 positioned as premium options. Verify current pricing with each vendor — most of these services change packages regularly.",
      },
      {
        question: "Do any of these include a dialer?",
        answer:
          "REDX, Vulcan7, and Espresso Agent all bundle dialers. Landvoice is primarily a data service, PropStream focuses on property data and marketing tools, and USAgentLeads delivers raw CSV data for use in your own calling or email stack.",
      },
    ],
  },
  {
    slug: "cole-realty-resource-alternatives",
    competitor: "Cole Realty Resource",
    title: "Best Cole Realty Resource Alternatives",
    headline: "Cole Realty Resource Alternatives: 5 Options Compared",
    intro:
      "Cole Realty Resource (from Cole Information) is a long-running list service best known for neighborhood farming data, with reported pricing from about $119.95 plus a $99.95 setup fee for the starter tier, up to $995–1,590/year for unlimited-download plans. Whether you want cheaper farm data, expired leads, or a completely different kind of list — realtor contacts instead of homeowner records — here are the alternatives.",
    answerBox:
      "For homeowner prospecting, the closest Cole Realty Resource replacements are REDX (lead types from ~$50–130/month with the Vortex CRM included), Landvoice (plans reported from $87/month), and PropStream (property-data prospecting from $99/month). If what you actually need is a list of real estate agents rather than homeowners, USAgentLeads is the specialized option: 1,100,000+ licensed agent contacts, $399 one-time, no setup fees or download caps.",
    whySwitch: [
      {
        title: "Setup fees and annual plans",
        detail:
          "The reported starter package carries a $99.95 setup fee, and the best rates (unlimited downloads, phone append) come on $995+/year plans.",
      },
      {
        title: "Download caps on the entry tier",
        detail:
          "The starter plan is reported at 2,000 downloads per month — fine for farming a neighborhood, restrictive for larger campaigns.",
      },
      {
        title: "You need agent contacts, not homeowner data",
        detail:
          "Cole's core product is homeowner/farm data for agents. Businesses that market to real estate agents need a licensed-agent database instead.",
      },
    ],
    options: [
      {
        ...US_OPTION_BASE,
        bestFor: "Reaching licensed real estate agents themselves",
        description:
          "If the list you actually need is real estate agents — for recruiting, coaching offers, lending partnerships, or software sales — this is the specialized option: 1,100,000+ agent contacts across all 50 states, $399 one-time, no setup fees or download caps.",
        pros: [
          "No setup fee, no subscription, no download caps",
          "All 50 states for less than Cole's reported starter tier + setup",
          "Instant CSV delivery with guest checkout",
          "30-day money-back guarantee",
        ],
        cons: [
          "Agent contacts only — no homeowner or farm data",
          "No neighborhood/geographic drill-down below state level in CSV packs",
        ],
      },
      {
        name: "REDX",
        bestFor: "Daily expired and FSBO seller leads with a dialer",
        pricing: "Individual lead types from ~$50–130/mo; bundles $199–349/mo",
        description:
          "Where Cole leans toward farming lists, REDX delivers time-sensitive seller leads (expireds, FSBOs, GeoLeads) with its Vortex CRM included and optional dialer tiers.",
        pros: [
          "Fresh daily expired/FSBO leads",
          "Vortex lead manager included",
          "Modular pricing per lead type",
        ],
        cons: [
          "Costs stack as you add lead types",
          "Subscription model — no one-time purchase",
        ],
      },
      {
        name: "Landvoice",
        bestFor: "Budget expired/FSBO/pre-foreclosure data",
        pricing: "Plans reported from $87–227/mo",
        description:
          "A value-priced data provider for expireds, FSBOs, and pre-foreclosures, sold by geographic area. Exclusive 'Old Expireds' packages are available per zip code.",
        pros: [
          "Low entry pricing",
          "Pre-foreclosure coverage",
          "Exclusive aged-expired packages",
        ],
        cons: [
          "Area-based pricing — more counties cost more",
          "Lighter tooling than dialer-first platforms",
        ],
      },
      {
        name: "PropStream",
        bestFor: "Property-criteria prospecting with skip tracing",
        pricing: "From $99/mo; Pro $199/mo",
        description:
          "Nationwide property database with ownership, equity, and distress filters plus built-in skip tracing — a more investor-oriented way to build homeowner lists than Cole's directory approach.",
        pros: [
          "Rich property-level filters",
          "Integrated skip tracing",
          "7-day free trial",
        ],
        cons: [
          "Monthly subscription with paid add-ons",
          "Overkill if you just want a neighborhood contact list",
        ],
      },
      {
        name: "Data Axle Genie",
        bestFor: "General consumer & business lists with sales tooling",
        pricing: "Reported $99–299/mo on 12-month contracts",
        description:
          "Formerly Salesgenie — consumer and business list building from Data Axle's databases, with CRM-lite features. Third-party guides note 12-month contracts, lead caps with overage charges, and a reported 50% early-termination fee.",
        pros: [
          "Both consumer and B2B list building",
          "3-day free trial with 150 leads reported",
          "Established data provider",
        ],
        cons: [
          "12-month contract with reported early-termination fee",
          "Real spend often exceeds sticker price due to overages and add-ons",
        ],
      },
    ],
    howToChoose:
      "Stay with Cole if geographic farming is your core play — its Pro plan's unlimited downloads are genuinely useful there. Pick REDX or Landvoice for listing-status leads, PropStream for property-data prospecting, and Data Axle Genie for general consumer/business lists. If your real goal is a list of real estate agents, buy the specialized agent database once instead of subscribing to homeowner-data tools.",
    compareSlug: "cole-realty-resource-vs-usagentleads",
    faqs: [
      {
        question: "Does USAgentLeads include homeowner farming data like Cole?",
        answer:
          "No. USAgentLeads is a database of licensed real estate agents — their names, emails, phones, and states. It serves businesses reaching agents, while Cole Realty Resource primarily serves agents reaching homeowners.",
      },
      {
        question: "What does Cole Realty Resource actually cost?",
        answer:
          "Third-party reviews report a starter package around $119.95 with a $99.95 setup fee (2,000 downloads/month), a Pro plan at $995/year with unlimited downloads and phone append, and a Power plan at $1,590/year. Confirm current pricing with Cole Information directly, as packages change.",
      },
      {
        question: "Which alternative has no subscription at all?",
        answer:
          "USAgentLeads is the only one-time purchase on this list — $99 per state or $399 for all 50 states, with no recurring billing. PropStream, REDX, Landvoice, and Data Axle Genie are all subscriptions.",
      },
    ],
  },
  {
    slug: "costar-alternatives",
    competitor: "CoStar",
    title: "Best CoStar Alternatives for Real Estate Data",
    headline: "CoStar Alternatives: 5 Options Compared",
    intro:
      "CoStar is the enterprise standard for commercial real estate intelligence — and priced like it. Pricing is custom and unpublished; third-party analyses report an average around $15,000/year, basic access reports in the $500–2,000/month range, and a median around $40,000/year for full-suite licenses. If that doesn't match your budget or your use case, here are five alternatives by need.",
    answerBox:
      "For commercial listings and comps, Crexi is the leading lower-cost CoStar alternative — its marketplace is free, and users report Intelligence access around $1,200/year. For property-level research, PropStream starts at a published $99/month. And if the job is simply reaching real estate agents, USAgentLeads covers 1,100,000+ licensed agent contacts for $399 one-time with no enterprise contract or sales process.",
    whySwitch: [
      {
        title: "Opaque, negotiated pricing",
        detail:
          "There's no public price list — every deal is a custom quote, and reported costs vary enormously by market coverage and seat count.",
      },
      {
        title: "Enterprise contracts",
        detail:
          "Annual contracts with a sales process and onboarding are the norm, which is heavy if you have a single, narrow data need.",
      },
      {
        title: "You only need contacts, not analytics",
        detail:
          "Teams that just want to reach real estate professionals don't need comps, analytics, or listing platforms — a contact database covers it.",
      },
    ],
    options: [
      {
        ...US_OPTION_BASE,
        bestFor: "Outreach to residential real estate agents",
        description:
          "If the job is contacting agents — recruiting, partnerships, or selling services — you don't need a CRE intelligence platform. 1,100,000+ licensed agent contacts, $399 one-time, instant CSV.",
        pros: [
          "About 1% of the cost of reported entry CoStar spend",
          "No sales process — buy and download in minutes",
          "All 50 states covered",
          "Works with any CRM or outreach tool",
        ],
        cons: [
          "No commercial property data, comps, or analytics",
          "No transaction or production data on agents",
        ],
      },
      {
        name: "Crexi",
        bestFor: "CRE listings marketplace with optional intelligence data",
        pricing: "Free marketplace; paid plans reported from ~$249; Intelligence reported ~$1,200/yr by users",
        description:
          "A commercial real estate marketplace with free listing search, plus paid tiers (Listing PRO, Intelligence, Enterprise PRO) adding nationwide property records, sales comps, and ownership data. Dramatically cheaper than CoStar for core comps and research, though exact pricing is consultation-based.",
        pros: [
          "Free marketplace tier",
          "User-reported Intelligence pricing near $1,200/year",
          "Modern interface with growing coverage",
        ],
        cons: [
          "Coverage depth trails CoStar in some markets",
          "Paid tiers require talking to sales",
        ],
      },
      {
        name: "PropStream",
        bestFor: "Property-level research and owner data at self-serve prices",
        pricing: "From $99/mo; Pro $199/mo; Elite $699/mo",
        description:
          "Nationwide property database with ownership, equity, and distress data plus skip tracing. Residential/investor-oriented rather than CRE-analytics-oriented, but self-serve and transparent.",
        pros: [
          "Published self-serve pricing",
          "Strong property and owner data",
          "7-day free trial",
        ],
        cons: [
          "Not a CRE comps/analytics platform",
          "Marketing tools cost extra at higher tiers",
        ],
      },
      {
        name: "Cole Realty Resource",
        bestFor: "Residential neighborhood/homeowner list building",
        pricing: "Starter reported ~$119.95 + setup fee; Pro $995/yr",
        description:
          "Geographic farming data — homeowner contacts by neighborhood — from Cole Information. A fit when 'real estate data' means residential contact lists rather than market analytics.",
        pros: [
          "Established provider (since 1947)",
          "Unlimited downloads on Pro",
          "Email and phone data included",
        ],
        cons: ["Setup fee reported on starter tier", "Annual plans for best value"],
      },
      {
        name: "Data Axle Genie",
        bestFor: "General business/consumer lists with light CRM tooling",
        pricing: "Reported $99–299/mo on 12-month contracts",
        description:
          "List building across Data Axle's business and consumer databases. Useful for broad local-business prospecting; watch for reported lead caps, add-on costs, and contract terms.",
        pros: [
          "Business + consumer databases in one tool",
          "Free trial reported (3 days, 150 leads)",
        ],
        cons: [
          "12-month contract with reported 50% early-termination fee",
          "Reported real spend runs well above sticker after overages",
        ],
      },
    ],
    howToChoose:
      "Match the tool to the actual job. CRE brokers doing comps and market analysis should trial Crexi before signing a CoStar renewal. Investors prospecting properties fit PropStream. List-driven residential marketing fits Cole or Data Axle. And if the goal is simply reaching real estate agents at scale, a one-time agent contact database does it without any enterprise contract.",
    compareSlug: "costar-vs-usagentleads",
    faqs: [
      {
        question: "How much does CoStar actually cost?",
        answer:
          "CoStar doesn't publish pricing. Third-party analyses report averages around $15,000/year, forum reports of basic access from $500–2,000/month, and median full-suite licenses around $40,000/year. Every contract is individually negotiated.",
      },
      {
        question: "What's the cheapest CoStar alternative?",
        answer:
          "It depends on the use case. For agent outreach, USAgentLeads is $399 one-time. For CRE listings and comps, Crexi has a free marketplace tier with paid intelligence reported around $1,200/year by users. For property research, PropStream starts at $99/month.",
      },
      {
        question: "Does any alternative include agent production data like CoStar/BrokerMetrics?",
        answer:
          "Not among these options. Agent production and transaction analytics remain a CoStar-family strength. USAgentLeads provides contact data (name, email, phone, state) rather than performance metrics.",
      },
    ],
  },
] as const

export function getAlternativesPageBySlug(slug: string): AlternativesPage | undefined {
  return ALTERNATIVES_PAGES.find((p) => p.slug === slug)
}
