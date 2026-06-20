/**
 * AdminDashboard.tsx — Internal admin panel (STUB).
 * 
 * STATUS: Not yet built. This is the planned entry point.
 * 
 * Will provide:
 * - KYC review queue (reads adminReviews collection)
 * - Brand verification approval/rejection
 * - Creator PAN/UPI verification approval
 * - Dispute resolution panel
 * - Platform analytics
 * 
 * Access control:
 * - Protected by Firebase Custom Claims: admin: true
 * - Set via Admin SDK: auth.setCustomUserClaims(uid, { admin: true })
 * - Route guard checks: currentUser.getIdTokenResult().claims.admin === true
 * 
 * To activate:
 * 1. Deploy Cloud Function to set admin claim on specific UIDs
 * 2. Create admin route in App.tsx with AdminRoute guard component
 * 3. Build the review queue UI reading from adminReviews collection
 */
import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
      <div className="text-center">
        <p className="text-2xl font-black text-black uppercase tracking-tight mb-2">Admin Panel</p>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Coming soon — requires admin Firebase custom claim</p>
      </div>
    </div>
  );
}
