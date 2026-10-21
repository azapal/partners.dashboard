import { Link } from "react-router-dom";
import { usePlatformPrices } from "../../hooks/usePlatformBilling";
import type { PlatformPriceKind } from "../../service/partnerService";

/**
 * What this action will cost, said before the partner does it.
 *
 * The rule the whole billing surface is built on: nothing charges a partner
 * without telling them first, at the moment it applies, in the place they are
 * standing. A price on a settings page they have to go and find is not the same
 * thing as a price on the button.
 *
 * It stays quiet when there is nothing to say — no price list yet, a price
 * Azapal has switched off — because an empty box saying nothing costs anything
 * reads as a warning too.
 */

const naira = (n: number) =>
  `₦${n.toLocaleString(undefined, { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;

export const PriceNotice = ({
  kind,
  /** What this one charge is for, when the unit label alone is too vague. */
  what,
  /** Where the charge lands, when it isn't obvious: "your company account". */
  billedTo,
  className = "",
}: {
  kind: PlatformPriceKind;
  what?: string;
  billedTo?: string;
  className?: string;
}) => {
  const { data: prices = [] } = usePlatformPrices();
  const price = prices.find((p) => p.kind === kind);
  if (!price) return null;

  const left = Math.max(0, price.free_allowance - price.used);
  const free = left > 0;

  return (
    <p
      className={`flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-xs leading-5 ${
        free ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
      } ${className}`}
    >
      <i className={`${free ? "ri-gift-line" : "ri-price-tag-3-line"} mt-0.5 shrink-0`} aria-hidden="true" />
      <span>
        {free ? (
          <>
            <strong className="font-semibold">Free</strong> — {left} of your first {price.free_allowance}{" "}
            {price.free_allowance === 1 ? "is" : "are"} still free. After that it's{" "}
            {naira(price.unit_amount)} {price.unit_label}.
          </>
        ) : (
          <>
            <strong className="font-semibold">{naira(price.unit_amount)}</strong> {price.unit_label}
            {what ? ` for ${what}` : ""}
            {billedTo ? `, billed to ${billedTo}` : ""}.
          </>
        )}{" "}
        Added to next month's bill, not charged now.{" "}
        <Link to="/bills" className="font-semibold underline underline-offset-2">
          See what you're using
        </Link>
      </span>
    </p>
  );
};
