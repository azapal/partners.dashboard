import { Store } from '@tanstack/store';

export type TourVariant = 'main' | 'support';

type TourState = {
  variant: TourVariant | null;
  // `${TOUR_STORAGE_PREFIX}:${variant}:${role}` — identifies which tour the
  // step index below belongs to, so a shell/role change restarts cleanly
  // while a plain route change does not.
  tourKey: string | null;
  isOpen: boolean;
  stepIndex: number;
};

export const tourStore = new Store<TourState>({
  variant: null,
  tourKey: null,
  isOpen: false,
  stepIndex: 0,
});

export const tourActions = {
  /**
   * Adopt a shell's tour key, initialising open-state from localStorage the
   * first time it's seen and doing nothing on every subsequent call.
   *
   * The no-op path is the whole point of this store. ProductTour is mounted
   * inside DashboardLayout/RepDashboardLayout, and every screen renders its own
   * layout (Routes.tsx has no shared layout route), so the tour unmounts and
   * remounts on each route change — including the ones the tour itself triggers
   * to reach the next step. Component state would reset to step 0 every time,
   * leaving any tour that spans more than one route permanently stuck on its
   * first page. Keeping the step index out here lets the remounted tour resume.
   */
  sync: (variant: TourVariant, tourKey: string) => {
    if (tourStore.state.tourKey === tourKey) return;
    tourStore.setState(() => ({
      variant,
      tourKey,
      isOpen: !localStorage.getItem(tourKey),
      stepIndex: 0,
    }));
  },

  next: () => {
    tourStore.setState((state) => ({ ...state, stepIndex: state.stepIndex + 1 }));
  },

  back: () => {
    tourStore.setState((state) => ({ ...state, stepIndex: Math.max(0, state.stepIndex - 1) }));
  },

  /** Ends the tour and marks it complete so it doesn't reopen on next load. */
  finish: () => {
    const { tourKey } = tourStore.state;
    if (tourKey) localStorage.setItem(tourKey, 'true');
    tourStore.setState((state) => ({ ...state, isOpen: false }));
  },

  /** Replays the tour for the currently-mounted shell (header "Replay" action). */
  restart: (variant: TourVariant) => {
    const { tourKey, variant: activeVariant } = tourStore.state;
    if (!tourKey || activeVariant !== variant) return;
    localStorage.removeItem(tourKey);
    tourStore.setState((state) => ({ ...state, isOpen: true, stepIndex: 0 }));
  },
};
