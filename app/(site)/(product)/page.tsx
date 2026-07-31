export const revalidate = 3600

import dynamic from "next/dynamic"
import { HeroSection } from "@/components/home/HeroSection"
import { TrustBar } from "@/components/home/TrustBar"
import { WhoIsThisFor } from "@/components/home/WhoIsThisFor"
import { HowItWorks } from "@/components/home/HowItWorks"
import { UseCases } from "@/components/home/UseCases"
import { PricingCards } from "@/components/home/PricingCards"
import { RecentOrders } from "@/components/home/RecentOrders"
import { RecentOrdersToast } from "@/components/home/RecentOrdersToast"
import { CompetitorComparison } from "@/components/home/CompetitorComparison"
import { LatestPosts } from "@/components/home/LatestPosts"
import { DataSources } from "@/components/home/DataSources"
import { StatsCTA } from "@/components/home/StatsCTA"
import { getDatabaseTotals, getStateCountMap } from "@/lib/supabase/server"
import { getAllPosts } from "@/lib/blog"
import { DATA_LAST_REFRESHED, SUPPORT_EMAIL } from "@/lib/utils/site"

// Below-the-fold client components — split into their own chunks so the initial
// page bundle stays small. SSR is preserved (default ssr: true).
const ApiSection = dynamic(() =>
  import("@/components/home/ApiSection").then(m => ({ default: m.ApiSection })),
)
const Testimonials = dynamic(() =>
  import("@/components/home/Testimonials").then(m => ({ default: m.Testimonials })),
)
const FAQSection = dynamic(() =>
  import("@/components/home/FAQSection").then(m => ({ default: m.FAQSection })),
)

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://www.usagentleads.com/#website",
  name: "USAgentLeads",
  url: "https://www.usagentleads.com",
  inLanguage: "en-US",
  description:
    `Verified real estate agent email list and contact database covering all 50 US states. 888,809+ realtor contacts with name, email, and phone — instant CSV download or REST API. Current dataset refreshed in ${DATA_LAST_REFRESHED}.`,
  publisher: {
    "@id": "https://www.usagentleads.com/#organization",
  },
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.usagentleads.com/#organization",
  name: "USAgentLeads",
  legalName: "USAgentLeads",
  url: "https://www.usagentleads.com",
  logo: {
    "@type": "ImageObject",
    url: "https://www.usagentleads.com/icon-512.png",
    width: 512,
    height: 512,
  },
  image: "https://www.usagentleads.com/opengraph-image",
  description:
    `USAgentLeads is a B2B data provider offering verified real estate agent email lists and realtor contact databases for all 50 US states. 888,809+ contacts with name, email, and phone. Current dataset refreshed in ${DATA_LAST_REFRESHED}.`,
  foundingDate: "2024",
  numberOfEmployees: {
    "@type": "QuantitativeValue",
    value: "1-10",
  },
  knowsAbout: [
    "Real estate agent databases",
    "Realtor email lists",
    "B2B real estate data",
    "Real estate lead generation",
    "Real estate marketing",
    "CRM data for real estate",
    "Real estate agent contact information",
    "MLS data",
    "Real estate cold outreach",
  ],
  areaServed: {
    "@type": "Country",
    name: "United States",
    sameAs: "https://en.wikipedia.org/wiki/United_States",
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: SUPPORT_EMAIL,
    contactType: "customer service",
    areaServed: "US",
    availableLanguage: "English",
  },
  makesOffer: [
    {
      "@type": "Offer",
      name: "State Pack",
      description: "Single state real estate agent email list CSV download",
      price: "49.00",
      priceCurrency: "USD",
      url: "https://www.usagentleads.com/states",
    },
    {
      "@type": "Offer",
      name: "Full Database",
      description: "All 50 states, 1.1M+ real estate agent contacts CSV download",
      price: "199.00",
      priceCurrency: "USD",
      url: "https://www.usagentleads.com/pricing",
    },
    {
      "@type": "Offer",
      name: "Pro Dashboard",
      description: "Searchable web interface to browse and filter 1.1M+ real estate agents",
      price: "49.00",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "49.00",
        priceCurrency: "USD",
        billingDuration: "P1M",
      },
      url: "https://www.usagentleads.com/pricing",
    },
    {
      "@type": "Offer",
      name: "Pro API",
      description: "REST API access to query 1.1M+ real estate agent contacts programmatically",
      price: "79.00",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "79.00",
        priceCurrency: "USD",
        billingDuration: "P1M",
      },
      url: "https://www.usagentleads.com/docs",
    },
  ],
}


export default async function Home() {
  const [{ count: totalCount, emails: totalEmails, phones: totalPhones }, countMap] = await Promise.all([
    getDatabaseTotals(),
    getStateCountMap(),
  ])
  const latestPosts = getAllPosts().slice(0, 3)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([websiteSchema, organizationSchema]),
        }}
      />
      <HeroSection totalCount={totalCount} countMap={countMap} />
      <TrustBar totalCount={totalCount} />
      <WhoIsThisFor />
      <HowItWorks />
      <UseCases />
      <PricingCards totalCount={totalCount} totalEmails={totalEmails} totalPhones={totalPhones} />
      <RecentOrders />
      <ApiSection />
      <CompetitorComparison />
      <Testimonials />
      <LatestPosts posts={latestPosts} />
      <DataSources />
      <StatsCTA />
      <FAQSection totalCount={totalCount} />
      <RecentOrdersToast />
    </>
  )
}
