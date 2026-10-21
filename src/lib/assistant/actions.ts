import States from "../../utilities/states.json";

/**
 * What the assistant is allowed to do, and where each one lives.
 *
 * THE BOUNDARY (PRD §13 — "the assistant proposes; a person disposes"):
 * an action may navigate, open a form and prefill it. An action may NEVER
 * submit. Every entry here stops at a filled-in form with the human's hand on
 * the button, which is also why a mis-parse shows up as a wrong field rather
 * than a wrong record. Anything that moves money is additionally marked
 * `sensitive` so the surrounding UI can say so out loud.
 *
 * Adding an action means: add it here, register a handler of the same id on the
 * screen that owns it (see useAssistantAction), and nothing else.
 */
export interface AssistantActionDef {
  id: string;
  label: string;
  /** Where the handler is registered. The runner routes here first. */
  route: string;
  /** Spoken back while the action runs. */
  say: string;
  /** Phrases that select this action, matched against the whole utterance. */
  match: RegExp;
  /** Pulls named params out of the utterance for prefill. */
  extract?: (utterance: string) => Record<string, string>;
  /** Touches money or access — surfaced in the UI as needing a closer look. */
  sensitive?: boolean;
}

const STATE_NAMES: string[] = (States as { name: string }[]).map((s) => s.name);

/**
 * Finds a Nigerian state named anywhere in the utterance, plus the LGA if one
 * of that state's own LGAs is also named. Longest-first so "Akwa Ibom" wins
 * over a shorter substring match.
 */
const extractPlace = (utterance: string): Record<string, string> => {
  const text = utterance.toLowerCase();
  const out: Record<string, string> = {};

  const state = [...STATE_NAMES]
    .sort((a, b) => b.length - a.length)
    .find((name) => text.includes(name.toLowerCase()));
  if (!state) return out;
  out.state = state;

  const lgas = (States as { name: string; lgas?: string[] }[]).find((s) => s.name === state)?.lgas ?? [];
  const lga = [...lgas].sort((a, b) => b.length - a.length).find((name) => text.includes(name.toLowerCase()));
  if (lga) out.lga = lga;

  return out;
};

/** Every state named in the utterance, in the order it appears. */
const statesInOrder = (utterance: string): string[] => {
  const text = utterance.toLowerCase();
  return STATE_NAMES.map((name) => ({ name, at: text.indexOf(name.toLowerCase()) }))
    .filter((hit) => hit.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((hit) => hit.name);
};

/** "Lagos to Abuja" / "from Kano to Kaduna" — first state named is the origin. */
const extractRoute = (utterance: string): Record<string, string> => {
  const [origin, destination] = statesInOrder(utterance);
  const out: Record<string, string> = {};
  if (origin) out.origin_state = origin;
  if (destination) out.destination_state = destination;
  return out;
};

/**
 * Email is unambiguous, so it is always taken. A name is only read from the
 * explicit "invite First Last" shape and must be capitalised — guessing names
 * out of loose prose produces confident nonsense in a field someone may not
 * re-read before inviting a stranger into their workspace.
 */
const extractInvite = (utterance: string): Record<string, string> => {
  const out: Record<string, string> = {};
  const email = utterance.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/);
  if (email) out.email = email[0];
  const name = utterance.match(/\binvite\s+([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/);
  if (name) {
    out.first_name = name[1];
    out.last_name = name[2];
  }
  return out;
};

/** Text after "in"/"at"/"on", used as a rough address when nothing better exists. */
const extractAddress = (utterance: string): Record<string, string> => {
  const m = utterance.match(/\b(?:at|on)\s+(.{3,80}?)(?:\s+in\b|[.,]|$)/i);
  return m ? { address: m[1].trim() } : {};
};

export const ASSISTANT_ACTIONS: AssistantActionDef[] = [
  {
    id: "branch.create",
    label: "Create a branch",
    route: "/branches",
    say: "Sure — let's get started by filling in the branch details.",
    match: /\b(create|add|new|open|set ?up|register)\b.{0,20}\bbranch\b|\bbranch\b.{0,20}\b(create|add|new)\b/i,
    extract: (u) => ({ ...extractPlace(u), ...extractAddress(u) }),
  },
  {
    id: "rate.create",
    label: "Add a region rate",
    route: "/rates",
    say: "Opening your region rates — I've started a new one for you.",
    match: /\b(create|add|new|set ?up)\b.{0,24}\b(rate|rates|pricing|price)\b|\b(rate|pricing)\b.{0,16}\b(create|add|new)\b/i,
    // No `extract`: RateModal has no prefill support yet, so there is nothing
    // to populate — and the runner only claims to have filled fields it passed.
    sensitive: true,
  },
  {
    id: "user.invite",
    label: "Invite a teammate",
    route: "/users",
    say: "Let's get them added — I've opened the invitation.",
    match: /\b(invite|add|onboard|create)\b.{0,24}\b(user|users|staff|teammate|team member|employee|colleague)\b|\binvite\b.{0,30}@/i,
    extract: extractInvite,
    // Grants access to the workspace, so it gets the same warning as money.
    sensitive: true,
  },
  {
    id: "route.create",
    label: "Add a pairing route",
    route: "/pairing-routes",
    say: "Opening the route form — I've set what I could from that.",
    match: /\b(create|add|new|set ?up|register)\b.{0,24}\b(route|routes|lane|pairing)\b|\b(route|lane)\b.{0,16}\b(create|add|new)\b/i,
    extract: extractRoute,
  },
  {
    id: "invoice.create",
    label: "Create an invoice",
    route: "/financials?tab=invoices",
    say: "Opening a new invoice for you.",
    match: /\b(create|add|new|raise|issue|send)\b.{0,20}\b(invoice|bill)\b|\b(invoice|bill)\b.{0,16}\b(create|add|new|raise)\b/i,
    // InvoiceModal builds line items from registered rates; nothing safe to
    // prefill from a sentence, so it opens empty rather than guessing amounts.
    sensitive: true,
  },
  {
    id: "split.create",
    label: "Create a payout split",
    route: "/financials?tab=split",
    say: "Taking you to payout splits — I've started a new arrangement.",
    match: /\b(create|add|new|set ?up)\b.{0,24}\b(split|splits|payout split|revenue share|arrangement)\b|\bsplit\b.{0,16}\b(create|add|new)\b/i,
    sensitive: true,
  },
];

export const findAction = (utterance: string) =>
  ASSISTANT_ACTIONS.find((action) => action.match.test(utterance));
