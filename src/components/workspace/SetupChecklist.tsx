import { Link } from "react-router-dom";
import { useOnboarding } from "../../hooks/useKyc";

/**
 * What a new partner still has to do, on the screen they land on.
 *
 * Computed server-side from what is actually true — a logo that exists, a
 * branch that exists, a verification that passed — rather than ticked off as
 * someone walks a wizard. A checklist that can disagree with the account it
 * describes is worse than none.
 *
 * It disappears once everything is done. A permanent "you're all set" panel is
 * clutter on every visit for the rest of the partner's life.
 */

export const SetupChecklist = () => {
  const { data: onboarding } = useOnboarding();
  if (!onboarding || onboarding.complete) return null;

  const next = onboarding.steps.find((step) => !step.done);
  const percent = Math.round((onboarding.done / onboarding.total) * 100);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Finish setting up</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            {onboarding.done} of {onboarding.total} done
            {onboarding.billable_blocked && " · verification opens the rest"}
          </p>
        </div>
        {next && (
          <Link
            to={next.to}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            {next.label}
          </Link>
        )}
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${percent}%` }} />
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {onboarding.steps.map((step) => (
          <li key={step.key}>
            <Link
              to={step.to}
              className={`flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 transition-colors ${
                step.done ? "bg-gray-50" : "border border-gray-200 hover:border-gray-300"
              }`}
            >
              <i
                className={`mt-0.5 shrink-0 ${
                  step.done ? "ri-checkbox-circle-fill text-emerald-500" : "ri-checkbox-blank-circle-line text-gray-300"
                }`}
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className={`block text-sm font-medium ${step.done ? "text-gray-400 line-through" : "text-gray-800"}`}>
                  {step.label}
                  {step.skipped && (
                    <span className="ml-1.5 rounded-full bg-amber-50 px-1.5 py-0.5 align-middle text-[10px] font-semibold text-amber-700">
                      Skipped
                    </span>
                  )}
                </span>
                {!step.done && <span className="block text-[11px] text-gray-400">{step.description}</span>}
                {/* Verification is the one step that changes what else works,
                    so it says where it has got to rather than just "not done". */}
                {step.key === "kyc" && !step.done && step.status === "in_review" && (
                  <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    We're checking your documents
                  </span>
                )}
                {step.key === "kyc" && !step.done && step.status === "declined" && (
                  <span className="mt-1 inline-block rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                    Needs attention
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
