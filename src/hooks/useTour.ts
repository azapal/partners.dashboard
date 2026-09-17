import { useSyncExternalStore } from 'react';
import { tourStore } from '../store/client/tour';

// Whole-state snapshot: tourStore.setState always produces a new object, so the
// reference is stable between updates and safe to return directly.
export const useTourState = () =>
  useSyncExternalStore(
    tourStore.subscribe,
    () => tourStore.state,
    () => tourStore.state,
  );
