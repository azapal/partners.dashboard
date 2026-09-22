import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { QuotePageSettings } from "../components/quote/QuotePageSettings";
import { QuoteRequestsPanel } from "../components/quote/QuoteRequestsPanel";
import { useDeleteMoveRateSet, useMoveRateSets, useSaveMoveRateSet } from "../hooks/useMoveRates";
import { useQuoteRequests } from "../hooks/useQuotePage";
import {
  COUNTRIES,
  DISTANCE_BANDS,
  PROPERTY_SIZES,
  baseKey,
  buildQuote,
  defaultRateSet,
  fieldOptions,
  isPricedFieldType,
  money,
  sameRateSet,
  type MoveCustomField,
  type MoveRateSet,
} from "../lib/data/moveRates";

/**
 * Move rates — a price list for relocations, per country.
 *
 * Three things on one screen because a mover edits them together: the base
 * grid, the modifiers that change it, and a live quote proving what a customer
 * would actually be told. The quote is the point — a grid you can't test is a
 * spreadsheet with extra steps.
 *
 * ── Saving ─────────────────────────────────────────────────────────────────
 * Lists live on the partner's account (partner/move-rates). Edits collect in a
 * per-country draft laid over the saved copy and go up whole on Save — the
 * same unit the backend stores — rather than autosaving every keystroke of a
 * 21-cell grid. A country the account has never saved is a draft by definition.
 *
 * ── Lists from before there was a backend ──────────────────────────────────
 * The first version kept lists in this browser under LEGACY_KEY. A country
 * found there that the account doesn't have yet is shown as an unsaved list,
 * and forgotten locally once it's saved or thrown away, so a partner who priced
 * before the backend existed doesn't silently lose the work.
 */

const LEGACY_KEY = "azapal-move-rates";

const readLegacy = (): Record<string, MoveRateSet> => {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* unavailable or corrupt storage just means nothing to bring across */
  }
  return {};
};

