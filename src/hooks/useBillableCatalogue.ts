import { useMemo } from 'react';
import { useGetRates } from './useRates';
import { useGetCargoRates, useGetDeliveryMethodRates, useGetRouteRates } from './useRateCards';

/**
 * Everything a partner can bill for, in one list.
 *
 * Pricing lives in four separate places in this codebase — region rates, route rate
 * cards, cargo rate cards and delivery-method rate cards — because each answers a
 * different question when quoting a delivery. None of that matters when you're
 * writing an invoice, where they're all just "a thing I charge for at a price", so
 * this flattens them into one searchable shape.
 *
 * Deliberately rates only. A partner's registered *services* are what they offer,
 * not what they charge — they carry no price, so putting them here meant offering
 * a pick that left the amount blank and invited a ₦0 line. Whatever a service is
 * worth is expressed as one of the rates below.
 */

export type CatalogueKind = 'rate' | 'route' | 'cargo' | 'delivery';

export interface CatalogueItem {
  /** Unique across all four sources, which share id spaces of their own. */
  id: string;
  kind: CatalogueKind;
  /** Shown in the dropdown. */
  label: string;
  /** Prefilled onto the line item, and editable afterwards. */
  description: string;
  /** Every entry is priced; the partner can still override it on the line. */
  unitPrice: number;
  /** Secondary detail the label can't carry, e.g. a per-kg component. */
  hint?: string;
}

const KIND_LABEL: Record<CatalogueKind, string> = {
  rate: 'Region rate',
  route: 'Route card',
  cargo: 'Cargo card',
  delivery: 'Delivery card',
};

const titleise = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const useBillableCatalogue = () => {
  const rates = useGetRates();
  const routeRates = useGetRouteRates();
  const cargoRates = useGetCargoRates();
  const deliveryRates = useGetDeliveryMethodRates();

  const items = useMemo<CatalogueItem[]>(() => {
    const out: CatalogueItem[] = [];

    for (const rate of rates.data ?? []) {
      const parts = [rate.region, rate.category?.name, rate.shipping_mode && titleise(rate.shipping_mode)]
        .filter(Boolean)
        .join(' · ');
      out.push({
        id: `rate:${rate.id}`,
        kind: 'rate',
        label: parts || `Rate #${rate.id}`,
        description: parts || `Rate #${rate.id}`,
        unitPrice: rate.price,
        hint: rate.window || undefined,
      });
    }

    // Inactive cards are deliberately excluded — a partner deactivates a card to
    // stop quoting it, and it shouldn't resurface on an invoice.
    for (const card of routeRates.data ?? []) {
      if (card.status && card.status !== 'Active') continue;
      const label = `${card.origin_state} → ${card.destination_state}`;
      out.push({
        id: `route:${card.id}`,
        kind: 'route',
        label: `${label} · ${titleise(card.cargo_type)}`,
        description: `${label} haulage (${titleise(card.cargo_type)})`,
        unitPrice: card.price,
      });
    }

    for (const card of cargoRates.data ?? []) {
      if (card.status && card.status !== 'Active') continue;
      out.push({
        id: `cargo:${card.id}`,
        kind: 'cargo',
        label: titleise(card.cargo_type),
        description: `${titleise(card.cargo_type)} cargo handling`,
        // The base price is the billable unit; the per-kg component needs a weight
        // this form doesn't ask for, so it's surfaced as a hint to adjust by hand.
        unitPrice: card.base_price,
        hint: card.price_per_kg ? `+₦${card.price_per_kg.toLocaleString()}/kg` : undefined,
      });
    }

    for (const card of deliveryRates.data ?? []) {
      if (card.status && card.status !== 'Active') continue;
      out.push({
        id: `delivery:${card.id}`,
        kind: 'delivery',
        label: titleise(card.method),
        description: `${titleise(card.method)} delivery`,
        unitPrice: card.price,
      });
    }

    return out;
  }, [rates.data, routeRates.data, cargoRates.data, deliveryRates.data]);

  return {
    items,
    // Any one source still loading means the list is incomplete, and a partner
    // shouldn't conclude a rate is missing because its request hadn't landed.
    isLoading: rates.isLoading || routeRates.isLoading || cargoRates.isLoading || deliveryRates.isLoading,
    kindLabel: KIND_LABEL,
  };
};
