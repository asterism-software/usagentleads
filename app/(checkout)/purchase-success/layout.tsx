import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Purchase Confirmed",
  robots: { index: false, follow: false },
}

export default function PurchaseSuccessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
