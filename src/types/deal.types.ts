/**
 * Deal Room TypeScript interfaces.
 */

export type DealStatus =
  | 'pending_creator_sign'
  | 'contract_amendment_requested'
  | 'creator_signed'
  | 'escrow_locked'
  | 'in_production'
  | 'pod_submitted'
  | 'pod_verified'
  | 'under_revision'
  | 'disputed'
  | 'completed'
  | 'cancelled';

export type DealStage = 'TERMS' | 'CONTRACT' | 'ESCROW' | 'PRODUCTION' | 'AI_CHECK' | 'RELEASED';

export interface DealRoom {
  id: string;
  campaignId: string;
  creatorId: string;
  brandId: string;
  // Terms
  status: DealStatus;
  amount: string;
  productionDays: string;
  deliverables: string;
  // Signatures
  creatorSignatureName?: string;
  creatorSignedAt?: string;
  brandSignedAt?: string;
  escrowLockedAt?: string;
  // Proof of Delivery
  podVideoLink?: string;
  podSubmittedAt?: string;
  // Amendment
  amendmentRequest?: string;
  // Dispute
  disputeMessage?: string;
  disputedAt?: string;
  // Financial settlement
  grossAmount?: number;
  tdsAmount?: number;
  platformFee?: number;
  netPayout?: number;
  // Meta
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface PayoutRecord {
  id: string;
  dealId: string;
  creatorId: string;
  brandId: string;
  grossAmount: number;
  tdsAmount: number;
  platformFee: number;
  netPayout: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  upiId?: string;
  createdAt: string;
  completedAt?: string;
}
