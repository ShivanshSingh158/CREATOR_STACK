import React, { useState } from 'react';
import { Send, FileText, CheckCircle2, Shield } from 'lucide-react';
import type { Stage } from '../App';

interface DealRoomProps {
  setStage: (stage: Stage) => void;
}

export default function DealRoom({ setStage }: DealRoomProps) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'brand',
      text: 'Hi, we love your content and want to sponsor a 60s integration on your next YouTube video. We can do ₹85,000.',
      timestamp: '10:00 AM',
    },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setMessages([
      ...messages,
      { id: messages.length + 1, sender: 'creator', text: inputText, timestamp: 'Now' },
    ]);
    setInputText('');
  };

  return (
    <div className="animate-fade-in flex gap-8" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', height: 'calc(100vh - 120px)' }}>
      
      {/* Chat Interface */}
      <div className="card flex-col" style={{ flex: '2', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-bronze)', background: 'var(--bg-slate)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-silver" style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Fintech Corp</h3>
              <p className="text-quartz" style={{ fontSize: '0.875rem' }}>Structured Negotiation Room</p>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="text-sage" size={18} />
              <span className="text-sage" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Secure End-to-End</span>
            </div>
          </div>
        </div>

        <div className="flex-col gap-4" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'creator' ? 'justify-end' : 'justify-start'}`}>
              <div 
                style={{ 
                  maxWidth: '70%', 
                  padding: '1rem', 
                  borderRadius: '12px',
                  background: msg.sender === 'creator' ? 'var(--accent-gold)' : 'var(--bg-slate)',
                  color: msg.sender === 'creator' ? 'var(--bg-slate)' : 'var(--text-silver)',
                  border: msg.sender === 'brand' ? '1px solid var(--border-bronze)' : 'none'
                }}
              >
                <p style={{ marginBottom: '0.5rem', fontSize: '0.9375rem', color: 'inherit' }}>{msg.text}</p>
                <span style={{ fontSize: '0.75rem', opacity: 0.7, color: 'inherit' }}>{msg.timestamp}</span>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} style={{ padding: '1.5rem', borderTop: '1px solid var(--border-bronze)', background: 'var(--bg-slate)', display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Type your response..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ padding: '0 1.5rem' }}>
            <Send size={20} />
          </button>
        </form>
      </div>

      {/* Structured Offer Sidebar */}
      <div className="flex-col gap-6" style={{ flex: '1', minWidth: '320px' }}>
        <div className="card glass-panel" style={{ position: 'sticky', top: '0' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '1.5rem' }}>
            <FileText className="text-gold" />
            <h3 className="text-silver">Final Structured Offer</h3>
          </div>

          <div className="flex-col gap-4" style={{ marginBottom: '2rem' }}>
            <div>
              <span className="text-quartz block" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Brand</span>
              <span className="text-silver font-medium">Fintech Corp</span>
            </div>
            <div>
              <span className="text-quartz block" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Content Deliverable</span>
              <span className="text-silver font-medium">60s Dedicated YouTube Integration</span>
            </div>
            <div>
              <span className="text-quartz block" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Timeline</span>
              <span className="text-silver font-medium">5 Days to publish</span>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-slate)', borderRadius: '8px', border: '1px solid var(--border-bronze)', marginTop: '0.5rem' }}>
              <span className="text-quartz block" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Payout</span>
              <span className="text-gold" style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹85,000</span>
            </div>
          </div>

          <button className="btn-primary w-full flex justify-center items-center gap-2" style={{ width: '100%' }} onClick={() => setStage('contract')}>
            <CheckCircle2 size={20} /> Accept & Generate Contract
          </button>
        </div>
      </div>

    </div>
  );
}
