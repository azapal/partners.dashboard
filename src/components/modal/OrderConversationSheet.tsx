import { useState } from 'react';
import { useAppStore } from '../../hooks/useAppStore';
import { useGetConversationDetail, useResolveConversation, useEscalateConversation, useAssignDriver } from '../../hooks/useRepOrders';
import type { WaConversation, WaOrder } from '../../service/repService';
import { DriverAssignControl } from '../support/DriverAssignControl';
import { EscalateOrderControl } from '../support/EscalateOrderControl';

export const OrderConversationSheet = () => {
  const { modal: { props } } = useAppStore((s) => s);
  const conversation: WaConversation = props?.conversation;

  const { data: detail, isLoading } = useGetConversationDetail(conversation?.phone ?? '');
  const { mutate: resolve, isPending: isResolving } = useResolveConversation();
  const { mutate: escalate, isPending: isEscalating } = useEscalateConversation();
  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [note, setNote] = useState('');

  if (!conversation) return null;

  const isResolved = conversation.status === 'resolved';
  const escalation = conversation.escalation;

  const handleEscalate = () => {
    if (!note.trim()) return;
    escalate(
      { phone: conversation.phone, note: note.trim() },
      { onSuccess: () => { setShowEscalateForm(false); setNote(''); } }
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-2 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-lg text-gray-900">
            {conversation.customer_name || conversation.phone}
          </h2>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
              isResolved ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
            }`}
          >
            {isResolved ? 'Resolved' : 'Active'}
          </span>
        </div>
        <p className="text-xs text-gray-400">{conversation.phone}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {conversation.message_count} message{conversation.message_count !== 1 ? 's' : ''} ·{' '}
          {new Date(conversation.updated_at).toLocaleString()}
        </p>

        {escalation && (
          <div className="mt-3 flex items-start gap-2 bg-red-50 text-red-700 rounded-xl px-3 py-2.5 text-xs">
            <i className="ri-error-warning-line text-sm mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">
                Escalated{escalation.raised_by ? ` by ${escalation.raised_by.name}` : ''}
              </p>
              {escalation.note && <p className="mt-0.5 text-red-600">{escalation.note}</p>}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {!isResolved && (
            <button
              onClick={() => resolve(conversation.phone)}
              disabled={isResolving}
              className="flex items-center gap-1.5 text-xs font-semibold border border-green-200 bg-green-50 text-green-700 px-3 py-1.5 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-60"
            >
              <i className="ri-checkbox-circle-line text-sm" />
              {isResolving ? 'Resolving…' : 'Mark Resolved'}
            </button>
          )}
          {!isResolved && !escalation && (
            <button
              onClick={() => setShowEscalateForm((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold border border-gray-200 bg-white text-gray-700 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <i className="ri-flag-2-line text-sm" />
              Escalate
            </button>
          )}
        </div>

        {showEscalateForm && !escalation && (
          <div className="mt-3 flex flex-col gap-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="What does your manager need to know?"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-200 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowEscalateForm(false); setNote(''); }}
                className="flex-1 h-9 border border-gray-200 bg-white text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalate}
                disabled={isEscalating || !note.trim()}
                className="flex-1 h-9 bg-[#F14724] text-white rounded-xl text-xs font-semibold hover:bg-[#d63d1e] transition-colors disabled:opacity-60"
              >
                {isEscalating ? 'Escalating…' : 'Send to manager'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Conversation thread */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Conversation
        </p>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-10">
            <i className="ri-loader-4-line animate-spin text-2xl text-gray-300" />
          </div>
        ) : !detail?.messages?.length ? (
          <p className="text-sm text-gray-400 text-center py-8">No messages yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {detail.messages.map((msg) => {
              const isCustomer = msg.role === 'user' || msg.role === 'customer';
              const bubbleClass = isCustomer
                ? 'bg-gray-100 text-gray-800 self-start'
                : 'bg-orange-50 text-[#8B2915] self-start';
              const label = isCustomer ? (conversation.customer_name || 'Customer') : msg.role;

              return (
                <div key={msg.id} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${bubbleClass}`}>
                  <p className="text-[10px] font-semibold opacity-70 mb-0.5 capitalize">{label}</p>
                  <p>{msg.content}</p>
                  <p className="text-[10px] opacity-60 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent orders */}
        {detail?.orders?.length ? (
          <div className="mt-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Recent orders
            </p>
            <div className="flex flex-col gap-2">
              {detail.orders.map((order, idx) => (
                <OrderRow key={idx} order={order} phone={conversation.phone} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

/* ---------- Order row: view + assign/reassign driver ---------- */
function OrderRow({ order, phone }: {
  order: WaOrder;
  phone: string;
}) {
  const { mutate: assignDriver, isPending } = useAssignDriver();

  return (
    <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-800">
          {order.order_ref ?? `Order #${order.id}`}
        </span>
        <div className="flex items-center gap-2">
          {order.amount != null && (
            <span className="text-gray-500 text-xs">₦{order.amount.toLocaleString()}</span>
          )}
          {order.status && (
            <span className="text-xs capitalize text-gray-400">{order.status}</span>
          )}
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <DriverAssignControl
            driverId={order.driver}
            isPending={isPending}
            onAssign={(driverId, { onSuccess, onError }) =>
              assignDriver(
                { orderId: order.id, driverId, phone },
                { onSuccess, onError: (err: any) => onError(err?.message ?? 'Failed to assign driver.') }
              )
            }
          />
        </div>
        <EscalateOrderControl orderId={order.id} orderLabel={order.order_ref ?? `Order #${order.id}`} />
      </div>
    </div>
  );
}
