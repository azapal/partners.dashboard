import config from '../../config/config';
import type { ApiResponse, PartnerResponse } from './partnerService';
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

// WhatsApp conversation types — field names inferred from API doc; adjust when
// the actual response shape is confirmed with the backend team.
export interface WaConversation {
  phone: string;
  customer_name: string;
  last_message: string;
  message_count: number;
  status: 'active' | 'resolved';
  updated_at: string;
}

export interface WaMessage {
  id: string | number;
  from: string;   // phone number or 'bot'
  body: string;
  timestamp: string;
  type?: string;
}

export interface WaOrder {
  id: string | number;
  order_ref?: string;
  amount?: number;
  status?: string;
  created_at: string;
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
// GET  /whatsapp/conversations
// GET  /whatsapp/conversations/<phone>
// POST /whatsapp/conversations/<phone>  (resolve)
// ============================================================================

export const repConversationService = {
  async getAll(): Promise<WaConversation[]> {
    const response = await fetchWithRepAuth(`${API_BASE_URL}/whatsapp/conversations`);

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
