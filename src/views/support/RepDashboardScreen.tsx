import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RepDashboardLayout } from '../../layouts/RepDashboardLayout';
import { useGetRepOrders, useGetRepMetrics } from '../../hooks/useRepOrders';
import { useRepProfile } from '../../hooks/useRepAuth';
import { sheetActions } from '../../store/client/sheets';
import type { WaConversation } from '../../service/repService';
import { Card, CardHeader, EmptyState, LoadingRows, Pill, StatTile, thClass } from '../../components/support/SupportUI';

const greetingFor = (hour: number) => (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');

const ConversationStatus = ({ status }: { status: WaConversation['status'] }) => (
  <Pill className={status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
    <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${status === 'resolved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
    {status}
  </Pill>
);

/**
 * The greeting strip. The port photo (a 600×197 panorama) only fills the right
 * part of the banner, capped near its native width, with the navy fading over
 * it from the left — so it never has to be upscaled across the full content
 * width, and the text side stays solid enough to read.
 */
const GreetingBanner = ({ activeCount, isLoading }: { activeCount: number; isLoading: boolean }) => {
  const profile = useRepProfile();
  const now = new Date();
  const today = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <section className="relative overflow-hidden rounded-3xl bg-brand-navy text-white">
      <img
        src="/images/support-port.jpg"
        alt=""
        aria-hidden
        className="absolute inset-y-0 right-0 h-full w-full object-cover object-[65%_55%] opacity-60 sm:w-[68%] sm:max-w-[660px] sm:opacity-100 sm:[mask-image:linear-gradient(to_right,transparent,black_55%)]"
      />
      <div className="absolute inset-0 bg-linear-to-r from-brand-navy via-brand-navy/60 to-brand-navy/10 sm:hidden" />
      <div className="absolute inset-0 bg-linear-to-t from-brand-navy/60 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_92%_30%,rgba(251,191,36,0.25),transparent_38%)]" />

      <div className="relative flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-8">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">{today}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {greetingFor(now.getHours())}{profile?.first_name ? `, ${profile.first_name}` : ''}
          </h2>
          <p className="mt-1.5 max-w-md text-sm leading-6 text-white/75">
            {isLoading
              ? 'Fetching your queue…'
              : activeCount > 0
                ? `You have ${activeCount} active conversation${activeCount === 1 ? '' : 's'} waiting in your queue.`
                : 'Your queue is clear. New WhatsApp conversations will show up here.'}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
            {profile?.invite_role?.name && (
              <span className="rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/15">{profile.invite_role.name}</span>
            )}
            {profile?.branch?.branch_code && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/15">
                <i className="ri-git-branch-line text-amber-300" />
                {profile.branch.branch_code}
              </span>
            )}
          </div>
        </div>

        <Link
          to="/support/orders"
          className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy shadow-sm transition-colors hover:bg-orange-50"
        >
          <i className="ri-truck-line text-brand" />
          Branch orders
          <i className="ri-arrow-right-line" />
        </Link>
      </div>
    </section>
  );
};

const RepDashboardScreen = () => {
  const [search, setSearch] = useState('');
  const { data: conversations = [], isLoading } = useGetRepOrders();
  const { data: metrics } = useGetRepMetrics();

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.phone.toLowerCase().includes(q) ||
      c.customer_name.toLowerCase().includes(q) ||
      (c.last_message?.content ?? '').toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
    );
  });

  const openConversation = (conversation: WaConversation) => {
    sheetActions.toggleBasicResizableSheet({
      name: 'orderConversationSheet',
      show: true,
      props: { conversation },
    });
  };

  const statsConfig = [
    { icon: 'ri-chat-3-line', title: 'Total', amount: metrics?.total_assigned ?? 0, tone: 'navy' as const, hint: 'Assigned to you' },
    { icon: 'ri-time-line', title: 'Active', amount: metrics?.pending ?? 0, tone: 'amber' as const, hint: 'Waiting on a reply' },
    { icon: 'ri-checkbox-circle-line', title: 'Resolved', amount: metrics?.completed ?? 0, tone: 'green' as const, hint: 'Closed out' },
    { icon: 'ri-message-2-line', title: 'Messages', amount: conversations.reduce((n, c) => n + (c.message_count ?? 0), 0), tone: 'brand' as const, hint: 'Across your queue' },
  ];

  const emptyState = search ? (
    <EmptyState icon="ri-search-line" title="No matching conversations">
      Nothing matches “{search}”. Try a phone number, name or status.
    </EmptyState>
  ) : (
    <EmptyState icon="ri-chat-smile-2-line" title="No conversations yet">
      When a customer messages your branch on WhatsApp and it's assigned to you, it lands here.
    </EmptyState>
  );

  return (
    <RepDashboardLayout>
      <div className="w-full flex flex-col gap-5">
        <GreetingBanner activeCount={metrics?.pending ?? 0} isLoading={isLoading} />

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statsConfig.map((stat) => (
            <StatTile
              key={stat.title}
              icon={stat.icon}
              label={stat.title}
              value={stat.amount}
              tone={stat.tone}
              hint={stat.hint}
              loading={isLoading}
            />
          ))}
        </div>

        {/* Conversations */}
        <Card>
          <CardHeader icon="ri-whatsapp-line" title="Your conversations" meta={isLoading ? undefined : conversations.length}>
            <div className="relative w-full sm:w-72">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
                aria-label="Search conversations"
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white outline-none transition focus:border-brand focus:ring-4 focus:ring-orange-100"
              />
            </div>
          </CardHeader>

          {isLoading ? (
            <LoadingRows rows={5} label="Loading conversations" />
          ) : filtered.length === 0 ? (
            emptyState
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <th className={thClass}>Customer</th>
                      <th className={thClass}>Last message</th>
                      <th className={thClass}>Msgs</th>
                      <th className={thClass}>Status</th>
                      <th className={thClass}>Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((c) => (
                      <tr
                        key={c.phone}
                        onClick={() => openConversation(c)}
                        className="group hover:bg-orange-50/40 cursor-pointer transition-colors"
                      >
                        <td className="pl-5 pr-4 py-3.5">
                          <p className="font-semibold text-gray-900 group-hover:text-brand transition-colors">{c.customer_name || c.phone}</p>
                          <p className="text-xs text-gray-400 tabular-nums">{c.phone}</p>
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 max-w-72">
                          <p className="truncate">{c.last_message?.content || '—'}</p>
                        </td>
                        <td className="px-4 py-3.5 text-gray-700 font-semibold tabular-nums">{c.message_count}</td>
                        <td className="px-4 py-3.5"><ConversationStatus status={c.status} /></td>
                        <td className="px-4 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(c.updated_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-gray-50">
                {filtered.map((c) => (
                  <button
                    type="button"
                    key={c.phone}
                    onClick={() => openConversation(c)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-orange-50/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {c.customer_name || c.phone}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{c.last_message?.content || '—'}</p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        {c.message_count} msgs · {new Date(c.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ConversationStatus status={c.status} />
                  </button>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </RepDashboardLayout>
  );
};

export default RepDashboardScreen;
