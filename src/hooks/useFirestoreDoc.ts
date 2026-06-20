/**
 * useFirestoreDoc — Generic typed real-time Firestore document hook.
 *
 * Usage:
 *   const { data, loading, error } = useFirestoreDoc<UserProfile>('users', userId);
 *
 * Returns the document data (typed) plus loading/error state.
 * Automatically unsubscribes on component unmount.
 */
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface FirestoreDocState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFirestoreDoc<T>(
  collectionPath: string,
  docId: string | null | undefined,
): FirestoreDocState<T> {
  const [state, setState] = useState<FirestoreDocState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Don't subscribe if no docId (e.g. user not yet logged in)
    if (!docId) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState((s) => ({ ...s, loading: true }));

    const unsubscribe = onSnapshot(
      doc(db, collectionPath, docId),
      (snap) => {
        if (snap.exists()) {
          setState({ data: { id: snap.id, ...snap.data() } as T, loading: false, error: null });
        } else {
          setState({ data: null, loading: false, error: null });
        }
      },
      (err) => {
        console.error(`useFirestoreDoc(${collectionPath}/${docId}):`, err);
        setState({ data: null, loading: false, error: err.message });
      },
    );

    return unsubscribe;
  }, [collectionPath, docId]);

  return state;
}
