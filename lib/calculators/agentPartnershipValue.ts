/**
 * A browser-only planning model for the value of a relationship-building
 * program with real estate agents. It intentionally does not model referral
 * fees, commissions, rebates, gifts, or any other consideration for a
 * referral.
 */
export interface AgentPartnershipValueInputs {
  /** Agents a business plans to approach or include in relationship marketing. */
  prospectiveAgents: number
  /** Share of prospective agents expected to make an introduction. */
  introductionRate: number
  /** Share of introductions expected to become qualified opportunities. */
  qualifiedOpportunityRate: number
  /** Share of qualified opportunities expected to become a win. */
  winRate: number
  /** User-estimated gross profit or contribution from one win. */
  grossProfitPerWin: number
  /** Total user-estimated cost of relationship marketing. */
  relationshipMarketingCost: number
}

export interface AgentPartnershipValueResults {
  prospectiveAgents: number
  introductions: number
  qualifiedOpportunities: number
  wins: number
  modeledContribution: number
  estimatedNetContribution: number
  /** Null when there is no non-zero cost basis to calculate ROI. */
  estimatedRoi: number | null
  /** Null when the model produces no wins. */
  estimatedCostPerWin: number | null
}

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

function wholeNumber(value: number): number {
  return Math.round(nonNegative(value))
}

function percentageAsFraction(value: number): number {
  return Math.min(100, nonNegative(value)) / 100
}

/**
 * Models a relationship funnel from visitor-provided assumptions. It supplies
 * no performance benchmarks and makes no prediction about future referrals,
 * revenue, or legal compliance.
 */
export function calculateAgentPartnershipValue(
  inputs: AgentPartnershipValueInputs
): AgentPartnershipValueResults {
  const prospectiveAgents = wholeNumber(inputs.prospectiveAgents)
  const introductionRate = percentageAsFraction(inputs.introductionRate)
  const qualifiedOpportunityRate = percentageAsFraction(inputs.qualifiedOpportunityRate)
  const winRate = percentageAsFraction(inputs.winRate)
  const grossProfitPerWin = nonNegative(inputs.grossProfitPerWin)
  const relationshipMarketingCost = nonNegative(inputs.relationshipMarketingCost)

  const introductions = prospectiveAgents * introductionRate
  const qualifiedOpportunities = introductions * qualifiedOpportunityRate
  const wins = qualifiedOpportunities * winRate
  const modeledContribution = wins * grossProfitPerWin
  const estimatedNetContribution = modeledContribution - relationshipMarketingCost
  const estimatedRoi =
    relationshipMarketingCost > 0
      ? (estimatedNetContribution / relationshipMarketingCost) * 100
      : null
  const estimatedCostPerWin = wins > 0 ? relationshipMarketingCost / wins : null

  return {
    prospectiveAgents,
    introductions,
    qualifiedOpportunities,
    wins,
    modeledContribution,
    estimatedNetContribution,
    estimatedRoi,
    estimatedCostPerWin,
  }
}
