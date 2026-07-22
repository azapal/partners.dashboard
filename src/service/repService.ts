import config from '../../config/config';
import type { ApiResponse, PartnerResponse, Transaction, TransactionsQuery, TransactionsPage } from './partnerService';
import { repStoreActions } from '../store/client/rep';

// ============================================================================
// Types
// ============================================================================

export interface RepBranch {
  id: number;
  branch_code: string;
  country?: string;
  address?: string;
  state?: string;
  lga?: string;
  status?: boolean;
}

export interface RepInviteRole {
  id: number;
  name: string;
}

export interface RepInvitingPartner {
  id: number;
  partner_name: string;
  partner_code: string;
}

export interface RepProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status?: boolean;
  branch: RepBranch;
  invite_role: RepInviteRole;
  // Present on branch-scoped logins (manager/Super Admin picking a branch to
  // log into) — the branch above reflects that chosen branch, not necessarily
  // the employee's home branch.
  inviting_partner?: RepInvitingPartner;
  access: string;
  refresh: string;
}

// WhatsApp conversation types — confirmed against the live API response.
export interface WaMessage {
  id: string | number;
  role: string;   // e.g. 'user' | 'assistant' | 'bot'
  content: string;
  created_at: string;
}

export interface RepRef {
  id: number;
  name: string;
}

export interface EscalationInfo {
  raised_by: RepRef | null;
  raised_at: string;
  note: string | null;
}

export type ConversationScope = 'mine' | 'team';

export interface WaConversation {
  phone: string;
  customer_name: string;
  last_message: WaMessage | null;
  message_count: number;
  status: 'active' | 'resolved';
  updated_at: string;
  assigned_to: RepRef | null;
  escalation: EscalationInfo | null;
}

export interface WaOrder {
  id: string | number;
  order_ref?: string;
  amount?: number;
  status?: string;
  created_at: string;
  // Bare employee id, not a {id, name} ref — the assign-driver response
  // only returns the id (see PATCH /partner/transactions/<id>/assign-driver
  // in the API manifest), so a name has to be resolved client-side against
  // the branch roster when available.
  driver?: number | null;
}

export interface WaConversationDetail {
  phone: string;
  customer_name?: string;
  messages: WaMessage[];
  orders: WaOrder[];
}

export interface RepOrderMetrics {
  total_assigned: number;
  pending: number;
  completed: number;
  failed: number;
}

export type ShiftStatus = 'active' | 'away' | 'offline';

export interface ShiftMate {
  id: number;
  name: string;
  role: string;
  status: ShiftStatus;
  branch_code: string;
}

export interface EscalatePayload {
  targetRepId: number;
  orderId?: string;
  note?: string;
}

// Real, presence-backed roster — GET /branch/<branch_code>/agents (manager-only).
// Distinct from ShiftMate below, which backs the general peer-escalation
// roster every rep can see and still has no real endpoint.
export interface Agent {
  id: number;
  name: string;
  role: string;
  status: ShiftStatus;
  branch_code: string;
}

// Dedicated driver roster for order assignment — GET
// /partner/transactions/drivers (any role, not manager-gated like Agent
// above). `status` is optional since the endpoint's availability field
// isn't confirmed yet; the UI degrades to name-only when absent.
export interface Driver {
  id: number;
  name: string;
  status?: ShiftStatus;
}

// ============================================================================
// Role check
// ============================================================================

// Role names are free-text, admin-assigned strings fetched from the backend
// (see useGetRoles/roleService) — there's no fixed enum to match against, so
// this matches loosely on "support" rather than an exact hardcoded list.
export const isSupportRole = (name: string | undefined | null): boolean => {
  if (!name) return false;
  return name.trim().toLowerCase().includes('support');
};

// Same looseness as isSupportRole — matches the two role names the backend
// actually treats as branch managers (see /branch/<code>/agents, /whatsapp/
// conversations take-over + reassign). This only gates *rendering* the Team
// nav item; the backend independently enforces these actions server-side.
export const isManagerRole = (name: string | undefined | null): boolean => {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  return n.includes('manager') || n.includes('admin');
};

// ============================================================================
// Auth helpers
// ============================================================================

const API_BASE_URL = config.api.azapal.baseUrl;

const getRepHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('rep_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * fetch wrapper that treats any 401 as a genuinely expired/invalid session —
 * it clears the rep/branch session so RepRequireAuth forces the user back
 * to login immediately, rather than attempting a silent refresh.
 */
const fetchWithRepAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const res = await fetch(url, { ...options, headers: { ...getRepHeaders(), ...(options.headers as Record<string, string> | undefined) } });

  if (res.status === 401) {
    repStoreActions.clearProfile();
  }

  return res;
};

