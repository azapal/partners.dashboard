import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { QuotePageView } from "../components/quote/QuotePageView";
import { recordQuoteContact, usePublicQuotePage, useSubmitPublicQuote } from "../hooks/useQuotePage";

/**
 * /quote/:slug — a partner's public quote page. No login and no dashboard
 * chrome: this is the partner's customer, not the partner. Everything shown
 * comes from the public quote-pages endpoint, and App.tsx keeps the Azapal
 * assistant off this route.
 *
 * `?r=` is the partner's reference link — which of their posts, profiles or
 * flyers the customer followed. It is carried into the request so the lead says
 * where it came from; the server keeps it only if the page lists that code, so
 * a stranger appending their own `?r=` writes nothing.
 */
export const PublicQuoteScreen = () => {
  const { slug = "" } = useParams();
  const [params] = useSearchParams();
  const source = params.get("r") ?? undefined;
  const { data: page, isPending, isError } = usePublicQuotePage(slug);
  const submit = useSubmitPublicQuote(slug);

  useEffect(() => {
    if (page) document.title = `${page.partner_name} — get a quote`;
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
      onSubmit={(payload) => submit.mutateAsync({ ...payload, source })}
      onContact={(reference, channel) => void recordQuoteContact(slug, reference, channel)}
    />
  );
};
