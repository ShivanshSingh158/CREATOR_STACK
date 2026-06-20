import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { db } from '../../lib/firebase';
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Wallet,
  TrendingUp,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Info,
  ArrowLeft,
} from 'lucide-react';

// ────────────────────────────────────────
// Simulated payment modal (Razorpay later)
// ────────────────────────────────────────
function DepositModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (amount: number) => void;
}) {
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState<'input' | 'processing' | 'success'>('input');
  const [error, setError] = useState('');

  const PRESETS = [5000, 25000, 50000, 100000];

  const handleDeposit = () => {
    const num = parseInt(amount.replace(/[^0-9]/g, '') || '0');
    if (num < 5000) {
      setError('Minimum deposit is ₹5,000');
      return;
    }
    setError('');
    setStage('processing');

    // Simulate Razorpay checkout + webhook confirmation
    setTimeout(() => {
      setStage('success');
      setTimeout(() => {
        onSuccess(num);
        onClose();
      }, 1800);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl max-w-md w-full p-8">
        {stage === 'input' && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-50 border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Wallet className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight">
                  Deposit to Escrow Wallet
                </h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                  Minimum ₹5,000
                </p>
              </div>
            </div>

            {/* Quick presets */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(String(p))}
                  className={`py-2 text-[10px] font-black uppercase tracking-widest border-2 border-black rounded-lg transition-all hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${amount === String(p) ? 'bg-indigo-600 text-white' : 'bg-white text-black hover:bg-gray-50'}`}
                >
                  ₹{p >= 100000 ? `${p / 100000}L` : p >= 1000 ? `${p / 1000}K` : p}
                </button>
              ))}
            </div>

            <div className="mb-5">
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">
                Custom Amount (INR)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-500">
                  ₹
                </span>
                <input
                  type="number"
                  min="5000"
                  placeholder="5000"
                  className="w-full pl-9 pr-4 py-3.5 border-2 border-black rounded-lg text-lg font-black text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError('');
                  }}
                />
              </div>
              {error && (
                <p className="text-[10px] font-black text-red-500 mt-1.5 uppercase tracking-widest">
                  {error}
                </p>
              )}
            </div>

            <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-3 mb-6 text-[10px] font-bold text-amber-800 uppercase tracking-widest leading-relaxed">
              <Info className="w-3.5 h-3.5 inline mr-1 mb-0.5" />
              Funds are locked in escrow when you initiate a deal. Unused funds can be withdrawn
              anytime.
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-2 border-black bg-white text-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-2 border-black bg-indigo-600 text-white rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:bg-indigo-700 transition-all"
              >
                Deposit →
              </button>
            </div>
          </>
        )}

        {stage === 'processing' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 border-[4px] border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest animate-pulse mb-2">
              Processing Payment
            </p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Securing your deposit via payment gateway…
            </p>
          </div>
        )}

        {stage === 'success' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-[#a3e635] border-2 border-black rounded-xl flex items-center justify-center mx-auto mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <CheckCircle2 className="w-10 h-10 text-black" />
            </div>
            <p className="text-lg font-black text-black uppercase tracking-tight mb-1">
              Deposit Confirmed!
            </p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              ₹{parseInt(amount).toLocaleString('en-IN')} added to your wallet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────
// Withdrawal modal (creator payout request)
// ────────────────────────────────────────
function WithdrawModal({
  maxAmount,
  upiId,
  onClose,
  onSuccess,
}: {
  maxAmount: number;
  upiId: string;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(String(maxAmount));
  const [stage, setStage] = useState<'input' | 'processing' | 'success'>('input');
  const [error, setError] = useState('');

  const tds = Math.round(parseInt(amount || '0') * 0.1);
  const platformFee = Math.round(parseInt(amount || '0') * 0.025 * 1.18);
  const net = Math.max(0, parseInt(amount || '0') - tds - platformFee);

  const handleWithdraw = () => {
    const num = parseInt(amount || '0');
    if (num < 1000) {
      setError('Minimum withdrawal is ₹1,000');
      return;
    }
    if (num > maxAmount) {
      setError('Amount exceeds available balance');
      return;
    }
    setError('');
    setStage('processing');
    setTimeout(() => {
      setStage('success');
      setTimeout(() => {
        onSuccess(num);
        onClose();
      }, 1800);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl max-w-md w-full p-8">
        {stage === 'input' && (
          <>
            <h2 className="text-lg font-black text-black uppercase tracking-tight mb-6">
              Request Payout
            </h2>
            <div className="mb-4">
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">
                Amount to Withdraw
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-500">
                  ₹
                </span>
                <input
                  type="number"
                  min="1000"
                  max={maxAmount}
                  className="w-full pl-9 pr-4 py-3.5 border-2 border-black rounded-lg text-lg font-black text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError('');
                  }}
                />
              </div>
              {error && (
                <p className="text-[10px] font-black text-red-500 mt-1.5 uppercase tracking-widest">
                  {error}
                </p>
              )}
            </div>

            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-5 space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span>Gross Amount</span>
                <span className="text-black font-black">
                  ₹{parseInt(amount || '0').toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span>TDS Deducted (10% — Sec 194J)</span>
                <span className="text-red-600">-₹{tds.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span>Platform Fee (2.5% + 18% GST)</span>
                <span className="text-red-600">-₹{platformFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-black border-t-2 border-black pt-2 mt-2">
                <span>Net to Your UPI</span>
                <span className="text-indigo-600">₹{net.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">
              Paid to: <span className="text-black font-black">{upiId || 'UPI not set'}</span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-2 border-black bg-white text-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-2 border-black bg-indigo-600 text-white rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:bg-indigo-700 transition-all"
              >
                Withdraw →
              </button>
            </div>
          </>
        )}

        {stage === 'processing' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 border-[4px] border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest animate-pulse">
              Initiating Payout
            </p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">
              Sending funds to your UPI ID…
            </p>
          </div>
        )}

        {stage === 'success' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-[#a3e635] border-2 border-black rounded-xl flex items-center justify-center mx-auto mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <CheckCircle2 className="w-10 h-10 text-black" />
            </div>
            <p className="text-lg font-black text-black uppercase tracking-tight mb-1">
              Payout Initiated!
            </p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              ₹{net.toLocaleString('en-IN')} will arrive in your UPI account within 2–4 hours
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────
// Main Wallet Page
// ────────────────────────────────────────
export default function EscrowWallet() {
  const { currentUser, userRole, userProfile } = useAuth();
  const navigate = useNavigate();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Live wallet data
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setWalletData(
          data.escrowWallet || {
            balance: 0,
            lockedBalance: 0,
            availableBalance: 0,
            currency: 'INR',
          },
        );
      }
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  // Fetch transaction history
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'walletTransactions'), where('userId', '==', currentUser.uid));
    getDocs(q)
      .then((snap) => {
        const txns = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        txns.sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setTransactions(txns);
      })
      .catch(() => {});
  }, [currentUser]);

  const handleDepositSuccess = async (amount: number) => {
    if (!currentUser || !walletData) return;
    const newBalance = (walletData.balance || 0) + amount;
    const newAvailable = (walletData.availableBalance || 0) + amount;
    const newWallet = {
      balance: newBalance,
      lockedBalance: walletData.lockedBalance || 0,
      availableBalance: newAvailable,
      currency: 'INR',
      lastDepositAt: new Date().toISOString(),
    };
    await updateDoc(doc(db, 'users', currentUser.uid), { escrowWallet: newWallet });

    // Log transaction
    await addDoc(collection(db, 'walletTransactions'), {
      userId: currentUser.uid,
      type: 'deposit',
      amount,
      description: 'Manual escrow wallet deposit',
      createdAt: new Date().toISOString(),
    });

    setTransactions((prev) => [
      {
        id: Date.now().toString(),
        type: 'deposit',
        amount,
        description: 'Manual escrow wallet deposit',
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const handleWithdrawSuccess = async (grossAmount: number) => {
    if (!currentUser || !walletData) return;
    const tds = Math.round(grossAmount * 0.1);
    const platFee = Math.round(grossAmount * 0.025 * 1.18);
    const net = grossAmount - tds - platFee;

    const newBalance = Math.max(0, (walletData.balance || 0) - grossAmount);
    const newAvailable = Math.max(0, (walletData.availableBalance || 0) - grossAmount);
    await updateDoc(doc(db, 'users', currentUser.uid), {
      escrowWallet: {
        ...walletData,
        balance: newBalance,
        availableBalance: newAvailable,
      },
    });

    await addDoc(collection(db, 'walletTransactions'), {
      userId: currentUser.uid,
      type: 'withdrawal',
      amount: net,
      grossAmount,
      tdsAmount: tds,
      platformFee: platFee,
      description: 'Creator payout withdrawal',
      createdAt: new Date().toISOString(),
    });
  };

  const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const balance = walletData?.balance || 0;
  const locked = walletData?.lockedBalance || 0;
  const available = walletData?.availableBalance || 0;
  const upiId = userProfile?.upi || '';

  return (
    <div
      className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pb-16"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {showDeposit && (
        <DepositModal onClose={() => setShowDeposit(false)} onSuccess={handleDepositSuccess} />
      )}
      {showWithdraw && (
        <WithdrawModal
          maxAmount={available}
          upiId={upiId}
          onClose={() => setShowWithdraw(false)}
          onSuccess={handleWithdrawSuccess}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b-2 border-black px-6 lg:px-10 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-black flex items-center gap-1.5 text-xs font-black uppercase tracking-widest transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="h-6 w-0.5 bg-black" />
          <h1 className="text-xl font-black text-black uppercase tracking-tight">
            {userRole === 'brand' ? 'Escrow Wallet' : 'Earnings & Payouts'}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Balance */}
          <div className="bg-indigo-600 border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />{' '}
              {userRole === 'brand' ? 'Total Deposited' : 'Total Earned'}
            </p>
            <p className="text-3xl font-black text-white">{fmt(balance)}</p>
          </div>

          {/* Locked */}
          <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />{' '}
              {userRole === 'brand' ? 'Locked in Deals' : 'Pending Release'}
            </p>
            <p className="text-3xl font-black text-black">{fmt(locked)}</p>
          </div>

          {/* Available */}
          <div className="bg-[#a3e635] border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-black text-black/60 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Available
            </p>
            <p className="text-3xl font-black text-black">{fmt(available)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          {userRole === 'brand' ? (
            <button
              onClick={() => setShowDeposit(true)}
              className="flex items-center gap-2 bg-indigo-600 border-2 border-black text-white text-xs font-black px-6 py-3 rounded-lg uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:bg-indigo-700 active:translate-y-0 active:shadow-none transition-all"
            >
              <ArrowDownLeft className="w-4 h-4" /> Deposit Funds
            </button>
          ) : (
            <button
              onClick={() => (available >= 1000 ? setShowWithdraw(true) : undefined)}
              disabled={available < 1000}
              className="flex items-center gap-2 bg-indigo-600 border-2 border-black text-white text-xs font-black px-6 py-3 rounded-lg uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:bg-indigo-700 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUpRight className="w-4 h-4" /> Request Payout
            </button>
          )}
        </div>

        {/* TDS Notice for Creators */}
        {userRole === 'creator' && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5 flex items-start gap-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">
                Section 194J TDS Notice
              </p>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest leading-relaxed">
                10% TDS is automatically deducted from each payout under the Income Tax Act, 1961.
                Your Form 16A will be generated at the end of each quarter. Platform fee is 2.5% +
                18% GST.
              </p>
            </div>
          </div>
        )}

        {/* Brand: Platform Fee Info */}
        {userRole === 'brand' && (
          <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-5 flex items-start gap-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-blue-800 uppercase tracking-widest mb-1">
                Platform Fee Transparency
              </p>
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest leading-relaxed">
                CreatorStack charges 2.5% + 18% GST on deal value. This is deducted from the
                creator's payout, not from your deposit. Your escrow deposit equals exactly the deal
                amount you agree to.
              </p>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="px-6 py-4 border-b-2 border-black bg-indigo-50">
            <h2 className="text-xs font-black text-black uppercase tracking-widest">
              Transaction History
            </h2>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                No transactions yet
              </p>
            </div>
          ) : (
            <div className="divide-y-2 divide-gray-100">
              {transactions.map((txn: any) => {
                const isCredit = ['deposit', 'release'].includes(txn.type);
                const icons: Record<string, React.ReactNode> = {
                  deposit: <ArrowDownLeft className="w-4 h-4 text-emerald-600" />,
                  lock: <Lock className="w-4 h-4 text-amber-600" />,
                  release: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
                  withdrawal: <ArrowUpRight className="w-4 h-4 text-indigo-600" />,
                };
                return (
                  <div
                    key={txn.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-9 h-9 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isCredit ? 'bg-emerald-50' : 'bg-gray-50'}`}
                      >
                        {icons[txn.type] || <Wallet className="w-4 h-4 text-gray-500" />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-black uppercase tracking-widest">
                          {txn.description}
                        </p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                          {new Date(txn.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-sm font-black ${isCredit ? 'text-emerald-600' : 'text-gray-700'}`}
                    >
                      {isCredit ? '+' : '-'}
                      {fmt(txn.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