const handleError = async (response: Response): Promise<never> => {
  const contentType = response.headers.get('content-type');
  let errorMessage = `Something went wrong (HTTP ${response.status}). Please try again.`;

  try {
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      errorMessage = data.message || data.detail || data.error || errorMessage;
    }
  } catch {
    // ignore parse errors, keep the generic fallback message
  }

  throw new Error(errorMessage);
};

// ============================================================================
// Auth — POST /employee/otp/send + /employee/verify-otp
// ============================================================================

export const repAuthService = {
  async sendOtp(email: string): Promise<PartnerResponse> {
    const response = await fetch(`${API_BASE_URL}/employee/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) await handleError(response);
    return response.json();
  },

  async verifyOtp(email: string, otp: string): Promise<ApiResponse<RepProfile>> {
    const response = await fetch(`${API_BASE_URL}/employee/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) await handleError(response);
    return response.json();
  },
};

// ============================================================================
// Branch-scoped auth — POST /branch/otp/send + /branch/verify-otp
// For branch managers and Super Admins logging into a specific branch
// (not necessarily their home branch). No "support" role restriction.
// ============================================================================

export const branchAuthService = {
  async sendOtp(email: string, branchCode: string): Promise<PartnerResponse> {
    const response = await fetch(`${API_BASE_URL}/branch/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, branch_code: branchCode }),
    });

    if (!response.ok) await handleError(response);
    return response.json();
  },

  async verifyOtp(email: string, otp: string, branchCode: string): Promise<ApiResponse<RepProfile>> {
    const response = await fetch(`${API_BASE_URL}/branch/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, branch_code: branchCode }),
    });

    if (!response.ok) await handleError(response);
    return response.json();
  },
};

// ============================================================================
// WhatsApp conversations — real endpoints (Employee JWT)
// GET  /whatsapp/conversations?scope=mine|team
// GET  /whatsapp/conversations/<phone>
// POST /whatsapp/conversations/<phone>            (resolve)
// POST /whatsapp/conversations/<phone>/claim
// POST /whatsapp/conversations/<phone>/escalate   { note }
// POST /whatsapp/conversations/<phone>/take-over
// POST /whatsapp/conversations/<phone>/reassign   { employee_id }
// ============================================================================

export const repConversationService = {
  async getAll(scope: ConversationScope = 'mine'): Promise<WaConversation[]> {
    const response = await fetchWithRepAuth(`${API_BASE_URL}/whatsapp/conversations?scope=${scope}`);

    if (!response.ok) await handleError(response);
    const json: ApiResponse<WaConversation[]> = await response.json();
    return json.data ?? [];
  },

  async getDetail(phone: string): Promise<WaConversationDetail> {
    const response = await fetchWithRepAuth(
      `${API_BASE_URL}/whatsapp/conversations/${encodeURIComponent(phone)}`,
    );

    if (!response.ok) await handleError(response);
    const json: ApiResponse<WaConversationDetail> = await response.json();
    return json.data!;
  },

  async resolve(phone: string): Promise<void> {
    const response = await fetchWithRepAuth(
      `${API_BASE_URL}/whatsapp/conversations/${encodeURIComponent(phone)}`,
      { method: 'POST' },
    );

    if (!response.ok) await handleError(response);
  },

  async claim(phone: string): Promise<WaConversation> {
    const response = await fetchWithRepAuth(
      `${API_BASE_URL}/whatsapp/conversations/${encodeURIComponent(phone)}/claim`,
      { method: 'POST' },
    );

    if (!response.ok) await handleError(response);
    const json: ApiResponse<WaConversation> = await response.json();
    return json.data!;
  },

  async escalate(phone: string, note: string): Promise<WaConversation> {
    const response = await fetchWithRepAuth(
      `${API_BASE_URL}/whatsapp/conversations/${encodeURIComponent(phone)}/escalate`,
      { method: 'POST', body: JSON.stringify({ note }) },
    );

    if (!response.ok) await handleError(response);
    const json: ApiResponse<WaConversation> = await response.json();
    return json.data!;
  },

  async takeOver(phone: string): Promise<WaConversation> {
    const response = await fetchWithRepAuth(
      `${API_BASE_URL}/whatsapp/conversations/${encodeURIComponent(phone)}/take-over`,
      { method: 'POST' },
    );

    if (!response.ok) await handleError(response);
    const json: ApiResponse<WaConversation> = await response.json();
    return json.data!;
  },

  async reassign(phone: string, employeeId: number): Promise<WaConversation> {
    const response = await fetchWithRepAuth(
      `${API_BASE_URL}/whatsapp/conversations/${encodeURIComponent(phone)}/reassign`,
      { method: 'POST', body: JSON.stringify({ employee_id: employeeId }) },
    );

    if (!response.ok) await handleError(response);
    const json: ApiResponse<WaConversation> = await response.json();
    return json.data!;
  },
};

