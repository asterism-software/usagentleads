import { describe, expect, it } from "vitest"
import { analyzeColdEmailCompliance } from "@/lib/tools/coldEmailComplianceChecker"

describe("analyzeColdEmailCompliance", () => {
  it("flags absent copy elements that need attention", () => {
    const result = analyzeColdEmailCompliance({
      subject: "",
      body: "Hello, we help agents save time.",
      footer: "",
    })

    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "subject-missing", status: "needs_attention" }),
        expect.objectContaining({ id: "postal-address-not-detected", status: "needs_attention" }),
        expect.objectContaining({ id: "opt-out-language-not-detected", status: "needs_attention" }),
      ])
    )
    expect(result.needsAttentionCount).toBeGreaterThanOrEqual(3)
  })

  it("detects common text-level review items without issuing a compliance verdict", () => {
    const result = analyzeColdEmailCompliance({
      subject: "A quick introduction from Acme",
      body: "This is a promotional email from Acme. We help real estate agents organize follow-up.",
      footer: "Acme Co.\n123 Main Street\nAustin, TX 78701\nUnsubscribe or manage email preferences.",
    })

    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "postal-address-detected", status: "detected" }),
        expect.objectContaining({ id: "opt-out-language-detected", status: "detected" }),
        expect.objectContaining({ id: "commercial-disclosure-detected", status: "detected" }),
        expect.objectContaining({ id: "headers-not-checked", status: "not_checked" }),
      ])
    )
    expect(result.findings.some((finding) => finding.title.toLowerCase().includes("compliant"))).toBe(false)
  })

  it("flags unresolved merge tags for final review", () => {
    const result = analyzeColdEmailCompliance({
      subject: "A note for {{first_name}}",
      body: "This is a promotional email.",
      footer: "Acme Co., P.O. Box 42, Austin, TX 78701. Unsubscribe.",
    })

    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "merge-tags-detected", status: "needs_attention" }),
      ])
    )
  })
})
