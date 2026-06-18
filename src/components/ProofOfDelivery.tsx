import React, { useState } from 'react';
import { Upload, Loader2, CheckCircle2, Clock, ScanEye } from 'lucide-react';
import type { Stage } from '../App';

interface ProofOfDeliveryProps {
  setStage: (stage: Stage) => void;
}

export default function ProofOfDelivery({ setStage }: ProofOfDeliveryProps) {
  const [deliveryUrl, setDeliveryUrl] = useState('');
  const [verificationState, setVerificationState] = useState<'idle' | 'verifying' | 'approved'>('idle');
  const [verificationSteps, setVerificationSteps] = useState({ nlp: false, ocr: false });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryUrl) return;
    
    setVerificationState('verifying');
    
    // Simulate multi-modal AI verification
    setTimeout(() => {
      setVerificationSteps(prev => ({ ...prev, nlp: true }));
      setTimeout(() => {
        setVerificationSteps(prev => ({ ...prev, ocr: true }));
        setTimeout(() => {
          setVerificationState('approved');
        }, 1500);
      }, 2000);
    }, 2000);
  };

  return (
    <div className="animate-fade-in flex-col items-center" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      
      <div className="text-center" style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Submit Final Work</h2>
        <p className="text-quartz">Production complete? Paste your live content URL for AI Proof-of-Delivery.</p>
      </div>

      <div className="card glass-panel" style={{ width: '100%', marginBottom: '2rem' }}>
        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <label className="text-silver" style={{ fontWeight: 500 }}>Live Content URL</label>
          <div className="flex gap-4">
            <input
              type="url"
              required
              className="input-field"
              placeholder="https://youtube.com/watch?v=..."
              value={deliveryUrl}
              onChange={(e) => setDeliveryUrl(e.target.value)}
              disabled={verificationState !== 'idle'}
              style={{ flex: 1 }}
            />
            {verificationState === 'idle' && (
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Upload size={18} /> Submit
              </button>
            )}
          </div>
        </form>

        {verificationState !== 'idle' && (
          <div className="flex-col gap-4" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-bronze)' }}>
            <h3 className="text-silver flex items-center gap-2 mb-2">
              <ScanEye className="text-gold" /> AI Multi-Modal Verification
            </h3>
            
            <div className="flex items-center gap-3">
              {verificationSteps.nlp ? <CheckCircle2 className="text-sage" size={20} /> : <Loader2 className="text-gold" size={20} style={{ animation: 'spin 2s linear infinite' }} />}
              <span className={verificationSteps.nlp ? 'text-silver' : 'text-quartz'}>Vernacular NLP: Checking "Hinglish" audio for brand mention</span>
            </div>

            <div className="flex items-center gap-3">
              {verificationSteps.ocr ? <CheckCircle2 className="text-sage" size={20} /> : (verificationSteps.nlp ? <Loader2 className="text-gold" size={20} style={{ animation: 'spin 2s linear infinite' }} /> : <div style={{ width: 20 }} />)}
              <span className={verificationSteps.ocr ? 'text-silver' : 'text-quartz'}>Computer Vision OCR: Scanning frames for #ad and watermarks</span>
            </div>
          </div>
        )}
      </div>

      {verificationState === 'approved' && (
        <div className="card animate-fade-in" style={{ width: '100%', border: '1px solid var(--accent-sage)', background: 'var(--accent-sage-bg)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Clock className="text-sage" size={32} />
              <div>
                <h3 className="text-sage" style={{ fontSize: '1.25rem' }}>AI Approved. 48-Hour Brand Review Started.</h3>
                <p className="text-quartz" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  If the brand does not raise a dispute within 48 hours, funds are automatically released.
                </p>
              </div>
            </div>
            <button className="btn-primary" onClick={() => setStage('payout')}>
              Simulate Time <Clock size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
