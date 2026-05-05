/**
 * Partner API Actions
 * 
 * Server-side actions for partner-related API calls
 * Handles business logic and API integration for partner operations
 */

import partnerService, {
  Partner,
  PartnerId,
  CreatePartnerPayload,
  UpdatePartnerPayload,
  CompleteOnboardingPayload,
} from '../../service/partnerService';

// ============================================================================
// Action Response Types
// ============================================================================

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// Partner Actions
// ============================================================================

export const partnerActions = {
  /**
   * Fetch all partners
   */
  async fetchAllPartners(): Promise<ActionResponse<Partner[]>> {
    try {
      const data = await partnerService.getAllPartners();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch partners',
      };
    }
  },

  /**
   * Fetch single partner by ID
   */
  async fetchPartnerById(id: PartnerId): Promise<ActionResponse<Partner>> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Partner ID is required',
        };
      }

      const data = await partnerService.getPartnerById(id);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch partner',
      };
    }
  },

  /**
   * Fetch partner by partner ID (alternative endpoint)
   */
  async fetchPartnerByPartnerId(
    partnerId: PartnerId
  ): Promise<ActionResponse<Partner>> {
    try {
      if (!partnerId) {
        return {
          success: false,
          error: 'Partner ID is required',
        };
      }

      const data = await partnerService.getPartnerByPartnerId(partnerId);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch partner',
      };
    }
  },

  /**
   * Create a new partner
   */
  async createNewPartner(
    payload: CreatePartnerPayload
  ): Promise<ActionResponse<Partner>> {
    try {
      if (!payload.email || !payload.fullName) {
        return {
          success: false,
          error: 'Email and full name are required',
        };
      }

      const data = await partnerService.createPartner(payload);
      return {
        success: true,
        data,
        message: 'Partner created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create partner',
      };
    }
  },

  /**
   * Update partner details
   */
  async updatePartnerDetails(
    id: PartnerId,
    payload: UpdatePartnerPayload
  ): Promise<ActionResponse<Partner>> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Partner ID is required',
        };
      }

      const data = await partnerService.updatePartner(id, payload);
      return {
        success: true,
        data,
        message: 'Partner updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update partner',
      };
    }
  },

  /**
   * Complete partner onboarding
   */
  async completePartnerOnboarding(
    payload: CompleteOnboardingPayload,
    token: string
  ): Promise<ActionResponse<Partner>> {
    try {
      if (!payload.partner_user) {
        return {
          success: false,
          error: 'Full name is required for onboarding',
        };
      }

      const data = await partnerService.completeOnboarding(payload, token);
      return {
        success: true,
        data,
        message: 'Onboarding completed successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete onboarding',
      };
    }
  },

  /**
   * Resend invite to partner
   */
  async resendPartnerInvite(id: PartnerId): Promise<ActionResponse> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Partner ID is required',
        };
      }

      const response = await partnerService.resendInvite(id);
      return {
        success: response.success,
        message: response.message || 'Invite resent successfully',
        error: response.success ? undefined : response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resend invite',
      };
    }
  },

  /**
   * Revoke partner invite
   */
  async revokePartnerInvite(id: PartnerId): Promise<ActionResponse> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Partner ID is required',
        };
      }

      const response = await partnerService.revokeInvite(id);
      return {
        success: response.success,
        message: response.message || 'Invite revoked successfully',
        error: response.success ? undefined : response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to revoke invite',
      };
    }
  },

  /**
   * Delete partner
   */
  async deletePartnerRecord(id: PartnerId): Promise<ActionResponse> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Partner ID is required',
        };
      }

      const response = await partnerService.deletePartner(id);
      return {
        success: response.success,
        message: response.message || 'Partner deleted successfully',
        error: response.success ? undefined : response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete partner',
      };
    }
  },
};

export default partnerActions;
