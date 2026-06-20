/**
 * LoadingSpinner — Shared spinner component used across the app.
 * 
 * Replaces the 8+ inline spinner divs scattered throughout the codebase.
 * 
 * Usage:
 *   <LoadingSpinner />                        // default medium indigo
 *   <LoadingSpinner size="lg" label="Loading campaigns…" />
 *   <LoadingSpinner size="sm" color="white" />
 */
import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
type SpinnerColor = 'indigo' | 'black' | 'white' | 'green';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  label?: string;
  /** If true, centers the spinner in a full-screen overlay */
  fullScreen?: boolean;
}

const SIZE_MAP: Record<SpinnerSize, string> = {
  sm: 'w-5 h-5 border-[3px]',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-[4px]',
  xl: 'w-16 h-16 border-[4px]',
};

const COLOR_MAP: Record<SpinnerColor, string> = {
  indigo: 'border-indigo-200 border-t-indigo-600',
  black: 'border-gray-200 border-t-black',
  white: 'border-white/30 border-t-white',
  green: 'border-green-200 border-t-green-600',
};

export default function LoadingSpinner({
  size = 'md',
  color = 'indigo',
  label,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`rounded-full animate-spin ${SIZE_MAP[size]} ${COLOR_MAP[color]}`} />
      {label && (
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 animate-pulse">
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        {spinner}
      </div>
    );
  }

  return spinner;
}
