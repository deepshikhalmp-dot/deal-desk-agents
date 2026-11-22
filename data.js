// Fake "enterprise systems" data for the Deal Desk demo
module.exports = {
  // ERP / Finance system (Pricing Agent)
  deals: {
    "ACME-Q4": { account: "Acme Retail", amount: 5000000, product: "Retail Cloud Suite", marginPct: 35 },
    "GLOBEX-Q4": { account: "Globex Corp", amount: 2000000, product: "Retail Cloud Suite", marginPct: 22 }
  },
  pricingRules: {
    maxDiscountPct: 15,        // rep can give up to 15% directly
    vpApprovalUpToPct: 25      // 15–25% needs VP approval, above 25% not allowed
  },

  // Credit bureau / AR system (Credit Agent)
  credit: {
    "Acme Retail": { latePayments24m: 0, avgDaysToPay: 28, riskScore: "LOW", creditLimit: 8000000, pan: "AAACA1234F" },
    "Globex Corp": { latePayments24m: 5, avgDaysToPay: 67, riskScore: "HIGH", creditLimit: 1000000, pan: "AAACG5678K" }
  },

  // Legal / CLM system (Contract Agent)
  contractTerms: {
    standard: "1-year term, Net 30 payment, standard SLA",
    extended: "3-year commitment, annual billing, price lock for 3 years",
    secured: "Advance payment of 50%, 1-year term, no credit extension"
  }
};
