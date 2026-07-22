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
import type { Agent, WaConversation } from '../../service/repService';
import { sheetActions } from '../../store/client/sheets';

function avatarColor(id: number) {
  const colors = ['bg-orange-400', 'bg-blue-400', 'bg-teal-400', 'bg-purple-400', 'bg-pink-400'];
  return colors[id % colors.length];
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

const STATUS_DOT: Record<Agent['status'], string> = {
  active: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-gray-300',
};

function waitBadge(raisedAt: string): { label: string; cls: string } {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(raisedAt).getTime()) / 60000));
  const label = mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
  if (mins < 15) return { label, cls: 'bg-blue-50 text-blue-600' };
  if (mins < 60) return { label, cls: 'bg-yellow-50 text-yellow-700' };
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

  if (profile && !isManager) {
    return <Navigate to="/support/dashboard" replace />;
  }

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
    { icon: 'ri-team-line', label: 'Team size', value: agents.length, color: 'text-[#F14724]', bg: 'bg-orange-50' },
    { icon: 'ri-checkbox-circle-line', label: 'Active now', value: activeAgents, color: 'text-green-600', bg: 'bg-green-50' },
    { icon: 'ri-chat-3-line', label: 'Open conversations', value: openCount, color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: 'ri-error-warning-line', label: 'Escalations pending', value: escalated.length, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <RepDashboardLayout>
      <div className="w-full flex flex-col gap-5">
        <p className="text-sm text-gray-500">
          Every agent's load across the branch, plus anything they've flagged for you — support reps only see their own queue.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <i className={`${s.icon} text-lg ${s.color}`} />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 items-start">
          {/* Roster */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Team roster</h2>
              <span className="text-xs text-gray-400">{agents.length} agents</span>
            </div>
            {agentsLoading ? (
              <p className="text-center py-10 text-gray-400 text-sm">
                <i className="ri-loader-4-line animate-spin text-xl" />
              </p>
            ) : agents.length === 0 ? (
              <p className="text-center py-10 text-gray-400 text-sm">No agents found for your branch.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {agents.map((agent) => {
                  const assigned = byAgent.get(agent.id) ?? [];
                  const open = assigned.filter((c) => c.status === 'active').length;
                  const resolved = assigned.filter((c) => c.status === 'resolved').length;
                  const isExpanded = expandedAgentId === agent.id;

                  return (
                    <div key={agent.id}>
                      <div className="flex items-center gap-3 px-5 py-3.5">
                        <div className="relative shrink-0">
                          <div className={`w-9 h-9 rounded-xl ${avatarColor(agent.id)} flex items-center justify-center`}>
                            <span className="text-white text-xs font-bold">{initials(agent.name)}</span>
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${STATUS_DOT[agent.status]}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 text-sm truncate">{agent.name}</p>
                          <p className="text-xs text-gray-400 truncate">{agent.role}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">{open}</p>
                            <p className="text-[9px] text-gray-400 uppercase tracking-wide">Open</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">{resolved}</p>
                            <p className="text-[9px] text-gray-400 uppercase tracking-wide">Resolved</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedAgentId(isExpanded ? null : agent.id)}
                          disabled={open === 0}
                          className="shrink-0 text-xs font-semibold border border-gray-200 bg-white text-gray-700 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isExpanded ? 'Hide' : 'View queue'}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="bg-gray-50/60 px-5 py-3 flex flex-col gap-1.5">
                          {assigned.filter((c) => c.status === 'active').map((c) => (
                            <button
                              key={c.phone}
                              onClick={() => openConversation(c)}
                              className="flex items-center justify-between gap-2 text-left px-3 py-2 rounded-xl hover:bg-white transition-colors"
                            >
                              <span className="text-xs font-medium text-gray-800 truncate">
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
          </div>

          {/* Escalations */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Escalations</h2>
              <span className="text-xs text-gray-400">{escalated.length} waiting</span>
            </div>
            {conversationsLoading ? (
              <p className="text-center py-10 text-gray-400 text-sm">
                <i className="ri-loader-4-line animate-spin text-xl" />
              </p>
            ) : escalated.length === 0 ? (
              <p className="text-center py-10 text-gray-400 text-sm">Nothing waiting on you right now.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {escalated.map((c) => {
                  const wait = waitBadge(c.escalation!.raised_at);
                  const isUnclaimed = !c.assigned_to;

                  return (
                    <div key={c.phone} className="px-5 py-3.5 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {c.customer_name || c.phone}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${wait.cls}`}>
                          {wait.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-snug">
                        {c.escalation!.raised_by ? (
                          <><span className="font-semibold text-gray-700">{c.escalation!.raised_by.name}</span>: </>
                        ) : null}
                        {c.escalation!.note || 'Auto-escalated — no agent has claimed this yet.'}
                      </p>

                      {isUnclaimed ? (
                        <button
                          onClick={() => claim(c.phone)}
                          disabled={isClaiming}
                          className="text-xs font-semibold bg-[#F14724] text-white px-3 py-1.5 rounded-xl hover:bg-[#d63d1e] transition-colors disabled:opacity-60 self-start"
                        >
                          {isClaiming ? 'Claiming…' : 'Claim'}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => takeOver(c.phone)}
                            disabled={isTakingOver}
                            className="text-xs font-semibold bg-[#F14724] text-white px-3 py-1.5 rounded-xl hover:bg-[#d63d1e] transition-colors disabled:opacity-60"
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
                                className="text-xs border border-gray-200 rounded-xl px-2 py-1.5 bg-white"
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
          </div>
        </div>
      </div>
    </RepDashboardLayout>
  );
};

export default TeamOverviewScreen;
