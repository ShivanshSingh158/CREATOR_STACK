/**
 * useFirestoreQuery — Generic typed real-time Firestore collection query hook.
 *
 * Usage:
 *   const { data, loading } = useFirestoreQuery<Campaign>(
 *     collection(db, 'campaigns'),
 *     where('brandId', '==', uid),
 *     orderBy('createdAt', 'desc'),
 *   );
 *
 * Accepts any Firebase Query object. Returns typed array + loading/error.
 * Automatically unsubscribes on unmount.
 */
import { useState, useEffect } from 'react';
import { type Query, onSnapshot } from 'firebase/firestore';

export interface FirestoreQueryState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export function useFirestoreQuery<T>(query: Query | null): FirestoreQueryState<T> {
  const [state, setState] = useState<FirestoreQueryState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!query) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    setState((s) => ({ ...s, loading: true }));

    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
        setState({ data: docs, loading: false, error: null });
      },
      (err) => {
        console.error('useFirestoreQuery:', err);
        setState({ data: [], loading: false, error: err.message });
      },
    );

    return unsubscribe;
  }, [query]);

  return state;
}
