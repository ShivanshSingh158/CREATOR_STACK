/**
 * VerifiedBadge — Canonical KYC status badge component.
 *
 * Single source of truth for how KYC status is displayed throughout the app.
 * Used in matchmaking cards, creator profiles, deal rooms, and dashboards.
 *
 * Usage:
 *   <VerifiedBadge kycStatus="verified" channelVerified={true} />
 *   <VerifiedBadge kycStatus="submitted" size="lg" />
 *   <VerifiedBadge kycStatus="rejected" />
 */
import React from 'react';
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

export type KycStatus =
  | 'verified' // Admin approved — shows "Brand Ready"
  | 'submitted' // User submitted docs — shows "KYC Pending"
  | 'under_review' // Admin is reviewing — shows "Under Review"
  | 'rejected' // Admin rejected — shows "Not Verified"
  | 'test_data' // Seed data — shows as "Verified" for demo
  | null
  | undefined;

interface VerifiedBadgeProps {
  kycStatus: KycStatus;
  /** Whether the YouTube channel was OAuth-verified (vs URL paste) */
  channelVerified?: boolean;
  size?: 'sm' | 'md';
}

export default function VerifiedBadge({
  kycStatus,
  channelVerified = false,
  size = 'sm',
}: VerifiedBadgeProps) {
  const base =
    size === 'sm'
      ? 'text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest flex items-center gap-0.5 border'
      : 'text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1 border-2';

  if (kycStatus === 'verified' || kycStatus === 'test_data') {
    return (
      <span className={`${base} text-[#4d7c0f] bg-[#ecfccb] border-[#bef264]`}>
        <CheckCircle2 className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />
        {channelVerified ? 'Brand Ready ✓' : 'KYC Verified'}
      </span>
    );
  }

  if (kycStatus === 'submitted') {
    return (
      <span className={`${base} text-amber-800 bg-amber-100 border-amber-300`}>
        <Clock className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />
        KYC Pending
      </span>
    );
  }

  if (kycStatus === 'under_review') {
    return (
      <span className={`${base} text-blue-800 bg-blue-100 border-blue-300`}>
        <Clock className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />
        Under Review
      </span>
    );
  }

  if (kycStatus === 'rejected') {
    return (
      <span className={`${base} text-red-700 bg-red-100 border-red-300`}>
        <XCircle className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />
        Not Verified
      </span>
    );
  }

  // No KYC — self-reported
  return (
    <span className={`${base} text-gray-500 bg-gray-100 border-gray-200`}>
      <AlertCircle className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />
      Self-Reported
    </span>
  );
}
