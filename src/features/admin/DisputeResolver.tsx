/**
 * DisputeResolver.tsx — Deal dispute resolution panel (STUB).
 * 
 * STATUS: Not yet built.
 * 
 * When a brand clicks "Request Revision" on a submitted PoD, the deal enters
 * 'disputed' state. If the creator and brand can't resolve it, an admin
 * steps in here.
 * 
 * Resolution options:
 * - Full release to creator (creator wins)
 * - Full refund to brand (brand wins)
 * - Split (custom %)
 * - Request revision (creator gets another attempt)
 */
import React from 'react';

export default function DisputeResolver() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-black text-black uppercase tracking-tight mb-4">Dispute Resolution</h1>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        Stub — reads dealRooms where status === 'disputed'.
      </p>
    </div>
  );
}
