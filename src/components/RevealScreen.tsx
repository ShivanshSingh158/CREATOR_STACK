import React from 'react';
import { TrendingUp, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import type { Stage } from '../App';

interface RevealScreenProps {
  setStage: (stage: Stage) => void;
  socialUrl: string;
}

export default function RevealScreen({ setStage, socialUrl }: RevealScreenProps) {
  return (
    <div className="animate-fade-in" style={{ padding: '2rem 0', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <div className="text-center" style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Valuation Complete.</h2>
        <p className="text-quartz" style={{ fontSize: '1.125rem' }}>Based on real-time graph analysis for <span className="text-silver">{socialUrl || 'your profile'}</span></p>
      </div>

      <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
        {/* Fair Rate Card */}
        <div className="card glass-panel" style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '2rem' }}>
            <TrendingUp className="text-gold" />
            <h3 className="text-silver" style={{ fontSize: '1.25rem' }}>True Market Value</h3>
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <p className="text-quartz" style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Per 60s Dedicated Integration</p>
            <div className="text-gold" style={{ fontSize: '4rem', fontWeight: 700, lineHeight: 1 }}>₹85,000</div>
          </div>

          <div className="flex-col gap-4" style={{ marginTop: 'auto' }}>
            <div className="flex justify-between items-center pb-4" style={{ borderBottom: '1px solid var(--border-bronze)' }}>
              <span className="text-quartz">Demographic Cluster</span>
              <span className="text-silver font-medium">Tier-1 Tech/Finance</span>
            </div>
            <div className="flex justify-between items-center pb-4" style={{ borderBottom: '1px solid var(--border-bronze)' }}>
              <span className="text-quartz">Engagement Quality</span>
              <span className="text-sage font-medium">Top 4%</span>
            </div>
          </div>
        </div>

        {/* Revenue Leakage Report */}
        <div className="card" style={{ flex: '1 1 400px', background: 'rgba(239, 68, 68, 0.02)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '2rem' }}>
            <AlertTriangle style={{ color: 'var(--error)' }} />
            <h3 className="text-silver" style={{ fontSize: '1.25rem' }}>Revenue Leakage Report</h3>
          </div>

          <p className="text-quartz" style={{ marginBottom: '2rem' }}>
            Our analysis indicates you are currently under-pricing yourself by an average of <span style={{ color: 'var(--error)', fontWeight: 600 }}>42%</span> per deal.
          </p>

          <div className="bg-carbon" style={{ padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <div className="flex justify-between" style={{ marginBottom: '1rem' }}>
              <span className="text-quartz">Estimated Annual Leakage</span>
              <span style={{ color: 'var(--error)', fontWeight: 600, fontSize: '1.25rem' }}>~₹12,40,000</span>
            </div>
            <div className="progress-bg">
              <div className="progress-fill" style={{ width: '42%', backgroundColor: 'var(--error)' }}></div>
            </div>
          </div>

          <div className="flex items-start gap-3" style={{ padding: '1rem', background: 'var(--bg-slate)', borderRadius: '8px', border: '1px solid var(--border-bronze)' }}>
            <ShieldCheck className="text-sage" size={24} style={{ flexShrink: 0 }} />
            <p className="text-silver" style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
              CreatorStack enforces this minimum rate strictly with all inbound brand inquiries.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center" style={{ marginTop: '4rem' }}>
        <button 
          className="btn-primary" 
          style={{ fontSize: '1.25rem', padding: '1.25rem 3rem' }}
          onClick={() => setStage('dashboard')}
        >
          Claim Your Free Deal Room <ArrowRight />
        </button>
      </div>
    </div>
  );
}
