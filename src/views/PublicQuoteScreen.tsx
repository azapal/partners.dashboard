import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { QuotePageView } from "../components/quote/QuotePageView";
import { recordQuoteContact, usePublicQuotePage, useSubmitPublicQuote } from "../hooks/useQuotePage";

/**
 * /quote/:slug — a partner's public quote page. No login and no dashboard
 * chrome: this is the partner's customer, not the partner. Everything shown
 * comes from the public quote-pages endpoint, and App.tsx keeps the Azapal
 * assistant off this route.
 */
export const PublicQuoteScreen = () => {
  const { slug = "" } = useParams();
  const { data: page, isPending, isError } = usePublicQuotePage(slug);
  const submit = useSubmitPublicQuote(slug);

  useEffect(() => {
    if (page) document.title = `${page.partner_name} — moving quote`;
  }, [page]);

  if (isPending || isError || !page) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 text-center">
        {isPending ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <div>
            <p className="text-base font-semibold text-gray-800">This quote page isn't available.</p>
            <p className="mt-1 text-sm text-gray-500">Check the link, or contact the company that sent it to you.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <QuotePageView
      page={page}
      onSubmit={(payload) => submit.mutateAsync(payload)}
      onContact={(reference, channel) => void recordQuoteContact(slug, reference, channel)}
    />
  );
};
