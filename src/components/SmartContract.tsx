import React, { useState, useEffect } from 'react';
import { FileSignature, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import type { Stage } from '../App';

interface SmartContractProps {
  setStage: (stage: Stage) => void;
}

export default function SmartContract({ setStage }: SmartContractProps) {
  const [escrowStatus, setEscrowStatus] = useState<'awaiting' | 'locked'>('awaiting');

  useEffect(() => {
    const timer = setTimeout(() => {
      setEscrowStatus('locked');
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="animate-fade-in flex-col items-center" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      
      <div className="text-center" style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Smart Contract Executed</h2>
        <p className="text-quartz">Your terms are legally bound. Waiting for brand liquidity.</p>
      </div>

      <div className="card glass-panel" style={{ width: '100%', marginBottom: '2rem' }}>
        <div className="flex items-center justify-between" style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-bronze)', marginBottom: '1.5rem' }}>
          <div className="flex items-center gap-3">
            <FileSignature className="text-gold" size={28} />
            <div>
              <h3 className="text-silver">Agreement #CS-8992-FIN</h3>
              <p className="text-quartz" style={{ fontSize: '0.875rem' }}>Auto-generated intellectual property & compliance clauses</p>
            </div>
          </div>
          <div className="badge-sage flex items-center gap-1">
            <CheckCircle2 size={14} /> Digitally Signed
          </div>
        </div>

        <div className="flex-col gap-4" style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--text-quartz)', background: 'var(--bg-slate)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-bronze)' }}>
          <p>1. CONTENT DELIVERABLE: 60s Dedicated Integration (Fintech Corp).</p>
          <p>2. TIMELINE: 5 Business Days from Escrow Lock.</p>
          <p>3. COMPLIANCE: Must include ASCI tags (#ad) and brand watermark.</p>
          <p>4. FINANCIALS: Total ₹85,000. 10% TDS (Sec 194J) deducted automatically by RazorpayX FinOps engine.</p>
        </div>
      </div>

      {/* Escrow Status Module */}
      <div className="card" style={{ width: '100%', border: escrowStatus === 'locked' ? '1px solid var(--accent-sage)' : '1px solid var(--border-bronze)', background: escrowStatus === 'locked' ? 'var(--accent-sage-bg)' : 'var(--card-carbon)' }}>
        <div className="flex items-center gap-4">
          <div style={{ padding: '1rem', background: 'var(--bg-slate)', borderRadius: '50%' }}>
            {escrowStatus === 'locked' ? <Lock className="text-sage" size={24} /> : <Lock className="text-gold scanning-effect" size={24} />}
          </div>
          <div style={{ flex: 1 }}>
            <h3 className={escrowStatus === 'locked' ? 'text-sage' : 'text-gold'} style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
              {escrowStatus === 'locked' ? 'Escrow Locked. Safe to Start Production.' : 'Awaiting Brand Deposit...'}
            </h3>
            <p className="text-quartz" style={{ fontSize: '0.875rem' }}>
              {escrowStatus === 'locked' 
                ? 'The brand has deposited ₹85,000 into the RazorpayX virtual escrow account. Your money is guaranteed.' 
                : 'Waiting for Fintech Corp to fund the virtual escrow account.'}
            </p>
          </div>
          
          {escrowStatus === 'locked' && (
            <button className="btn-primary" onClick={() => setStage('delivery')}>
              Proceed to Delivery <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
