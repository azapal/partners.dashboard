import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useRepProfile } from "../../hooks/useRepAuth";
import { useTourState } from "../../hooks/useTour";
import { tourActions, type TourVariant } from "../../store/client/tour";
import { BRAND_ORANGE } from "../../lib/brandColors";

export type { TourVariant };

type TourStep = {
  id: string;
  route: string;
  target: string;
  title: string;
  description: string;
};

export const restartProductTour = (variant: TourVariant) => tourActions.restart(variant);

// Tenant Admin and Super Admin are the only two roles RequireAuth lets into the
// main dashboard (isElevatedAdminRole), and they get identical parity there, so
// they share one set of steps rather than Tenant Admin silently falling through
// to the much thinner `default` tour.
const ELEVATED_ADMIN_STEPS: TourStep[] = [
  { id: "sidebar", route: "/dashboard", target: '[data-tour="main-sidebar"], [data-tour="main-bottom-nav"]', title: "Your workspace at a glance", description: "Use the navigation to move between operations, management, and finance." },
  { id: "services", route: "/service", target: '[data-tour="nav-service"]', title: "Services", description: "Define the services your logistics operation offers." },
  // nav-rates and nav-logistics-network aren't in the mobile bottom tab, so
  // those two steps fall back to highlighting the whole bar.
  { id: "rates", route: "/rates", target: '[data-tour="nav-rates"], [data-tour="main-bottom-nav"]', title: "Rates", description: "Review and manage the pricing that powers your services." },
  { id: "branches", route: "/branches", target: '[data-tour="nav-branches"]', title: "Branches", description: "Keep your operating locations and branch coverage organized." },
  { id: "users", route: "/users", target: '[data-tour="nav-users"]', title: "Users", description: "Invite people and manage access across the workspace." },
];

const MAIN_TOURS: Record<string, TourStep[]> = {
  "super admin": ELEVATED_ADMIN_STEPS,
  "tenant admin": ELEVATED_ADMIN_STEPS,
  // Unreachable today: RequireAuth confines a Logistics Manager to /support/*,
  // where SUPPORT_TOURS applies instead. Kept so the intended route-first tour
  // for the role is ready if that guard ever widens.
  "logistics manager": [
    { id: "sidebar", route: "/dashboard", target: '[data-tour="main-sidebar"], [data-tour="main-bottom-nav"]', title: "Your workspace at a glance", description: "Use the navigation to move between the tools available to your role." },
    { id: "logistics-network", route: "/logistics-network", target: '[data-tour="nav-logistics-network"], [data-tour="main-bottom-nav"]', title: "Start with your logistics network", description: "Review and manage the routes that connect your operation." },
    { id: "branches", route: "/branches", target: '[data-tour="nav-branches"]', title: "Branches", description: "See the locations connected to your network." },
    { id: "services", route: "/service", target: '[data-tour="nav-service"]', title: "Services", description: "Check which services are available across the network." },
  ],
  // Also what a partner-owner session gets: there's no rep profile to read a
  // role from, so `role` is "" and lands here.
  default: [
    { id: "sidebar", route: "/dashboard", target: '[data-tour="main-sidebar"], [data-tour="main-bottom-nav"]', title: "Find your way around", description: "This navigation is your starting point for the workspace." },
    { id: "dashboard", route: "/dashboard", target: '[data-tour="dashboard-header"]', title: "Your dashboard", description: "Get a quick view of the activity that matters to you." },
    { id: "services", route: "/service", target: '[data-tour="nav-service"]', title: "Services", description: "Explore the services available to your operation." },
  ],
};

const SUPPORT_TOURS: Record<string, TourStep[]> = {
  default: [
    { id: "sidebar", route: "/support/dashboard", target: '[data-tour="support-sidebar"], [data-tour="support-bottom-nav"]', title: "Your operations workspace", description: "Use this menu to move between your daily operations and team tools." },
    { id: "orders", route: "/support/orders", target: '[data-tour="support-orders"]', title: "Orders", description: "This is where you review and work on assigned orders." },
    { id: "shift-mates", route: "/support/shift-mates", target: '[data-tour="support-shift-mates"]', title: "Shift Mates", description: "Stay connected with the people working alongside you." },
  ],
  manager: [
    { id: "sidebar", route: "/support/dashboard", target: '[data-tour="support-sidebar"], [data-tour="support-bottom-nav"]', title: "Your branch workspace", description: "Use this menu to move between daily work and branch management." },
    { id: "orders", route: "/support/orders", target: '[data-tour="support-orders"]', title: "Orders", description: "Review and process the orders assigned to your branch." },
    { id: "team", route: "/support/team", target: '[data-tour="support-team"]', title: "Team Overview", description: "See your branch team and coordinate operational coverage." },
  ],
};

