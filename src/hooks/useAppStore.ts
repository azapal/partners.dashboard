import { useSyncExternalStore } from 'react'
import {sheetStore} from "../store/client/sheets";

// this hook, registers our sheetStore so we can reuse it.
export function useAppStore<T>(selector: (state: typeof sheetStore.state) => T): T {
    return useSyncExternalStore(
        sheetStore.subscribe,
        () => selector(sheetStore.state),
        () => selector(sheetStore.state) // server snapshot (optional)
    )
}