import { useState } from "react";
import { RepDashboardLayout } from "../../layouts/RepDashboardLayout";
import { QuotePageSettings } from "../../components/quote/QuotePageSettings";
import { useQuotePages } from "../../hooks/useQuotePage";

/**
 * A branch's own quote page, for the manager who runs that branch.
 *
 * They get the parts a branch may differ on — its link, whether it's published,
 * its wording and where its leads go. What the page quotes for, and the prices
 * behind it, belong to the company page and are read-only here.
 *
 * `limited` keeps this off the admin-only endpoints (branding, price lists): a
 * 403 would sign them out, since the app reads one as an expired session.
 */
export const RepQuotePageScreen = () => {
  const { data: pages = [], isPending, isError } = useQuotePages();
  const mine = pages.filter((p) => p.branch !== null);
  const [branchId, setBranchId] = useState<number | null>(null);
  const editing = mine.find((p) => p.branch === branchId) ?? mine[0];

  return (
    <RepDashboardLayout>
      <div className="flex w-full flex-col gap-4 overflow-y-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-sm text-gray-500">
            The page your branch shares with customers. Anything you don't set here follows your company's page.
          </p>
          {mine.length > 1 && (
            <select
              value={editing?.branch ?? ""}
              onChange={(e) => setBranchId(Number(e.target.value))}
              aria-label="Which branch"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
            >
              {mine.map((p) => (
                <option key={p.branch} value={p.branch ?? ""}>{p.branch_code}</option>
              ))}
            </select>
          )}
        </div>

        {isPending ? (
          <p className="rounded-2xl bg-white py-14 text-center text-sm text-gray-400 shadow-card">Loading…</p>
        ) : isError || !editing ? (
          <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-card">
            <p className="text-sm text-gray-500">
              You don't manage a branch quote page. Ask an admin to make you a manager of your branch.
            </p>
          </div>
        ) : (
          <QuotePageSettings view="page" branchId={editing.branch} limited />
        )}
      </div>
    </RepDashboardLayout>
  );
};
