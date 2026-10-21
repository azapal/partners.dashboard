import { useSalesContact } from "../../hooks/useMobility";

/**
 * "Need more than this? Talk to sales."
 *
 * The details are Azapal staff's to change, from the KYC portal's settings, so
 * nothing here is hard-coded. A channel staff haven't filled in is left out
 * rather than shown blank, and with none at all the card says nothing — a
 * "contact us" with no way to contact anyone is worse than no card.
 */

const digits = (phone: string) => phone.replace(/\D/g, "");

export const SalesContactCard = ({
  title = "Need more than this?",
  body,
  /** Prefilled into the email subject and WhatsApp message so sales knows the context. */
  topic,
  className = "",
}: {
  title?: string;
  body: string;
  topic: string;
  className?: string;
}) => {
  const { data: contact } = useSalesContact();
  if (!contact) return null;

  const message = `Hi Azapal sales — I'd like to talk about ${topic}.`;
  const channels = [
    contact.sales_email && {
      key: "email",
      icon: "ri-mail-line",
      label: "Email",
      detail: contact.sales_email,
      href: `mailto:${contact.sales_email}?subject=${encodeURIComponent(topic)}&body=${encodeURIComponent(message)}`,
    },
    contact.sales_phone && {
      key: "phone",
      icon: "ri-phone-line",
      label: "Call",
      detail: contact.sales_phone,
      href: `tel:${contact.sales_phone}`,
    },
    contact.sales_whatsapp && {
      key: "whatsapp",
      icon: "ri-whatsapp-line",
      label: "WhatsApp",
      detail: contact.sales_whatsapp,
      href: `https://wa.me/${digits(contact.sales_whatsapp)}?text=${encodeURIComponent(message)}`,
    },
  ].filter(Boolean) as { key: string; icon: string; label: string; detail: string; href: string }[];

  if (channels.length === 0) return null;

  return (
    <section className={`rounded-2xl bg-white p-5 shadow-card ${className}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-brand">
          <i className="ri-customer-service-2-line text-lg" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="mt-0.5 text-xs leading-5 text-gray-500">{body}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {channels.map((c) => (
          <a
            key={c.key}
            href={c.href}
            target={c.key === "whatsapp" ? "_blank" : undefined}
            rel={c.key === "whatsapp" ? "noreferrer" : undefined}
            className="flex min-w-0 items-center gap-2.5 rounded-xl border border-gray-200 px-3.5 py-2.5 transition-colors hover:border-brand hover:bg-orange-50"
          >
            <i className={`${c.icon} text-base ${c.key === "whatsapp" ? "text-emerald-600" : "text-gray-500"}`} />
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-gray-800">{c.label}</span>
              <span className="block truncate text-[11px] text-gray-500">{c.detail}</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
};
