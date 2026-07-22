// Real order statuses go well beyond a fixed enum (e.g. "arrived_pickup_location",
// "delivery_completed", alongside the more obvious "pending"/"canceled") — see
// TransactionStatus in partnerService.ts, typed as an open-ended string union.
// Rather than maintaining an exhaustive map that silently falls back to gray
// for anything unlisted, bucket by keyword so new/unseen statuses still land
// in a sensible color.

export function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function statusDotClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('cancel') || s.includes('fail') || s.includes('dispute') || s.includes('reject')) return 'bg-red-600';
  if (s.includes('complete') || s.includes('delivered')) return 'bg-green-600';
  if (s.includes('pending') || s.includes('awaiting')) return 'bg-yellow-600';
  return 'bg-blue-600';
}

export function statusHexColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('cancel') || s.includes('fail') || s.includes('dispute') || s.includes('reject')) return '#dc2626';
  if (s.includes('complete') || s.includes('delivered')) return '#16a34a';
  if (s.includes('pending') || s.includes('awaiting')) return '#ca8a04';
  return '#2563eb';
}
