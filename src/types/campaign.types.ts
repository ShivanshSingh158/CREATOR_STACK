/**
 * Campaign and Application TypeScript interfaces.
 */

export type CampaignStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface Campaign {
  id: string;
  brandId: string;
  brandName: string;
  brandLogoUrl?: string;
  title: string;
  description: string;
  niche: string | string[];
  budget: string | number;   // stored as string from form, parsed for math
  deliverables: string;
  deadline: string;
  status: CampaignStatus;
  createdAt: string;
  completedAt?: string;
  finalAmount?: number;
  netPayout?: number;
}

export type ApplicationStatus = 'pending' | 'shortlisted' | 'accepted' | 'rejected';

export interface Application {
  id: string;
  campaignId: string;
  creatorId: string;
  creatorName: string;
  creatorHandle?: string;
  creatorNiche?: string;
  creatorFollowers?: number;
  status: ApplicationStatus;
  pitchNote?: string;
  appliedAt: string;
  updatedAt?: string;
}
