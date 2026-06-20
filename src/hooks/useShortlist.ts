import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
  collection, query, where, onSnapshot, addDoc,
  deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';

/**
 * useShortlist — manages a brand's saved/shortlisted creator list.
 * Reads from the `shortlists` collection in Firestore.
 */
export function useShortlist(brandId: string | undefined) {
  const [shortlisted, setShortlisted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [docMap, setDocMap] = useState<Record<string, string>>({}); // creatorId -> docId

  useEffect(() => {
    if (!brandId) return;
    const q = query(collection(db, 'shortlists'), where('brandId', '==', brandId));
    const unsub = onSnapshot(q, snap => {
      const ids: string[] = [];
      const map: Record<string, string> = {};
      snap.docs.forEach(d => {
        ids.push(d.data().creatorId);
        map[d.data().creatorId] = d.id;
      });
      setShortlisted(ids);
      setDocMap(map);
      setLoading(false);
    });
    return () => unsub();
  }, [brandId]);

  const toggle = async (creatorId: string) => {
    if (!brandId) return;
    if (shortlisted.includes(creatorId)) {
      const docId = docMap[creatorId];
      if (docId) await deleteDoc(doc(db, 'shortlists', docId));
    } else {
      await addDoc(collection(db, 'shortlists'), {
        brandId,
        creatorId,
        savedAt: serverTimestamp(),
      });
    }
  };

  const isShortlisted = (creatorId: string) => shortlisted.includes(creatorId);

  return { shortlisted, loading, toggle, isShortlisted };
}
