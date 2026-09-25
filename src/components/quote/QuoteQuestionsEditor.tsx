import { useState } from "react";
import {
  CHOICE_QUESTION_TYPES,
  PLACEHOLDER_TYPES,
  QUESTION_TYPES,
  newQuestionId,
  questionTypeLabel,
  type QuoteQuestion,
  type QuoteQuestionRules,
  type QuoteQuestionType,
} from "../../lib/data/quoteServices";

/**
 * The quote form a partner builds for one service — the questions a customer
 * answers before the partner prices the job. Built here, per service, rather
 * than handed down by Azapal: what to ask is the partner's call.
 *
 * Each question is a card that opens to edit — wording, type, hint, required,
 * the rules its type supports, and the answers a choice offers — the same way
 * the admin portal builds a service's setup questions. Changes join the page's
 * draft and go up with Save; the preview beside it shows the form live.
 */

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-orange-50";
const labelClass = "mb-1 block text-[11px] font-medium text-gray-500";
const iconButton =
  "flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:pointer-events-none disabled:opacity-30";

const numberOrUndefined = (raw: string) => (raw.trim() === "" || Number.isNaN(Number(raw)) ? undefined : Number(raw));

/** What stops one question being saved, in the words the card shows. */
export const questionProblems = (q: QuoteQuestion): string[] => {
  const problems: string[] = [];
  if (!q.label.trim()) problems.push("Word the question.");
  if (CHOICE_QUESTION_TYPES.includes(q.type) && !(q.options ?? []).some((o) => o.trim()))
    problems.push("Add at least one answer to pick from.");
  const v = q.validation ?? {};
  if (v.min !== undefined && v.max !== undefined && v.min > v.max) problems.push("The minimum is more than the maximum.");
  if (v.min_length !== undefined && v.max_length !== undefined && v.min_length > v.max_length)
    problems.push("The shortest answer is longer than the longest.");
  return problems;
};

/** Why a service's questions can't be saved yet, or null when they can. */
export const questionsProblem = (questions: QuoteQuestion[]) => {
  const index = questions.findIndex((q) => questionProblems(q).length > 0);
  if (index < 0) return null;
  const q = questions[index];
  return `${q.label.trim() || `Question ${index + 1}`}: ${questionProblems(q)[0].toLowerCase()}`;
};

