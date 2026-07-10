import { useState } from "react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { useGetPartnerLogs, useGetPartnerSessions, useBranchManagerNames } from "../hooks/useActivityLog";
import { useGetBranches } from "../hooks/useBranchPartner";
import { sheetActions } from "../store/client/sheets";
import type { PartnerLog, PartnerSession, LogAction, ActorType } from "../service/partnerService";

const PAGE_SIZE = 20;

const ACTION_OPTIONS: (LogAction | "All")[] = ["All", "CREATE", "UPDATE", "DELETE", "VIEW"];
const ACTOR_TYPE_OPTIONS: (ActorType | "All")[] = ["All", "partner", "employee", "user"];

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Created", UPDATE: "Updated", DELETE: "Deleted", VIEW: "Viewed",
};

const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-green-50 text-green-700",
  UPDATE: "bg-blue-50 text-blue-700",
  DELETE: "bg-red-50 text-red-600",
  VIEW: "bg-gray-100 text-gray-600",
};

const RESOURCE_LABELS: [string, string][] = [
  ["branch-partner", "Branch"],
  ["partner-invites", "User Invite"],
  ["services", "Service"],
  ["transactions", "Transaction"],
  ["dashboard", "Dashboard"],
  ["partner", "Partner Profile"],
];

function humanizeResource(resource: string): string {
  for (const [key, label] of RESOURCE_LABELS) {
    if (resource.includes(key)) return label;
  }
  const segments = resource.split("/").filter(Boolean);
  const last = [...segments].reverse().find((s) => Number.isNaN(Number(s)));
  return last ? last.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Record";
}

function describeLog(log: PartnerLog): string {
  const verb = ACTION_LABELS[log.action] ?? log.action;
  const label = humanizeResource(log.resource);
  const idPart = log.object_id ? ` #${log.object_id}` : "";
  return `${verb} ${label}${idPart}`;
}

function actorLabel(actorType: string, id: number | null | undefined, nameMap: Map<number, string>): string {
  if (actorType === "partner") return "Partner";
  if (id == null) return actorType ? actorType.charAt(0).toUpperCase() + actorType.slice(1) : "Unknown";
  if (actorType === "employee") return nameMap.get(id) ?? `Employee #${id}`;
  return `${actorType.charAt(0).toUpperCase()}${actorType.slice(1)} #${id}`;
}

function parseDevice(ua: string): string {
  if (!ua) return "Unknown device";
  const os = /iPhone|iPad/.test(ua) ? "iOS"
    : /Android/.test(ua) ? "Android"
    : /Mac OS X/.test(ua) ? "macOS"
    : /Windows/.test(ua) ? "Windows"
    : /Linux/.test(ua) ? "Linux" : "Unknown OS";
  const browser = /Chrome/.test(ua) ? "Chrome"
    : /Firefox/.test(ua) ? "Firefox"
    : /Safari/.test(ua) ? "Safari" : "Browser";
  return `${browser} on ${os}`;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

const NO_BRANCH_MESSAGE = "Employee is not assigned to a branch";

function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">{children}</div>;
}

interface SelectOption {
  value: string;
  label: string;
}

