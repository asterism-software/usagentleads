import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ScrollRevealProvider } from "@/components/layout/ScrollRevealProvider";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.usagentleads.com"),
  title: {
    default: `Real Estate Agent Email List — 1.1M+ US Realtor Contacts`,
    template: "%s | USAgentLeads",
  },
  description: `Buy a verified real estate agent email list for any US state. 1.1M+ realtor emails and phone numbers across all 50 states — instant CSV download from $49.`,
  icons: {
    icon: [{ url: "/icon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    locale: "en_US",
    type: "website",
    siteName: "USAgentLeads",
    title: `Real Estate Agent Email List — 1.1M+ US Realtor Contacts`,
    description: `Buy a verified real estate agent email list for any US state. 1.1M+ realtor emails and phone numbers across all 50 states — instant CSV download from $49.`,
    url: "https://www.usagentleads.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Real Estate Agent Email List — 1.1M+ US Realtor Contacts",
    description:
      "Buy a verified real estate agent email list for any US state. 1.1M+ realtor emails and phone numbers across all 50 states — instant CSV download from $49.",
    images: ["https://www.usagentleads.com/opengraph-image.png"],
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://www.usagentleads.com",
    languages: {
      "en-US": "https://www.usagentleads.com",
      "x-default": "https://www.usagentleads.com",
    },
    types: {
      "application/rss+xml": "https://www.usagentleads.com/blog/feed.xml",
    },
  },
  other: {
    "geo.region": "US",
    "geo.placename": "United States",
    "content-language": "en-US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-US"
      className={`${poppins.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased bg-page text-ink">
        <ScrollRevealProvider />
        {children}
        <Toaster />
        <GoogleAnalytics gaId="G-3KDWCR1X74" />
      </body>
    </html>
  );
}
