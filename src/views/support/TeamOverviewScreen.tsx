import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { RepDashboardLayout } from '../../layouts/RepDashboardLayout';
import { useRepProfile } from '../../hooks/useRepAuth';
import { useGetBranchAgents } from '../../hooks/useAgents';
import {
  useGetRepOrders,
  useClaimConversation,
  useTakeOverConversation,
  useReassignConversation,
} from '../../hooks/useRepOrders';
import { isManagerRole } from '../../service/repService';
import type { WaConversation } from '../../service/repService';
import { sheetActions } from '../../store/client/sheets';
import { Avatar, Card, CardHeader, EmptyState, LoadingRows, PageIntro, StatTile } from '../../components/support/SupportUI';

function waitBadge(raisedAt: string): { label: string; cls: string } {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(raisedAt).getTime()) / 60000));
  const label = mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
  if (mins < 15) return { label, cls: 'bg-sky-50 text-sky-700' };
  if (mins < 60) return { label, cls: 'bg-amber-50 text-amber-700' };
  return { label, cls: 'bg-red-50 text-red-600' };
}

const TeamOverviewScreen = () => {
  const profile = useRepProfile();
  const isManager = isManagerRole(profile?.invite_role?.name);
  const [expandedAgentId, setExpandedAgentId] = useState<number | null>(null);
  const [reassignTarget, setReassignTarget] = useState<string | null>(null);

  const { data: agents = [], isLoading: agentsLoading } = useGetBranchAgents();
  const { data: conversations = [], isLoading: conversationsLoading } = useGetRepOrders('team', isManager);

  const { mutate: claim, isPending: isClaiming } = useClaimConversation();
  const { mutate: takeOver, isPending: isTakingOver } = useTakeOverConversation();
  const { mutate: reassign, isPending: isReassigning } = useReassignConversation();

  const byAgent = useMemo(() => {
    const map = new Map<number, WaConversation[]>();
    for (const c of conversations) {
      if (!c.assigned_to) continue;
      const list = map.get(c.assigned_to.id) ?? [];
      list.push(c);
      map.set(c.assigned_to.id, list);
    }
    return map;
  }, [conversations]);

  // After every hook (the useMemo above used to sit below this return, which
  // breaks the rules of hooks if the profile's role ever changes mid-session).
  if (profile && !isManager) {
    return <Navigate to="/support/dashboard" replace />;
  }

  const escalated = conversations.filter((c) => c.escalation);
  const openCount = conversations.filter((c) => c.status === 'active').length;
  const activeAgents = agents.filter((a) => a.status === 'active').length;

  const openConversation = (conversation: WaConversation) => {
    sheetActions.toggleBasicResizableSheet({
      name: 'orderConversationSheet',
      show: true,
      props: { conversation },
    });
  };

  const stats = [
    { icon: 'ri-team-line', label: 'Team size', value: agents.length, tone: 'navy' as const, loading: agentsLoading },
    { icon: 'ri-checkbox-circle-line', label: 'Active now', value: activeAgents, tone: 'green' as const, loading: agentsLoading },
    { icon: 'ri-chat-3-line', label: 'Open conversations', value: openCount, tone: 'amber' as const, loading: conversationsLoading },
    { icon: 'ri-error-warning-line', label: 'Escalations pending', value: escalated.length, tone: 'red' as const, loading: conversationsLoading },
  ];

  return (
    <RepDashboardLayout>
      <div className="w-full flex flex-col gap-5">
        <PageIntro>
          Every agent's load across the branch, plus anything they've flagged for you — support reps only see their own queue.
        </PageIntro>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <StatTile key={s.label} icon={s.icon} label={s.label} value={s.value} tone={s.tone} loading={s.loading} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 items-start">
          {/* Roster */}
          <Card>
            <CardHeader icon="ri-team-line" title="Team roster" meta={agentsLoading ? undefined : `${agents.length} agents`} />
            {agentsLoading ? (
              <LoadingRows rows={4} label="Loading team" />
            ) : agents.length === 0 ? (
              <EmptyState icon="ri-user-search-line" title="No agents yet" compact>
                No agents found for your branch.
              </EmptyState>
            ) : (
              <div className="divide-y divide-gray-50">
                {agents.map((agent) => {
                  const assigned = byAgent.get(agent.id) ?? [];
                  const open = assigned.filter((c) => c.status === 'active').length;
                  const resolved = assigned.filter((c) => c.status === 'resolved').length;
                  const isExpanded = expandedAgentId === agent.id;

                  return (
                    <div key={agent.id}>
                      <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
                        <Avatar id={agent.id} name={agent.name} status={agent.status} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 text-sm truncate">{agent.name}</p>
                          <p className="text-xs text-gray-400 truncate">{agent.role}</p>
                          <p className="text-[11px] text-gray-500 sm:hidden">
                            <span className="font-semibold text-amber-700">{open} open</span> · {resolved} resolved
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-1 shrink-0">
                          <div className="rounded-lg bg-amber-50 px-2.5 py-1 text-center">
                            <p className="text-sm font-bold text-amber-700 tabular-nums leading-tight">{open}</p>
                            <p className="text-[9px] font-semibold text-amber-700/70 uppercase tracking-wide">Open</p>
                          </div>
                          <div className="rounded-lg bg-emerald-50 px-2.5 py-1 text-center">
                            <p className="text-sm font-bold text-emerald-700 tabular-nums leading-tight">{resolved}</p>
                            <p className="text-[9px] font-semibold text-emerald-700/70 uppercase tracking-wide">Resolved</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedAgentId(isExpanded ? null : agent.id)}
                          disabled={open === 0}
                          aria-expanded={isExpanded}
                          className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold border border-gray-200 bg-white text-gray-700 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isExpanded ? 'Hide' : <>View<span className="hidden sm:inline">&nbsp;queue</span></>}
                          <i className={isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="bg-gray-50/70 px-4 sm:px-5 py-3 flex flex-col gap-1.5">
                          {assigned.filter((c) => c.status === 'active').map((c) => (
                            <button
                              key={c.phone}
                              onClick={() => openConversation(c)}
                              className="flex items-center justify-between gap-2 text-left px-3 py-2.5 rounded-xl bg-white hover:bg-orange-50/60 transition-colors shadow-card"
                            >
                              <span className="text-xs font-semibold text-gray-800 truncate">
                                {c.customer_name || c.phone}
                              </span>
                              <span className="text-[11px] text-gray-400 truncate max-w-[140px]">
                                {c.last_message?.content || '—'}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Escalations */}
          <Card>
            <CardHeader icon="ri-alarm-warning-line" title="Escalations" meta={conversationsLoading ? undefined : `${escalated.length} waiting`} />
            {conversationsLoading ? (
              <LoadingRows rows={3} label="Loading escalations" />
            ) : escalated.length === 0 ? (
              <EmptyState icon="ri-checkbox-circle-line" title="All clear" compact>
                Nothing waiting on you right now.
              </EmptyState>
            ) : (
              <div className="divide-y divide-gray-50">
                {escalated.map((c) => {
                  const wait = waitBadge(c.escalation!.raised_at);
                  const isUnclaimed = !c.assigned_to;

                  return (
                    <div key={c.phone} className="px-4 sm:px-5 py-4 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {c.customer_name || c.phone}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${wait.cls}`}>
                          {wait.label}
                        </span>
                      </div>
                      <p className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600 leading-snug">
                        {c.escalation!.raised_by ? (
                          <><span className="font-semibold text-gray-800">{c.escalation!.raised_by.name}</span>: </>
                        ) : null}
                        {c.escalation!.note || 'Auto-escalated — no agent has claimed this yet.'}
                      </p>

                      {isUnclaimed ? (
                        <button
                          onClick={() => claim(c.phone)}
                          disabled={isClaiming}
                          className="text-xs font-semibold bg-brand text-white px-3 py-1.5 rounded-xl hover:bg-brand-hover transition-colors disabled:opacity-60 self-start"
                        >
                          {isClaiming ? 'Claiming…' : 'Claim'}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => takeOver(c.phone)}
                            disabled={isTakingOver}
                            className="text-xs font-semibold bg-brand text-white px-3 py-1.5 rounded-xl hover:bg-brand-hover transition-colors disabled:opacity-60"
                          >
                            {isTakingOver ? 'Taking over…' : 'Take over'}
                          </button>
                          {reassignTarget === c.phone ? (
                            <>
                              <select
                                onChange={(e) => {
                                  const employeeId = Number(e.target.value);
                                  if (employeeId) {
                                    reassign({ phone: c.phone, employeeId }, { onSuccess: () => setReassignTarget(null) });
                                  }
                                }}
                                disabled={isReassigning}
                                className="text-xs border border-gray-200 rounded-xl px-2 py-1.5 bg-white min-w-0 max-w-full"
                                defaultValue=""
                              >
                                <option value="" disabled>Reassign to…</option>
                                {agents.filter((a) => a.id !== c.assigned_to?.id).map((a) => (
                                  <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => setReassignTarget(null)}
                                className="text-xs font-semibold text-gray-500 px-2 py-1.5 hover:text-gray-700"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setReassignTarget(c.phone)}
                              className="text-xs font-semibold border border-gray-200 bg-white text-gray-700 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                              Reassign
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </RepDashboardLayout>
  );
};

export default TeamOverviewScreen;
