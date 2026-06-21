/**
 * sendEmail — calls the CreatorStack /api/send-email serverless function.
 * Safe to call from any React component — API key is server-side only.
 */
const API_URL = '/api/send-email';

async function post(payload: object) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[email] Failed:', err);
    }
  } catch (e) {
    console.error('[email] Network error:', e);
  }
}

export const EmailService = {
  /** Called when a brand marks an application as 'interested' / accepts */
  applicationAccepted: (params: {
    toEmail: string;
    creatorName: string;
    campaignTitle: string;
    brandName: string;
  }) =>
    post({
      type: 'application_accepted',
      dashboardUrl: `${window.location.origin}/creator-dashboard`,
      ...params,
    }),

  /** Called when both parties have signed the contract */
  contractSigned: (params: {
    toEmail: string;
    recipientName: string;
    role: 'brand' | 'creator';
    campaignTitle: string;
    otherParty: string;
    amount: string;
    dealRoomUrl: string;
  }) => post({ type: 'contract_signed', ...params }),

  /** Called when brand locks escrow — notify creator to start production */
  escrowLocked: (params: {
    toEmail: string;
    creatorName: string;
    campaignTitle: string;
    brandName: string;
    amount: string;
    netPayout: string;
    productionDays: string;
    dealRoomUrl: string;
  }) => post({ type: 'escrow_locked', ...params }),

  /** Called when brand approves delivery and funds are released */
  dealCompleted: (params: {
    toEmail: string;
    creatorName: string;
    campaignTitle: string;
    brandName: string;
    grossAmount: string;
    tdsAmount: string;
    netPayout: string;
    upiId: string;
  }) => post({ type: 'deal_completed', ...params }),

  /** Called by admin panel when approving or rejecting KYC */
  kycStatus: (params: {
    toEmail: string;
    userName: string;
    status: 'approved' | 'rejected';
    role: string;
    rejectionReason?: string;
  }) => post({ type: 'kyc_status', ...params }),

  /** Called by admin to send smart campaign matching emails */
  sendWeeklyMatches: (params: {
    toEmail: string;
    brandName: string;
    matches: Array<{ name: string; niche: string; matchScore: string; profileUrl: string }>;
  }) => post({ type: 'weekly_matches', ...params }),
};
