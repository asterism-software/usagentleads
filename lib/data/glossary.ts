export interface GlossaryTerm {
  slug: string
  term: string
  title: string
  definition: string
  body: string
  relatedTerms: string[]
  keywords: string[]
  relatedBlogSlugs?: string[]
}

export const GLOSSARY_TERMS: readonly GlossaryTerm[] = [
  {
    slug: "mls",
    term: "MLS (Multiple Listing Service)",
    title: "What Is an MLS (Multiple Listing Service)?",
    definition:
      "A Multiple Listing Service (MLS) is a private database that real estate agents use to share property listings with each other. Each MLS is operated regionally, and access is restricted to licensed agents who pay membership fees.",
    body: `There are over 500 MLSs operating across the United States, each covering a specific geographic area. When a listing agent signs a seller, they enter the property into the local MLS so that buyer's agents can find it and bring offers.

**Why the MLS matters for agent data:** Every agent who lists or sells properties is registered with at least one MLS. This registration, combined with their state license, creates the data trail that makes agent contact databases possible. Companies that sell to agents — CRM vendors, coaching programs, mortgage lenders — use agent databases built from MLS and licensing records to reach their target market.

**Key facts about the MLS:**
- Access requires a real estate license and association membership
- Most MLSs charge monthly or annual fees ($20-60/month is typical)
- The NAR (National Association of Realtors) oversees MLS standards through its subsidiary, the Real Estate Standards Organization (RESO)
- Recent legal settlements (Sitzer/Burnett) are changing how commissions are displayed in MLS systems

**How this connects to USAgentLeads:** Our agent database includes contacts for agents registered across all US MLSs. When you buy a state pack, you're getting the licensed agents who participate in that state's MLS systems.`,
    relatedTerms: ["idx", "nar", "realtor-vs-real-estate-agent", "brokerage"],
    keywords: ["what is MLS", "multiple listing service", "MLS real estate", "MLS explained", "how MLS works"],
    relatedBlogSlugs: ["find-real-estate-agent-email-addresses", "real-estate-agent-email-list-all-states"],
  },
  {
    slug: "idx",
    term: "IDX (Internet Data Exchange)",
    title: "What Is IDX (Internet Data Exchange)?",
    definition:
      "IDX (Internet Data Exchange) is a system that allows real estate agents and brokers to display MLS listings on their own websites. It's the technology behind the property search tools you see on agent and brokerage websites.",
    body: `When you search for homes on a real estate agent's website, you're usually looking at an IDX feed — a live connection to the local MLS that pulls in property listings and displays them on the agent's site.

**How IDX works:**
- The local MLS provides an IDX data feed to participating brokers and agents
- Agents install IDX software (from vendors like iHomefinder, IDX Broker, or Showcase IDX) on their websites
- The software pulls listings from the MLS and displays them with search and filter tools
- Leads who search on the site can be captured for follow-up

**Why IDX matters for businesses selling to agents:** IDX is a major expense and technology decision for agents. Companies selling IDX solutions, website builders, or CRM tools with IDX integration need to reach agents directly. A verified agent email list lets IDX vendors market to the 1,100,000+ licensed agents who are potential customers.

**IDX vs VOW (Virtual Office Website):**
- IDX: Publicly accessible, shows listings to anyone visiting the site
- VOW: Requires user registration before displaying full listing data

**Changes ahead:** The NAR settlement is driving changes to how listing data is shared and displayed. IDX vendors and agents are adapting to new rules around commission transparency and data access.`,
    relatedTerms: ["mls", "brokerage", "crm-real-estate"],
    keywords: ["what is IDX", "IDX real estate", "Internet Data Exchange", "IDX explained", "IDX vs MLS"],
    relatedBlogSlugs: ["proptech-sales-sell-software-real-estate-agents", "best-crm-for-real-estate-agents"],
  },
  {
    slug: "nar",
    term: "NAR (National Association of Realtors)",
    title: "What Is NAR (National Association of Realtors)?",
    definition:
      "The National Association of Realtors (NAR) is the largest trade association in the United States, representing over 1.5 million real estate professionals. Only NAR members can use the trademarked title \"Realtor.\"",
    body: `NAR operates at the national level and works with state and local Realtor associations across the country. Membership is voluntary but widespread — most practicing agents join because MLS access often requires NAR membership.

**NAR's role in the industry:**
- Sets the Code of Ethics that Realtors must follow
- Lobbies for real estate industry interests at the federal level
- Oversees MLS standards through RESO (Real Estate Standards Organization)
- Provides education, certifications, and designations
- Publishes market research and housing statistics

**The NAR settlement (2024):** The Sitzer/Burnett lawsuit resulted in a $418 million settlement that changed how buyer agent commissions work. Sellers are no longer required to offer compensation to buyer's agents through the MLS, and buyers must sign written agreements with their agents before touring homes.

**Why this matters for agent outreach:** NAR membership data, combined with state licensing records, forms the backbone of agent contact databases. With 1.5 million+ members, NAR's membership directory is one of the largest sources of agent professional information. Our database pulls from state licensing authorities to ensure coverage of all licensed agents, not just NAR members.`,
    relatedTerms: ["mls", "realtor-vs-real-estate-agent", "brokerage"],
    keywords: ["what is NAR", "National Association of Realtors", "NAR explained", "NAR membership", "NAR settlement"],
    relatedBlogSlugs: ["real-estate-agent-email-list-all-states", "cold-outreach-realtors-compliance"],
  },
  {
    slug: "realtor-vs-real-estate-agent",
    term: "Realtor vs Real Estate Agent",
    title: "Realtor vs Real Estate Agent — What's the Difference?",
    definition:
      "A real estate agent is anyone licensed to help people buy or sell property. A Realtor is a real estate agent who is also a member of the National Association of Realtors (NAR). \"Realtor\" is a trademarked term — not all agents are Realtors.",
    body: `This distinction matters more than most people realize, especially when you're marketing to agents or buying contact data.

**Real Estate Agent:**
- Licensed by their state to practice real estate
- Must pass a state licensing exam
- Must complete continuing education to maintain their license
- Can work independently or under a broker
- There are roughly 2 million licensed agents in the US

**Realtor:**
- Everything above, plus NAR membership
- Subscribes to NAR's Code of Ethics
- Pays annual dues to local, state, and national associations
- Can use the "Realtor" trademark
- About 1.5 million of the 2 million agents are NAR members

**Why this matters for data buyers:** When you buy a real estate agent contact list, make sure you're getting all licensed agents — not just Realtors. Some data sources only pull from NAR membership directories, which misses hundreds of thousands of licensed agents who aren't NAR members. USAgentLeads sources from state licensing authorities, capturing all licensed agents regardless of NAR membership.

**Other titles you'll see:**
- **Broker:** An agent with additional licensing who can operate independently or manage other agents
- **Associate Broker:** A broker who works under another broker
- **Salesperson/Sales Agent:** An entry-level licensee who must work under a broker`,
    relatedTerms: ["nar", "brokerage", "mls"],
    keywords: ["realtor vs real estate agent", "difference between realtor and agent", "what is a realtor", "realtor meaning", "are all agents realtors"],
    relatedBlogSlugs: ["how-to-build-realtor-email-list", "real-estate-agent-email-list-all-states"],
  },
  {
    slug: "brokerage",
    term: "Real Estate Brokerage",
    title: "What Is a Real Estate Brokerage?",
    definition:
      "A real estate brokerage is a firm where licensed real estate agents work. Every agent must \"hang their license\" at a brokerage — they can't operate independently without a broker's license. Brokerages provide agents with support, training, and legal oversight.",
    body: `Brokerages range from large national franchises (Keller Williams, RE/MAX, Coldwell Banker) to independent local firms with a handful of agents.

**How brokerages work:**
- A licensed broker (the brokerage owner) holds the firm's license
- Individual agents work under the brokerage as independent contractors (not employees)
- The brokerage typically takes a split of each agent's commission
- Commission splits vary widely: 50/50, 70/30, 80/20, or 100% with a flat fee

**Major brokerage models:**
- **Traditional:** Higher splits but more support, training, and leads (Keller Williams, Coldwell Banker)
- **Discount/flat-fee:** 100% commission to agents who pay a monthly desk fee (eXp Realty, Real Broker)
- **Boutique:** Small local firms with personalized service and flexible terms

**Why brokerages care about agent data:** Brokerages are one of the biggest buyers of agent contact databases. They use the data for recruiting — reaching out to agents at competing firms to pitch them on switching. A brokerage that can consistently recruit productive agents grows faster than one that relies on walk-ins and referrals.

**Brokerage consolidation trend:** The industry is consolidating. Compass acquired several regional firms. eXp and Real Broker grew rapidly with remote-first, high-split models. This competition makes agent recruitment data more valuable than ever.`,
    relatedTerms: ["nar", "realtor-vs-real-estate-agent", "commission-split"],
    keywords: ["what is a real estate brokerage", "real estate brokerage explained", "how brokerages work", "real estate broker vs agent", "brokerage models"],
    relatedBlogSlugs: ["how-to-build-realtor-email-list", "real-estate-agent-email-list-all-states"],
  },
  {
    slug: "commission-split",
    term: "Commission Split",
    title: "What Is a Real Estate Commission Split?",
    definition:
      "A commission split is the division of a real estate transaction's commission between the brokerage and the individual agent. When an agent closes a deal, they don't keep the full commission — a portion goes to their brokerage.",
    body: `Commission splits are one of the most important factors agents consider when choosing a brokerage. They directly impact how much an agent takes home from each transaction.

**How commission splits work:**
1. A home sells and generates a commission (historically 5-6% of sale price, split between buyer's and seller's agents)
2. Each agent's share goes to their brokerage first
3. The brokerage takes its cut based on the split agreement
4. The agent receives the remainder

**Common split structures:**
- **Percentage split:** Agent keeps 70%, brokerage keeps 30% (varies widely)
- **Graduated split:** Starts at 60/40, improves as the agent hits production milestones
- **Cap model:** Brokerage takes a split until the agent hits a dollar cap (e.g., $16K/year), then the agent keeps 100%
- **Flat fee:** Agent pays a fixed monthly or per-transaction fee and keeps 100% of commissions

**Post-NAR settlement changes:** The 2024 settlement changed how buyer agent commissions work. Buyer agents can no longer rely on the MLS to guarantee their commission from the seller. This is pushing agents to be more selective about brokerages and more focused on their value proposition.

**Why this matters for businesses selling to agents:** Understanding commission pressure helps you position your product. Agents feeling squeezed on commissions are more receptive to tools that help them generate leads, close more deals, or reduce costs.`,
    relatedTerms: ["brokerage", "nar", "realtor-vs-real-estate-agent"],
    keywords: ["real estate commission split", "agent commission split explained", "how do commission splits work", "brokerage commission structure", "real estate agent pay"],
    relatedBlogSlugs: ["real-estate-marketing-strategies", "proptech-sales-sell-software-real-estate-agents"],
  },
  {
    slug: "crm-real-estate",
    term: "CRM (Real Estate)",
    title: "What Is a Real Estate CRM?",
    definition:
      "A real estate CRM (Customer Relationship Management) is software that helps agents manage their contacts, leads, and transactions. It's the central system agents use to track relationships and follow up with prospects.",
    body: `Real estate CRMs are one of the most competitive software categories in the industry. Dozens of products compete for agent adoption, making agent contact data essential for CRM vendors' sales teams.

**What a real estate CRM does:**
- Stores and organizes contact information for leads, clients, and referral partners
- Automates follow-up emails, texts, and task reminders
- Tracks where each lead is in the buying/selling process
- Integrates with MLS/IDX for property matching
- Provides reporting on pipeline and conversion rates

**Popular real estate CRMs:**
- Follow Up Boss
- kvCORE (Inside Real Estate)
- LionDesk
- Wise Agent
- Chime
- Sierra Interactive
- HubSpot (general-purpose, adapted for RE)

**Why CRM vendors buy agent data:** CRM companies need to reach agents to sell their software. The real estate CRM market is crowded, so vendors that can run targeted outbound campaigns to agents have an edge. A database of 1,100,000+ agent emails and phones lets a CRM sales team reach every potential customer in the US.

**How agents typically adopt CRMs:** Most agents choose a CRM based on their brokerage's recommendation, peer reviews, or direct outreach from vendors. Cold email introducing a CRM — especially with a free trial offer — is one of the highest-converting approaches for CRM sales teams.`,
    relatedTerms: ["idx", "mls", "brokerage"],
    keywords: ["real estate CRM", "what is a real estate CRM", "CRM for realtors", "best real estate CRM", "agent CRM software"],
    relatedBlogSlugs: ["best-crm-for-real-estate-agents", "import-real-estate-contacts-hubspot"],
  },
  {
    slug: "cold-email",
    term: "Cold Email (Real Estate Outreach)",
    title: "What Is Cold Email in Real Estate?",
    definition:
      "Cold email is the practice of sending unsolicited emails to prospects you have no prior relationship with. In the real estate industry, it's used by businesses to reach agents and by agents to reach potential clients.",
    body: `Cold email is one of the most cost-effective ways to reach real estate agents at scale. When done right, it generates meetings and sales at a fraction of the cost of paid advertising.

**Cold email for reaching agents:**
- SaaS companies pitching their tools to agents
- Coaches promoting programs and workshops
- Mortgage lenders introducing their services
- Brokerages recruiting agents

**What makes cold email work:**
- **Relevant subject line:** Agent-specific, not generic ("Quick question about your [State] practice")
- **Short first email:** 3-5 sentences max. State who you are, why you're reaching out, and one clear ask
- **Personalization at scale:** Use state, city, or agent name to make it feel relevant
- **Follow-up sequence:** 3-5 emails over 2-3 weeks. Most replies come on email 2 or 3
- **Clear unsubscribe:** Required by CAN-SPAM and builds trust

**CAN-SPAM compliance:**
- Include your physical business address
- Provide a clear opt-out mechanism
- Honor unsubscribe requests within 10 days
- Don't use deceptive subject lines
- Identify the message as an ad if applicable

**Tools commonly used:**
- Instantly, Smartlead, Lemlist (cold email platforms)
- Apollo, Outreach, Salesloft (sales engagement)
- Mailchimp, ActiveCampaign (for warmer sequences)

**How USAgentLeads fits in:** Our database provides the contact data you need to run cold email campaigns to agents. Buy a state pack for $99 or the full database for $399, import the CSV into your email tool, and start sending.`,
    relatedTerms: ["crm-real-estate", "can-spam"],
    keywords: ["cold email real estate agents", "cold email to realtors", "email outreach real estate", "how to cold email agents", "real estate cold email"],
    relatedBlogSlugs: ["real-estate-cold-email-templates", "cold-outreach-realtors-compliance"],
  },
  {
    slug: "can-spam",
    term: "CAN-SPAM Act",
    title: "What Is the CAN-SPAM Act?",
    definition:
      "The CAN-SPAM Act is a US federal law (2003) that sets rules for commercial email. It requires businesses to include opt-out mechanisms, physical addresses, and honest subject lines in marketing emails. Violations can result in fines up to $51,744 per email.",
    body: `If you're emailing real estate agents — or anyone — for commercial purposes, CAN-SPAM compliance is mandatory. The good news: following the rules is straightforward.

**CAN-SPAM requirements:**
1. **Don't use false header information** — Your "From," "To," and routing information must be accurate
2. **Don't use deceptive subject lines** — The subject must reflect the content of the email
3. **Identify the message as an ad** — If it's a commercial message, disclosure is required (though a brief, non-deceptive sales email often satisfies this implicitly)
4. **Include your physical address** — A valid postal address (PO boxes count)
5. **Tell recipients how to opt out** — Every email needs a clear unsubscribe mechanism
6. **Honor opt-outs promptly** — Process unsubscribe requests within 10 business days
7. **Monitor third parties** — You're responsible for emails sent on your behalf

**Common misconceptions:**
- "I need permission before emailing" — CAN-SPAM doesn't require prior consent for B2B emails. You can email business contacts as long as you comply with the rules above. (Note: GDPR is stricter if you're emailing EU contacts.)
- "Buying an email list is illegal" — Buying B2B contact data is legal. How you use it must comply with CAN-SPAM.
- "One violation means a lawsuit" — Enforcement is typically against repeat offenders or egregious spammers, but individual emails can technically carry penalties.

**Best practices when emailing agents from a purchased list:**
- Use a professional domain (not gmail.com)
- Warm up your sending domain before high-volume sends
- Keep unsubscribe rates low by sending relevant, useful content
- Remove bounced addresses promptly
- Don't email anyone who has unsubscribed`,
    relatedTerms: ["cold-email", "crm-real-estate"],
    keywords: ["CAN-SPAM Act", "CAN-SPAM compliance", "email marketing laws", "can you buy email lists legally", "CAN-SPAM requirements"],
    relatedBlogSlugs: ["cold-outreach-realtors-compliance", "real-estate-cold-email-templates"],
  },
  {
    slug: "real-estate-lead",
    term: "Real Estate Lead",
    title: "What Is a Real Estate Lead?",
    definition:
      "A real estate lead is a person who has shown interest in buying, selling, or renting property — or a contact who could potentially become a client. For businesses selling to agents, a \"lead\" is an agent who could become a customer.",
    body: `The term "lead" means different things depending on which side of the real estate industry you're on.

**For real estate agents, a lead is:**
- A homeowner thinking about selling
- A buyer looking for a property
- A renter searching for a new place
- A referral from a past client

**For businesses selling to agents, a lead is:**
- A licensed agent who might buy your software, coaching, or services
- A broker evaluating tools for their team
- An agent responding to your outreach

**Lead sources for agents:**
- Zillow, Realtor.com, Redfin (paid leads)
- Google/Facebook ads
- Open houses and networking
- Referrals and sphere of influence
- FSBO and expired listing prospecting

**Lead sources for businesses targeting agents:**
- Agent contact databases (like USAgentLeads)
- LinkedIn Sales Navigator
- Real estate conferences and trade shows
- Content marketing and SEO
- Referrals from existing agent customers

**Lead quality vs quantity:** In both contexts, quality matters more than quantity. A targeted list of 1,000 agents in your ideal customer profile converts better than blasting 100,000 random contacts. This is why per-state purchasing is valuable — you can focus outreach on markets where you have the strongest product-market fit.

**How USAgentLeads provides leads:** Our database gives you the raw contact data for licensed agents. It's up to you to turn contacts into leads through relevant outreach, and leads into customers through your sales process.`,
    relatedTerms: ["cold-email", "crm-real-estate", "mls"],
    keywords: ["real estate lead", "what is a real estate lead", "real estate lead generation", "agent leads", "how to get real estate leads"],
    relatedBlogSlugs: ["find-real-estate-agent-email-addresses", "real-estate-marketing-strategies"],
  },
  {
    slug: "email-list",
    term: "Email List (Real Estate)",
    title: "What Is a Real Estate Agent Email List?",
    definition:
      "A real estate agent email list is a compiled database of email addresses belonging to licensed real estate agents. These lists are used by businesses to run marketing campaigns, sales outreach, and recruitment efforts targeting agents.",
    body: `Agent email lists are one of the most direct channels for reaching real estate professionals. They're used by SaaS companies, coaches, mortgage lenders, and brokerages.

**What's typically in an agent email list:**
- Full name
- Professional email address
- Phone number (not always included)
- State or location
- Sometimes: brokerage name, license number, license status

**Where agent email lists come from:**
- **State licensing authorities** — The most reliable source. Each state maintains a public registry of licensed agents. USAgentLeads compiles from these sources.
- **MLS directories** — Limited access, usually restricted to other agents
- **NAR membership records** — Only covers NAR members (about 75% of agents)
- **Web scraping** — Agent websites, social profiles, and brokerage directories
- **Manual research** — Time-consuming but sometimes necessary for niche lists

**Buying vs building your own list:**

| Factor | Buying | Building |
|--------|--------|----------|
| Cost | $99-399 (USAgentLeads) | $1,000+ in labor/tools |
| Time | Instant | Days to weeks |
| Coverage | All 50 states | Limited to what you scrape |
| Accuracy | Verified against licensing data | Depends on sources |
| Maintenance | Re-purchase periodically | Ongoing scraping/cleaning |

**Quality indicators for a good email list:**
- Low bounce rate (under 5%)
- Sourced from authoritative records (state licensing)
- Includes multiple contact methods (email + phone)
- Recently verified or updated
- Transparent about data sources and methodology`,
    relatedTerms: ["cold-email", "can-spam", "real-estate-lead"],
    keywords: ["real estate agent email list", "realtor email list", "buy agent email list", "real estate email database", "agent mailing list"],
    relatedBlogSlugs: ["how-to-build-realtor-email-list", "real-estate-agent-mailing-list-guide"],
  },
  {
    slug: "csv",
    term: "CSV (Comma-Separated Values)",
    title: "What Is a CSV File in Real Estate Data?",
    definition:
      "A CSV (Comma-Separated Values) file is a plain text format for storing tabular data. It's the standard format for exchanging contact lists, agent databases, and lead data between different software tools.",
    body: `CSV is the universal data exchange format. Every CRM, email tool, and spreadsheet application can read and write CSV files, which makes it the default format for agent contact databases.

**What a CSV file looks like:**
\`\`\`
Full Name,Email,Phone,State
James Harrington,james@example.com,(305) 881-2244,Florida
Sarah Chen,sarah@example.com,(512) 447-9801,Texas
\`\`\`

**Why CSV is the standard for agent data:**
- Works with every tool: Excel, Google Sheets, HubSpot, Salesforce, Mailchimp, Instantly
- No proprietary software needed to open or edit
- Small file size — even 1,100,000+ records stay under 80MB
- Easy to filter, sort, and split by state or other fields

**How to use a CSV agent list:**
1. **Purchase and download** the CSV from USAgentLeads
2. **Open in Excel or Google Sheets** to preview and filter
3. **Import into your tool** — every CRM and email platform has CSV import
4. **Map the columns** — match Full Name, Email, Phone, State to your tool's fields
5. **Start your campaign** — segment by state, set up sequences, and send

**Common CSV issues and fixes:**
- **Encoding problems:** Open in UTF-8 if you see garbled characters
- **Phone formatting:** Some tools interpret phone numbers as math. Format the column as text before opening.
- **Duplicate removal:** Use your email tool's dedup feature or Excel's Remove Duplicates

**Alternatives to CSV:** Some providers use Excel (.xlsx), JSON, or API access. CSV remains the most portable and widely supported format.`,
    relatedTerms: ["email-list", "crm-real-estate"],
    keywords: ["CSV file", "CSV real estate data", "what is CSV", "CSV import CRM", "CSV contact list"],
    relatedBlogSlugs: ["realtor-database-download-guide", "import-real-estate-contacts-hubspot"],
  },
] as const

export function getTermBySlug(slug: string): GlossaryTerm | undefined {
  return GLOSSARY_TERMS.find((t) => t.slug === slug)
}
