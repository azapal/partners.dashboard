import { useMemo, useState } from "react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { useGetCargoRates } from "../hooks/useRateCards";
import {
  DIVISOR_PRESETS,
  chargeableWeight,
  kg,
  naira,
  priceFor,
  reweigh,
  volumetricWeight,
} from "../lib/chargeableWeight";

/**
 * Chargeable weight — quote it at booking, settle it at pickup.
 *
 * Both halves of the weight question on one screen, because they are the same
 * arithmetic run twice: what the customer *declared* when they booked, and what
 * the rider *measured* when they collected. The difference between them is the
 * reweigh adjustment.
 *
 * Prices come from the partner's real cargo rate cards. Nothing is stored —
 * consignments carry no weight field yet, so this computes rather than records.
 */

const num = (v: string) => (v.trim() === "" ? 0 : Math.max(0, Number(v) || 0));

const Field = ({
  label,
  value,
  onChange,
  suffix,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  placeholder?: string;
}) => (
  <label className="block">
    <span className="text-xs font-medium text-gray-500">{label}</span>
    <div className="relative mt-1">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
        inputMode="decimal"
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-orange-50"
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{suffix}</span>
      )}
    </div>
  </label>
);

export const ChargeableWeightScreen = () => {
  const { data: cargoRates = [] } = useGetCargoRates();
  const active = useMemo(
    () => cargoRates.filter((c) => !c.status || c.status === "Active"),
    [cargoRates],
  );

  const [presetId, setPresetId] = useState("road");
  const [customDivisor, setCustomDivisor] = useState("");
  const [declared, setDeclared] = useState("");
  const [measured, setMeasured] = useState("");
  const [l, setL] = useState("");
  const [w, setW] = useState("");
  const [h, setH] = useState("");
  const [cardId, setCardId] = useState<string>("");

  const preset = DIVISOR_PRESETS.find((p) => p.id === presetId) ?? DIVISOR_PRESETS[0];
  const divisor = customDivisor ? num(customDivisor) : preset.divisor;

  const vol = volumetricWeight(num(l), num(w), num(h), divisor);
  const atBooking = chargeableWeight(num(declared), vol);
  const atPickup = chargeableWeight(num(measured), vol);

  const card = active.find((c) => String(c.id) === cardId) ?? active[0];
  const perKg = card?.price_per_kg ?? 0;
  const base = card?.base_price ?? 0;

  const adjustment = reweigh(atBooking.chargeable, atPickup.chargeable, perKg);
  const hasDims = vol > 0;

  return (
    <DashboardLayout>
      <div className="w-full flex flex-col gap-5 overflow-y-auto">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Chargeable weight</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Freight bills on the greater of what a consignment weighs and what it occupies. Quote it
            at booking, settle it at pickup.
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 px-4 py-3">
          <i className="ri-information-line mt-0.5 text-base text-blue-600" />
          <p className="text-xs leading-5 text-blue-900">
            <span className="font-semibold">A calculator, not a record.</span> Consignments don't
            carry a weight field yet, so nothing here is saved against an order. Prices come from
            your real cargo rate cards.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          {/* ── Inputs ───────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <section className="rounded-2xl bg-white p-5 shadow-card">
              <h2 className="text-sm font-semibold text-gray-800">The consignment</h2>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <Field label="Length" value={l} onChange={setL} suffix="cm" placeholder="0" />
                <Field label="Width" value={w} onChange={setW} suffix="cm" placeholder="0" />
                <Field label="Height" value={h} onChange={setH} suffix="cm" placeholder="0" />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Field label="Declared at booking" value={declared} onChange={setDeclared} suffix="kg" placeholder="0" />
                <Field label="Measured at pickup" value={measured} onChange={setMeasured} suffix="kg" placeholder="0" />
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-card">
              <h2 className="text-sm font-semibold text-gray-800">Volumetric divisor</h2>
              <p className="mt-0.5 text-xs text-gray-400">
                Set by the carrier, not by standard. Confirm yours in the contract.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {DIVISOR_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setPresetId(p.id); setCustomDivisor(""); }}
                    title={p.note}
                    className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                      presetId === p.id && !customDivisor
                        ? "border-brand bg-orange-50 text-brand"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p.label}
                    <span className="mt-0.5 block text-[10px] font-medium text-gray-400">÷ {p.divisor}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <Field label="Or a custom divisor" value={customDivisor} onChange={setCustomDivisor} placeholder={String(preset.divisor)} />
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-card">
              <h2 className="text-sm font-semibold text-gray-800">Price against</h2>
              {active.length === 0 ? (
                <p className="mt-2 rounded-xl bg-gray-50 px-3 py-3 text-xs text-gray-500">
                  No active cargo rate cards — add one and the figures below will price themselves.
                </p>
              ) : (
                <select
                  value={cardId || String(active[0].id)}
                  onChange={(e) => setCardId(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-orange-50"
                >
                  {active.map((c) => (
                    <option key={c.id} value={c.id}>
                      {String(c.cargo_type).replace(/_/g, " ")} — {naira(c.base_price)} base · {naira(c.price_per_kg)}/kg
                    </option>
                  ))}
                </select>
              )}
            </section>
          </div>

          {/* ── Results ──────────────────────────────────────────────────── */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <section className="rounded-2xl bg-white p-5 shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">At booking — what you quote</h2>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Declared
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ["Actual", atBooking.actual, atBooking.basis === "actual"],
                  ["Volumetric", atBooking.volumetric, atBooking.basis === "volumetric"],
                  ["Chargeable", atBooking.chargeable, false],
                ].map(([label, value, wins], i) => (
                  <div
                    key={label as string}
                    className={`rounded-xl p-3 ${i === 2 ? "bg-gray-900" : wins ? "bg-orange-50" : "bg-gray-50"}`}
                  >
                    <p className={`text-[10px] font-medium uppercase tracking-wide ${i === 2 ? "text-white/60" : "text-gray-400"}`}>
                      {label as string}
                    </p>
                    <p className={`mt-1 text-lg font-bold ${i === 2 ? "text-white" : wins ? "text-brand" : "text-gray-900"}`}>
                      {kg(value as number)}
                    </p>
                  </div>
                ))}
              </div>

              {hasDims && atBooking.basis === "volumetric" && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5">
                  <i className="ri-windy-line mt-0.5 text-sm text-amber-600" />
                  <p className="text-[11px] leading-4 text-amber-800">
                    This bills on volume, not mass — <strong>{kg(atBooking.airKg)}</strong> of it is
                    air. {perKg > 0 && <>That's <strong>{naira(atBooking.airKg * perKg)}</strong> of the price. </>}
                    Repacking to cut void space is the remedy.
                  </p>
                </div>
              )}

              {card && atBooking.chargeable > 0 && (
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-500">
                    {naira(base)} base + {kg(atBooking.chargeable)} × {naira(perKg)}
                  </span>
                  <span className="text-base font-bold text-gray-900">
                    {naira(priceFor(atBooking.chargeable, base, perKg))}
                  </span>
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">At pickup — what you settle</h2>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Measured
                </span>
              </div>

              {!num(measured) ? (
                <p className="mt-3 rounded-xl bg-gray-50 px-3 py-4 text-xs text-gray-500">
                  Enter the weight your rider recorded and the reweigh adjustment appears here.
                </p>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Quoted on</p>
                      <p className="mt-1 text-lg font-bold text-gray-900">{kg(adjustment.declaredChargeable)}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Bills on</p>
                      <p className="mt-1 text-lg font-bold text-gray-900">{kg(adjustment.measuredChargeable)}</p>
                    </div>
                    <div
                      className={`rounded-xl p-3 ${
                        adjustment.direction === "under"
                          ? "bg-emerald-50"
                          : adjustment.direction === "over"
                            ? "bg-red-50"
                            : "bg-gray-50"
                      }`}
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Adjustment</p>
                      <p
                        className={`mt-1 text-lg font-bold ${
                          adjustment.direction === "under"
                            ? "text-emerald-700"
                            : adjustment.direction === "over"
                              ? "text-red-600"
                              : "text-gray-900"
                        }`}
                      >
                        {adjustment.deltaKg > 0 ? "+" : ""}
                        {kg(adjustment.deltaKg)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
                    <i
                      className={`mt-0.5 text-sm ${
                        adjustment.direction === "under"
                          ? "ri-arrow-up-line text-emerald-600"
                          : adjustment.direction === "over"
                            ? "ri-arrow-down-line text-red-500"
                            : "ri-check-line text-gray-500"
                      }`}
                    />
                    <p className="text-[11px] leading-4 text-gray-700">
                      {adjustment.direction === "under" && (
                        <>
                          Under-declared. You may re-invoice{" "}
                          <strong>{naira(Math.abs(adjustment.deltaAmount))}</strong> on top of the quote.
                        </>
                      )}
                      {adjustment.direction === "over" && (
                        <>
                          Over-declared. The customer was quoted{" "}
                          <strong>{naira(Math.abs(adjustment.deltaAmount))}</strong> more than this
                          consignment bills at — credit it or you'll hear about it.
                        </>
                      )}
                      {adjustment.direction === "exact" && <>The declaration matched. Nothing to adjust.</>}
                    </p>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
