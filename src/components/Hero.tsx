import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import type { Stage } from '../App';

interface HeroProps {
  stage: Stage;
  setStage: (stage: Stage) => void;
  socialUrl: string;
  setSocialUrl: (url: string) => void;
}

export default function Hero({ stage, setStage, socialUrl, setSocialUrl }: HeroProps) {
  const [loadingText, setLoadingText] = useState('Initializing AI Matchmaking Engine...');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialUrl) return;
    setStage('loading-valuation');
  };

  useEffect(() => {
    if (stage === 'loading-valuation') {
      const timers = [
        setTimeout(() => setLoadingText('Pinging Meta Graph API...'), 1500),
        setTimeout(() => setLoadingText('Scraping Public Metrics...'), 2500),
        setTimeout(() => setLoadingText('Calculating Predictive Valuation...'), 3500),
        setTimeout(() => setStage('reveal'), 5000),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [stage, setStage]);

  return (
    <div className="flex flex-col items-center justify-center animate-fade-in" style={{ flex: 1, minHeight: '80vh' }}>
      <div className="text-center" style={{ marginBottom: '3rem', maxWidth: '800px' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Stop guessing your worth. <br />
          <span className="text-gold">Know your market value.</span>
        </h1>
        <p className="text-quartz" style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
          CreatorStack is an enterprise-ready financial protocol for top-tier creators. Enter your primary social link to unlock your true valuation.
        </p>
      </div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '1.5rem', borderRadius: '100px' }}>
        {stage === 'entry' ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-4">
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-quartz)' }} size={24} />
              <input
                type="url"
                required
                placeholder="Paste your YouTube or Instagram URL..."
                className="input-field"
                style={{ paddingLeft: '3.5rem', borderRadius: '50px', border: 'none', background: 'transparent', fontSize: '1.125rem' }}
                value={socialUrl}
                onChange={(e) => setSocialUrl(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ borderRadius: '50px', padding: '1rem 2rem' }}>
              Analyze
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-4 scanning-effect" style={{ borderRadius: '50px' }}>
            <Loader2 className="text-gold" size={32} style={{ animation: 'spin 2s linear infinite' }} />
            <p className="text-silver" style={{ fontWeight: 500 }}>{loadingText}</p>
          </div>
        )}
      </div>

      {stage === 'entry' && (
        <div className="flex gap-8" style={{ marginTop: '4rem', opacity: 0.6 }}>
          {['Backed by Elite Capital', 'Bank-Grade Security', 'Smart Escrow Built-in'].map((text, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="status-dot active"></div>
              <span className="text-quartz" style={{ fontSize: '0.875rem' }}>{text}</span>
            </div>
          ))}
        </div>
      )}
      <style>
        {`
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}
      </style>
    </div>
  );
}
