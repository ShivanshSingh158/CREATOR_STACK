import React, { useState } from 'react';
import { Copy, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import type { Stage } from '../App';

interface DashboardProps {
  setStage: (stage: Stage) => void;
}

export default function Dashboard({ setStage }: DashboardProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleVerify = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setIsVerified(true);
    }, 2000);
  };

  return (
    <div className="animate-fade-in flex-col gap-8" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Top Banner: Storefront & Verification */}
      <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
        
        {/* Storefront Link */}
        <div className="card glass-panel" style={{ flex: '2 1 400px' }}>
          <h3 className="text-quartz" style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            Your Storefront Link
          </h3>
          <div className="flex items-center gap-4">
            <div className="input-field" style={{ padding: '0.75rem 1rem', flex: 1, color: 'var(--text-silver)', background: 'var(--bg-slate)' }}>
              creatorstack.com/rohan-tech
            </div>
            <button className="btn-secondary flex items-center gap-2">
              <Copy size={18} /> Copy Link
            </button>
          </div>
          <p className="text-quartz mt-4" style={{ fontSize: '0.875rem', marginTop: '1rem' }}>
            Share this link with brands. Inbound requests will automatically populate your pipeline.
          </p>
        </div>

        {/* Verification Module */}
        <div className="card" style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {isVerified ? (
            <div className="flex-col items-center justify-center text-center">
              <CheckCircle2 className="text-sage" size={48} style={{ marginBottom: '1rem' }} />
              <h3 className="text-silver mb-2">Brand-Ready</h3>
              <p className="text-quartz" style={{ fontSize: '0.875rem' }}>Your PAN and KYC are verified. Brands see you as compliant.</p>
            </div>
          ) : (
            <div className="flex-col">
              <div className="flex items-center gap-2 mb-4" style={{ marginBottom: '1rem' }}>
                <AlertCircle className="text-gold" />
                <h3 className="text-silver">Action Required</h3>
              </div>
              <p className="text-quartz" style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Upload your PAN card to get the "Brand-Ready" verification badge and start accepting funds.
              </p>
              <button 
                className="btn-primary w-full" 
                onClick={handleVerify}
                disabled={isUploading}
              >
                {isUploading ? 'Verifying with Sandbox/Signzy...' : 'Upload PAN & Verify'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Kanban Pipeline */}
      <div>
        <h3 className="text-silver" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', marginTop: '2rem' }}>Active Pipeline</h3>
        <div className="flex gap-6" style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
          
          {/* Column 1: Pending */}
          <div className="flex-col gap-4" style={{ flex: '1 1 280px', minWidth: '280px' }}>
            <div className="flex items-center justify-between">
              <h4 className="text-quartz" style={{ fontSize: '0.875rem', textTransform: 'uppercase' }}>Pending Inquiries</h4>
              <span className="badge-sage" style={{ background: 'var(--border-bronze)', color: 'var(--text-silver)', border: 'none' }}>1</span>
            </div>
            
            {/* Kanban Card */}
            <div className="card" style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => setStage('deal-room')}>
              <div className="flex justify-between items-start mb-2" style={{ marginBottom: '0.5rem' }}>
                <span className="text-silver font-medium">Fintech Corp</span>
                <span className="text-gold font-bold">₹85,000</span>
              </div>
              <p className="text-quartz" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>60s Dedicated Reel • Tech Finance</p>
              <div className="flex items-center text-gold" style={{ fontSize: '0.875rem', fontWeight: 500, gap: '0.25rem' }}>
                Review Offer <ArrowRight size={14} />
              </div>
            </div>
          </div>

          {/* Column 2: In Production */}
          <div className="flex-col gap-4" style={{ flex: '1 1 280px', minWidth: '280px' }}>
            <div className="flex items-center justify-between">
              <h4 className="text-quartz" style={{ fontSize: '0.875rem', textTransform: 'uppercase' }}>In Production</h4>
              <span className="badge-sage" style={{ background: 'var(--border-bronze)', color: 'var(--text-silver)', border: 'none' }}>0</span>
            </div>
            {/* Empty state */}
            <div className="card" style={{ borderStyle: 'dashed', borderColor: 'var(--border-bronze)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px' }}>
              <span className="text-quartz" style={{ fontSize: '0.875rem' }}>No active productions</span>
            </div>
          </div>

          {/* Column 3: AI Verification */}
          <div className="flex-col gap-4" style={{ flex: '1 1 280px', minWidth: '280px' }}>
            <div className="flex items-center justify-between">
              <h4 className="text-quartz" style={{ fontSize: '0.875rem', textTransform: 'uppercase' }}>Awaiting Verification</h4>
              <span className="badge-sage" style={{ background: 'var(--border-bronze)', color: 'var(--text-silver)', border: 'none' }}>0</span>
            </div>
            <div className="card" style={{ borderStyle: 'dashed', borderColor: 'var(--border-bronze)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px' }}>
              <span className="text-quartz" style={{ fontSize: '0.875rem' }}>No pending verifications</span>
            </div>
          </div>

          {/* Column 4: Funds Cleared */}
          <div className="flex-col gap-4" style={{ flex: '1 1 280px', minWidth: '280px' }}>
            <div className="flex items-center justify-between">
              <h4 className="text-quartz" style={{ fontSize: '0.875rem', textTransform: 'uppercase' }}>Funds Cleared</h4>
              <span className="badge-sage" style={{ background: 'var(--border-bronze)', color: 'var(--text-silver)', border: 'none' }}>0</span>
            </div>
             <div className="card" style={{ borderStyle: 'dashed', borderColor: 'var(--border-bronze)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px' }}>
              <span className="text-quartz" style={{ fontSize: '0.875rem' }}>No cleared funds</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
