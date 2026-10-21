import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useMarketplaceConversations, useMarketplaceThread, useSendMarketplaceMessage } from "../../hooks/useMarketplace";
import type { MarketplaceConversation, MarketplaceMessage } from "../../service/partnerService";
import { Composer } from "./Composer";
import { LoadError, PartnerLogo, VerifiedBadge, clockTime, formatDay, placeOf, shortTime } from "./shared";

/**
 * Partner-to-partner messages. One thread per pair of partners; a message can
 * carry the brief or listing it's about. Two panes on desktop, one at a time
 * with a back button on a phone. The open thread is in the URL (?c=) so a
 * storefront or a brief response can land straight in it.
 *
 * No realtime: the hooks poll the open thread every 10s and the list every
 * 30s, only while the tab is visible.
 */
export const InboxTab = ({
  selectedId,
  onSelect,
  onOpenPartner,
  onBrowse,
}: {
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onOpenPartner: (partnerCode: string) => void;
  onBrowse: () => void;
}) => {
  const { data: conversations = [], isLoading, error, refetch } = useMarketplaceConversations();
  const [filter, setFilter] = useState("");
  const shown = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return f ? conversations.filter((c) => c.partner.partner_name.toLowerCase().includes(f)) : conversations;
  }, [conversations, filter]);

  if (!isLoading && !error && conversations.length === 0 && selectedId == null) {
    return (
      <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-16 text-center shadow-card">
        <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-brand"><i className="ri-chat-smile-3-line text-2xl" /></span>
        <p className="text-sm font-semibold text-gray-800">No conversations yet</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-gray-500">
          Message a partner from their storefront, or respond to a job brief. When partners write to you, it lands here.
        </p>
        <button onClick={onBrowse} className="mt-4 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-hover">Browse the marketplace</button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-200px)] min-h-[440px] overflow-hidden rounded-2xl bg-white shadow-card md:h-[calc(100dvh-130px)]">
      {/* List */}
      <div className={`${selectedId != null ? "hidden md:flex" : "flex"} w-full min-w-0 flex-col border-r border-gray-100 md:w-80 md:shrink-0 lg:w-96`}>
        <div className="border-b border-gray-100 p-3">
          <div className="relative">
            <i className="ri-search-line pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search conversations"
              className="h-10 w-full rounded-xl bg-gray-50 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {error ? (
            <div className="p-3"><LoadError what="your conversations" error={error} onRetry={() => refetch()} /></div>
          ) : isLoading ? (
            <div className="flex flex-col gap-1 p-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-50" />)}</div>
          ) : shown.length === 0 ? (
            <p className="px-4 py-10 text-center text-xs text-gray-400">No conversation matches "{filter}".</p>
          ) : (
            <ul className="flex flex-col p-1.5">
              {shown.map((c) => (
                <li key={c.id}>
                  <ConversationRow conversation={c} active={c.id === selectedId} onClick={() => onSelect(c.id)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Thread */}
      <div className={`${selectedId != null ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
        {selectedId != null ? (
          <Thread
            key={selectedId}
            id={selectedId}
            fallback={conversations.find((c) => c.id === selectedId)}
            onBack={() => onSelect(null)}
            onOpenPartner={onOpenPartner}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-gray-50/50 text-center">
            <i className="ri-chat-3-line text-3xl text-gray-300" />
            <p className="text-sm font-semibold text-gray-600">Pick a conversation</p>
            <p className="text-xs text-gray-400">Your messages with other partners show up here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

function ConversationRow({ conversation: c, active, onClick }: { conversation: MarketplaceConversation; active: boolean; onClick: () => void }) {
  const unread = c.unread_count > 0;
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${active ? "bg-orange-50" : "hover:bg-gray-50"}`}
    >
      <PartnerLogo partner={c.partner} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`min-w-0 flex-1 truncate text-sm ${unread ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
            {c.partner.partner_name}
          </p>
          <span className={`shrink-0 text-[11px] ${unread ? "font-semibold text-brand" : "text-gray-400"}`}>{shortTime(c.last_message_at)}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <p className={`min-w-0 flex-1 truncate text-xs ${unread ? "font-medium text-gray-700" : "text-gray-500"}`}>
            {c.last_message ? `${c.last_message.is_mine ? "You: " : ""}${c.last_message.body}` : "No messages yet"}
          </p>
          {unread && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">
              {c.unread_count > 99 ? "99+" : c.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function Thread({
  id,
  fallback,
  onBack,
  onOpenPartner,
}: {
  id: number;
  fallback?: MarketplaceConversation;
  onBack: () => void;
  onOpenPartner: (partnerCode: string) => void;
}) {
  const { data: thread, isLoading, error, refetch } = useMarketplaceThread(id);
  const send = useSendMarketplaceMessage();
  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const partner = thread?.partner ?? fallback?.partner;
  const messages = thread?.messages ?? [];

  // Stick to the bottom when the thread opens and whenever a message arrives.
  const lastId = messages[messages.length - 1]?.id;
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastId, send.isPending]);

  const submit = () => {
    const text = body.trim();
    if (!text) return;
    send.mutate({ conversationId: id, body: text }, { onSuccess: () => setBody("") });
  };

  return (
    <>
      <header className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-3 py-3 sm:px-4">
        <button onClick={onBack} aria-label="Back to conversations" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 md:hidden">
          <i className="ri-arrow-left-line text-lg" />
        </button>
        {partner ? (
          <>
            <PartnerLogo partner={partner} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-bold text-gray-900">{partner.partner_name}</p>
                {partner.is_verified && <VerifiedBadge compact />}
              </div>
              {placeOf(partner) && <p className="truncate text-xs text-gray-500">{placeOf(partner)}</p>}
            </div>
            <button onClick={() => onOpenPartner(partner.partner_code)} className="flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-brand hover:bg-orange-50">
              <i className="ri-store-2-line" /><span className="hidden sm:inline">Storefront</span>
            </button>
          </>
        ) : (
          <span className="h-9 flex-1 animate-pulse rounded-xl bg-gray-50" />
        )}
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-gray-50/60 px-3 py-4 sm:px-6">
        {error ? (
          <LoadError what="this conversation" error={error} onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="flex flex-col gap-3">
            {[60, 40, 70, 50].map((w, i) => (
              <div key={i} className={`h-12 animate-pulse rounded-2xl bg-white ${i % 2 ? "self-end" : ""}`} style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : (
          <MessageList messages={messages} pending={send.isPending ? send.variables?.body : undefined} />
        )}
      </div>

      <div className="shrink-0 border-t border-gray-100 bg-white px-3 pt-3 sm:px-4">
        <Composer value={body} onChange={setBody} onSend={submit} sending={send.isPending} placeholder={partner ? `Message ${partner.partner_name}…` : "Write a message…"} />
      </div>
    </>
  );
}

function MessageList({ messages, pending }: { messages: MarketplaceMessage[]; pending?: string }) {
  if (messages.length === 0 && !pending) {
    return <p className="py-10 text-center text-xs text-gray-400">No messages yet — say hello.</p>;
  }
  let lastDay = "";
  return (
    <div className="flex flex-col gap-2">
      {messages.map((m, i) => {
        const day = m.created_at ? formatDay(m.created_at) : "";
        const showDay = day !== lastDay;
        lastDay = day;
        const prev = messages[i - 1];
        const grouped = !showDay && prev && prev.is_mine === m.is_mine && !m.brief && !m.listing;
        return (
          <Fragment key={m.id}>
            {showDay && day && (
              <div className="my-2 flex items-center gap-3">
                <span className="h-px flex-1 bg-gray-200" />
                <span className="text-[11px] font-medium text-gray-400">{day}</span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>
            )}
            <Bubble message={m} grouped={!!grouped} />
          </Fragment>
        );
      })}
      {pending && (
        <div className="flex justify-end opacity-60">
          <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand px-3.5 py-2 text-sm text-white sm:max-w-[70%]">
            <p className="whitespace-pre-wrap break-words">{pending}</p>
            <p className="mt-0.5 text-right text-[10px] text-white/70">Sending…</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Bubble({ message: m, grouped }: { message: MarketplaceMessage; grouped: boolean }) {
  const context = m.brief ? { icon: "ri-file-list-3-line", label: "Brief", title: m.brief.title } : m.listing ? { icon: "ri-price-tag-3-line", label: "Listing", title: m.listing.title } : null;
  return (
    <div className={`flex flex-col ${m.is_mine ? "items-end" : "items-start"} ${grouped ? "-mt-1" : "mt-1"}`}>
      {!grouped && !m.is_mine && m.sender_name && <p className="mb-0.5 px-1 text-[11px] font-medium text-gray-400">{m.sender_name}</p>}
      {context && (
        <span className="mb-1 inline-flex max-w-[85%] items-center gap-1 truncate rounded-lg border border-orange-100 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 sm:max-w-[70%]">
          <i className={`${context.icon} text-brand`} />
          <span className="text-gray-400">{context.label}:</span>
          <span className="truncate">{context.title}</span>
        </span>
      )}
      <div
        className={`max-w-[85%] px-3.5 py-2 text-sm sm:max-w-[70%] ${
          m.is_mine ? "rounded-2xl rounded-br-md bg-brand text-white" : "rounded-2xl rounded-bl-md bg-white text-gray-800 shadow-card"
        }`}
      >
        <p className="whitespace-pre-wrap break-words leading-5">{m.body}</p>
        <p className={`mt-0.5 text-right text-[10px] ${m.is_mine ? "text-white/70" : "text-gray-400"}`}>{clockTime(m.created_at)}</p>
      </div>
    </div>
  );
}
