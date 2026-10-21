import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { kycKeys, useKycState, useSubmitKyc, useUploadKycDocument } from "../../hooks/useKyc";
import { useUpdatePartnerProfile } from "../../hooks/useAuth";
import type { KycDocument, KycDocumentKind, KycStatus } from "../../service/partnerService";

/**
 * Proving the business is real.
 *
 * Three things are required — a certificate of incorporation, a director's ID,
 * and a phone number a reviewer can ring — and until they pass, the parts of
 * Azapal that cost money stay shut. The panel says which those are up front
 * rather than letting a partner discover it by being refused somewhere else.
 *
 * The phone number is the partner's own profile field, edited here because this
 * is where it is needed: papers can be forged and a company can be dissolved,
 * and being answerable on a number is often the quickest thing that tells a real
 * operator from a convincing PDF. It also gives a reviewer somewhere to take a
 * query instead of declining and leaving the partner to guess why.
 *
 * Files go straight from the browser to a private bucket; nothing here is ever
 * a link that can be shared, and the API never sees the bytes.
 */

const STATUS: Record<KycStatus, { label: string; tone: string; blurb: string }> = {
  not_started: {
    label: "Not verified",
    tone: "bg-amber-50 text-amber-800",
    blurb: "Send us two documents and a phone number, and we'll check them — usually within a working day.",
  },
  in_review: {
    label: "In review",
    tone: "bg-blue-50 text-blue-800",
    blurb: "We have your documents. You can carry on working while we check them.",
  },
  verified: {
    label: "Verified",
    tone: "bg-emerald-50 text-emerald-800",
    blurb: "Your business is verified. Everything on your account is open.",
  },
  declined: {
    label: "Needs attention",
    tone: "bg-red-50 text-red-800",
    blurb: "We couldn't verify your business from what you sent.",
  },
};

const BLOCKED_WHILE_UNVERIFIED = [
  "Creating a branch",
  "Publishing your quote page",
  "Opening a virtual account",
  "Taking payment links",
];

export const VerificationPanel = () => {
  const { data: kyc, isPending, isError, error, refetch } = useKycState();
  const submit = useSubmitKyc();

  if (isPending) return <p className="text-sm text-gray-400">Loading…</p>;
  if (isError || !kyc) {
    return (
      <div>
        <p className="text-sm text-gray-500">Couldn't load your verification{error?.message ? ` — ${error.message}` : "."}</p>
        <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-semibold text-brand hover:text-brand-hover">
          Try again
        </button>
      </div>
    );
  }

  const state = STATUS[kyc.status];

  return (
    <div className="flex flex-col gap-5">
      <div className={`rounded-xl px-4 py-3.5 ${state.tone}`}>
        <p className="flex items-center gap-2 text-sm font-semibold">
          <i className={kyc.status === "verified" ? "ri-shield-check-line" : "ri-shield-line"} aria-hidden="true" />
          {state.label}
        </p>
        <p className="mt-1 text-xs leading-5">{kyc.status === "declined" && kyc.note ? kyc.note : state.blurb}</p>
      </div>

      {kyc.status !== "verified" && (
        <div className="rounded-xl bg-gray-50 px-4 py-3.5">
          <p className="text-xs font-semibold text-gray-700">Shut until you're verified</p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {BLOCKED_WHILE_UNVERIFIED.map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-gray-500">
                <i className="ri-lock-line text-gray-300" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-gray-400">
            Everything else keeps working — orders, leads, invoices and your team.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <PhoneRow phone={kyc.phone ?? ""} locked={kyc.status === "verified" || kyc.status === "in_review"} />
        {kyc.documents.map((doc) => (
          <DocumentRow key={doc.kind} doc={doc} locked={kyc.status === "verified" || kyc.status === "in_review"} />
        ))}
      </div>

      {kyc.status !== "verified" && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-400">
            {(() => {
              const outstanding = [
                ...kyc.documents.filter((d) => kyc.missing.includes(d.kind)).map((d) => d.label),
                ...(kyc.needs_phone ? ["a phone number"] : []),
              ];
              if (outstanding.length > 0) return `Still needed: ${outstanding.join(", ")}.`;
              return kyc.status === "in_review" ? "Sent. We'll email you when it's checked." : "Ready to send.";
            })()}
          </p>
          <button
            type="button"
            onClick={() => submit.mutate()}
            disabled={!kyc.can_submit || submit.isPending}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submit.isPending ? "Sending…" : "Send for verification"}
          </button>
        </div>
      )}

      <p className="text-[11px] text-gray-400">
        Your documents are stored privately and only seen by the Azapal team reviewing them. They're never shown on your
        quote page or your invoices — that's{" "}
        <Link to="/financials" className="font-semibold text-brand hover:text-brand-hover">your branding</Link>.
      </p>
    </div>
  );
};

/**
 * The number itself, edited in place.
 *
 * It is the partner's profile field, saved through the profile endpoint — this
 * panel does not keep a second copy of it. Saving invalidates the verification
 * state because `can_submit` turns on this number being there.
 */
const PhoneRow = ({ phone, locked }: { phone: string; locked: boolean }) => {
  const qc = useQueryClient();
  const update = useUpdatePartnerProfile("Phone number saved.");
  const [value, setValue] = useState(phone);

  const trimmed = value.trim();
  const dirty = trimmed !== phone.trim();

  const save = () => {
    update.mutate(
      { partner_phone: trimmed },
      { onSuccess: () => qc.invalidateQueries({ queryKey: kycKeys.all }) },
    );
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 px-4 py-3 sm:flex-row sm:items-center">
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
          Phone number
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">Required</span>
        </span>
        <span className="mt-0.5 block text-[11px] text-gray-400">
          {locked
            ? phone || "Not given"
            : "Where we'll call if we have a question about your documents."}
        </span>
      </span>

      {!locked && (
        <>
          <input
            type="tel"
            value={value}
            aria-label="Phone number"
            placeholder="+234 801 234 5678"
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand sm:w-56"
          />
          <button
            type="button"
            onClick={save}
            disabled={!dirty || !trimmed || update.isPending}
            className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            {update.isPending ? "Saving…" : "Save"}
          </button>
        </>
      )}
    </div>
  );
};

const DocumentRow = ({ doc, locked }: { doc: KycDocument; locked: boolean }) => {
  const upload = useUploadKycDocument();
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (file: File | undefined) => {
    if (!file) return;
    upload.mutate({ kind: doc.kind as KycDocumentKind, file });
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 px-4 py-3 sm:flex-row sm:items-center">
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
          {doc.label}
          {doc.required ? (
            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">Required</span>
          ) : (
            <span className="text-[11px] text-gray-400">Optional</span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-gray-400">
          {upload.isPending
            ? "Uploading…"
            : doc.uploaded
              ? `${doc.filename || "Uploaded"}${doc.note ? ` · ${doc.note}` : ""}`
              : "Nothing uploaded yet"}
        </span>
      </span>

      {doc.uploaded && (
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            doc.status === "verified"
              ? "bg-emerald-50 text-emerald-700"
              : doc.status === "declined"
                ? "bg-red-50 text-red-700"
                : "bg-gray-100 text-gray-500"
          }`}
        >
          {doc.status === "verified" ? "Verified" : doc.status === "declined" ? "Declined" : "Sent"}
        </span>
      )}

      {!locked && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            aria-label={`Upload ${doc.label}`}
            onChange={(e) => pick(e.target.files?.[0])}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
            className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            {doc.uploaded ? "Replace" : "Upload"}
          </button>
        </>
      )}
    </div>
  );
};
