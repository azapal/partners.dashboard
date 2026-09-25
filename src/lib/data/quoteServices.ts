/**
 * What a quote page can offer.
 *
 * Every service comes from the admin's catalog: the partner ticks the ones they
 * offer (the Services screen), and writes the questions customers answer for
 * each one. Nothing is built in, and nothing is priced here — the partner reads
 * the answers and quotes back. The server lists what a page may offer as
 * `available_services`.
 */

/** A catalog service's key (Service.key on the backend). */
export type QuoteServiceId = string;

/** The icon a service shows on the page. The catalog carries no icon of its own. */
export const serviceIcon = (_id: QuoteServiceId) => "ri-price-tag-3-line";

/** The default question a form closes with, when the partner hasn't worded their own. */
export const DEFAULT_PROMPT = "Anything else we should know?";

/**
 * What a partner can ask about a job — the same kinds of field the admin's
 * service builder offers. Mirrors QUESTION_TYPES in quote_page.py.
 */
export type QuoteQuestionType =
  | "text"
  | "long_text"
  | "number"
  | "date"
  | "email"
  | "phone"
  | "link"
  | "select"
  | "multi_select"
  | "boolean";

export const QUESTION_TYPES: { id: QuoteQuestionType; label: string; icon: string }[] = [
  { id: "text", label: "Short answer", icon: "ri-text" },
  { id: "long_text", label: "Long answer", icon: "ri-align-left" },
  { id: "number", label: "Number", icon: "ri-hashtag" },
  { id: "date", label: "Date", icon: "ri-calendar-line" },
  { id: "email", label: "Email", icon: "ri-mail-line" },
  { id: "phone", label: "Phone", icon: "ri-phone-line" },
  { id: "link", label: "Link", icon: "ri-link" },
  { id: "select", label: "Dropdown (pick one)", icon: "ri-arrow-down-s-line" },
  { id: "multi_select", label: "Checkboxes (pick many)", icon: "ri-checkbox-multiple-line" },
  { id: "boolean", label: "Yes / no", icon: "ri-toggle-line" },
];

/** Types answered by picking from the question's own answers. */
export const CHOICE_QUESTION_TYPES: QuoteQuestionType[] = ["select", "multi_select"];

/** Types that show a hint inside the empty field. */
export const PLACEHOLDER_TYPES: QuoteQuestionType[] = ["text", "long_text", "number", "email", "phone", "link", "select"];

/** The rules a question can carry. Mirrors QUESTION_RULES in quote_page.py. */
export interface QuoteQuestionRules {
  min_length?: number;
  max_length?: number;
  min?: number;
  max?: number;
  /** A date: today or later. */
  not_past?: boolean;
}

export interface QuoteQuestion {
  /** What the customer's answer is sent under — never shown. */
  id: string;
  label: string;
  type: QuoteQuestionType;
  required: boolean;
  /** Hint shown inside the empty field. */
  placeholder?: string;
  validation?: QuoteQuestionRules;
  /** The answers a choice offers. */
  options?: string[];
}

export const questionTypeLabel = (type: QuoteQuestionType) => QUESTION_TYPES.find((t) => t.id === type)?.label ?? type;

export const newQuestionId = () => `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
