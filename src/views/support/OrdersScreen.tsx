import { useState } from 'react';
import { RepDashboardLayout } from '../../layouts/RepDashboardLayout';
import { useGetRepTransactions, useAssignDriverToOrder } from '../../hooks/useRepTransactions';
import { DriverAssignControl } from '../../components/support/DriverAssignControl';
import { EscalateOrderControl } from '../../components/support/EscalateOrderControl';
import type { Transaction, TransactionStatus } from '../../service/partnerService';

const STATUS_OPTIONS: (TransactionStatus | 'All')[] = [
  'All', 'pending', 'approved', 'shipped', 'delivered', 'canceled',
];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  approved: 'bg-blue-50 text-blue-700',
  shipped: 'bg-indigo-50 text-indigo-700',
  delivered: 'bg-green-50 text-green-700',
  canceled: 'bg-red-50 text-red-600',
};

const PAGE_SIZE = 20;

const formatAmount = (n: number | null) => (n != null ? `₦${n.toLocaleString()}` : 'Pending price');
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const StatusBadge = ({ value, styles }: { value: string; styles: Record<string, string> }) => (
  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${styles[value] ?? 'bg-gray-100 text-gray-600'}`}>
    {value}
  </span>
);

const OrdersScreen = () => {
  const [status, setStatus] = useState<TransactionStatus | 'All'>('All');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useGetRepTransactions({
    status: status === 'All' ? undefined : status,
    page,
    page_size: PAGE_SIZE,
  });

  const { mutate: assignDriver, isPending: isAssigning } = useAssignDriverToOrder();

  const orders: Transaction[] = data?.results ?? [];
  const count = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const changeStatus = (value: TransactionStatus | 'All') => {
    setStatus(value);
    setPage(1);
  };

  return (
    <RepDashboardLayout>
      <div className="w-full flex flex-col gap-5">
        <p className="text-sm text-gray-500">
          Orders in your branch — assign or reassign a driver directly, no need to open a conversation.
        </p>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 shrink-0">Status</span>
          <select
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none capitalize"
            value={status}
            onChange={(e) => changeStatus(e.target.value as TransactionStatus | 'All')}
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-orange-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Driver</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-14 text-gray-400 text-sm">
                      <i className="ri-loader-4-line animate-spin text-xl" />
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-14 text-gray-400 text-sm">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-orange-50/40 transition-colors">
                      <td className="px-5 py-3.5 text-gray-900 font-medium">#{order.id}</td>
                      <td className="px-4 py-3.5 text-gray-600">{order.sender_id}</td>
                      <td className="px-4 py-3.5 text-gray-900 font-semibold">{formatAmount(order.total_amount)}</td>
                      <td className="px-4 py-3.5"><StatusBadge value={order.status} styles={STATUS_STYLES} /></td>
                      <td className="px-4 py-3.5 text-gray-500">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3.5 min-w-40">
                        <DriverAssignControl
                          driverId={order.driver}
                          isPending={isAssigning}
                          onAssign={(driverId, { onSuccess, onError }) =>
                            assignDriver(
                              { orderId: order.id, driverId },
                              { onSuccess, onError: (err: any) => onError(err?.message ?? 'Failed to assign driver.') }
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <EscalateOrderControl orderId={order.id} orderLabel={`Order #${order.id}`} />
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
            ) : orders.length === 0 ? (
              <p className="text-center py-14 text-gray-400 text-sm">No orders found</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="flex flex-col gap-2 px-4 py-3.5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 text-sm">#{order.id}</p>
                    <p className="font-semibold text-gray-900 text-sm">{formatAmount(order.total_amount)}</p>
                  </div>
                  <p className="text-xs text-gray-400">{order.sender_id} · {formatDate(order.created_at)}</p>
                  <StatusBadge value={order.status} styles={STATUS_STYLES} />
                  <DriverAssignControl
                    driverId={order.driver}
                    isPending={isAssigning}
                    onAssign={(driverId, { onSuccess, onError }) =>
                      assignDriver(
                        { orderId: order.id, driverId },
                        { onSuccess, onError: (err: any) => onError(err?.message ?? 'Failed to assign driver.') }
                      )
                    }
                  />
                  <div className="flex justify-end">
                    <EscalateOrderControl orderId={order.id} orderLabel={`Order #${order.id}`} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {count > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
              <p className="text-xs text-gray-400">
                Page {page} of {totalPages} · {count} order{count !== 1 ? 's' : ''}
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
                  disabled={!data?.next || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <i className="ri-arrow-right-s-line text-base" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </RepDashboardLayout>
  );
};

export default OrdersScreen;
