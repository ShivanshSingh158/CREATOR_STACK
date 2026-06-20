/**
 * EscrowLockPanel.tsx — The escrow lock UI panel in the deal room (STUB).
 *
 * STATUS: Logic exists inline in DigitalDealRoom.tsx.
 * TODO: Extract here in next refactor pass.
 *
 * Responsibilities:
 * - Shows brand's available wallet balance
 * - Shows deal amount to be locked
 * - "Lock Funds" button → calls handleSignAndEscrow()
 * - Shows insufficient funds warning if availableBalance < dealAmount
 * - Links to /wallet to deposit more
 */
import React from 'react';
import { Lock, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEscrowWallet } from '../../../hooks/useEscrowWallet';

interface EscrowLockPanelProps {
  dealAmount: number;
  onLock: () => void;
  locked?: boolean;
}

export default function EscrowLockPanel({
  dealAmount,
  onLock,
  locked = false,
}: EscrowLockPanelProps) {
  const { wallet, format } = useEscrowWallet();
  const navigate = useNavigate();
  const hasEnough = wallet.availableBalance >= dealAmount;

  if (locked) {
    return (
      <div className="bg-[#a3e635] border-2 border-black rounded-xl p-5 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <Lock className="w-8 h-8 text-black mx-auto mb-2" />
        <p className="text-xs font-black text-black uppercase tracking-widest">Escrow Locked</p>
        <p className="text-[10px] font-bold text-black/70 uppercase tracking-widest mt-1">
          {format(dealAmount)} earmarked
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] font-black text-black uppercase tracking-widest">
          Wallet Balance
        </p>
        <p className="text-lg font-black text-black">{format(wallet.availableBalance)}</p>
      </div>
      {!hasEnough && (
        <div className="bg-amber-50 border border-amber-400 rounded-lg p-3 mb-4 text-[9px] font-black uppercase tracking-widest text-amber-800">
          Insufficient funds. You need {format(dealAmount - wallet.availableBalance)} more.
          <button
            onClick={() => navigate('/wallet')}
            className="block mt-1 text-indigo-600 underline"
          >
            Deposit funds →
          </button>
        </div>
      )}
      <button
        onClick={onLock}
        disabled={!hasEnough}
        className="w-full flex items-center justify-center gap-2 bg-emerald-500 border-2 border-black text-white font-black py-4 rounded-lg uppercase tracking-widest text-[10px] hover:-translate-y-0.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Lock className="w-4 h-4" /> Lock {format(dealAmount)} in Escrow
      </button>
    </div>
  );
}