const writeLegacy = (sets: Record<string, MoveRateSet>) => {
  try {
    if (Object.keys(sets).length) window.localStorage.setItem(LEGACY_KEY, JSON.stringify(sets));
    else window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
};

const without = <T,>(obj: Record<string, T>, key: string) => {
  const next = { ...obj };
  delete next[key];
  return next;
};

const num = (v: string) => (v.trim() === "" ? 0 : Math.max(0, Number(v) || 0));

const parseOptions = (text: string) => text.split(",").map((o) => o.trim()).filter(Boolean);

/**
 * The answers to a choice, typed as one comma-separated line. It keeps the raw
 * text itself so "Big van, " survives mid-word, while the list only ever holds
 * the parsed answers.
 */
const OptionsInput = ({
  options,
  label,
  onChange,
}: {
  options: string[];
  label: string;
  onChange: (options: string[]) => void;
}) => {
  const [text, setText] = useState(options.join(", "));

  // Follow changes made elsewhere — a discard, the server's copy after a save —
  // but not the ones this input just made, or it would eat the trailing comma.
  useEffect(() => {
    if (parseOptions(text).join("\n") !== options.join("\n")) setText(options.join(", "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  return (
    <input
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseOptions(e.target.value));
      }}
      placeholder="Answers, separated by commas — e.g. Van, Truck, Either"
      aria-label={`Answers for ${label}`}
      className="w-full rounded-lg border border-dashed border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand focus:ring-2 focus:ring-orange-50"
    />
  );
};

// The quote page lives here rather than on its own screen because it is these
// prices, sold: a partner tunes the list and the page that quotes from it
// together. `?view=` lets the workspace launcher open either tab directly.
const VIEWS = [
  ["lists", "Price lists"],
  ["quote-page", "Quote page"],
  ["requests", "Quote requests"],
] as const;
type View = (typeof VIEWS)[number][0];

const savedOn = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";

export const MoveRatesScreen = () => {
  const { data: saved, isPending, isError, error, refetch } = useMoveRateSets();
  const saveSet = useSaveMoveRateSet();
  const deleteSet = useDeleteMoveRateSet();
  const { data: quoteRequests } = useQuoteRequests();
  const newLeads = quoteRequests?.filter((r) => r.status === "new").length ?? 0;

  const [params, setParams] = useSearchParams();
  const view: View = VIEWS.find(([key]) => key === params.get("view"))?.[0] ?? "lists";
  const showView = (next: View) => setParams(next === "lists" ? {} : { view: next });

  const [drafts, setDrafts] = useState<Record<string, MoveRateSet>>({});
  const [legacy, setLegacy] = useState<Record<string, MoveRateSet>>(readLegacy);
  const [picked, setPicked] = useState("");
  const [tab, setTab] = useState<"grid" | "modifiers" | "fields">("grid");

  // Quote preview state
  const [sizeId, setSizeId] = useState(PROPERTY_SIZES[3].id);
  const [bandId, setBandId] = useState(DISTANCE_BANDS[0].id);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [customValues, setCustomValues] = useState<Record<string, number>>({});

  const savedByCountry = useMemo(
    () => Object.fromEntries((saved ?? []).map((s) => [s.country, s])) as Record<string, MoveRateSet>,
    [saved],
  );

  // Saved lists over any browser-held ones, drafts over both. With nothing at
  // all, a Nigeria template to start from rather than an empty page.
  const sets = useMemo(() => {
    const merged = { ...legacy, ...savedByCountry, ...drafts };
    return Object.keys(merged).length ? merged : { Nigeria: defaultRateSet("Nigeria") };
  }, [legacy, savedByCountry, drafts]);

  const configured = Object.keys(sets).sort();
  const country = sets[picked] ? picked : configured[0];
  const set = sets[country];
  const unconfigured = COUNTRIES.filter((c) => !sets[c.country]);

  const isSaved = (c: string) => !!savedByCountry[c];
  const isDirty = (c: string) =>
    !isSaved(c) || (!!drafts[c] && !sameRateSet(drafts[c], savedByCountry[c]));

  // Only edits held nowhere but memory. A browser-held list is still in
  // storage, and the untouched template costs nothing to lose.
  const hasUnsavedEdits = Object.keys(drafts).some(isDirty);
  useEffect(() => {
    if (!hasUnsavedEdits) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedEdits]);

  const update = (fn: (s: MoveRateSet) => MoveRateSet) =>
    setDrafts((prev) => ({ ...prev, [country]: fn(prev[country] ?? set) }));

  const quote = useMemo(
    () => (set ? buildQuote(set, sizeId, bandId, selections, customValues) : null),
    [set, sizeId, bandId, selections, customValues],
  );

  const choose = (c: string) => {
    setPicked(c);
    saveSet.reset();
    deleteSet.reset();
  };

  const addCountry = (name: string) => {
    setDrafts((prev) => ({ ...prev, [name]: defaultRateSet(name) }));
    choose(name);
  };

  const forgetLegacy = (c: string) => {
    if (!legacy[c]) return;
    const next = without(legacy, c);
    writeLegacy(next);
    setLegacy(next);
  };

  const save = () => {
    const sent = set;
    saveSet.mutate(sent, {
      onSuccess: () => {
        // Drop the draft only if it's still the one that was sent — anything
        // typed while the save was in flight stays as a new unsaved change.
        setDrafts((prev) => (prev[sent.country] === sent ? without(prev, sent.country) : prev));
        forgetLegacy(sent.country);
      },
    });
  };

  const discard = () => {
    setDrafts((prev) => without(prev, country));
    saveSet.reset();
  };

  const removeCountry = () => {
    if (!isSaved(country)) {
      if (!window.confirm(`Throw away the unsaved ${country} price list?`)) return;
      setDrafts((prev) => without(prev, country));
      forgetLegacy(country);
      return;
    }
    if (!window.confirm(`Delete the ${country} price list? This can't be undone.`)) return;
    deleteSet.mutate(country, {
      onSuccess: () => {
        setDrafts((prev) => without(prev, country));
        forgetLegacy(country);
      },
    });
  };

  const addField = () =>
    update((s) => ({
      ...s,
      customFields: [
        ...s.customFields,
        { id: `f${Date.now()}`, label: "New question", type: "text", amount: 0 },
      ],
    }));

  const editField = (id: string, patch: Partial<MoveCustomField>) =>
    update((s) => ({
      ...s,
      customFields: s.customFields.map((f) => {
        if (f.id !== id) return f;
        const next = { ...f, ...patch };
        // A price left on a type that can't charge would sit there invisibly
        // and come back to life if the type were switched back.
        return isPricedFieldType(next.type) ? next : { ...next, amount: 0 };
      }),
    }));

  if (isPending || isError || !set) {
    return (
      <DashboardLayout>
        <div className="w-full rounded-2xl bg-white py-14 text-center shadow-card">
          {isError ? (
            <>
              <p className="text-sm text-gray-500">
                Couldn't load your move rates{error?.message ? ` — ${error.message}` : "."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 text-sm font-semibold text-brand hover:text-brand-hover"
              >
                Try again
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-400">Loading…</p>
          )}
        </div>
      </DashboardLayout>
    );
  }

  const dirty = isDirty(country);
  const busy = saveSet.isPending || deleteSet.isPending;
  const actionError = (saveSet.error ?? deleteSet.error)?.message;
  // Nothing to delete: the starter template, never edited or saved.
  const removable = isSaved(country) || !!drafts[country] || !!legacy[country];

  const status = deleteSet.isPending
    ? { dot: "bg-gray-300", title: "Deleting…", note: "" }
    : saveSet.isPending
      ? { dot: "bg-gray-300", title: "Saving…", note: "" }
      : legacy[country] && !isSaved(country)
        ? {
            dot: "bg-amber-500",
            title: "Found in this browser",
            note: `You priced ${country} before move rates were saved to your account. Save it to keep it — until then it exists only here.`,
          }
        : !isSaved(country)
          ? {
              dot: "bg-amber-500",
              title: "Not saved yet",
              note:
                country === "Nigeria"
                  ? "The Nigeria grid starts from a template — edit it, don't trust it. Save to keep it on your account."
                  : "Fill in your prices, then save to keep this list on your account.",
            }
          : dirty
            ? { dot: "bg-amber-500", title: "Unsaved changes", note: "Your team sees the saved version until you save." }
            : {
                dot: "bg-emerald-500",
                title: `Saved ${savedOn(set.updatedAt)}`,
                note: "Shared with your team, and what your quote page prices from.",
              };

  return (
    <DashboardLayout>
      <div className="w-full flex flex-col gap-5 overflow-y-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex w-fit items-center gap-1 rounded-xl bg-white p-1 shadow-card">
            {VIEWS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => showView(key)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  view === key ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {label}
                {key === "requests" && newLeads > 0 && (
                  <span className={`rounded-full px-1.5 text-[10px] ${view === key ? "bg-white/25" : "bg-orange-100 text-brand"}`}>
                    {newLeads}
                  </span>
                )}
              </button>
            ))}
          </div>
          {view === "lists" && (
            <div className="flex items-center gap-2">
              <select
                value={country}
                onChange={(e) => choose(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-orange-50"
              >
                {configured.map((c) => (
                  <option key={c} value={c}>
                    {c} · {sets[c].currency}{isDirty(c) ? " · unsaved" : ""}
                  </option>
                ))}
              </select>
              {removable && (
                <button
                  type="button"
                  onClick={removeCountry}
                  disabled={busy}
                  aria-label={`Delete the ${country} price list`}
                  title={`Delete the ${country} price list`}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-400 transition-colors hover:border-red-200 hover:text-red-500 disabled:opacity-40"
                >
                  <i className="ri-delete-bin-line text-base leading-none" />
                </button>
              )}
              {unconfigured.length > 0 && (
                <select
                  value=""
                  onChange={(e) => e.target.value && addCountry(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-500 outline-none focus:border-brand"
                >
                  <option value="">+ Add country</option>
                  {unconfigured.map((c) => (
                    <option key={c.country} value={c.country}>{c.country} ({c.code})</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {view === "quote-page" ? (
          <QuotePageSettings savedSets={saved ?? []} onOpenPriceLists={() => showView("lists")} />
        ) : view === "requests" ? (
          <QuoteRequestsPanel onOpenSettings={() => showView("quote-page")} />
        ) : (
          <>
          <div className="flex flex-col gap-3 rounded-2xl bg-white px-5 py-3.5 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <span className={`h-2 w-2 shrink-0 rounded-full ${status.dot}`} />
                {status.title}
              </p>
              {actionError ? (
                <p className="mt-0.5 text-xs text-red-600">{actionError}</p>
              ) : (
                status.note && <p className="mt-0.5 text-xs text-gray-400">{status.note}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isSaved(country) && dirty && (
                <button
                  type="button"
                  onClick={discard}
                  disabled={busy}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-40"
                >
                  Discard changes
                </button>
              )}
              <button
                type="button"
                onClick={save}
                disabled={!dirty || busy}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saveSet.isPending ? "Saving…" : `Save ${country}`}
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="flex items-center gap-1 rounded-xl bg-white p-1 w-fit shadow-card">
                {([["grid", "Base grid"], ["modifiers", "Modifiers"], ["fields", "Custom fields"]] as const).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                        tab === key ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>

              {tab === "grid" && (
                <div className="overflow-hidden rounded-2xl bg-white shadow-card">
                  <div className="border-b border-gray-100 px-5 py-3.5">
                    <h2 className="text-sm font-semibold text-gray-800">
                      What the move costs before anything else
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Prices in {set.currency}. Leave a cell at zero to mean "we don't quote that".
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50/60">
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            Property
                          </th>
                          {DISTANCE_BANDS.map((band) => (
                            <th key={band.id} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500" title={band.hint}>
                              {band.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {PROPERTY_SIZES.map((size) => (
                          <tr key={size.id}>
                            <td className="px-4 py-2">
                              <p className="text-xs font-semibold text-gray-800">{size.label}</p>
                              <p className="text-[10px] text-gray-400">~{size.volumeCbm} m³</p>
                            </td>
                            {DISTANCE_BANDS.map((band) => {
                              const key = baseKey(size.id, band.id);
                              return (
                                <td key={band.id} className="px-3 py-2">
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
                                      {set.symbol}
                                    </span>
                                    <input
                                      value={set.base[key] ? String(set.base[key]) : ""}
                                      onChange={(e) =>
                                        update((s) => ({
                                          ...s,
                                          base: { ...s.base, [key]: num(e.target.value.replace(/[^\d]/g, "")) },
                                        }))
                                      }
                                      inputMode="numeric"
                                      placeholder="0"
                                      className="w-full rounded-lg border border-gray-200 py-1.5 pl-9 pr-2 text-xs outline-none focus:border-brand focus:ring-2 focus:ring-orange-50"
                                    />
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === "modifiers" && (
                <div className="overflow-hidden rounded-2xl bg-white shadow-card divide-y divide-gray-100">
                  {set.modifiers.map((mod) => (
                    <div key={mod.id} className="flex items-center gap-3 px-5 py-3">
                      <input
                        type="checkbox"
                        checked={mod.enabled}
                        onChange={(e) =>
                          update((s) => ({
                            ...s,
                            modifiers: s.modifiers.map((m) => (m.id === mod.id ? { ...m, enabled: e.target.checked } : m)),
                          }))
                        }
                        className="h-4 w-4 accent-[#F14724]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold ${mod.enabled ? "text-gray-800" : "text-gray-400"}`}>
                          {mod.label}
                        </p>
                        <p className="text-[11px] text-gray-400">{mod.hint}</p>
                      </div>
                      <span className="hidden w-24 shrink-0 text-right text-[10px] uppercase tracking-wide text-gray-400 sm:block">
                        {mod.kind.replace(/_/g, " ")}
                      </span>
                      <div className="relative w-32 shrink-0">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
                          {mod.kind === "percent" ? "%" : set.symbol}
                        </span>
                        <input
                          value={mod.amount ? String(mod.amount) : ""}
                          onChange={(e) =>
                            update((s) => ({
                              ...s,
                              modifiers: s.modifiers.map((m) =>
                                m.id === mod.id ? { ...m, amount: num(e.target.value.replace(/[^\d.]/g, "")) } : m,
                              ),
                            }))
                          }
                          inputMode="numeric"
                          placeholder="0"
                          className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-2 text-xs outline-none focus:border-brand focus:ring-2 focus:ring-orange-50"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === "fields" && (
                <div className="overflow-hidden rounded-2xl bg-white shadow-card">
                  <div className="border-b border-gray-100 px-5 py-3.5">
                    <h2 className="text-sm font-semibold text-gray-800">Your own questions</h2>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Anything you ask that we didn't anticipate. Number and yes/no questions can carry
                      a price — per unit, or once for a yes. Leave it at zero, or use text or a choice,
                      to just record the answer.
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {set.customFields.map((field) => (
                      <div key={field.id} className="flex flex-wrap items-center gap-2 px-5 py-3">
                        <input
                          value={field.label}
                          onChange={(e) => editField(field.id, { label: e.target.value })}
                          className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand focus:ring-2 focus:ring-orange-50"
                        />
                        <select
                          value={field.type}
                          onChange={(e) => editField(field.id, { type: e.target.value as MoveCustomField["type"] })}
                          className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-brand"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="boolean">Yes / no</option>
                          <option value="select">Choice</option>
                        </select>
                        {isPricedFieldType(field.type) ? (
                          <div className="relative w-28">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">{set.symbol}</span>
                            <input
                              value={field.amount ? String(field.amount) : ""}
                              onChange={(e) => editField(field.id, { amount: num(e.target.value.replace(/[^\d]/g, "")) })}
                              inputMode="numeric"
                              placeholder="0"
                              aria-label={field.type === "number" ? `Price per unit for ${field.label}` : `Price for ${field.label}`}
                              className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-2 text-xs outline-none focus:border-brand focus:ring-2 focus:ring-orange-50"
                            />
                          </div>
                        ) : (
                          <span className="w-28 text-center text-[11px] text-gray-400">Recorded only</span>
                        )}
                        <button
                          type="button"
                          onClick={() => update((s) => ({ ...s, customFields: s.customFields.filter((f) => f.id !== field.id) }))}
                          aria-label={`Remove ${field.label}`}
                          className="text-gray-300 transition-colors hover:text-red-500"
                        >
                          <i className="ri-delete-bin-line text-base" />
                        </button>
                        {field.type === "select" && (
                          <OptionsInput
                            options={fieldOptions(field)}
                            label={field.label}
                            onChange={(options) => editField(field.id, { options })}
                          />
                        )}
                        {field.type === "select" && fieldOptions(field).length === 0 && (
                          <p className="w-full text-[11px] text-amber-600">
                            Add at least one answer — a choice with nothing to pick can't be answered.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addField}
                    className="w-full border-t border-gray-100 px-5 py-3 text-left text-xs font-semibold text-brand hover:bg-orange-50"
                  >
                    <i className="ri-add-line mr-1" />
                    Add a question
                  </button>
                </div>
              )}
            </div>

            {/* ── Live quote ───────────────────────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl bg-white p-5 shadow-card lg:sticky lg:top-4">
                <h2 className="text-sm font-semibold text-gray-800">Try a quote</h2>
                <p className="mt-0.5 text-xs text-gray-400">What a customer would be told.</p>

                <div className="mt-3 grid gap-2">
                  <select
                    value={sizeId}
                    onChange={(e) => setSizeId(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-orange-50"
                  >
                    {PROPERTY_SIZES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                  <select
                    value={bandId}
                    onChange={(e) => setBandId(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-orange-50"
                  >
                    {DISTANCE_BANDS.map((b) => (
                      <option key={b.id} value={b.id}>{b.label}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 space-y-1.5">
                  {set.modifiers.filter((m) => m.enabled).map((mod) => {
                    const counted = mod.kind === "per_floor" || mod.kind === "per_hour" || mod.kind === "per_week";
                    const qty = selections[mod.id] ?? 0;
                    return (
                      <div key={mod.id} className="flex items-center gap-2">
                        {counted ? (
                          <input
                            value={qty || ""}
                            onChange={(e) => setSelections((p) => ({ ...p, [mod.id]: num(e.target.value.replace(/[^\d]/g, "")) }))}
                            inputMode="numeric"
                            placeholder="0"
                            className="w-12 rounded-lg border border-gray-200 px-2 py-1 text-center text-xs outline-none focus:border-brand"
                          />
                        ) : (
                          <input
                            type="checkbox"
                            checked={qty > 0}
                            onChange={(e) => setSelections((p) => ({ ...p, [mod.id]: e.target.checked ? 1 : 0 }))}
                            className="h-4 w-4 accent-[#F14724]"
                          />
                        )}
                        <span className="text-xs text-gray-600">{mod.label}</span>
                      </div>
                    );
                  })}
                  {/* Only questions that can move the total — the recorded-only
                      ones would be inputs that visibly do nothing here. */}
                  {set.customFields
                    .filter((f) => isPricedFieldType(f.type) && f.amount > 0)
                    .map((field) => {
                      const value = customValues[field.id] ?? 0;
                      return (
                        <div key={field.id} className="flex items-center gap-2">
                          {field.type === "number" ? (
                            <input
                              value={value || ""}
                              onChange={(e) => setCustomValues((p) => ({ ...p, [field.id]: num(e.target.value.replace(/[^\d]/g, "")) }))}
                              inputMode="numeric"
                              placeholder="0"
                              aria-label={field.label}
                              className="w-12 rounded-lg border border-gray-200 px-2 py-1 text-center text-xs outline-none focus:border-brand"
                            />
                          ) : (
                            <input
                              type="checkbox"
                              checked={value > 0}
                              onChange={(e) => setCustomValues((p) => ({ ...p, [field.id]: e.target.checked ? 1 : 0 }))}
                              aria-label={field.label}
                              className="h-4 w-4 accent-[#F14724]"
                            />
                          )}
                          <span className="text-xs text-gray-600">{field.label}</span>
                        </div>
                      );
                    })}
                </div>

                <div className="mt-4 border-t border-gray-100 pt-3">
                  {quote && quote.lines.length > 0 ? (
                    <>
                      {quote.lines.map((line, i) => (
                        <div key={`${line.label}-${i}`} className="flex items-start justify-between py-1 text-xs">
                          <span className="min-w-0 pr-2 text-gray-600">
                            {line.label}
                            {line.detail && <span className="block text-[10px] text-gray-400">{line.detail}</span>}
                          </span>
                          <span className="shrink-0 font-medium text-gray-800">{money(set.symbol, line.amount)}</span>
                        </div>
                      ))}
                      <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                        <span className="text-xs font-semibold text-gray-700">
                          Total
                          <span className="ml-1 font-normal text-gray-400">· ~{quote.volumeCbm} m³</span>
                        </span>
                        <span className="text-lg font-bold text-gray-900">{money(set.symbol, quote.total)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="py-4 text-center text-xs text-gray-400">
                      No price set for that combination yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
