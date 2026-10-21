import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/**
 * The frame every rep/employee sign-in screen sits in: a form column and a
 * photo brand panel.
 *
 * About the photo: /images/support-port.jpg is a 600×197 panorama. Stretched
 * over a full-height panel it would be ~4× upscaled and visibly soft, so it is
 * never used that way. On desktop it sits as a band along the foot of the navy
 * panel at roughly its native width, fading up into the navy; on mobile it is a
 * short header, which is *smaller* than the source. In both places a navy
 * gradient sits over it, so what softness there is reads as atmosphere.
 *
 * The two entry points (support rep vs branch) share this frame but carry
 * different icons, accents and copy, and the switcher at the top of the card
 * links between them — the same two routes the old screens cross-linked.
 */

export type SupportAuthMode = "support" | "branch";

const MODE_COPY: Record<SupportAuthMode, { eyebrow: string; headline: string; body: string; points: { icon: string; text: string }[] }> = {
  support: {
    eyebrow: "Customer support",
    headline: "Every conversation, one calm queue.",
    body: "Pick up WhatsApp conversations, price and dispatch orders, and pull in a teammate when a customer needs more.",
    points: [
      { icon: "ri-chat-smile-2-line", text: "Your assigned conversations" },
      { icon: "ri-truck-line", text: "Branch orders and driver dispatch" },
      { icon: "ri-group-line", text: "Escalate to whoever is on shift" },
    ],
  },
  branch: {
    eyebrow: "Branch access",
    headline: "Step into the branch you run.",
    body: "For branch managers and Super Admins. Choose the branch you want to work in and you'll land with its team, orders and quote leads.",
    points: [
      { icon: "ri-git-branch-line", text: "Work inside one branch at a time" },
      { icon: "ri-team-line", text: "See your team's load and escalations" },
      { icon: "ri-price-tag-3-line", text: "Chase the leads from your quote page" },
    ],
  },
};

const ENTRY_LINKS: { mode: SupportAuthMode; to: string; label: string; icon: string }[] = [
  { mode: "support", to: "/support/login", label: "Support rep", icon: "ri-customer-service-2-line" },
  { mode: "branch", to: "/support/branch-login", label: "Branch login", icon: "ri-git-branch-line" },
];