// ============================================================================
// Employee presence — real endpoints (Employee JWT)
// PATCH /employee/shift-status              { status: 'active' | 'away' }
// GET   /branch/<branch_code>/agents        (manager-only)
// ============================================================================

export const presenceService = {
  async updateShiftStatus(status: 'active' | 'away'): Promise<{ id: number; status: ShiftStatus; updated_at: string }> {
    const response = await fetchWithRepAuth(`${API_BASE_URL}/employee/shift-status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    if (!response.ok) await handleError(response);
    const json: ApiResponse<{ id: number; status: ShiftStatus; updated_at: string }> = await response.json();
    return json.data!;
  },

  async getBranchAgents(branchCode: string): Promise<Agent[]> {
    const response = await fetchWithRepAuth(
      `${API_BASE_URL}/branch/${encodeURIComponent(branchCode)}/agents`,
    );

    if (!response.ok) await handleError(response);
    const json: ApiResponse<Agent[]> = await response.json();
    return json.data ?? [];
  },
};

// ============================================================================
// Orders — real endpoints (Employee JWT, branch-scoped, any role — not
// manager-only, unlike the roster used to populate the driver picker)
// GET   /partner/transactions                      ?status= &payment_status= &confirmed=
// PATCH /partner/transactions/<id>/assign-driver    { driver: number }
// GET   /partner/transactions/drivers
// ============================================================================

export const repOrderService = {
  async getAll(query: TransactionsQuery = {}): Promise<TransactionsPage> {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.payment_status) params.set('payment_status', query.payment_status);
    if (query.page) params.set('page', String(query.page));
    if (query.page_size) params.set('page_size', String(query.page_size));
    const qs = params.toString();

    const response = await fetchWithRepAuth(
      `${API_BASE_URL}/partner/transactions${qs ? `?${qs}` : ''}`,
    );

    if (!response.ok) await handleError(response);
    const raw = await response.json();
    const results = raw.results;
    const list: Transaction[] = Array.isArray(results) ? results : (results?.data ?? []);

    return {
      count: raw.count ?? 0,
      next: raw.next ?? null,
      previous: raw.previous ?? null,
      results: list,
    };
  },

  async assignDriver(orderId: string | number, driverId: number): Promise<Transaction> {
    const response = await fetchWithRepAuth(
      `${API_BASE_URL}/partner/transactions/${encodeURIComponent(String(orderId))}/assign-driver`,
      { method: 'PATCH', body: JSON.stringify({ driver: driverId }) },
    );

    if (!response.ok) await handleError(response);
    const json: ApiResponse<Transaction> = await response.json();
    return json.data!;
  },

  async getDrivers(): Promise<Driver[]> {
    const response = await fetchWithRepAuth(`${API_BASE_URL}/partner/transactions/drivers`);

    if (!response.ok) await handleError(response);
    const raw = await response.json();
    // Envelope shape isn't confirmed yet — accept a bare array, `{ data }`
    // (ApiResponse, like assign-driver), or `{ results }` (like the
    // transactions list) rather than assuming one.
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.results) ? raw.results : [];
    return list as Driver[];
  },
};

// ============================================================================
// Mock data — shift mates (no real endpoint yet)
// ============================================================================

const delay = <T,>(value: T, ms = 350): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const mockShiftMates: ShiftMate[] = [
  { id: 2, name: 'Kemi Adesanya', role: 'Customer Support', status: 'active', branch_code: 'Lagos-A4T' },
  { id: 3, name: 'David Okon', role: 'Customer Support', status: 'active', branch_code: 'Lagos-A4T' },
  { id: 4, name: 'Grace Effiong', role: 'Branch Manager', status: 'away', branch_code: 'Lagos-A4T' },
  { id: 5, name: 'Yusuf Aliyu', role: 'Customer Support', status: 'offline', branch_code: 'Lagos-A4T' },
  { id: 6, name: 'Chinwe Obasi', role: 'Dispatch Lead', status: 'active', branch_code: 'Lagos-A4T' },
];

export const shiftService = {
  async getTeamMembers(branchCode: string): Promise<ShiftMate[]> {
    return delay(mockShiftMates.filter((m) => m.branch_code === branchCode));
  },

  async escalate(payload: EscalatePayload): Promise<{ success: true }> {
    return delay({ success: true as const }, 500);
  },
};
