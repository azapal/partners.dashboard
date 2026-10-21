import { useState } from "react";
import Select from "react-select";
import { useCreateBrief, useMarketplaceCategories, useUpdateBrief } from "../../hooks/useMarketplace";
import type { JobBrief } from "../../service/partnerService";
import { Field, FullScreenModal, STATE_OPTIONS, formatNaira, inputClass, selectProps } from "./shared";

/**
 * Post (or edit) a job brief: something you need done by a partner who does
 * it. Client-side checks mirror the backend's limits so the common mistakes
 * show inline before a round trip; anything else comes back in the
 * FeedbackModal.
 */

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const MAX_REQUIREMENTS = 20;

export const BriefFormModal = ({ brief, onClose }: { brief?: JobBrief; onClose: () => void }) => {
  const { data: categories = [] } = useMarketplaceCategories();
  const create = useCreateBrief();
  const update = useUpdateBrief();
  const pending = create.isPending || update.isPending;

  const [category, setCategory] = useState(brief?.category ?? "");
  const [title, setTitle] = useState(brief?.title ?? "");
  const [description, setDescription] = useState(brief?.description ?? "");
  const [requirements, setRequirements] = useState<string[]>(brief?.requirements ?? []);
  const [draftReq, setDraftReq] = useState("");
  const [locations, setLocations] = useState<string[]>(brief?.locations ?? []);
  const [budgetMin, setBudgetMin] = useState(brief?.budget_min != null ? String(brief.budget_min) : "");
  const [budgetMax, setBudgetMax] = useState(brief?.budget_max != null ? String(brief.budget_max) : "");
  const [neededBy, setNeededBy] = useState(brief?.needed_by ?? "");
  const [tried, setTried] = useState(false);

  const categoryOptions = categories.map((c) => ({ value: c.key, label: c.name, icon: c.icon }));
  const min = budgetMin.trim() === "" ? null : Number(budgetMin);
  const max = budgetMax.trim() === "" ? null : Number(budgetMax);

  const errors = {
    category: !category ? "Pick the kind of work this is." : null,
    title: title.trim().length < 5 || title.trim().length > 140 ? "Give it a title of 5–140 characters." : null,
    description: description.trim().length < 20 ? `Describe the job in at least 20 characters (${description.trim().length} so far).` : null,
    budget:
      (min != null && (!Number.isFinite(min) || min < 0)) || (max != null && (!Number.isFinite(max) || max < 0))
        ? "Enter amounts in naira."
        : min != null && max != null && min > max
          ? "The maximum must be at least the minimum."
          : null,
    neededBy: neededBy && neededBy < today() && neededBy !== brief?.needed_by ? "Pick a date that hasn't passed." : null,
  };
  const valid = !Object.values(errors).some(Boolean);

  const addRequirement = () => {
    const r = draftReq.trim();
    if (!r || requirements.length >= MAX_REQUIREMENTS) return;
    if (!requirements.includes(r)) setRequirements((rs) => [...rs, r.slice(0, 200)]);
    setDraftReq("");
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setTried(true);
    if (!valid) return;
    // A requirement typed but not added is still meant.
    const reqs = draftReq.trim() && !requirements.includes(draftReq.trim()) ? [...requirements, draftReq.trim()] : requirements;
    const payload = {
      category,
      title: title.trim(),
      description: description.trim(),
      requirements: reqs,
      locations,
      budget_min: min,
      budget_max: max,
      needed_by: neededBy || null,
    };
    if (brief) update.mutate({ id: brief.id, payload }, { onSuccess: onClose });
    else create.mutate(payload, { onSuccess: onClose });
  };

  const show = (k: keyof typeof errors) => (tried ? errors[k] : null);

  return (
    <FullScreenModal
      labelId="brief-form-title"
      onClose={onClose}
      title={brief ? "Edit brief" : "Post a job brief"}
      subtitle="Tell partners what you need done. Those who can do it will message you."
      footer={
        <div className="mx-auto flex w-full max-w-3xl items-center justify-end gap-3">
          <button onClick={onClose} className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200">Cancel</button>
          <button type="submit" form="brief-form" disabled={pending} className="flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60">
            {pending && <i className="ri-loader-4-line animate-spin" />}
            {brief ? "Save brief" : "Post brief"}
          </button>
        </div>
      }
    >
      <form id="brief-form" onSubmit={submit} className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-5 sm:px-8 sm:py-8">
        <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-card sm:p-5">
          <h3 className="text-sm font-semibold text-gray-900">The job</h3>
          <Field label="Category" required error={show("category")}>
            <Select
              options={categoryOptions}
              value={categoryOptions.find((o) => o.value === category) ?? null}
              onChange={(o) => setCategory(o?.value ?? "")}
              placeholder="What kind of work is it?"
              formatOptionLabel={(o) => (
                <span className="flex items-center gap-2"><i className={`${o.icon} text-gray-400`} />{o.label}</span>
              )}
              {...selectProps}
            />
          </Field>
          <Field label="Title" required error={show("title")} counter={`${title.length}/140`}>
            <input value={title} maxLength={140} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly haulage of 2 tonnes, Lagos → Abuja" className={inputClass} />
          </Field>
          <Field label="Description" required error={show("description")} counter={`${description.length}/5000`}>
            <textarea
              value={description}
              maxLength={5000}
              rows={6}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's being moved or stored, how often, pickup and drop-off, anything special about handling…"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm leading-6 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </Field>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card sm:p-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">What it takes</h3>
            <p className="mt-0.5 text-xs text-gray-500">Must-haves a partner needs to do this — vehicles, licences, insurance, equipment.</p>
          </div>
          {requirements.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {requirements.map((r, i) => (
                <li key={r} className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2">
                  <i className="ri-checkbox-circle-fill mt-0.5 text-brand" />
                  <span className="min-w-0 flex-1 break-words text-sm text-gray-700">{r}</span>
                  <button type="button" onClick={() => setRequirements((rs) => rs.filter((_, j) => j !== i))} aria-label={`Remove ${r}`} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-white hover:text-red-500">
                    <i className="ri-close-line" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {requirements.length < MAX_REQUIREMENTS ? (
            <div className="flex gap-2">
              <input
                value={draftReq}
                maxLength={200}
                onChange={(e) => setDraftReq(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRequirement(); } }}
                placeholder="e.g. 10-tonne truck with tarpaulin"
                className={inputClass}
              />
              <button type="button" onClick={addRequirement} disabled={!draftReq.trim()} className="flex h-11 shrink-0 items-center gap-1 rounded-xl bg-gray-100 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50">
                <i className="ri-add-line" /> Add
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-400">That's the maximum of {MAX_REQUIREMENTS}.</p>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-card sm:p-5">
          <h3 className="text-sm font-semibold text-gray-900">Where, when and budget</h3>
          <Field label="Locations" hint="The states involved. Leave empty if it's anywhere.">
            <Select
              isMulti
              options={STATE_OPTIONS}
              value={locations.map((s) => ({ value: s, label: s }))}
              onChange={(opts) => setLocations(opts.map((o) => o.value))}
              placeholder="Select states…"
              closeMenuOnSelect={false}
              {...selectProps}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Budget from (₦)" error={show("budget")} hint={min != null && Number.isFinite(min) ? formatNaira(min) : "Optional"}>
              <input type="number" inputMode="numeric" min={0} value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="50000" className={inputClass} />
            </Field>
            <Field label="Budget up to (₦)" hint={max != null && Number.isFinite(max) ? formatNaira(max) : "Optional"}>
              <input type="number" inputMode="numeric" min={0} value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="150000" className={inputClass} />
            </Field>
          </div>
          <Field label="Needed by" error={show("neededBy")} hint="Optional.">
            <input type="date" min={today()} value={neededBy} onChange={(e) => setNeededBy(e.target.value)} className={`${inputClass} sm:max-w-xs`} />
          </Field>
        </section>
      </form>
    </FullScreenModal>
  );
};
