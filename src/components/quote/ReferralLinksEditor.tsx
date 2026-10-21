import { useState } from "react";
import type { QuoteReferral } from "../../service/partnerService";

/**
 * A page's reference links — the same quote page with `?r=<code>` on the end.
 *
 * One link per place the partner shares it (Instagram bio, a Facebook post, a
 * flyer's QR code), so every visit and every lead says where it came from. The
 * two counts together are the point: clicks say whether anyone is following the
 * link, leads say whether the page then did its job.
 *
 * The code is derived from the name rather than typed: it ends up in a link the
 * partner pastes in public, and "instagram-bio" reads better there than
 * whatever they'd have typed. It is fixed once the link is saved, because
 * changing it orphans the copies already out in the world.
 */

const MAX_LINKS = 20;

/** The code that goes in the link: lowercase, hyphens, nothing exotic. */
export const referralCode = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
    .replace(/-+$/, "");

const uniqueCode = (name: string, taken: Set<string>) => {
  const base = referralCode(name) || "link";
  if (!taken.has(base)) return base;
  for (let n = 2; n < 100; n += 1) {
    const next = `${base.slice(0, 29)}-${n}`;
    if (!taken.has(next)) return next;
  }
  return `${base.slice(0, 26)}-${Date.now().toString(36).slice(-4)}`;
};

export const ReferralLinksEditor = ({
  links,
  pageLink,
  bareClicks,
  onChange,
}: {
  links: QuoteReferral[];
  /** The page's own share link, which each reference link hangs off. */
  pageLink: string;
  /** Clicks on that bare link, by people who followed no reference link. */
  bareClicks: number;
  onChange: (links: QuoteReferral[]) => void;
}) => {
  const [name, setName] = useState("");
  const [copied, setCopied] = useState("");

  const add = () => {
    const label = name.trim().slice(0, 40);
    if (!label || links.length >= MAX_LINKS) return;
    onChange([...links, { code: uniqueCode(label, new Set(links.map((l) => l.code))), label, clicks: 0, leads: 0 }]);
    setName("");
  };

  const copy = (code: string) => {
    navigator.clipboard?.writeText(`${pageLink}?r=${code}`).then(
      () => { setCopied(code); setTimeout(() => setCopied(""), 2000); },
      () => undefined,
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {links.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {links.map((link, index) => (
            <li key={link.code} className="flex flex-col gap-2 rounded-xl bg-gray-50 px-3 py-2.5 sm:flex-row sm:items-center">
              <span className="min-w-0 flex-1">
                <input
                  value={link.label}
                  onChange={(e) =>
                    onChange(links.map((l, i) => (i === index ? { ...l, label: e.target.value.slice(0, 40) } : l)))
                  }
                  aria-label={`Name for ${link.code}`}
                  className="w-full rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-gray-800 outline-none hover:border-gray-200 focus:border-brand focus:bg-white"
                />
                <span className="mt-0.5 block truncate px-1 text-[11px] text-gray-400">
                  {pageLink}?r={link.code}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    link.clicks > 0 ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-400"
                  }`}
                  title="People who opened the page through this link"
                >
                  {link.clicks} {link.clicks === 1 ? "click" : "clicks"}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    link.leads > 0 ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"
                  }`}
                  title="Requests left after following this link"
                >
                  {link.leads} {link.leads === 1 ? "lead" : "leads"}
                </span>
                <button
                  type="button"
                  onClick={() => copy(link.code)}
                  className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <i className={`${copied === link.code ? "ri-check-line" : "ri-file-copy-line"} mr-1`} />
                  {copied === link.code ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={() => onChange(links.filter((_, i) => i !== index))}
                  aria-label={`Remove ${link.label || link.code}`}
                  className="text-gray-300 transition-colors hover:text-red-500"
                >
                  <i className="ri-close-line text-base" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 40))}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Where you'll share it — Instagram bio, Facebook page…"
          aria-label="Name a new reference link"
          disabled={links.length >= MAX_LINKS}
          className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-orange-50 disabled:opacity-40"
        />
        <button
          type="button"
          onClick={add}
          disabled={!name.trim() || links.length >= MAX_LINKS}
          className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          Add link
        </button>
      </div>
      <p className="text-[11px] text-gray-400">
        {links.length >= MAX_LINKS ? `That's all ${MAX_LINKS} links. ` : ""}
        {bareClicks > 0 && `${bareClicks} ${bareClicks === 1 ? "person" : "people"} opened your page without following one of these. `}
        Renaming a link is safe; the link itself never changes.
      </p>
    </div>
  );
};
