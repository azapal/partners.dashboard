import { useState } from "react";
import { RepDashboardLayout } from "../../layouts/RepDashboardLayout";
import { QuotePageSettings } from "../../components/quote/QuotePageSettings";
import { useQuotePages } from "../../hooks/useQuotePage";
import { Card, EmptyState, PageIntro } from "../../components/support/SupportUI";

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
      <div className="flex w-full flex-col gap-5">
        <PageIntro
          actions={
            mine.length > 1 ? (
              <label className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <i className="ri-git-branch-line text-amber-600" />
                <select
                  value={editing?.branch ?? ""}
                  onChange={(e) => setBranchId(Number(e.target.value))}
                  aria-label="Which branch"
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand focus:ring-4 focus:ring-orange-100"
                >
                  {mine.map((p) => (
                    <option key={p.branch} value={p.branch ?? ""}>{p.branch_code}</option>
                  ))}
                </select>
              </label>
            ) : undefined
          }
        >
          The page your branch shares with customers. Anything you don't set here follows your company's page.
        </PageIntro>

        {isPending ? (
          <Card>
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400" role="status">
              <i className="ri-loader-4-line animate-spin text-lg" />
              Loading your quote page…
            </div>
          </Card>
        ) : isError || !editing ? (
          <Card>
            <EmptyState icon="ri-pages-line" title="No branch quote page">
              You don't manage a branch quote page. Ask an admin to make you a manager of your branch.
            </EmptyState>
          </Card>
        ) : (
          <QuotePageSettings view="page" branchId={editing.branch} limited />
        )}
      </div>
    </RepDashboardLayout>
  );
};
