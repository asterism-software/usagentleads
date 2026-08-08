import { describe, expect, it } from "vitest"
import { calculateBrokerageRecruitingRoi } from "@/lib/calculators/brokerageRecruitingRoi"

describe("calculateBrokerageRecruitingRoi", () => {
  it("models retained recruits, company dollar, return, and payback from supplied assumptions", () => {
    const result = calculateBrokerageRecruitingRoi({
      recruitedAgents: 10,
      annualVolumePerAgent: 5_000_000,
      grossCommissionRate: 2.5,
      brokerageSplit: 20,
      retentionRate: 80,
      recruitingCost: 50_000,
    })

    expect(result).toMatchObject({
      recruitedAgents: 10,
      retainedRecruits: 8,
      grossCommissionIncomePerAgent: 125_000,
      companyDollarPerRetainedRecruit: 25_000,
      annualCompanyDollar: 200_000,
      costPerRetainedRecruit: 6_250,
      netContribution: 150_000,
      roiPercent: 300,
      paybackMonths: 3,
    })
  })

  it("keeps a zero-retention model finite and reports unavailable per-recruit cost and payback", () => {
    const result = calculateBrokerageRecruitingRoi({
      recruitedAgents: 6,
      annualVolumePerAgent: 3_000_000,
      grossCommissionRate: 2.5,
      brokerageSplit: 20,
      retentionRate: 0,
      recruitingCost: 12_000,
    })

    expect(result.retainedRecruits).toBe(0)
    expect(result.annualCompanyDollar).toBe(0)
    expect(result.costPerRetainedRecruit).toBeNull()
    expect(result.netContribution).toBe(-12_000)
    expect(result.roiPercent).toBe(-100)
    expect(result.paybackMonths).toBeNull()
  })

  it("returns no ROI or payback when no recruiting cost is supplied", () => {
    const result = calculateBrokerageRecruitingRoi({
      recruitedAgents: 4,
      annualVolumePerAgent: 2_000_000,
      grossCommissionRate: 3,
      brokerageSplit: 25,
      retentionRate: 75,
      recruitingCost: 0,
    })

    expect(result.retainedRecruits).toBe(3)
    expect(result.annualCompanyDollar).toBe(45_000)
    expect(result.costPerRetainedRecruit).toBe(0)
    expect(result.netContribution).toBe(45_000)
    expect(result.roiPercent).toBeNull()
    expect(result.paybackMonths).toBeNull()
  })

  it("clamps invalid negative and over-100 percentage inputs without NaN or infinity", () => {
    const result = calculateBrokerageRecruitingRoi({
      recruitedAgents: Number.NaN,
      annualVolumePerAgent: -1,
      grossCommissionRate: 150,
      brokerageSplit: Number.POSITIVE_INFINITY,
      retentionRate: -10,
      recruitingCost: Number.NaN,
    })

    expect(result).toMatchObject({
      recruitedAgents: 0,
      annualVolumePerAgent: 0,
      grossCommissionRate: 100,
      brokerageSplit: 0,
      retentionRate: 0,
      recruitingCost: 0,
      retainedRecruits: 0,
      annualCompanyDollar: 0,
      netContribution: 0,
      roiPercent: null,
      paybackMonths: null,
    })
  })
})
