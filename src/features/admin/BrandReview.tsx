/**
 * BrandReview.tsx — Manual brand KYC review panel (STUB).
 * 
 * STATUS: Not yet built.
 * 
 * Will read from: adminReviews collection (write-only from client)
 * Will write: users/{uid}.verificationStatus = 'verified' | 'rejected'
 * Will write: users/{uid}.panVerified = true
 * 
 * Expected flow:
 * 1. Admin sees list of pending brand reviews
 * 2. Opens review — sees submitted PAN, GSTIN, CIN, tier selection
 * 3. Clicks Approve → sets verificationStatus: 'verified' on user doc
 * 4. Clicks Reject → sets verificationStatus: 'rejected' + sends reason
 * 5. Brand gets FCM push notification of decision
 */
import React from 'react';

export default function BrandReview() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-black text-black uppercase tracking-tight mb-4">Brand KYC Review Queue</h1>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        Stub — reads adminReviews collection. Requires Firebase Admin SDK access.
      </p>
    </div>
  );
}
