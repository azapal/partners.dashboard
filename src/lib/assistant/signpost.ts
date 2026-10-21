/**
 * Where a question gets answered today.
 *
 * Used when no action matches: rather than dead-ending on "I can't do that",
 * the assistant points at the screen that already holds the answer. This is
 * keyword routing, not comprehension, and it is written to never read as
 * though the question was understood — it offers a destination, not an answer.
 */
export interface Signpost {
  label: string;
  to: string;
}

export const signpostFor = (question: string): Signpost[] => {
  const q = question.toLowerCase();
  const hits: Signpost[] = [];
  const add = (label: string, to: string) => {
    if (!hits.some((h) => h.to === to)) hits.push({ label, to });
  };

  // A quote is a customer asking for a price, which lives on its own page; the
  // partner's own pricing is the rate cards. A question about both gets both.
  if (/quote|lead|enquir/.test(q)) add("Quote page", "/quote-page");
  if (/rate|price|pricing|cost|charge/.test(q)) add("Rates & rate cards", "/rates");
  // "how much did Ikeja take yesterday" is the PRD's own daily-brief example;
  // until that brief exists it is a performance-and-wallet question.
  if (/how much|revenue|earn|took|take|turnover|income|made/.test(q)) {
    add("Monthly performance", "/dashboard/performance");
    add("Wallet", "/financials?tab=wallet");
  }
  if (/split|share|stakeholder|payout|settle/.test(q)) add("Payout splits", "/financials?tab=split");
  if (/invoice|bill|payment|paid|credit|reconcil/.test(q)) add("Invoices", "/financials?tab=invoices");
  if (/wallet|balance|fund/.test(q)) add("Wallet", "/financials?tab=wallet");
  if (/order|deliver|dispatch|rider|driver/.test(q)) add("Orders & dispatch", "/transactions");
  if (/branch|location|office/.test(q)) add("Branches", "/branches");
  if (/staff|team|user|role|permission|invite/.test(q)) add("Team & roles", "/users");
  if (/route|pairing|lane/.test(q)) add("Pairing routes", "/pairing-routes");
  if (/network|marketplace|partner|logn|storefront/.test(q)) add("Marketplace", "/marketplace");
  if (/brief|tender|rfq|outsource/.test(q)) add("Job briefs", "/job-briefs");
  if (/activity|audit|log|session/.test(q)) add("Activity & sessions", "/activity-log");
  if (/2fa|two.factor|security|password/.test(q)) add("Security", "/settings?tab=security");

  return hits.slice(0, 3);
};
