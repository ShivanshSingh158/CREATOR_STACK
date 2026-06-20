/**
 * BrandTierBadge.tsx — Displays brand verification tier.
 *
 * Shows which tier a brand is verified at:
 * - Individual: Solo / freelancer brand
 * - Business: GST-registered company
 * - Enterprise: CIN + corporate documentation
 * - Unverified: No KYC submitted yet
 *
 * Usage:
 *   <BrandTierBadge tier="business" status="verified" />
 *   <BrandTierBadge tier="enterprise" status="under_review" />
 */
import React from 'react';
import { Shield, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

type VerificationTier = 'unverified' | 'individual' | 'business' | 'enterprise';
type VerificationStatus = 'pending' | 'under_review' | 'verified' | 'rejected';

interface BrandTierBadgeProps {
  tier?: VerificationTier;
  status?: VerificationStatus;
  size?: 'sm' | 'md';
}

const TIER_LABELS: Record<VerificationTier, string> = {
  unverified: 'Unverified',
  individual: 'Solo Brand',
  business: 'Business',
  enterprise: 'Enterprise',
};

const TIER_COLORS: Record<VerificationTier, string> = {
  unverified: 'bg-gray-100 text-gray-600 border-gray-200',
  individual: 'bg-blue-100 text-blue-800 border-blue-300',
  business: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  enterprise: 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function BrandTierBadge({
  tier = 'unverified',
  status = 'pending',
  size = 'sm',
}: BrandTierBadgeProps) {
  const base =
    size === 'sm'
      ? 'text-[9px] px-1.5 py-0.5 border rounded font-black uppercase tracking-widest flex items-center gap-1'
      : 'text-[10px] px-2.5 py-1 border-2 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5';

  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5';

  const StatusIcon =
    status === 'verified' ? CheckCircle2 : status === 'under_review' ? Clock : AlertCircle;

  return (
    <span className={`${base} ${TIER_COLORS[tier]}`}>
      <Shield className={iconSize} />
      {TIER_LABELS[tier]}
      {status !== 'pending' && <StatusIcon className={iconSize} />}
    </span>
  );
}