function Select({ value, onChange, options, label }: {
  value: string; onChange: (v: string) => void; options: SelectOption[]; label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500 shrink-0">{label}</span>
      <select
        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none capitalize"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

const toOptions = (values: string[]): SelectOption[] => values.map((v) => ({ value: v, label: v }));

function Pagination({ page, setPage, count, hasNext, isFetching }: {
  page: number; setPage: (fn: (p: number) => number) => void; count: number; hasNext: boolean; isFetching: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
      <p className="text-xs text-gray-400">
        Page {page} of {totalPages} · {count} entr{count !== 1 ? "ies" : "y"}
      </p>
      <div className="flex items-center gap-2">
        <button
          aria-label="Previous page"
          disabled={page <= 1 || isFetching}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <i className="ri-arrow-left-s-line text-base" />
        </button>
        <button
          aria-label="Next page"
          disabled={!hasNext || isFetching}
          onClick={() => setPage((p) => p + 1)}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <i className="ri-arrow-right-s-line text-base" />
        </button>
      </div>
    </div>
  );
}

function ActivityTab() {
  const { data: branches = [] } = useGetBranches();
  const [branchId, setBranchId] = useState("All");
  const [action, setAction] = useState<LogAction | "All">("All");
  const [actorType, setActorType] = useState<ActorType | "All">("All");
  const [resource, setResource] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, error } = useGetPartnerLogs({
    branch_id: branchId === "All" ? undefined : branchId,
    action: action === "All" ? undefined : action,
    actor_type: actorType === "All" ? undefined : actorType,
    resource: resource.trim() || undefined,
    page,
    page_size: PAGE_SIZE,
  });

  const logs: PartnerLog[] = data?.results ?? [];
  const nameMap = useBranchManagerNames(logs.map((l) => l.branch));
  const noBranch = isError && error instanceof Error && error.message === NO_BRANCH_MESSAGE;

  return (
    <>
      <FilterBar>
        <div className="relative w-full sm:max-w-xs">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
          <input
            type="text"
            value={resource}
            onChange={(e) => { setResource(e.target.value); setPage(1); }}
            placeholder="Search resource…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
        <Select label="Branch" value={branchId} onChange={(v) => { setBranchId(v); setPage(1); }}
          options={[{ value: "All", label: "All" }, ...branches.map((b) => ({ value: b.id, label: b.branch_code }))]} />
        <Select label="Action" value={action} onChange={(v) => { setAction(v as LogAction | "All"); setPage(1); }} options={toOptions(ACTION_OPTIONS)} />
        <Select label="Actor" value={actorType} onChange={(v) => { setActorType(v as ActorType | "All"); setPage(1); }} options={toOptions(ACTOR_TYPE_OPTIONS)} />
      </FilterBar>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <p className="text-center py-14 text-gray-400 text-sm">
            <i className="ri-loader-4-line animate-spin text-xl" />
          </p>
        ) : noBranch ? (
          <p className="text-center py-14 text-gray-400 text-sm">
            You're not assigned to a branch, so there's no activity to show.
          </p>
        ) : isError ? (
          <p className="text-center py-14 text-gray-400 text-sm">Couldn't load activity logs.</p>
        ) : logs.length === 0 ? (
          <p className="text-center py-14 text-gray-400 text-sm">No activity found</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map((log) => (
              <div
                key={log.id}
                onClick={() => sheetActions.toggleBasicResizableSheet({
                  name: "logDetailSheet",
                  show: true,
                  props: {
                    log,
                    actorName: actorLabel(log.actor_type, Number(log.user_id), nameMap),
                    description: describeLog(log),
                  },
                })}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/60 cursor-pointer transition-colors"
              >
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${ACTION_STYLES[log.action] ?? "bg-gray-100 text-gray-600"}`}>
                  {log.action}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{describeLog(log)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {actorLabel(log.actor_type, Number(log.user_id), nameMap)} · {log.ip_address}
                  </p>
                </div>
                <p className="text-xs text-gray-400 shrink-0">{formatDate(log.created_at)}</p>
              </div>
            ))}
          </div>
        )}
        <Pagination page={page} setPage={setPage} count={data?.count ?? 0} hasNext={!!data?.next} isFetching={isFetching} />
      </div>
    </>
  );
}

function SessionsTab() {
  const { data: branches = [] } = useGetBranches();
  const [branchId, setBranchId] = useState("All");
  const [actorType, setActorType] = useState<ActorType | "All">("All");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, error } = useGetPartnerSessions({
    branch_id: branchId === "All" ? undefined : branchId,
    actor_type: actorType === "All" ? undefined : actorType,
    page,
    page_size: PAGE_SIZE,
  });

  const sessions: PartnerSession[] = data?.results ?? [];
  const nameMap = useBranchManagerNames(sessions.map((s) => s.branch));
  const noBranch = isError && error instanceof Error && error.message === NO_BRANCH_MESSAGE;

  return (
    <>
      <FilterBar>
        <Select label="Branch" value={branchId} onChange={(v) => { setBranchId(v); setPage(1); }}
          options={[{ value: "All", label: "All" }, ...branches.map((b) => ({ value: b.id, label: b.branch_code }))]} />
        <Select label="Actor" value={actorType} onChange={(v) => { setActorType(v as ActorType | "All"); setPage(1); }}
          options={toOptions(["All", "partner", "employee"])} />
      </FilterBar>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <p className="text-center py-14 text-gray-400 text-sm">
            <i className="ri-loader-4-line animate-spin text-xl" />
          </p>
        ) : noBranch ? (
          <p className="text-center py-14 text-gray-400 text-sm">
            You're not assigned to a branch, so there's no session history to show.
          </p>
        ) : isError ? (
          <p className="text-center py-14 text-gray-400 text-sm">Couldn't load sessions.</p>
        ) : sessions.length === 0 ? (
          <p className="text-center py-14 text-gray-400 text-sm">No sessions found</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => sheetActions.toggleBasicResizableSheet({
                  name: "sessionDetailSheet",
                  show: true,
                  props: {
                    session,
                    actorName: actorLabel(session.actor_type, session.employee, nameMap),
                    device: parseDevice(session.user_agent),
                  },
                })}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/60 cursor-pointer transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <i className="ri-shield-keyhole-line text-base text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">
                    {actorLabel(session.actor_type, session.employee, nameMap)} signed in
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {parseDevice(session.user_agent)} · {session.ip_address}
                  </p>
                </div>
                <p className="text-xs text-gray-400 shrink-0">{formatDate(session.created_at)}</p>
              </div>
            ))}
          </div>
        )}
        <Pagination page={page} setPage={setPage} count={data?.count ?? 0} hasNext={!!data?.next} isFetching={isFetching} />
      </div>
    </>
  );
}

export const ActivityLogScreen = () => {
  const [tab, setTab] = useState<"activity" | "sessions">("activity");

  const tabButton = (key: "activity" | "sessions", label: string) => (
    <button
      onClick={() => setTab(key)}
      className={`h-9 px-4 rounded-xl text-sm font-medium border transition ${
        tab === key
          ? "border-[#F14724] bg-orange-50 text-[#F14724]"
          : "border-gray-200 text-gray-500 hover:bg-gray-50 bg-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <DashboardLayout>
      <div className="w-full flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
          <p className="text-sm text-slate-500 mt-1">
            A record of actions and sign-ins across your portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tabButton("activity", "Activity")}
          {tabButton("sessions", "Sessions")}
        </div>

        {tab === "activity" ? <ActivityTab /> : <SessionsTab />}
      </div>
    </DashboardLayout>
  );
};
