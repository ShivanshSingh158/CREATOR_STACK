import React, { useEffect, useState, useRef } from 'react';

// ── Skeleton Loader ───────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 rounded-xl">
      <Skeleton className="h-4 w-1/3 mb-3" />
      <Skeleton className="h-8 w-2/3 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonCreatorCard() {
  return (
    <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
      <Skeleton className="h-28 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-3">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStatBar() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ── Animated Counter ──────────────────────────────────────────────────────────

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({
  target,
  duration = 900,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}: AnimatedCounterProps) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const hasStarted = useRef(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (target === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          startRef.current = performance.now();

          const tick = (now: number) => {
            const elapsed = now - startRef.current;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(eased * target);
            if (progress < 1) {
              frameRef.current = requestAnimationFrame(tick);
            } else {
              setValue(target);
            }
          };

          frameRef.current = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );

    if (elementRef.current) observer.observe(elementRef.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return (
    <span ref={elementRef} className={`tabular-nums ${className}`}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  ctaVariant?: 'creator' | 'biz' | 'default';
}

export function EmptyState({
  emoji,
  title,
  description,
  ctaLabel,
  onCta,
  ctaVariant = 'default',
}: EmptyStateProps) {
  const ctaColour =
    ctaVariant === 'creator'
      ? 'bg-[#e8473f]'
      : ctaVariant === 'biz'
        ? 'bg-[#0f3460]'
        : 'bg-[#111827]';

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-5xl mb-4 animate-[fadeInUp_0.3s_ease-out]">{emoji}</div>
      <h3 className="text-lg font-black text-black uppercase tracking-wide mb-2 animate-[fadeInUp_0.35s_ease-out]">
        {title}
      </h3>
      <p className="text-sm font-medium text-gray-500 max-w-xs mb-6 animate-[fadeInUp_0.4s_ease-out]">
        {description}
      </p>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className={`animate-[fadeInUp_0.45s_ease-out] ${ctaColour} text-white text-xs font-black uppercase tracking-widest px-6 py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all`}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

// ── Password Strength Meter ───────────────────────────────────────────────────

interface PasswordStrengthProps {
  password: string;
}

function getStrength(pw: string): { score: number; label: string; colour: string } {
  if (!pw) return { score: 0, label: '', colour: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', colour: '#ef4444' };
  if (score === 2) return { score: 2, label: 'Fair', colour: '#f97316' };
  if (score === 3) return { score: 3, label: 'Good', colour: '#eab308' };
  if (score === 4) return { score: 4, label: 'Strong', colour: '#22c55e' };
  return { score: 5, label: 'Very Strong', colour: '#16a34a' };
}

export function PasswordStrengthMeter({ password }: PasswordStrengthProps) {
  const { score, label, colour } = getStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: level <= score ? colour : '#e5e7eb',
            }}
          />
        ))}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colour }}>
        {label}
      </p>
    </div>
  );
}

// ── Escrow Confirmation Modal ─────────────────────────────────────────────────

interface EscrowConfirmModalProps {
  isOpen: boolean;
  amount: string | number;
  creatorName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EscrowConfirmModal({
  isOpen,
  amount,
  creatorName,
  onConfirm,
  onCancel,
}: EscrowConfirmModalProps) {
  if (!isOpen) return null;

  const gross = typeof amount === 'string' ? parseInt(amount) || 0 : amount;
  const tds = Math.round(gross * 0.1);
  const platformFee = Math.round(gross * 0.025 * 1.18);
  const net = gross - tds - platformFee;
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white border-2 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] animate-[scalePop_0.25s_ease-out]">
        {/* Header */}
        <div className="bg-[#0f3460] px-6 py-5 border-b-2 border-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 border-2 border-white/20 rounded-lg flex items-center justify-center text-xl">
              🔐
            </div>
            <div>
              <p className="text-xs font-black text-blue-200 uppercase tracking-widest">
                Confirm Action
              </p>
              <h2 className="text-xl font-black text-white">Lock Escrow Funds</h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm font-medium text-gray-600 leading-relaxed">
            You are about to lock{' '}
            <strong className="text-black font-black">{fmt(gross)}</strong> into a
            CreatorStack escrow account for{' '}
            <strong className="text-black font-black">{creatorName}</strong>. The creator
            will be notified immediately and production will begin.
          </p>

          {/* Breakdown */}
          <div className="bg-gray-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-600">Gross amount</span>
              <span className="font-black text-black">{fmt(gross)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-600">TDS deducted (10%)</span>
              <span className="font-black text-rose-600">−{fmt(tds)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-600">Platform fee (2.5% + GST)</span>
              <span className="font-black text-gray-500">−{fmt(platformFee)}</span>
            </div>
            <div className="h-px bg-black" />
            <div className="flex justify-between text-base">
              <span className="font-black text-black">Creator receives</span>
              <span className="font-black text-emerald-600">{fmt(net)}</span>
            </div>
          </div>

          <p className="text-[11px] font-bold text-gray-400 leading-relaxed">
            Funds can only be released after you approve the creator's delivery. A 48-hour
            dispute window applies before auto-release.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border-2 border-black bg-white text-sm font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 border-2 border-black bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            🔐 Yes, Lock Funds
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Signing Ceremony Overlay ──────────────────────────────────────────────────

interface SigningCeremonyProps {
  isVisible: boolean;
  amount: string | number;
  onDone: () => void;
}

export function SigningCeremony({ isVisible, amount, onDone }: SigningCeremonyProps) {
  useEffect(() => {
    if (isVisible) {
      const t = setTimeout(onDone, 2800);
      return () => clearTimeout(t);
    }
  }, [isVisible, onDone]);

  if (!isVisible) return null;

  const gross = typeof amount === 'string' ? parseInt(amount) || 0 : amount;
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="text-center animate-[scalePop_0.4s_ease-out]">
        {/* Seal */}
        <div className="text-8xl mb-6 animate-[pulse_1s_ease-in-out_infinite]">🟢</div>
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
          Contract Signed
        </h2>
        <p className="text-lg font-bold text-emerald-300 mb-1">
          {fmt(gross)} secured in production
        </p>
        <p className="text-sm font-medium text-gray-400">
          Your signature is now immutable on CreatorStack
        </p>
        <p className="text-xs font-bold text-gray-500 mt-4 uppercase tracking-widest">
          Waiting for brand to lock escrow…
        </p>
      </div>
    </div>
  );
}

// ── Campaign Health Badge ─────────────────────────────────────────────────────

interface CampaignHealthProps {
  applicationCount: number;
  daysOld: number;
  isNew?: boolean;
}

export function CampaignHealthBadge({ applicationCount, daysOld, isNew }: CampaignHealthProps) {
  if (isNew || daysOld <= 1) {
    return <span className="badge-new">🆕 New</span>;
  }
  if (applicationCount >= 20) {
    return <span className="badge-hot">🔥 Hot · {applicationCount} applied</span>;
  }
  if (applicationCount >= 5) {
    return <span className="badge-warm">✨ Good · {applicationCount} applied</span>;
  }
  if (daysOld >= 5 && applicationCount === 0) {
    return <span className="badge-cold">🔴 Low Response</span>;
  }
  return null;
}

// ── Notification Bell with Dot ────────────────────────────────────────────────

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}

export function NotificationBell({ unreadCount, onClick }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className="relative w-10 h-10 flex items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all rounded-lg"
      aria-label={`${unreadCount} unread notifications`}
    >
      <span className="text-lg">🔔</span>
      {unreadCount > 0 && (
        <span className="notif-dot animate-pulse-slow">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
