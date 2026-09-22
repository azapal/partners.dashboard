const WORKSPACE_HISTORY_KEY = "azapal-workspace-history";
const MAX_WORKSPACE_HISTORY = 8;

export interface WorkspaceVisit {
  to: string;
  visitedAt: number;
}

export const recordWorkspaceVisit = (to: string) => {
  if (typeof window === "undefined" || !to || to.startsWith("/support")) return;

  try {
    const stored = JSON.parse(window.localStorage.getItem(WORKSPACE_HISTORY_KEY) ?? "[]") as WorkspaceVisit[];
    const visits = stored.filter((visit) => visit.to !== to);
    visits.unshift({ to, visitedAt: Date.now() });
    window.localStorage.setItem(WORKSPACE_HISTORY_KEY, JSON.stringify(visits.slice(0, MAX_WORKSPACE_HISTORY)));
  } catch {
    // Ignore unavailable or malformed local storage; navigation should still work.
  }
};

export const getWorkspaceVisits = (): WorkspaceVisit[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = JSON.parse(window.localStorage.getItem(WORKSPACE_HISTORY_KEY) ?? "[]") as WorkspaceVisit[];
    return stored.filter((visit) => typeof visit?.to === "string").slice(0, MAX_WORKSPACE_HISTORY);
  } catch {
    return [];
  }
};