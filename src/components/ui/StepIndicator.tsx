/**
 * StepIndicator — Shared multi-step progress indicator used in onboarding flows.
 * 
 * Extracts the duplicated step indicator UI from BrandOnboarding and CreatorOnboarding.
 * 
 * Usage:
 *   <StepIndicator
 *     steps={['Channel Verification', 'Legal & PAN', 'UPI Payout']}
 *     currentStep={2}  // 1-indexed
 *   />
 */
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface StepIndicatorProps {
  steps: string[];
  /** 1-indexed current step number */
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((label, i) => {
        const n = i + 1;
        const isCompleted = currentStep > n;
        const isActive = currentStep === n;

        return (
          <React.Fragment key={n}>
            <div className="flex flex-col items-center">
              <div
                className={[
                  'w-8 h-8 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all border-2 rounded',
                  isCompleted
                    ? 'bg-[#a3e635] text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : isActive
                    ? 'bg-indigo-600 text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-gray-400 border-gray-300',
                ].join(' ')}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : n}
              </div>
              <span
                className={`text-[9px] mt-2 font-black uppercase tracking-widest whitespace-nowrap ${
                  isActive ? 'text-black' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-1 w-16 mb-5 mx-2 transition-all ${
                  currentStep > n ? 'bg-black' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
