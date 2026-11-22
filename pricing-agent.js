// Pricing Agent – pretends to be the ERP / Finance system
const { deals, pricingRules } = require("./data.js");

const rupees = n => "₹" + n.toLocaleString("en-IN");

function handle(question) {
  const text = question.toUpperCase();

  // 1. Find which deal is being asked about
  const dealId = Object.keys(deals).find(id => text.includes(id));
  if (!dealId) {
    return `I could not find a deal ID in your request. Known deals: ${Object.keys(deals).join(", ")}.`;
  }
  const deal = deals[dealId];

  // 2. Find the discount % asked for
  const match = text.match(/(\d+(\.\d+)?)\s*%/);
  if (!match) {
    return `${dealId} (${deal.account}): amount ${rupees(deal.amount)}, margin ${deal.marginPct}%. Reps can give up to ${pricingRules.maxDiscountPct}% without approval.`;
  }
  const discount = parseFloat(match[1]);

  // 3. Calculate impact
  const discountValue = Math.round(deal.amount * discount / 100);
  const newMargin = ((deal.marginPct - discount) / (100 - discount) * 100).toFixed(1);
  const summary = `${dealId} (${deal.account}): ${discount}% discount = ${rupees(discountValue)} off ${rupees(deal.amount)}. Margin drops from ${deal.marginPct}% to ${newMargin}%.`;

  // 4. Apply company policy
  if (discount <= pricingRules.maxDiscountPct) {
    return `APPROVED. ${summary} Within the ${pricingRules.maxDiscountPct}% rep limit.`;
  }
  if (discount <= pricingRules.vpApprovalUpToPct) {
    return `VP APPROVAL REQUIRED. ${summary} Above the ${pricingRules.maxDiscountPct}% rep limit; VP can approve up to ${pricingRules.vpApprovalUpToPct}%.`;
  }
  return `NOT ALLOWED. ${summary} Exceeds the maximum ${pricingRules.vpApprovalUpToPct}% discount policy.`;
}

module.exports = {
  name: "Pricing Agent",
  description: "Checks a requested discount against margin rules in the ERP and says if it is approved, needs VP approval, or is not allowed.",
  path: "/pricing",
  skills: [{
    id: "discount_check",
    name: "Discount check",
    description: "Is X% discount allowed on deal Y? Returns decision, discount value and margin impact.",
    tags: ["pricing", "discount", "margin", "deal desk"],
    examples: ["Can ACME-Q4 get 20% discount?"]
  }],
  handle
};
