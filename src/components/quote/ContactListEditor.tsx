import { useState } from "react";
import type {
  QuoteContact,
  QuoteContactList,
  QuoteListChannel,
  QuoteTeammate,
} from "../../service/partnerService";

/**
 * Who answers one channel on the quote page — WhatsApp, a text or Instagram.
 *
 * Two ways in, and a page can mix them: pick people off the team, and type any
 * other number — a sales line, a landline, someone who isn't a user here.
 *
 * A teammate is stored as a link, never a copy of their number or handle: the
 * server reads it from their profile when a request comes in, so it follows them
 * when it changes and drops out if they leave.
 *
 * The picker lists everyone, grouped by branch — a company page usually answers
 * from head office, and one branch often covers another's calls — with anyone
 * who has nothing on file for this channel shown but unpickable, so it reads as
 * "add their number" rather than "that person doesn't exist". A branch manager
 * editing their own page sees their own branch's people only; that's what the
 * server sends them.
 *
 * `interchange` points each new request at the next contact instead of always
 * the first, which is why the chosen rows carry their turn.
 */

const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];

export const ContactListEditor = ({
  channel,
  label,
  icon,
  placeholder,
  hint,
  value,
  teammates,
  onChange,
}: {
  channel: QuoteListChannel;
  label: string;
  icon: string;
  placeholder: string;
  hint: string;
  value?: QuoteContactList;
  teammates: QuoteTeammate[];
  onChange: (value: QuoteContactList) => void;
}) => {
  const contacts = value?.contacts ?? [];
  const interchange = value?.interchange ?? false;
  const [typed, setTyped] = useState("");
  // Instagram reaches a teammate on their handle; the other two on their phone.
  const teammateAddress = (t: QuoteTeammate) => (channel === "instagram" ? t.social_handle : t.phone)?.trim() || null;
  const nothingOnFile = channel === "instagram" ? "no handle on file" : "no number on file";

  const set = (next: QuoteContact[], nextInterchange = interchange) =>
    // Losing the second contact leaves nothing to alternate with.
    onChange({ contacts: next, interchange: next.length > 1 ? nextInterchange : false });

  const turn = (index: number) => ORDINALS[index] ?? `${index + 1}th`;
  const showTurns = contacts.length > 1 && interchange;

  const linkedIds = new Set(contacts.map((c) => c.employee_id).filter(Boolean));
  const pickable = teammates.filter((t) => teammateAddress(t) && !linkedIds.has(t.id));

  // Everyone not already on the list, head office first, then a group per branch.
  const rest = teammates.filter((t) => !linkedIds.has(t.id));
  const branches = [...new Map(rest.filter((t) => t.branch).map((t) => [t.branch!.id, t.branch!])).values()]
    .sort((a, b) => a.branch_code.localeCompare(b.branch_code));
  const groups = [
    { key: "head-office", label: "Head office", people: rest.filter((t) => !t.branch) },
    ...branches.map((branch) => ({
      key: String(branch.id),
      label: branch.branch_code,
      people: rest.filter((t) => t.branch?.id === branch.id),
    })),
  ].filter((g) => g.people.length > 0);

  const addTyped = () => {
    if (!typed.trim()) return;
    set([...contacts, { employee_id: null, address: typed.trim(), label: "" }]);
    setTyped("");
  };

  return (
    <div className="rounded-xl border border-gray-100 p-3.5">
      <p className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <i className={`${icon} text-base text-gray-400`} aria-hidden="true" />
        {label}
      </p>
      <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p>

      {contacts.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {contacts.map((contact, index) => {
            const teammate = teammates.find((t) => t.id === contact.employee_id);
            const address = teammate ? teammateAddress(teammate) : contact.address;
            const gone = !!contact.employee_id && !teammate;
            return (
              <li
                key={`${contact.employee_id ?? contact.address}-${index}`}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 ${gone ? "bg-amber-50" : "bg-gray-50"}`}
              >
                <i
                  className={`${gone ? "ri-user-unfollow-line text-amber-500" : contact.employee_id ? "ri-user-line text-gray-400" : "ri-phone-line text-gray-400"}`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 text-xs">
                  <span className="block truncate font-medium text-gray-800">
                    {contact.employee_id ? teammate?.name ?? contact.label ?? "Teammate" : contact.label || "Number"}
                  </span>
                  <span className={`block truncate ${gone || (contact.employee_id && !address) ? "text-amber-600" : "text-gray-400"}`}>
                    {gone
                      ? "no longer on your team"
                      : `${address ?? nothingOnFile}${teammate?.branch ? ` · ${teammate.branch.branch_code}` : ""}`}
                  </span>
                </span>
                {showTurns && (
                  <span className="shrink-0 rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                    {turn(index)}
                  </span>
                )}
                {!contact.employee_id && (
                  <input
                    value={contact.label}
                    onChange={(e) =>
                      set(contacts.map((c, i) => (i === index ? { ...c, label: e.target.value.slice(0, 60) } : c)))
                    }
                    placeholder="Label (optional)"
                    aria-label={`Label for ${contact.address}`}
                    className="w-32 shrink-0 rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-brand"
                  />
                )}
                <button
                  type="button"
                  onClick={() => set(contacts.filter((_, i) => i !== index))}
                  aria-label={`Remove ${contact.employee_id ? (teammate?.name ?? "teammate") : contact.address} from ${label}`}
                  className="shrink-0 text-gray-300 transition-colors hover:text-red-500"
                >
                  <i className="ri-close-line text-base" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
        <div className="flex min-w-0 flex-1 gap-2">
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTyped())}
            placeholder={placeholder}
            aria-label={`Add ${channel === "instagram" ? "a handle" : "a number"} for ${label}`}
            className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-orange-50"
          />
          <button
            type="button"
            onClick={addTyped}
            disabled={!typed.trim()}
            className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Add
          </button>
        </div>
        <select
          value=""
          onChange={(e) => {
            const teammate = teammates.find((t) => String(t.id) === e.target.value);
            if (teammate) set([...contacts, { employee_id: teammate.id, address: null, label: teammate.name }]);
          }}
          disabled={pickable.length === 0}
          aria-label={`Add a teammate to ${label}`}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 outline-none focus:border-brand disabled:opacity-40"
        >
          <option value="">
            {teammates.length === 0
              ? "Nobody on your team yet"
              : pickable.length
                ? "+ Add a teammate"
                : channel === "instagram"
                  ? "No teammate left with a handle"
                  : "No teammate left with a number"}
          </option>
          {groups.map((group) => (
            <optgroup key={group.key} label={group.label}>
              {group.people.map((t) => (
                // Someone with nothing on file is listed, but can't be picked:
                // the fix is their profile, not this list.
                <option key={t.id} value={t.id} disabled={!teammateAddress(t)}>
                  {t.name}
                  {t.role ? ` · ${t.role}` : ""}
                  {teammateAddress(t) ? "" : ` — ${nothingOnFile}`}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <p className="mt-1 text-[11px] text-gray-400">
        {channel === "instagram"
          ? "Type any other handle, or pick from your team."
          : "Type any other number — a sales line, a landline — or pick from your team."}
      </p>

      <label className={`mt-3 flex items-start gap-2.5 ${contacts.length > 1 ? "cursor-pointer" : ""}`}>
        <input
          type="checkbox"
          checked={interchange}
          disabled={contacts.length < 2}
          onChange={(e) => set(contacts, e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#F14724]"
        />
        <span>
          <span className={`block text-xs font-semibold ${contacts.length > 1 ? "text-gray-800" : "text-gray-400"}`}>
            Interchange
          </span>
          <span className="block text-[11px] text-gray-400">
            {contacts.length > 1
              ? `Each new request goes to the next contact instead of piling up on the first. Customers see one ${
                  channel === "instagram" ? "handle" : "number"
                } — whoever's turn it is.`
              : "Add a second contact to share the leads between people."}
          </span>
        </span>
      </label>
    </div>
  );
};
