import { useState } from "react";
import {
  useDeleteBrief,
  useJobBrief,
  useJobBriefs,
  useMarketplaceCategories,
  useSetBriefStatus,
  useStartConversation,
} from "../../hooks/useMarketplace";
import type { BriefStatus, JobBrief, MarketplaceCategory } from "../../service/partnerService";
import { CategoryNav, FilterBar } from "./CategoryNav";
import { Composer } from "./Composer";
import { BriefFormModal } from "./BriefFormModal";
import { useNetwork } from "./NetworkShell";
import { SignInLink } from "./SignInLink";
import { CategoryChip, FullScreenModal, LoadError, PartnerLogo, VerifiedBadge, budgetLabel, formatDay, neededByLabel, placeOf, useDebounced } from "./shared";

/**
 * Job briefs: work partners need done. "Board" is everyone else's open briefs,
 * filtered like the marketplace; "My briefs" is yours in any state, with how
 * many partners have answered each. Answering a brief starts a conversation
 * with its poster, carrying the brief as context.
 *
 * The board is public: a signed-out visitor reads it (budgets included) and
 * every action — posting, responding, My briefs — becomes a sign-in link. The
 * open brief is in the path (/job-briefs/:briefId) so it can be shared.
 */
export const BriefsTab = ({
  openId,
  onOpenBrief,
  onCloseBrief,
}: {
  openId: number | null;
  onOpenBrief: (id: number) => void;
  onCloseBrief: () => void;
}) => {
  const { signedIn, openThread: onOpenThread, openPartner: onOpenPartner } = useNetwork();
  const [view, setView] = useState<"board" | "mine">("board");
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState<JobBrief | null>(null);
  const setOpenId = (id: number | null) => (id == null ? onCloseBrief() : onOpenBrief(id));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-brand">
            <i className="ri-file-list-3-line text-xl" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">Need something moved, stored or cleared?</p>
            <p className="mt-0.5 text-xs leading-5 text-gray-500">Post a brief and partners who do that work will message you. Answer someone else's to win it.</p>
          </div>
        </div>
        {signedIn ? (
          <button onClick={() => setPosting(true)} className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover">
            <i className="ri-add-line" /> Post a brief
          </button>
        ) : (
          <SignInLink className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover">
            <i className="ri-login-box-line" /> Sign in to post a brief
          </SignInLink>
        )}
      </div>

      {signedIn && <div role="tablist" aria-label="Briefs" className="flex w-fit items-center gap-1 rounded-xl bg-white p-1 shadow-card">
        {([["board", "Board", "ri-layout-grid-line"], ["mine", "My briefs", "ri-user-line"]] as const).map(([id, label, icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${view === id ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <i className={icon} /> {label}
          </button>
        ))}
      </div>}

      {view === "board" || !signedIn ? (
        <BriefBoard onOpen={setOpenId} onPost={() => setPosting(true)} />
      ) : (
        <MyBriefs onOpen={setOpenId} onEdit={setEditing} onPost={() => setPosting(true)} />
      )}

      {posting && <BriefFormModal onClose={() => setPosting(false)} />}
      {editing && <BriefFormModal brief={editing} onClose={() => setEditing(null)} />}
      {openId != null && (
        <BriefDetailModal
          id={openId}
          onClose={() => setOpenId(null)}
          onEdit={(b) => { setOpenId(null); setEditing(b); }}
          onOpenThread={onOpenThread}
          onOpenPartner={onOpenPartner}
        />
      )}
    </div>
  );
};

function BriefBoard({ onOpen, onPost }: { onOpen: (id: number) => void; onPost: () => void }) {
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const q = useDebounced(query);
  const { data: categories = [], isLoading: catLoading } = useMarketplaceCategories();
  const { data: briefs = [], isLoading, isFetching, error, refetch } = useJobBriefs({ category, state, q });
  const filtered = !!(category || state || q.trim());
  const current = categories.find((c) => c.key === category);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
        <CategoryNav
          categories={categories}
          loading={catLoading}
          selected={category}
          onSelect={setCategory}
          countOf={(c: MarketplaceCategory) => c.brief_count ?? 0}
          allLabel="All briefs"
          noun="open brief"
        />
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <FilterBar query={query} onQuery={setQuery} placeholder="Search briefs…" state={state} onState={setState} />
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            {isLoading ? "Loading briefs…" : (
              <>
                <span className="font-semibold text-gray-800">{briefs.length}</span> open brief{briefs.length === 1 ? "" : "s"}
                {current ? <> in <span className="font-semibold text-gray-800">{current.name}</span></> : null}
                {state ? <> in <span className="font-semibold text-gray-800">{state}</span></> : null}
                {isFetching && <i className="ri-loader-4-line ml-1.5 animate-spin text-gray-400" />}
              </>
            )}
          </p>
          {filtered && (
            <button onClick={() => { setCategory(""); setQuery(""); setState(""); }} className="text-xs font-semibold text-brand hover:text-brand-hover">Clear filters</button>
          )}
        </div>

        {error ? (
          <LoadError what="briefs" error={error} onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-white shadow-card" />)}
          </div>
        ) : briefs.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center shadow-card">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-brand">
              <i className="ri-file-search-line text-2xl" />
            </span>
            <p className="text-sm font-semibold text-gray-800">{filtered ? "No open briefs match" : "No open briefs right now"}</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-gray-500">
              {filtered ? "Try another category or state." : "When partners post work they need done, it shows up here. Have a job yourself? Post it."}
            </p>
            <PostCta onPost={onPost} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {briefs.map((b) => <BriefCard key={b.id} brief={b} icon={categories.find((c) => c.key === b.category)?.icon} onOpen={() => onOpen(b.id)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function BriefCard({ brief, icon, onOpen }: { brief: JobBrief; icon?: string; onOpen: () => void }) {
  const { signedIn } = useNetwork();
  const due = neededByLabel(brief.needed_by);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-w-0 flex-col rounded-2xl bg-white p-4 text-left shadow-card ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-orange-100 sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <CategoryChip icon={icon} name={brief.category_name} tone="brand" />
        {due && (
          <span className={`flex shrink-0 items-center gap-1 text-[11px] font-semibold ${due.urgent ? "text-amber-700" : "text-gray-500"}`}>
            <i className="ri-calendar-event-line" />{due.text}
          </span>
        )}
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-bold leading-5 text-gray-900">{brief.title}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{brief.description}</p>

      {brief.requirements.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {brief.requirements.slice(0, 2).map((r) => (
            <li key={r} className="flex items-start gap-1.5 text-xs text-gray-600">
              <i className="ri-check-line mt-0.5 text-brand" /><span className="line-clamp-1">{r}</span>
            </li>
          ))}
          {brief.requirements.length > 2 && <li className="pl-5 text-[11px] text-gray-400">+{brief.requirements.length - 2} more requirement{brief.requirements.length - 2 === 1 ? "" : "s"}</li>}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="flex items-center gap-1 font-semibold text-gray-900"><i className="ri-money-naira-circle-line text-emerald-600" />{budgetLabel(brief.budget_min, brief.budget_max)}</span>
        <span className="flex min-w-0 items-center gap-1 text-gray-500">
          <i className="ri-map-pin-line" />
          <span className="truncate">{brief.locations.length ? brief.locations.slice(0, 3).join(", ") + (brief.locations.length > 3 ? ` +${brief.locations.length - 3}` : "") : "Anywhere"}</span>
        </span>
      </div>

      <div className="mt-auto pt-4"><div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
        {brief.poster ? (
          <span className="flex min-w-0 items-center gap-2">
            <PartnerLogo partner={brief.poster} size="xs" />
            <span className="truncate text-xs font-medium text-gray-700">{brief.poster.partner_name}</span>
            {brief.poster.is_verified && <VerifiedBadge compact />}
          </span>
        ) : <span className="text-xs text-gray-400">A partner</span>}
        <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-brand">
          {signedIn ? "Respond" : "View"}<i className="ri-arrow-right-line transition-transform group-hover:translate-x-0.5" />
        </span>
      </div></div>
    </button>
  );
}

const STATUS_FILTERS: { id: "" | BriefStatus; label: string }[] = [
  { id: "", label: "All" },
  { id: "open", label: "Open" },
  { id: "closed", label: "Closed" },
];

function MyBriefs({ onOpen, onEdit, onPost }: { onOpen: (id: number) => void; onEdit: (b: JobBrief) => void; onPost: () => void }) {
  const [status, setStatus] = useState<"" | BriefStatus>("");
  const { data: briefs = [], isLoading, error, refetch } = useJobBriefs({ mine: true, status: status || undefined });
  const setBriefStatus = useSetBriefStatus();
  const remove = useDeleteBrief();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id || "all"}
            onClick={() => setStatus(f.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${status === f.id ? "bg-brand text-white" : "bg-white text-gray-600 shadow-card hover:text-gray-900"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <LoadError what="your briefs" error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white shadow-card" />)}</div>
      ) : briefs.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center shadow-card">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-brand"><i className="ri-draft-line text-2xl" /></span>
          <p className="text-sm font-semibold text-gray-800">{status ? `No ${status} briefs` : "You haven't posted a brief"}</p>
          <p className="mt-1 max-w-sm text-xs leading-5 text-gray-500">Describe a job — haulage, warehousing, last-mile in a city you don't cover — and partners who do it will message you.</p>
          <button onClick={onPost} className="mt-4 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-hover">Post a brief</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {briefs.map((b) => {
            const open = b.status === "open";
            const responses = b.response_count ?? 0;
            return (
              <article key={b.id} className="rounded-2xl bg-white p-4 shadow-card sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <button onClick={() => onOpen(b.id)} className="min-w-0 flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${open ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{open ? "Open" : "Closed"}</span>
                      <CategoryChip name={b.category_name} />
                      <span className="text-[11px] text-gray-400">Posted {formatDay(b.created_at)}</span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-gray-900 hover:text-brand">{b.title}</p>
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span>{budgetLabel(b.budget_min, b.budget_max)}</span>
                      <span>{b.locations.length ? b.locations.join(", ") : "Anywhere"}</span>
                      {b.needed_by && <span>By {formatDay(b.needed_by)}</span>}
                    </p>
                  </button>
                  <span className={`flex w-fit shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold ${responses ? "bg-orange-50 text-brand" : "bg-gray-50 text-gray-500"}`}>
                    <i className="ri-chat-3-line" />{responses} response{responses === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap justify-end gap-1 border-t border-gray-100 pt-3">
                  <button onClick={() => onEdit(b)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"><i className="ri-edit-line" /> Edit</button>
                  <button
                    onClick={() => setBriefStatus.mutate({ id: b.id, status: open ? "closed" : "open" })}
                    disabled={setBriefStatus.isPending}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    <i className={open ? "ri-lock-line" : "ri-lock-unlock-line"} /> {open ? "Close" : "Reopen"}
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`Delete "${b.title}"? This can't be undone.`)) remove.mutate(b.id); }}
                    disabled={remove.isPending}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <i className="ri-delete-bin-line" /> Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BriefDetailModal({
  id,
  onClose,
  onEdit,
  onOpenThread,
  onOpenPartner,
}: {
  id: number;
  onClose: () => void;
  onEdit: (b: JobBrief) => void;
  onOpenThread: (conversationId: number) => void;
  onOpenPartner: (partnerCode: string) => void;
}) {
  const { signedIn } = useNetwork();
  const { data: brief, isLoading, error } = useJobBrief(id);
  const { data: categories = [] } = useMarketplaceCategories();
  const [responding, setResponding] = useState(false);
  const [body, setBody] = useState("");
  const start = useStartConversation();
  const setBriefStatus = useSetBriefStatus();
  const due = brief ? neededByLabel(brief.needed_by) : null;
  const icon = brief ? categories.find((c) => c.key === brief.category)?.icon : undefined;

  const send = () => {
    if (!brief?.poster) return;
    start.mutate(
      { partner_code: brief.poster.partner_code, body: body.trim(), brief_id: brief.id },
      { onSuccess: (c) => onOpenThread(c.id) },
    );
  };

  return (
    <FullScreenModal
      labelId="brief-detail-title"
      onClose={onClose}
      title={brief?.title ?? (isLoading ? "Loading brief…" : "Brief")}
      subtitle={brief ? `${brief.category_name} · posted ${formatDay(brief.created_at)}` : undefined}
      footer={
        brief ? (
          <div className="mx-auto flex w-full max-w-3xl justify-end gap-3">
            <button onClick={onClose} className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200">Close</button>
            {brief.is_mine ? (
              <>
                <button
                  onClick={() => setBriefStatus.mutate({ id: brief.id, status: brief.status === "open" ? "closed" : "open" })}
                  className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                >
                  {brief.status === "open" ? "Close brief" : "Reopen"}
                </button>
                <button onClick={() => onEdit(brief)} className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"><i className="ri-edit-line" /> Edit</button>
              </>
            ) : (
              !responding && brief.poster && (signedIn ? (
                <button onClick={() => setResponding(true)} className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover">
                  <i className="ri-reply-line" /> Respond
                </button>
              ) : (
                <SignInLink className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover">
                  <i className="ri-login-box-line" /> Sign in to respond
                </SignInLink>
              ))
            )}
          </div>
        ) : undefined
      }
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-5 sm:px-8 sm:py-8">
        {isLoading ? (
          <div className="h-72 animate-pulse rounded-2xl bg-white shadow-card" />
        ) : error || !brief ? (
          <LoadError what="this brief" error={error} />
        ) : (
          <>
            <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-card sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryChip icon={icon} name={brief.category_name} tone="brand" />
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${brief.status === "open" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  {brief.status === "open" ? "Open" : "Closed"}
                </span>
                {brief.is_mine && brief.response_count != null && (
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-brand">{brief.response_count} response{brief.response_count === 1 ? "" : "s"}</span>
                )}
              </div>
              <h3 className="text-lg font-bold leading-7 text-gray-900 sm:text-xl">{brief.title}</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Fact icon="ri-money-naira-circle-line" label="Budget" value={budgetLabel(brief.budget_min, brief.budget_max)} />
                <Fact icon="ri-map-pin-line" label="Locations" value={brief.locations.length ? brief.locations.join(", ") : "Anywhere"} />
                <Fact icon="ri-calendar-event-line" label="Needed by" value={brief.needed_by ? formatDay(brief.needed_by) : "No deadline"} tone={due?.urgent ? "amber" : undefined} />
              </div>
              <p className="whitespace-pre-line text-sm leading-6 text-gray-600">{brief.description}</p>
              {brief.requirements.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Requirements</p>
                  <ul className="flex flex-col gap-1.5">
                    {brief.requirements.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-sm text-gray-700"><i className="ri-checkbox-circle-fill mt-0.5 text-brand" />{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {brief.poster && !brief.is_mine && (
              <section className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card sm:p-5">
                <PartnerLogo partner={brief.poster} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-gray-400">Posted by</p>
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-bold text-gray-900">{brief.poster.partner_name}</p>
                    {brief.poster.is_verified && <VerifiedBadge compact />}
                  </div>
                  {placeOf(brief.poster) && <p className="truncate text-xs text-gray-500">{placeOf(brief.poster)}</p>}
                </div>
                <button onClick={() => onOpenPartner(brief.poster!.partner_code)} className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-brand hover:bg-orange-50">
                  Storefront
                </button>
              </section>
            )}

            {responding && brief.poster && (
              <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card ring-2 ring-orange-100 sm:p-5">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Respond to {brief.poster.partner_name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">Say how you'd do it, what it would cost, and when you could start. It opens a conversation in your inbox.</p>
                </div>
                <Composer
                  value={body}
                  onChange={setBody}
                  onSend={send}
                  sending={start.isPending}
                  autoFocus
                  minRows={4}
                  sendLabel="Send response"
                  placeholder="We can take this on — we run 10-tonne trucks on that route weekly…"
                  context={
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-brand">
                      <i className="ri-file-list-3-line" /> About: {brief.title}
                    </span>
                  }
                />
              </section>
            )}
          </>
        )}
      </div>
    </FullScreenModal>
  );
}

function Fact({ icon, label, value, tone }: { icon: string; label: string; value: string; tone?: "amber" }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
      <i className={`${icon} mt-0.5 ${tone === "amber" ? "text-amber-600" : "text-gray-400"}`} />
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-gray-400">{label}</p>
        <p className={`text-sm font-semibold ${tone === "amber" ? "text-amber-700" : "text-gray-900"}`}>{value}</p>
      </div>
    </div>
  );
}

function PostCta({ onPost }: { onPost: () => void }) {
  const { signedIn } = useNetwork();
  return signedIn ? (
    <button onClick={onPost} className="mt-4 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-hover">Post a brief</button>
  ) : (
    <SignInLink className="mt-4 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-hover">Sign in to post a brief</SignInLink>
  );
}
