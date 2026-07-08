import { useAppStore } from '../../hooks/useAppStore';
import { useGetConversationDetail, useResolveConversation } from '../../hooks/useRepOrders';
import type { WaConversation } from '../../service/repService';

export const OrderConversationSheet = () => {
  const { modal: { props } } = useAppStore((s) => s);
  const conversation: WaConversation = props?.conversation;

  const { data: detail, isLoading } = useGetConversationDetail(conversation?.phone ?? '');
  const { mutate: resolve, isPending: isResolving } = useResolveConversation();

  if (!conversation) return null;

  const isResolved = conversation.status === 'resolved';

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

        {!isResolved && (
          <button
            onClick={() => resolve(conversation.phone)}
            disabled={isResolving}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold border border-green-200 bg-green-50 text-green-700 px-3 py-1.5 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-60"
          >
            <i className="ri-checkbox-circle-line text-sm" />
            {isResolving ? 'Resolving…' : 'Mark Resolved'}
          </button>
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
            {detail.messages.map((msg, idx) => {
              const isBot = msg.from === 'bot' || msg.type === 'bot';
              const isCustomer = !isBot;
              const bubbleClass = isBot
                ? 'bg-orange-50 text-[#8B2915] self-start'
                : 'bg-gray-100 text-gray-800 self-start';
              const label = isBot ? 'Bot' : msg.from;

              return (
                <div key={idx} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${bubbleClass}`}>
                  <p className="text-[10px] font-semibold opacity-70 mb-0.5 capitalize">{label}</p>
                  <p>{msg.body}</p>
                  <p className="text-[10px] opacity-60 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
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
                <div
                  key={idx}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 text-sm"
                >
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
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
