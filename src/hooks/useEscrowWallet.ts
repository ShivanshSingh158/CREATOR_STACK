/**
 * useEscrowWallet — Real-time escrow wallet balance hook.
 * 
 * Returns the current user's escrowWallet from Firestore,
 * live-updating whenever any deal locks or releases funds.
 * 
 * Usage:
 *   const { wallet, loading } = useEscrowWallet();
 *   // wallet.availableBalance — funds free to start new deals
 *   // wallet.lockedBalance    — funds earmarked in active escrows
 *   // wallet.balance          — total deposited
 */
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../features/auth/AuthContext';

export interface EscrowWalletData {
  balance: number;
  lockedBalance: number;
  availableBalance: number;
  lastDepositAt?: string;
  currency: 'INR';
}

const EMPTY_WALLET: EscrowWalletData = {
  balance: 0,
  lockedBalance: 0,
  availableBalance: 0,
  currency: 'INR',
};

export function useEscrowWallet() {
  const { currentUser } = useAuth();
  const [wallet, setWallet] = useState<EscrowWalletData>(EMPTY_WALLET);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setWallet(EMPTY_WALLET);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setWallet(data.escrowWallet ?? EMPTY_WALLET);
        } else {
          setWallet(EMPTY_WALLET);
        }
        setLoading(false);
      },
      (err) => {
        console.error('useEscrowWallet:', err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [currentUser]);

  /** Formats balance as ₹XX,XX,XXX */
  const format = (amount: number) =>
    `₹${amount.toLocaleString('en-IN')}`;

  return { wallet, loading, format };
}
