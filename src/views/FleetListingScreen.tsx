import { useState } from "react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { useGetBranches } from "../hooks/useBranchPartner";

/**
 * List your fleet — offer idle vehicles to the partner network and earn.
 *
 * This is the partner-side front door for the PRD's capacity sharing (§11):
 * "a half-empty vehicle on a lane offered to the network, with the revenue
 * split handled by the machinery already built". Pillar 2 is unbuilt, so there
 * is no vehicle record to attach to and nothing to POST — the flow captures the
 * listing and says plainly that it hasn't gone anywhere yet.
 *
 * Three steps, because the partner is deciding three separate things: what the
 * vehicle is, where it runs, and what they want for it.
 */

const VEHICLE_TYPES = [
  { id: "truck", label: "Truck", icon: "ri-truck-line" },
  { id: "trailer", label: "Trailer", icon: "ri-caravan-line" },
  { id: "van", label: "Van", icon: "ri-roadster-line" },
  { id: "car", label: "Car", icon: "ri-car-line" },
  { id: "motorcycle", label: "Motorcycle", icon: "ri-motorbike-line" },
  { id: "bicycle", label: "Bicycle", icon: "ri-bike-line" },
];

const AVAILABILITY = [
  { id: "idle", label: "Only when idle", detail: "Offered when you aren't using it." },
  { id: "scheduled", label: "On a schedule", detail: "Fixed days each week." },
  { id: "always", label: "Always available", detail: "The network can book it any time." },
];

const STEPS = ["Vehicle", "Coverage", "Terms"];

const STORAGE_KEY = "azapal-fleet-listing";

export const FleetListingScreen = () => {
  const { data: branches = [] } = useGetBranches();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const [type, setType] = useState<string | null>(null);
  const [plate, setPlate] = useState("");
  const [capacity, setCapacity] = useState("");
  const [branchId, setBranchId] = useState<string>("");
  const [lanes, setLanes] = useState("");
  const [availability, setAvailability] = useState("idle");
  const [dayRate, setDayRate] = useState("");

  const canAdvance =
    step === 0 ? Boolean(type && plate.trim()) : step === 1 ? Boolean(branchId) : Boolean(dayRate);

  const submit = () => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ type, plate, capacity, branchId, lanes, availability, dayRate, at: Date.now() }),
      );
    } catch {
      // Storage unavailable shouldn't block the confirmation.
    }
    setDone(true);
  };

  if (done) {
    return (
      <DashboardLayout>
        <div className="mx-auto w-full max-w-lg py-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <i className="ri-check-line text-2xl" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-gray-900">Listing captured</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            {VEHICLE_TYPES.find((v) => v.id === type)?.label} · {plate.toUpperCase()}
          </p>
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left">
            <i className="ri-information-line mt-0.5 text-base text-amber-600" />
            <p className="text-xs leading-5 text-amber-800">
              Fleet sharing isn't connected yet — there's no vehicle register behind this, so the
              listing is held in this browser only and nobody on the network can see it.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setDone(false); setStep(0); }}
            className="mt-5 text-xs font-semibold text-brand hover:text-brand-hover"
          >
            List another vehicle
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-xl font-bold text-gray-900">List your fleet</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Lend a vehicle to the partner network and earn on the days you aren't using it.
        </p>

        {/* Stepper */}
        <div className="mt-6 flex items-center">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <span className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                    i < step
                      ? "bg-emerald-500 text-white"
                      : i === step
                        ? "bg-brand text-white"
                        : "border border-gray-200 bg-white text-gray-300"
                  }`}
                >
                  {i < step ? <i className="ri-check-line" /> : i + 1}
                </span>
                <span
                  className={`text-xs font-semibold ${i <= step ? "text-gray-800" : "text-gray-300"}`}
                >
                  {label}
                </span>
              </span>
              {i < STEPS.length - 1 && (
                <span className={`mx-3 h-px flex-1 ${i < step ? "bg-emerald-300" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-white p-5 shadow-card">
          {step === 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-800">What are you listing?</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {VEHICLE_TYPES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setType(v.id)}
                    className={`flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors ${
                      type === v.id
                        ? "border-brand bg-orange-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <i className={`${v.icon} text-xl ${type === v.id ? "text-brand" : "text-gray-400"}`} />
                    <span className={`text-xs font-semibold ${type === v.id ? "text-brand" : "text-gray-700"}`}>
                      {v.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-gray-500">Plate number</span>
                  <input
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    placeholder="e.g. LSD-482-XA"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm uppercase outline-none focus:border-brand focus:ring-4 focus:ring-orange-50"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-500">Capacity (optional)</span>
                  <input
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="e.g. 3 tonnes"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-orange-50"
                  />
                </label>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-sm font-semibold text-gray-800">Where does it run?</h2>
              <label className="mt-3 block">
                <span className="text-xs font-medium text-gray-500">Based at</span>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-orange-50"
                >
                  <option value="">Select a branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branch_code} · {b.state}
                    </option>
                  ))}
                </select>
                {branches.length === 0 && (
                  <span className="mt-1 block text-[11px] text-gray-400">
                    You have no branches yet — add one first so the network knows where it sits.
                  </span>
                )}
              </label>
              <label className="mt-3 block">
                <span className="text-xs font-medium text-gray-500">Lanes it can cover (optional)</span>
                <input
                  value={lanes}
                  onChange={(e) => setLanes(e.target.value)}
                  placeholder="e.g. Lagos → Ibadan, Lagos → Benin"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-orange-50"
                />
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-sm font-semibold text-gray-800">What do you want for it?</h2>
              <div className="mt-3 space-y-2">
                {AVAILABILITY.map((a) => (
                  <label
                    key={a.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                      availability === a.id ? "border-brand bg-orange-50" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="availability"
                      checked={availability === a.id}
                      onChange={() => setAvailability(a.id)}
                      className="mt-0.5 h-4 w-4 accent-[#F14724]"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-800">{a.label}</span>
                      <span className="block text-xs text-gray-400">{a.detail}</span>
                    </span>
                  </label>
                ))}
              </div>
              <label className="mt-4 block">
                <span className="text-xs font-medium text-gray-500">Day rate (₦)</span>
                <input
                  value={dayRate}
                  onChange={(e) => setDayRate(e.target.value.replace(/[^\d]/g, ""))}
                  inputMode="numeric"
                  placeholder="e.g. 45000"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-orange-50"
                />
                <span className="mt-1 block text-[11px] text-gray-400">
                  Earnings settle into your Azapal wallet, split by the arrangement you pick.
                </span>
              </label>
            </>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 disabled:invisible"
            >
              <i className="ri-arrow-left-line mr-1" />
              Back
            </button>
            <button
              type="button"
              onClick={() => (step === STEPS.length - 1 ? submit() : setStep((s) => s + 1))}
              disabled={!canAdvance}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:bg-gray-200 disabled:text-gray-400"
            >
              {step === STEPS.length - 1 ? "List it" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