const TOUR_STORAGE_PREFIX = "azapal-tour-complete";

const normaliseRole = (role?: string | null) => role?.trim().toLowerCase() ?? "";

const getTourKey = (variant: TourVariant, role: string) => `${TOUR_STORAGE_PREFIX}:${variant}:${role || "default"}`;

export const ProductTour = ({ variant }: { variant: TourVariant }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const repProfile = useRepProfile();
  const role = normaliseRole(repProfile?.invite_role?.name);
  const tourKey = getTourKey(variant, role);
  const steps = useMemo(() => {
    // The "manager" support tour is picked with the same predicate isManagerRole
    // uses to render the Team nav, so its support-team target always exists.
    if (variant === "support") return SUPPORT_TOURS[role.includes("manager") || role.includes("admin") ? "manager" : "default"];
    return MAIN_TOURS[role] ?? MAIN_TOURS.default;
  }, [role, variant]);

  const { isOpen, stepIndex, tourKey: activeTourKey } = useTourState();
  // Derived from the live DOM, so unlike stepIndex these *should* reset on every
  // mount and every step change.
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetMissing, setTargetMissing] = useState(false);

  useEffect(() => {
    tourActions.sync(variant, tourKey);
  }, [variant, tourKey]);

  // Guard on the key as well as isOpen: on the first render after a shell or
  // role change the store still holds the previous tour's state.
  const isActive = isOpen && activeTourKey === tourKey;
  const step = isActive ? steps[stepIndex] : undefined;

  useEffect(() => {
    if (!isActive || !step) return;
    setTargetRect(null);
    setTargetMissing(false);
    if (location.pathname !== step.route) {
      navigate(step.route);
      return;
    }

    const findTarget = () =>
      Array.from(document.querySelectorAll(step.target)).find((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

    let frame = 0;
    let attempts = 0;
    const locateTarget = () => {
      const target = findTarget();
      if (!target && attempts < 120) {
        attempts += 1;
        frame = window.requestAnimationFrame(locateTarget);
        return;
      }
      if (target) {
        // Without this a step anchored below the fold draws its ring off-screen.
        // "nearest" so an already-visible target isn't moved.
        target.scrollIntoView({ block: "nearest", inline: "nearest" });
        setTargetRect(target.getBoundingClientRect());
      } else {
        setTargetMissing(true);
      }
    };

    frame = window.requestAnimationFrame(locateTarget);
    const update = () => {
      const target = findTarget();
      if (target) setTargetRect(target.getBoundingClientRect());
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isActive, location.pathname, navigate, step]);

  useEffect(() => {
    if (!isActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") tourActions.finish();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isActive]);

  if (!isActive || !step || (!targetRect && !targetMissing)) return null;

  const next = () => {
    if (stepIndex === steps.length - 1) tourActions.finish();
    else tourActions.next();
  };

  const cardTop = targetRect
    ? Math.min(Math.max(targetRect.bottom + 16, 20), window.innerHeight - 210)
    : Math.max((window.innerHeight - 210) / 2, 20);
  const cardLeft = targetRect
    ? Math.min(Math.max(targetRect.left, 20), window.innerWidth - 340)
    : Math.max((window.innerWidth - 340) / 2, 20);

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Product tour">
      {targetRect ? (
        <div
          className="absolute rounded-xl transition-all"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            // Both the brand ring and the dimmed surround have to live in this
            // one inline boxShadow. An inline box-shadow replaces the property
            // wholesale, so Tailwind ring-* utilities here would never paint —
            // and the surround must be the *only* dimming layer or the
            // highlighted element gets dimmed along with everything else.
            boxShadow: `0 0 0 2px ${BRAND_ORANGE}, 0 0 0 9999px rgba(15, 23, 42, 0.55)`,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-950/45" />
      )}
      <div className="absolute w-[320px] rounded-2xl bg-white p-5 shadow-2xl" style={{ top: cardTop, left: cardLeft }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand">Workspace tour</p>
            <h2 className="mt-1 text-base font-bold text-gray-900">{step.title}</h2>
          </div>
          <button type="button" onClick={tourActions.finish} className="text-xs font-semibold text-gray-400 hover:text-gray-700">Skip</button>
        </div>
        <p className="mt-2 text-sm leading-5 text-gray-600">{step.description}</p>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">{stepIndex + 1} of {steps.length}</span>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button type="button" onClick={tourActions.back} className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800">
                Back
              </button>
            )}
            <button type="button" onClick={next} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover">
              {stepIndex === steps.length - 1 ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
