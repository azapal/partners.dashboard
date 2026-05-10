/**
 * Partner Service
 * 
 * Service layer for all partner-related API endpoints.
 * Uses the Account API base URL from config.
 */

import config from '../../config/config';

// ============================================================================
// Types
// ============================================================================

export type PartnerId = string;

export interface Partner {
  id: PartnerId;
  email: string;
  fullName: string;
  status: 'active' | 'pending' | 'invited' | 'revoked';
  createdAt: string;
  updatedAt: string;
  // Add other fields as needed based on your API
}

export interface CreatePartnerPayload {
  email: string;
  fullName: string;
  role?: string;
}

export interface UpdatePartnerPayload {
  email?: string;
  fullName?: string;
  status?: string;
}

export interface CompleteOnboardingPayload {
  partner_user: string;
  // Add other required onboarding fields
}

export interface PartnerResponse {
  success: boolean;
  data?: Partner;
  message?: string;
}

export interface PartnersListResponse {
  success: boolean;
  data?: Partner[];
  message?: string;
}

// ============================================================================
// API Base URL
// ============================================================================

const API_BASE_URL = config.api.azapal.baseUrl;
const PARTNER_ENDPOINT = `${API_BASE_URL}/partner`;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Constructs headers with authorization if token exists
 */
const getHeaders = (contentType = 'application/json'): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': contentType,
  };

  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Handles API errors and throws descriptive error messages
 */
const handleError = async (response: Response): Promise<never> => {
  const contentType = response.headers.get('content-type');
  let errorMessage = `HTTP ${response.status}`;

  try {
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      errorMessage = data.message || data.error || errorMessage;
    } else {
      const text = await response.text();
      errorMessage = text || errorMessage;
    }
  } catch {
    // Use default error message if parsing fails
  }

  throw new Error(errorMessage);
};

// ============================================================================
// Partner API Methods
// ============================================================================

export const partnerService = {
  /**
   * GET /partner
   * Fetch all partners
   */
  async getAllPartners(): Promise<Partner[]> {
    const response = await fetch(PARTNER_ENDPOINT, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      await handleError(response);
    }

    const data: PartnersListResponse = await response.json();
    return data.data || [];
  },

  /**
   * GET /partner/<id>
   * Fetch a single partner by ID
   */
  async getPartnerById(id: PartnerId): Promise<Partner> {
    const response = await fetch(`${PARTNER_ENDPOINT}/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      await handleError(response);
    }

    const data: PartnerResponse = await response.json();
    if (!data.data) {
      throw new Error('Partner not found');
    }
    return data.data;
  },

  /**
   * GET /partner/read/by_partner_id/<id>
   * Fetch partner details by partner ID (alternative endpoint)
   */
  async getPartnerByPartnerId(partnerId: PartnerId): Promise<Partner> {
    const response = await fetch(
      `${PARTNER_ENDPOINT}/read/by_partner_id/${partnerId}`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      await handleError(response);
    }

    const data: PartnerResponse = await response.json();
    if (!data.data) {
      throw new Error('Partner not found');
    }
    return data.data;
  },

  /**
   * POST /partner
   * Create a new partner
   */
  async createPartner(payload: CreatePartnerPayload): Promise<Partner> {
    const response = await fetch(PARTNER_ENDPOINT, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await handleError(response);
    }

    const data: PartnerResponse = await response.json();
    if (!data.data) {
      throw new Error('Failed to create partner');
    }
    return data.data;
  },

  /**
   * PUT /partner/<id>
   * Update a partner
   */
  async updatePartner(
    id: PartnerId,
    payload: UpdatePartnerPayload
  ): Promise<Partner> {
    const response = await fetch(`${PARTNER_ENDPOINT}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await handleError(response);
    }

    const data: PartnerResponse = await response.json();
    if (!data.data) {
      throw new Error('Failed to update partner');
    }
    return data.data;
  },

  /**
   * POST /partner/complete
   * Complete partner onboarding
   */
  async completeOnboarding(payload: CompleteOnboardingPayload, token:string): Promise<Partner> {
    const response = await fetch(`${PARTNER_ENDPOINT}/complete/${token}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await handleError(response);
    }

    const data: PartnerResponse = await response.json();
    if (!data.data) {
      throw new Error('Failed to complete onboarding');
    }
    return data.data;
  },

  /**
   * POST /partner/<id>/resend
   * Resend invite to partner
   */
  async resendInvite(id: PartnerId): Promise<PartnerResponse> {
    const response = await fetch(`${PARTNER_ENDPOINT}/${id}/resend`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!response.ok) {
      await handleError(response);
    }

    return response.json();
  },

  /**
   * POST /partner/<id>/revoke
   * Revoke partner invite
   */
  async revokeInvite(id: PartnerId): Promise<PartnerResponse> {
    const response = await fetch(`${PARTNER_ENDPOINT}/${id}/revoke`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!response.ok) {
      await handleError(response);
    }

    return response.json();
  },

  /**
   * DELETE /partner/<id>
   * Delete a partner (if supported by API)
   */
  async deletePartner(id: PartnerId): Promise<PartnerResponse> {
    const response = await fetch(`${PARTNER_ENDPOINT}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      await handleError(response);
    }

    return response.json();
  },
};

export default partnerService;
