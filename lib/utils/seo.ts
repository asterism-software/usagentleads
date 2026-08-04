import type { Metadata } from "next"
import type { USState } from "@/types"
import type { BlogPost } from "@/types/blog"
import { CURRENT_YEAR, formatAgentCount } from "@/lib/utils/states"
import { SITE_URL } from "@/lib/utils/site"

const BASE_URL = SITE_URL

function trimDescription(text: string, limit = 155): string {
  if (text.length <= limit) return text
  return text.slice(0, text.lastIndexOf(" ", limit)) + "…"
}

export function generateStateMetadata(state: USState, cities?: string[]): Metadata {
  const count = state.agentCount.toLocaleString()
  const shortCount = formatAgentCount(state.agentCount)
  const cityText = cities?.length ? ` Covers ${cities.slice(0, 2).join(", ")} and more.` : ""
  const title = `${state.name} Realtor Email List & Real Estate Database (${CURRENT_YEAR})`
  const rawDesc = `Download the ${state.name} realtor email list & real estate agent database — ${count}+ verified agent emails and phone numbers. Complete list of ${state.name} real estate agents, instant CSV, $49.${cityText}`
  return {
    title: { absolute: title },
    description: trimDescription(rawDesc),
    alternates: {
      canonical: `${BASE_URL}/states/${state.slug}`,
      languages: {
        "en-US": `${BASE_URL}/states/${state.slug}`,
        "x-default": `${BASE_URL}/states/${state.slug}`,
      },
    },
    other: {
      "geo.region": `US-${state.code}`,
      "geo.placename": state.name,
      "content-language": "en-US",
    },
    openGraph: {
      locale: "en_US",
      title,
      description: trimDescription(rawDesc),
      url: `${BASE_URL}/states/${state.slug}`,
      type: "website",
      // Omit images here so Next uses the per-state opengraph-image.tsx
      // (shows the state name + agent count) instead of the generic brand image.
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: trimDescription(rawDesc),
      // Omit images here so the per-state twitter-image.tsx is used.
    },
  }
}

export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function generateProductSchema(state: USState, liveCount?: number) {
  const count = (liveCount ?? state.agentCount).toLocaleString()
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${state.name} Realtor Email List & Contact Database ${CURRENT_YEAR}`,
    description: `Verified database of ${count}+ ${state.name} real estate agent emails and phone numbers. Download the complete realtor email list.`,
    image: "https://www.usagentleads.com/opengraph-image",
    brand: {
      "@type": "Brand",
      name: "USAgentLeads",
    },
    offers: {
      "@type": "Offer",
      price: "49.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `https://www.usagentleads.com/states/${state.slug}`,
      priceValidUntil: "2027-12-31",
      seller: {
        "@type": "Organization",
        name: "USAgentLeads",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "USD",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "US",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: "0",
            maxValue: "0",
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: "0",
            maxValue: "0",
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "US",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 30,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
  }
}

export function generateDatasetSchema(state: USState, liveCount?: number) {
  const count = (liveCount ?? state.agentCount).toLocaleString()
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${state.name} Real Estate Agent Email Database`,
    description: `Verified email database of ${count}+ licensed realtors in ${state.name}. Includes name, email address, and phone number for each agent.`,
    url: `${BASE_URL}/states/${state.slug}`,
    creator: {
      "@type": "Organization",
      name: "USAgentLeads",
      url: BASE_URL,
    },
    spatialCoverage: {
      "@type": "Place",
      name: state.name,
      geo: {
        "@type": "GeoShape",
        addressCountry: "US",
      },
    },
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "text/csv",
      contentUrl: `${BASE_URL}/states/${state.slug}`,
    },
    variableMeasured: ["Full Name", "Email Address", "Phone Number", "State"],
    keywords: [
      `${state.name.toLowerCase()} realtor email list`,
      `${state.name.toLowerCase()} real estate agent database`,
      `${state.name.toLowerCase()} agent contacts`,
    ],
    offers: {
      "@type": "Offer",
      price: "49.00",
      priceCurrency: "USD",
    },
  }
}

export function generateFAQSchema(
  items: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }
}

export function generateArticleSchema(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: `${BASE_URL}/blog/${post.slug}/opengraph-image`,
    datePublished: post.date,
    dateModified: post.updatedAt || post.date,
    author: {
      "@type": "Person",
      name: post.author,
      url: `${BASE_URL}/blog/author/${post.author.toLowerCase().replace(/\s+/g, "-")}`,
    },
    publisher: {
      "@type": "Organization",
      name: "USAgentLeads",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/icon.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/blog/${post.slug}`,
    },
  }
}
