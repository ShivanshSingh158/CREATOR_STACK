/**
 * Shared user-related TypeScript interfaces.
 * All Firestore user documents must conform to these shapes.
 */

export interface EscrowWallet {
  balance: number; // total deposited (in paise)
  lockedBalance: number; // earmarked in active deals
  availableBalance: number; // balance - lockedBalance
  lastDepositAt?: string;
  currency: 'INR';
}

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'lock' | 'release' | 'refund' | 'withdrawal';
  amount: number; // in paise
  description: string;
  dealId?: string;
  createdAt: string;
}

export type VerificationStatus = 'pending' | 'under_review' | 'verified' | 'rejected';
export type VerificationTier = 'unverified' | 'individual' | 'business' | 'enterprise';
export type KycStatus = 'incomplete' | 'submitted' | 'under_review' | 'verified' | 'rejected';

export interface BaseUser {
  uid: string;
  email: string;
  role: 'creator' | 'brand';
  profileCompleted: boolean;
  createdAt: string;
}

export interface CreatorProfile extends BaseUser {
  role: 'creator';
  // Identity
  name: string;
  handle: string;
  legalName: string;
  // Channel
  profileUrl: string;
  niche: string;
  language: string;
  // Verification state
  kycStatus: KycStatus;
  channelVerified: boolean; // true = YouTube OAuth connected
  panVerified: boolean; // true = admin confirmed PAN
  upiVerified: boolean; // true = penny drop confirmed
  isAPIVerified: boolean; // true = YouTube API data fetched
  isEstimate: boolean; // true = metrics are estimates only
  // Metrics
  follower_count: number;
  avg_views: number;
  engagement_rate: number;
  // Payment
  pan: string; // stored encrypted
  upi: string;
  // YouTube data (if verified)
  channelId?: string;
  channelThumbnail?: string;
  youtubeData?: Record<string, unknown>;
  lastSyncedAt?: string;
  // Earnings
  totalEarned?: number;
  pendingEarnings?: number;
}

export interface BrandProfile extends BaseUser {
  role: 'brand';
  // Company
  companyName: string;
  website: string;
  industry: string;
  budget: string;
  logoUrl?: string;
  // Legal
  corporatePan: string;
  gstin?: string;
  cin?: string; // Tier 3 only
  // Verification
  verificationTier: VerificationTier;
  verificationStatus: VerificationStatus;
  panVerified: boolean;
  kycSubmittedAt?: string;
  // Finance
  trustScore: number; // calculated from real activity (0–100), not random
  escrowWallet: EscrowWallet;
}
