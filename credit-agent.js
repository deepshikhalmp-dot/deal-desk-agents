// Credit Agent – pretends to be the credit bureau / Accounts Receivable system
const { credit, deals } = require("./data.js");

const rupees = n => "₹" + n.toLocaleString("en-IN");

function handle(question) {
  const text = question.toUpperCase();

  // 1. Find the customer: by name, or via a deal ID
  const dealId = Object.keys(deals).find(id => text.includes(id));
  let account = Object.keys(credit).find(name => text.includes(name.toUpperCase()));
  if (!account && dealId) account = deals[dealId].account;
  if (!account) {
    return `I could not find a customer in your request. Known customers: ${Object.keys(credit).join(", ")}.`;
  }
  const c = credit[account];

  // 2. Payment history summary (PAN included on purpose – Governance will mask it)
  let answer = `${account} – credit risk ${c.riskScore}. ${c.latePayments24m} late payments in last 24 months, pays in ${c.avgDaysToPay} days on average. Credit limit ${rupees(c.creditLimit)}. Customer PAN: ${c.pan}.`;

  // 3. Compare deal amount with credit limit
  const deal = dealId ? deals[dealId] : Object.values(deals).find(d => d.account === account);
  const overLimit = deal && deal.amount > c.creditLimit;
  if (deal) {
    answer += overLimit
      ? ` Deal amount ${rupees(deal.amount)} EXCEEDS the credit limit.`
      : ` Deal amount ${rupees(deal.amount)} is within the credit limit.`;
  }

  // 4. Recommendation
  if (c.riskScore === "HIGH" || overLimit) {
    answer += " RECOMMENDATION: Do not extend credit – use secured terms (advance payment).";
  } else {
    answer += " RECOMMENDATION: Credit approved – standard payment terms are fine.";
  }
  return answer;
}

module.exports = {
  name: "Credit Agent",
  description: "Checks a customer's payment history, credit risk and credit limit from the credit bureau / AR system and recommends payment terms.",
  path: "/credit",
  skills: [{
    id: "credit_check",
    name: "Customer credit check",
    description: "Is customer X (or the customer on deal Y) creditworthy? Returns risk score, payment history, limit check and recommendation.",
    tags: ["credit", "risk", "payment history", "deal desk"],
    examples: ["Check credit for Acme Retail", "Credit check for GLOBEX-Q4"]
  }],
  handle
};
