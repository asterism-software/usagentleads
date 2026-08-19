import { describe, expect, it } from "vitest"
import {
  confirmSignupTemplate,
  contactNotificationTemplate,
  downloadReadyTemplate,
  freeSampleTemplate,
  magicLinkTemplate,
  milestoneAnnouncementTemplate,
  nurtureFinalTemplate,
  nurtureImportTemplate,
  nurtureQualityTemplate,
  paymentFailedTemplate,
  subscriptionCancelledTemplate,
  subscriptionRenewedTemplate,
  subscriptionWelcomeTemplate,
  type EmailTemplate,
  type MarketingEmailOptions,
} from "@/lib/resend/email-templates"

const marketing: MarketingEmailOptions = {
  unsubscribeUrl: "https://www.usagentleads.com/api/unsubscribe?e=test&t=token",
  postalAddress: "123 Test Street, Test City, TS 00000",
  reason: "You requested a free sample from USAgentLeads.",
}

const templates: Array<[string, EmailTemplate]> = [
  ["magic link", magicLinkTemplate({ confirmationUrl: "https://www.usagentleads.com/auth/confirm?token=test" })],
  ["signup confirmation", confirmSignupTemplate({ confirmationUrl: "https://www.usagentleads.com/auth/confirm?token=test" })],
  ["download ready", downloadReadyTemplate({ downloadUrl: "https://www.usagentleads.com/api/download?token=test", productName: "Full USA", purchaseType: "full_database" })],
  ["subscription welcome", subscriptionWelcomeTemplate({ planName: "Pro API", countLabel: "1.1M+" })],
  ["subscription cancelled", subscriptionCancelledTemplate({ accessUntil: "2026-09-30T00:00:00.000Z" })],
  ["subscription renewed", subscriptionRenewedTemplate({ nextRenewal: "2026-09-30T00:00:00.000Z" })],
  ["support notification", contactNotificationTemplate({ name: "Preview contact", email: "preview@example.com", subject: "Data question", message: "Please send more information." })],
  ["free sample", freeSampleTemplate({ downloadUrl: "https://www.usagentleads.com/sample.csv", countLabel: "1.1M+" })],
  ["nurture import", nurtureImportTemplate({ countLabel: "1.1M+", marketing })],
  ["nurture quality", nurtureQualityTemplate({ marketing })],
  ["nurture final", nurtureFinalTemplate({ countLabel: "1.1M+", coupon: { code: "PREVIEW10", label: "$10 off a state pack", expiresAt: "2026-09-30T00:00:00.000Z" }, marketing })],
  ["payment failed", paymentFailedTemplate({ planName: "Pro Dashboard" })],
  ["milestone announcement", milestoneAnnouncementTemplate({ marketing })],
]

describe("unified email templates", () => {
  it.each(templates)("renders %s with the shared landing-page design system", (_name, template) => {
    expect(template.subject.length).toBeGreaterThan(5)
    expect(template.text.length).toBeGreaterThan(40)
    expect(template.html).toContain("<!doctype html>")
    expect(template.html).toContain("USAgentLeads")
    expect(template.html).toContain(
      'src="https://www.usagentleads.com/icon-192.png"'
    )
    expect(template.html).not.toContain(">US</td>")
    expect(template.html).toContain("#F8F9FB")
    expect(template.html).toContain("#1D4ED8")
    expect(template.html).toContain("#0F1623")
    expect(template.html).toContain("Poppins,Arial,sans-serif")
    expect(template.html).toContain("role=\"presentation\"")
    expect(template.html).toContain("display:none;max-height:0")
    expect(Buffer.byteLength(template.html, "utf8")).toBeLessThan(50_000)
  })

  it("includes complete promotional disclosure and opt-out details", () => {
    for (const [, template] of templates.filter(([name]) => name.startsWith("nurture") || name === "milestone announcement")) {
      expect(template.html).toContain("Advertisement")
      expect(template.html).toContain(marketing.postalAddress)
      expect(template.html).toContain(marketing.unsubscribeUrl.replace(/&/g, "&amp;"))
      expect(template.text).toContain(marketing.postalAddress)
      expect(template.text).toContain(`Unsubscribe: ${marketing.unsubscribeUrl}`)
    }
  })

  it("escapes untrusted support-form content", () => {
    const template = contactNotificationTemplate({
      name: '<img src=x onerror="alert(1)">',
      email: "preview@example.com",
      subject: "<script>alert(1)</script>",
      message: "<b>not trusted markup</b>",
    })

    expect(template.html).not.toContain("<script>")
    expect(template.html).not.toContain("<img src=x")
    expect(template.html).not.toContain("<b>not trusted")
    expect(template.html).toContain("&lt;script&gt;")
    expect(template.html).toContain("&lt;b&gt;not trusted markup&lt;/b&gt;")
  })
})