export const SupportAuthShell = ({
  mode,
  step,
  children,
  footer,
}: {
  mode: SupportAuthMode;
  /** Shown as "Step n of 2" above the form. */
  step: 1 | 2;
  children: ReactNode;
  footer?: ReactNode;
}) => {
  const copy = MODE_COPY[mode];

  return (
    <div className="min-h-screen bg-[#f7f5f2] text-slate-900 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* ── Mobile photo header ─────────────────────────────────────────── */}
      <div className="relative h-44 overflow-hidden bg-brand-navy lg:hidden">
        <img
          src="/images/support-port.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[30%_60%]"
        />
        <div className="absolute inset-0 bg-linear-to-b from-brand-navy/80 via-brand-navy/45 to-brand-navy/85" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_35%,rgba(251,191,36,0.28),transparent_45%)]" />
        <div className="relative flex h-full flex-col justify-between px-5 pt-5 pb-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
              <img src="/azapallogoV1.svg" alt="Azapal" className="h-6 w-auto" />
            </span>
            <span className="text-sm font-semibold text-white">Azapal</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">{copy.eyebrow}</p>
            <p className="mt-1 text-lg font-semibold leading-snug text-white">{copy.headline}</p>
          </div>
        </div>
      </div>

      {/* ── Form column ─────────────────────────────────────────────────── */}
      <div className="relative z-10 -mt-6 flex flex-col px-4 pb-8 sm:px-8 lg:mt-0 lg:min-h-screen lg:justify-center lg:px-12 lg:py-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 hidden items-center gap-3 lg:flex">
            <img src="/azapallogoV1.svg" alt="Azapal" className="h-9 w-auto" />
            <span className="h-5 w-px bg-slate-200" />
            <span className="text-sm font-medium text-slate-500">Operations workspace</span>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-[0_24px_60px_-28px_rgba(13,27,61,0.35)] ring-1 ring-slate-900/5 sm:p-8">
            {/* Entry-point switcher: which door you're coming through. */}
            <nav aria-label="Sign-in type" className="mb-7 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
              {ENTRY_LINKS.map((link) => {
                const active = link.mode === mode;
                return (
                  <Link
                    key={link.mode}
                    to={link.to}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                      active ? "bg-white text-brand-navy shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <i className={`${link.icon} text-base ${active ? (link.mode === "branch" ? "text-amber-600" : "text-brand") : ""}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Step {step} of 2
            </p>

            {children}
          </div>

          {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}

          <p className="mt-8 text-center text-xs text-slate-400">
            Signing in as the business owner?{" "}
            <Link to="/" className="font-medium text-slate-600 hover:text-brand">
              Partner login
            </Link>
          </p>
        </div>
      </div>

      {/* ── Desktop brand panel ─────────────────────────────────────────── */}
      <aside className="relative m-3 hidden overflow-hidden rounded-[28px] bg-brand-navy text-white lg:flex lg:flex-col">
        {/* The photo band: pinned to the foot of the panel at near its native
            600px width, faded up into the navy so there's no hard top edge. */}
        <div className="absolute inset-x-0 bottom-0 h-72 xl:h-80">
          <img
            src="/images/support-port.jpg"
            alt="Container ship leaving port at sunset"
            className="absolute inset-0 h-full w-full object-cover object-[50%_70%]"
          />
          <div className="absolute inset-0 bg-linear-to-b from-brand-navy via-brand-navy/40 to-brand-navy/5" />
          <div className="absolute inset-0 bg-linear-to-r from-brand-navy/50 via-transparent to-transparent" />
        </div>
        {/* Glow over everything, photo included, so the two blend. */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_80%,rgba(251,191,36,0.18),transparent_40%),radial-gradient(circle_at_10%_0%,rgba(241,71,36,0.18),transparent_40%)]" />

        <div className="relative flex flex-1 flex-col p-10 pb-60 xl:p-14 xl:pb-64">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
              <img src="/azapallogoV1.svg" alt="" className="h-7 w-auto" />
            </span>
            <div>
              <p className="text-sm font-semibold">Azapal</p>
              <p className="text-xs text-white/55">Operations workspace</p>
            </div>
          </div>

          <div className="mt-auto max-w-lg pt-12">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                mode === "branch" ? "bg-amber-400/15 text-amber-200" : "bg-brand/20 text-orange-200"
              }`}
            >
              <i className={mode === "branch" ? "ri-git-branch-line" : "ri-customer-service-2-line"} />
              {copy.eyebrow}
            </span>
            <h2 className="mt-4 text-[34px] font-semibold leading-[1.15] tracking-tight xl:text-[40px]">{copy.headline}</h2>
            <p className="mt-4 text-sm leading-6 text-white/70">{copy.body}</p>

            <ul className="mt-7 space-y-3">
              {copy.points.map((p) => (
                <li key={p.text} className="flex items-center gap-3 text-sm text-white/85">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                    <i className={`${p.icon} text-base text-amber-200`} />
                  </span>
                  {p.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </aside>
    </div>
  );
};

/** Shared input look for the sign-in forms. */
export const authInputClass =
  "w-full h-12 px-4 text-base border border-slate-200 rounded-xl bg-white outline-none transition focus:border-brand focus:ring-4 focus:ring-orange-100 text-slate-900 placeholder:text-slate-300 disabled:opacity-50";

export const authPrimaryButtonClass =
  "w-full h-12 bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold text-base rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-brand-navy/20 disabled:opacity-60 disabled:cursor-not-allowed";