const QuestionCard = ({
  question: q,
  index,
  count,
  expanded,
  onToggle,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
}: {
  question: QuoteQuestion;
  index: number;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<QuoteQuestion>) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) => {
  const problems = questionProblems(q);
  const isChoice = CHOICE_QUESTION_TYPES.includes(q.type);
  const rules = q.validation ?? {};
  const options = q.options ?? [];

  const setRules = (patch: QuoteQuestionRules) => {
    const next: Record<string, unknown> = { ...rules, ...patch };
    Object.keys(next).forEach((k) => (next[k] === undefined || next[k] === false) && delete next[k]);
    onChange({ validation: Object.keys(next).length ? (next as QuoteQuestionRules) : undefined });
  };

  const setType = (type: QuoteQuestionType) =>
    // Rules and answers belong to a type; carried over, they'd only come back to
    // life if the type were switched back.
    onChange({
      type,
      validation: undefined,
      options: CHOICE_QUESTION_TYPES.includes(type) ? (options.length ? options : [""]) : undefined,
      placeholder: PLACEHOLDER_TYPES.includes(type) ? q.placeholder : undefined,
    });

  const setOption = (i: number, value: string) => onChange({ options: options.map((o, idx) => (idx === i ? value : o)) });
  const moveOption = (i: number, direction: -1 | 1) => {
    const next = [...options];
    [next[i], next[i + direction]] = [next[i + direction], next[i]];
    onChange({ options: next });
  };

  return (
    <div
      className={`rounded-xl border bg-white transition-colors ${
        problems.length && !expanded ? "border-amber-300" : expanded ? "border-brand/40" : "border-gray-200"
      }`}
    >
      {/* Summary */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <i className={`ri-arrow-${expanded ? "down" : "right"}-s-line text-gray-400`} aria-hidden="true" />
          <i className={`${QUESTION_TYPES.find((t) => t.id === q.type)?.icon ?? "ri-question-line"} text-gray-400`} aria-hidden="true" />
          <span className="truncate text-sm font-medium text-gray-800">
            {q.label.trim() || <span className="italic text-gray-400">Untitled question</span>}
            {q.required && <span className="text-red-500"> *</span>}
          </span>
          <span className="hidden shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 sm:inline">
            {questionTypeLabel(q.type)}
          </span>
          {problems.length > 0 && <i className="ri-error-warning-line shrink-0 text-amber-500" title={problems[0]} />}
        </button>
        <div className="flex shrink-0 items-center">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up" className={iconButton}>
            <i className="ri-arrow-up-line" />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} aria-label="Move down" className={iconButton}>
            <i className="ri-arrow-down-line" />
          </button>
          <button type="button" onClick={onDuplicate} aria-label="Duplicate" title="Duplicate" className={iconButton}>
            <i className="ri-file-copy-line" />
          </button>
          <button type="button" onClick={onRemove} aria-label={`Remove ${q.label || "question"}`} title="Remove" className={`${iconButton} hover:!text-red-500`}>
            <i className="ri-delete-bin-line" />
          </button>
        </div>
      </div>

      {/* Editor */}
      {expanded && (
        <div className="flex flex-col gap-3 border-t border-gray-100 px-4 pb-4 pt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Question</span>
              <input
                value={q.label}
                onChange={(e) => onChange({ label: e.target.value.slice(0, 120) })}
                placeholder="e.g. Pickup address"
                autoFocus={!q.label}
                className={inputClass}
              />
            </label>
            <label>
              <span className={labelClass}>Answer type</span>
              <select value={q.type} onChange={(e) => setType(e.target.value as QuoteQuestionType)} className={inputClass}>
                {QUESTION_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </label>
          </div>

          {PLACEHOLDER_TYPES.includes(q.type) && (
            <label>
              <span className={labelClass}>Hint inside the field</span>
              <input
                value={q.placeholder ?? ""}
                onChange={(e) => onChange({ placeholder: e.target.value.slice(0, 120) || undefined })}
                placeholder={q.type === "select" ? "Choose…" : "e.g. Street, area and city"}
                className={inputClass}
              />
            </label>
          )}

          <label className="flex w-fit cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={q.required}
              onChange={(e) => onChange({ required: e.target.checked })}
              className="h-4 w-4 accent-[#F14724]"
            />
            <span className="text-sm text-gray-700">Customers must answer this</span>
          </label>

          {/* Rules for this type */}
          {(q.type === "text" || q.type === "long_text") && (
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className={labelClass}>Shortest answer (characters)</span>
                <input type="number" min={0} value={rules.min_length ?? ""} onChange={(e) => setRules({ min_length: numberOrUndefined(e.target.value) })} className={inputClass} />
              </label>
              <label>
                <span className={labelClass}>Longest answer (characters)</span>
                <input type="number" min={0} value={rules.max_length ?? ""} onChange={(e) => setRules({ max_length: numberOrUndefined(e.target.value) })} className={inputClass} />
              </label>
            </div>
          )}
          {q.type === "number" && (
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className={labelClass}>Smallest allowed</span>
                <input type="number" value={rules.min ?? ""} onChange={(e) => setRules({ min: numberOrUndefined(e.target.value) })} placeholder="e.g. 1" className={inputClass} />
              </label>
              <label>
                <span className={labelClass}>Largest allowed</span>
                <input type="number" value={rules.max ?? ""} onChange={(e) => setRules({ max: numberOrUndefined(e.target.value) })} className={inputClass} />
              </label>
            </div>
          )}
          {q.type === "date" && (
            <label className="flex w-fit cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={!!rules.not_past}
                onChange={(e) => setRules({ not_past: e.target.checked })}
                className="h-4 w-4 accent-[#F14724]"
              />
              <span className="text-sm text-gray-700">Must be today or later</span>
            </label>
          )}

          {/* Answers to pick from */}
          {isChoice && (
            <div>
              <span className={labelClass}>Answers to pick from</span>
              <div className="flex flex-col gap-1.5">
                {options.map((option, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <i className={`${q.type === "select" ? "ri-radio-button-line" : "ri-checkbox-blank-line"} text-gray-300`} aria-hidden="true" />
                    <input
                      value={option}
                      onChange={(e) => setOption(i, e.target.value.slice(0, 100))}
                      onKeyDown={(e) => {
                        // Enter adds the next answer, the way a list is usually typed.
                        if (e.key === "Enter") {
                          e.preventDefault();
                          onChange({ options: [...options.slice(0, i + 1), "", ...options.slice(i + 1)] });
                        }
                      }}
                      placeholder={`Answer ${i + 1}`}
                      aria-label={`Answer ${i + 1}`}
                      autoFocus={option === "" && i === options.length - 1 && i > 0}
                      className={inputClass}
                    />
                    <button type="button" onClick={() => moveOption(i, -1)} disabled={i === 0} aria-label="Move answer up" className={iconButton}>
                      <i className="ri-arrow-up-line" />
                    </button>
                    <button type="button" onClick={() => moveOption(i, 1)} disabled={i === options.length - 1} aria-label="Move answer down" className={iconButton}>
                      <i className="ri-arrow-down-line" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({ options: options.filter((_, idx) => idx !== i) })}
                      aria-label="Remove answer"
                      className={`${iconButton} hover:!text-red-500`}
                    >
                      <i className="ri-close-line" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onChange({ options: [...options, ""] })}
                className="mt-2 flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover"
              >
                <i className="ri-add-line" /> Add an answer
              </button>
            </div>
          )}

          {problems.length > 0 && (
            <ul className="flex flex-col gap-0.5">
              {problems.map((p) => (
                <li key={p} className="text-[11px] text-amber-600">{p}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export const QuoteQuestionsEditor = ({
  questions,
  onChange,
}: {
  questions: QuoteQuestion[];
  onChange: (questions: QuoteQuestion[]) => void;
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const open = (id: string) => setExpanded((prev) => new Set(prev).add(id));
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const edit = (id: string, patch: Partial<QuoteQuestion>) =>
    onChange(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const move = (index: number, direction: -1 | 1) => {
    const next = [...questions];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next);
  };

  const duplicate = (index: number) => {
    const source = questions[index];
    const copy: QuoteQuestion = {
      ...source,
      id: newQuestionId(),
      label: `${source.label} (copy)`.slice(0, 120),
      options: source.options ? [...source.options] : undefined,
      validation: source.validation ? { ...source.validation } : undefined,
    };
    onChange([...questions.slice(0, index + 1), copy, ...questions.slice(index + 1)]);
    open(copy.id);
  };

  const add = () => {
    const question: QuoteQuestion = { id: newQuestionId(), label: "", type: "text", required: false };
    onChange([...questions, question]);
    open(question.id);
  };

  return (
    <div className="flex flex-col gap-2">
      {questions.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-xs text-gray-400">
          No questions yet. Customers will only describe the job in their own words.
        </p>
      )}
      {questions.map((q, i) => (
        <QuestionCard
          key={q.id}
          question={q}
          index={i}
          count={questions.length}
          expanded={expanded.has(q.id)}
          onToggle={() => toggle(q.id)}
          onChange={(patch) => edit(q.id, patch)}
          onMove={(direction) => move(i, direction)}
          onDuplicate={() => duplicate(i)}
          onRemove={() => onChange(questions.filter((x) => x.id !== q.id))}
        />
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:border-brand hover:text-brand"
      >
        <i className="ri-add-line" /> Add a question
      </button>
    </div>
  );
};
