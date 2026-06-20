/**
 * useDealRoom.ts — Shared deal room Firestore logic hook.
 *
 * Encapsulates all real-time Firestore reads for a deal room.
 * Used by both DigitalDealRoom (brand view) and CreatorDealRoom (creator view).
 *
 * Usage:
 *   const { dealRoom, campaign, creator, loading } = useDealRoom(campaignId, creatorId);
 */
import { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface DealRoomData {
  dealRoom: Record<string, any> | null;
  campaign: Record<string, any> | null;
  creator: Record<string, any> | null;
  loading: boolean;
}

export function useDealRoom(
  campaignId: string | undefined,
  creatorId: string | undefined,
): DealRoomData {
  const [dealRoom, setDealRoom] = useState<Record<string, any> | null>(null);
  const [campaign, setCampaign] = useState<Record<string, any> | null>(null);
  const [creator, setCreator] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch campaign and creator once (static)
  useEffect(() => {
    if (!campaignId || !creatorId) return;
    Promise.all([
      getDoc(doc(db, 'campaigns', campaignId)),
      getDoc(doc(db, 'creators', creatorId)),
    ]).then(([campSnap, creatorSnap]) => {
      if (campSnap.exists()) setCampaign({ id: campSnap.id, ...campSnap.data() });
      if (creatorSnap.exists()) setCreator({ id: creatorSnap.id, ...creatorSnap.data() });
    });
  }, [campaignId, creatorId]);

  // Listen to deal room in real-time
  useEffect(() => {
    if (!campaignId || !creatorId) return;
    const dealId = `${campaignId}_${creatorId}`;
    const unsub = onSnapshot(
      doc(db, 'dealRooms', dealId),
      (snap) => {
        setDealRoom(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setLoading(false);
      },
      (err) => {
        console.error('useDealRoom:', err);
        setLoading(false);
      },
    );
    return unsub;
  }, [campaignId, creatorId]);

  return { dealRoom, campaign, creator, loading };
}
