import React, { useState } from 'react';
import { Wallet, Zap, Landmark, CheckCircle2, TrendingUp } from 'lucide-react';
import type { Stage } from '../App';

interface PayoutProps {
  setStage: (stage: Stage) => void;
}

export default function Payout({ setStage }: PayoutProps) {
  const [payoutState, setPayoutState] = useState<'selection' | 'processing' | 'success'>('selection');

  const handleInstantPayout = () => {
    setPayoutState('processing');
    setTimeout(() => {
      setPayoutState('success');
    }, 2500);
  };

  const totalAmount = 85000;
  const tds = totalAmount * 0.10; // 10%
  const platformFee = totalAmount * 0.15; // 15%
  const netBalance = totalAmount - tds - platformFee;
  const instantFee = netBalance * 0.015; // 1.5%

  return (
    <div className="animate-fade-in flex-col items-center" style={{ width: '100%', maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      {payoutState !== 'success' && (
        <div className="text-center" style={{ marginBottom: '3rem' }}>
          <div className="badge-sage mb-4" style={{ marginBottom: '1rem' }}>
            <CheckCircle2 size={16} /> Review Period Ended
          </div>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--accent-sage)' }}>Funds Released!</h2>
          <p className="text-quartz">Fintech Corp has approved your content. Your funds are ready for withdrawal.</p>
        </div>
      )}

      {payoutState === 'selection' && (
        <div className="flex gap-8" style={{ width: '100%', flexWrap: 'wrap' }}>
          
          {/* Ledger Breakdown */}
          <div className="card glass-panel" style={{ flex: '1 1 300px' }}>
            <h3 className="text-silver mb-6" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-bronze)', paddingBottom: '1rem' }}>
              Ledger Breakdown
            </h3>
            <div className="flex-col gap-4">
              <div className="flex justify-between text-quartz">
                <span>Gross Deal Value</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-quartz">
                <span>Section 194J TDS (10%)</span>
                <span className="text-error">-₹{tds.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-quartz">
                <span>CreatorStack Fee (15%)</span>
                <span className="text-error">-₹{platformFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-silver" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-bronze)', fontSize: '1.25rem', fontWeight: 600 }}>
                <span>Net Wallet Balance</span>
                <span className="text-gold">₹{netBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Withdrawal Options */}
          <div className="flex-col gap-4" style={{ flex: '2 1 400px' }}>
            
            {/* Standard */}
            <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border-bronze)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div style={{ padding: '0.75rem', background: 'var(--bg-slate)', borderRadius: '8px' }}>
                    <Landmark className="text-silver" />
                  </div>
                  <div>
                    <h4 className="text-silver" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Standard Withdrawal</h4>
                    <p className="text-quartz" style={{ fontSize: '0.875rem' }}>Hits your bank in 2-3 business days. Free.</p>
                  </div>
                </div>
                <button className="btn-secondary">Select</button>
              </div>
            </div>

            {/* Instant */}
            <div className="card" style={{ cursor: 'pointer', border: '1px solid var(--accent-gold)', background: 'linear-gradient(145deg, var(--card-carbon) 0%, rgba(209, 176, 124, 0.05) 100%)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div style={{ padding: '0.75rem', background: 'var(--accent-gold)', borderRadius: '8px' }}>
                    <Zap className="text-bg-slate" style={{ color: 'var(--bg-slate)' }} />
                  </div>
                  <div>
                    <h4 className="text-gold" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Instant Payout</h4>
                    <p className="text-quartz" style={{ fontSize: '0.875rem' }}>Money in your account in 60 seconds via UPI/IMPS.</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between" style={{ padding: '1rem', background: 'var(--bg-slate)', borderRadius: '8px', marginTop: '1rem' }}>
                <span className="text-quartz" style={{ fontSize: '0.875rem' }}>1.5% Premium Fee (-₹{instantFee.toLocaleString()})</span>
                <button className="btn-primary" onClick={handleInstantPayout}>
                  Get ₹{(netBalance - instantFee).toLocaleString()} Now
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {payoutState === 'processing' && (
        <div className="card glass-panel flex-col items-center justify-center scanning-effect" style={{ width: '100%', padding: '4rem 2rem' }}>
          <Zap className="text-gold mb-4" size={48} style={{ animation: 'pulse-border 1s infinite', marginBottom: '1.5rem' }} />
          <h3 className="text-silver" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Routing via RazorpayX...</h3>
          <p className="text-quartz">Executing instant IMPS transfer to your verified bank account.</p>
        </div>
      )}

      {payoutState === 'success' && (
        <div className="card flex-col items-center justify-center text-center animate-fade-in" style={{ width: '100%', padding: '4rem 2rem', border: '1px solid var(--accent-sage)', background: 'var(--accent-sage-bg)' }}>
          <div style={{ width: 80, height: 80, background: 'var(--bg-slate)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '2px solid var(--accent-sage)' }}>
            <CheckCircle2 className="text-sage" size={40} />
          </div>
          <h2 className="text-sage" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Deal Closed.</h2>
          <p className="text-silver" style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
            ₹{(netBalance - instantFee).toLocaleString()} has successfully hit your bank account.
          </p>
          
          <div className="flex gap-2 items-center text-gold" style={{ padding: '1rem 2rem', background: 'rgba(209, 176, 124, 0.1)', borderRadius: '100px', border: '1px solid rgba(209, 176, 124, 0.3)' }}>
            <TrendingUp size={18} />
            <span style={{ fontWeight: 500 }}>Proof of Revenue Ledger updated. Internal Credit Score +12.</span>
          </div>

          <button className="btn-secondary" style={{ marginTop: '3rem' }} onClick={() => setStage('dashboard')}>
            Return to Dashboard
          </button>
        </div>
      )}

    </div>
  );
}
