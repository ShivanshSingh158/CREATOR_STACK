/**
 * PanVerification.tsx — PAN format validation + admin review queue submission.
 *
 * STATUS: Logic implemented inline in onboarding. This is the extracted component.
 *
 * What it does:
 * - Validates PAN format: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
 * - Submits to adminReviews collection for manual verification
 * - Shows clear "format valid, pending admin review" state
 *
 * What it does NOT do (and should NEVER claim to):
 * - Does NOT call MCA/Income Tax registry API (that's a paid API — add later)
 * - Does NOT auto-verify the PAN
 * - Does NOT set panVerified: true (only admin can do that)
 *
 * Real PAN verification APIs for future:
 * - Signzy PAN Verification: https://docs.signzy.com/
 * - Aadhaar Bridge: https://www.aadhaarbridge.com/
 * - KarzaTech: https://karza.in/
 */
import React, { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

interface PanVerificationProps {
  onVerified: (pan: string, legalName: string) => void;
}

export default function PanVerification({ onVerified }: PanVerificationProps) {
  const [pan, setPan] = useState('');
  const [legalName, setLegalName] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!legalName.trim()) {
      setError('Legal name is required');
      return;
    }
    if (!PAN_REGEX.test(pan.toUpperCase())) {
      setError('Invalid format. Must be ABCDE1234F (5 letters + 4 digits + 1 letter)');
      return;
    }
    setSubmitted(true);
    onVerified(pan.toUpperCase(), legalName.trim());
  };

  if (submitted) {
    return (
      <div className="bg-[#a3e635] border-2 border-black rounded-lg p-4 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
        <div>
          <p className="text-xs font-black text-black uppercase tracking-widest">
            PAN Format Valid
          </p>
          <p className="text-[10px] font-bold text-black/70 uppercase tracking-widest mt-0.5">
            Submitted for manual review. Verified within 24–48 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
          Legal Full Name (as on PAN card) *
        </label>
        <input
          type="text"
          required
          className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          placeholder="e.g. Rahul Kumar Sharma"
        />
      </div>
      <div>
        <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
          PAN Number *
        </label>
        <input
          type="text"
          required
          maxLength={10}
          className={`w-full px-4 py-3 bg-white border-2 rounded-lg text-sm font-bold text-black focus:outline-none transition-all ${error ? 'border-red-500 shadow-[2px_2px_0px_0px_rgba(239,68,68,1)]' : 'border-black focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
          value={pan}
          onChange={(e) => {
            setPan(e.target.value.toUpperCase());
            setError('');
          }}
          placeholder="ABCDE1234F"
        />
        {error && (
          <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        className="w-full bg-indigo-600 border-2 border-black text-white font-black py-3.5 rounded-lg uppercase tracking-widest text-[10px] hover:bg-indigo-700 hover:-translate-y-0.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        Submit for Review
      </button>
    </form>
  );
}
