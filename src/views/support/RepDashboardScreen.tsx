import { useState } from 'react';
import { RepDashboardLayout } from '../../layouts/RepDashboardLayout';
import { useGetRepOrders, useGetRepMetrics } from '../../hooks/useRepOrders';
import { sheetActions } from '../../store/client/sheets';
import type { WaConversation } from '../../service/repService';

const RepDashboardScreen = () => {
  const [search, setSearch] = useState('');
  const { data: conversations = [], isLoading } = useGetRepOrders();
  const { data: metrics } = useGetRepMetrics();

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.phone.toLowerCase().includes(q) ||
      c.customer_name.toLowerCase().includes(q) ||
      c.last_message.toLowerCase().includes(q) ||
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
    { icon: 'ri-chat-3-line', title: 'Total', amount: metrics?.total_assigned ?? 0, iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
    { icon: 'ri-time-line', title: 'Active', amount: metrics?.pending ?? 0, iconBg: 'bg-yellow-50', iconColor: 'text-yellow-500' },
    { icon: 'ri-checkbox-circle-line', title: 'Resolved', amount: metrics?.completed ?? 0, iconBg: 'bg-green-50', iconColor: 'text-green-500' },
    { icon: 'ri-message-2-line', title: 'Messages', amount: conversations.reduce((n, c) => n + (c.message_count ?? 0), 0), iconBg: 'bg-purple-50', iconColor: 'text-purple-500' },
  ];

  return (
    <RepDashboardLayout>
      <div className="w-full flex flex-col gap-5 overflow-y-auto">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statsConfig.map((stat) => (
            <div key={stat.title} className="flex flex-col gap-3 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                <i className={`${stat.icon} text-lg ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 leading-tight mb-0.5">{stat.title}</p>
                <h3 className="font-bold text-xl text-gray-900">{stat.amount}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        {/* Conversations table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-orange-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Message</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Msgs</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Updated</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-14 text-gray-400 text-sm">
                      <i className="ri-loader-4-line animate-spin text-xl" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-14 text-gray-400 text-sm">
                      No conversations found
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr
                      key={c.phone}
                      onClick={() => openConversation(c)}
                      className="border-b border-gray-50 hover:bg-orange-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-900">{c.customer_name || c.phone}</p>
                        <p className="text-xs text-gray-400">{c.phone}</p>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 max-w-60">
                        <p className="truncate">{c.last_message}</p>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 font-medium">{c.message_count}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                          c.status === 'resolved' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 text-xs">
                        {new Date(c.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-gray-50">
            {isLoading ? (
              <p className="text-center py-14 text-gray-400 text-sm">
                <i className="ri-loader-4-line animate-spin text-xl" />
              </p>
            ) : filtered.length === 0 ? (
              <p className="text-center py-14 text-gray-400 text-sm">No conversations found</p>
            ) : (
              filtered.map((c) => (
                <div
                  key={c.phone}
                  onClick={() => openConversation(c)}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-orange-50/40 cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {c.customer_name || c.phone}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{c.last_message}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                    c.status === 'resolved' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </RepDashboardLayout>
  );
};

export default RepDashboardScreen;
