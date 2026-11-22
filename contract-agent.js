// Contract Agent – pretends to be the Legal / Contract Lifecycle Management (CLM) system
const { deals, credit, pricingRules, contractTerms } = require("./data.js");

const rupees = n => "₹" + n.toLocaleString("en-IN");

function handle(question) {
  const text = question.toUpperCase();

  // 1. Find the deal
  const dealId = Object.keys(deals).find(id => text.includes(id));
  if (!dealId) {
    return `I need a deal ID to draft a contract. Known deals: ${Object.keys(deals).join(", ")}.`;
  }
  const deal = deals[dealId];

  // 2. Discount (0% if not mentioned) – legal will not draft above policy maximum
  const match = text.match(/(\d+(\.\d+)?)\s*%/);
  const discount = match ? parseFloat(match[1]) : 0;
  if (discount > pricingRules.vpApprovalUpToPct) {
    return `CANNOT DRAFT. ${dealId}: ${discount}% discount exceeds the ${pricingRules.vpApprovalUpToPct}% policy maximum. Please revise the discount.`;
  }

  // 3. Pick the contract template
  const riskyByRequest = /SECURED|ADVANCE|HIGH RISK/.test(text);          // caller asked for secured terms
  const riskyByRecord = credit[deal.account]?.riskScore === "HIGH";       // CLM's own counterparty risk flag
  let template, reason;
  if (riskyByRecord) {
    template = "secured";
    reason = "customer is flagged high credit risk";
  } else if (riskyByRequest) {
    template = "secured";
    reason = "secured terms were requested";
  } else if (discount > pricingRules.maxDiscountPct) {
    template = "extended";
    reason = `discount above ${pricingRules.maxDiscountPct}% is offset by a longer commitment`;
  } else {
    template = "standard";
    reason = "discount within standard limits";
  }

  // 4. Build the draft
  const finalPrice = Math.round(deal.amount * (100 - discount) / 100);
  const draftId = `CTR-${dealId}-${discount}`;
  return `CONTRACT DRAFT ${draftId} for ${dealId} (${deal.account}). Template: ${template.toUpperCase()}. Price: ${rupees(deal.amount)} less ${discount}% = ${rupees(finalPrice)}. Terms: ${contractTerms[template]}. Reason: ${reason}.`;
}

module.exports = {
  name: "Contract Agent",
  description: "Drafts contract terms for a deal from the Legal / CLM system, choosing standard, extended (3-year) or secured (advance payment) templates.",
  path: "/contract",
  skills: [{
    id: "contract_draft",
    name: "Draft contract terms",
    description: "Draft a contract for deal Y with X% discount. Returns draft ID, template, final price, terms and reason.",
    tags: ["contract", "legal", "terms", "deal desk"],
    examples: ["Draft contract for ACME-Q4 with 20% discount"]
  }],
  handle
};
