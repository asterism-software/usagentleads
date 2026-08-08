export interface BrokerageRecruitingRoiInputs {
  /** Number of agents the brokerage expects to recruit. */
  recruitedAgents: number
  /** Annual closed sales volume expected from one recruited agent. */
  annualVolumePerAgent: number
  /** Gross commission rate expressed as a percentage, for example 2.5. */
  grossCommissionRate: number
  /** Brokerage share of gross commission expressed as a percentage, for example 20. */
  brokerageSplit: number
  /** Share of recruited agents expected to remain through the modeled year, as a percentage. */
  retentionRate: number
  /** Total cost to recruit the cohort, including recruiting spend and team time if desired. */
  recruitingCost: number
}

export interface BrokerageRecruitingRoiResults {
  recruitedAgents: number
  retainedRecruits: number
  annualVolumePerAgent: number
  grossCommissionRate: number
  brokerageSplit: number
  retentionRate: number
  recruitingCost: number
  grossCommissionIncomePerAgent: number
  companyDollarPerRetainedRecruit: number
  annualCompanyDollar: number
  costPerRetainedRecruit: number | null
  netContribution: number
  roiPercent: number | null
  paybackMonths: number | null
}

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

function wholeNumber(value: number): number {
  return Math.round(nonNegative(value))
}

function percentage(value: number): number {
  return Math.min(100, nonNegative(value))
}

/**
 * Estimates annual brokerage company dollar from the retained portion of a
 * recruited cohort. It deliberately uses only visitor-entered assumptions and
 * does not supply performance or retention benchmarks.
 */
export function calculateBrokerageRecruitingRoi(
  inputs: BrokerageRecruitingRoiInputs
): BrokerageRecruitingRoiResults {
  const recruitedAgents = wholeNumber(inputs.recruitedAgents)
  const annualVolumePerAgent = nonNegative(inputs.annualVolumePerAgent)
  const grossCommissionRate = percentage(inputs.grossCommissionRate)
  const brokerageSplit = percentage(inputs.brokerageSplit)
  const retentionRate = percentage(inputs.retentionRate)
  const recruitingCost = nonNegative(inputs.recruitingCost)

  const retainedRecruits = recruitedAgents * (retentionRate / 100)
  const grossCommissionIncomePerAgent = annualVolumePerAgent * (grossCommissionRate / 100)
  const companyDollarPerRetainedRecruit = grossCommissionIncomePerAgent * (brokerageSplit / 100)
  const annualCompanyDollar = retainedRecruits * companyDollarPerRetainedRecruit
  const costPerRetainedRecruit = retainedRecruits > 0 ? recruitingCost / retainedRecruits : null
  const netContribution = annualCompanyDollar - recruitingCost
  const roiPercent = recruitingCost > 0 ? (netContribution / recruitingCost) * 100 : null
  const paybackMonths =
    recruitingCost > 0 && annualCompanyDollar > 0
      ? recruitingCost / (annualCompanyDollar / 12)
      : null

  return {
    recruitedAgents,
    retainedRecruits,
    annualVolumePerAgent,
    grossCommissionRate,
    brokerageSplit,
    retentionRate,
    recruitingCost,
    grossCommissionIncomePerAgent,
    companyDollarPerRetainedRecruit,
    annualCompanyDollar,
    costPerRetainedRecruit,
    netContribution,
    roiPercent,
    paybackMonths,
  }
}
