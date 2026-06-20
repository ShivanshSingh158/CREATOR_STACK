import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AnimatedCounter } from '../../components/ui/SharedComponents';

// ─── Role-adaptive hero copy ──────────────────────────────────────────────────

const HERO_COPY = {
  creator: {
    headline1: 'Get Paid.',
    headline2: 'Get Verified.',
    headline3: 'Get Booked.',
    subtext:
      'Join 800+ creators already earning from brand collaborations. KYC-verified, escrow-protected, no middlemen.',
    cta: 'Start for Free',
    ctaHref: '/signup',
    ctaStyle: 'bg-[#e8473f] hover:bg-[#c73530] text-white',
    secondaryCta: 'See How It Works',
    accent: '#e8473f',
    badgeBg: 'bg-[#fff0ee]',
    badgeText: 'text-[#e8473f]',
    gradient: 'from-[#fff0ee] via-white to-white',
  },
  brand: {
    headline1: 'Hire Verified',
    headline2: 'Creators.',
    headline3: 'Measure Real ROI.',
    subtext:
      'Access 800+ YouTube creators with verified KYC and real subscriber data. Post a campaign in 5 minutes.',
    cta: 'Post Your First Campaign',
    ctaHref: '/signup',
    ctaStyle: 'bg-[#0f3460] hover:bg-[#1a4a82] text-white',
    secondaryCta: 'See How It Works',
    accent: '#0f3460',
    badgeBg: 'bg-[#f0f7ff]',
    badgeText: 'text-[#0f3460]',
    gradient: 'from-[#f0f7ff] via-white to-white',
  },
} as const;

type Role = 'creator' | 'brand';

export default function LandingPage() {
  const { currentUser } = useAuth();
  const [activeRole, setActiveRole] = useState<Role>('creator');

  const copy = HERO_COPY[activeRole];

  return (
    <div className="bg-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className={`relative pt-20 pb-28 overflow-hidden border-b-2 border-black transition-all duration-500 bg-gradient-to-br ${copy.gradient}`}
      >
        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#00000012_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Role toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
              {(['creator', 'brand'] as Role[]).map((role) => (
                <button
                  key={role}
                  id={`hero-toggle-${role}`}
                  onClick={() => setActiveRole(role)}
                  className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition-all duration-300 ${
                    activeRole === role
                      ? role === 'creator'
                        ? 'bg-[#e8473f] text-white'
                        : 'bg-[#0f3460] text-white'
                      : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  {role === 'creator' ? '🎥 I'm a Creator' : '💼 I'm a Brand'}
                </button>
              ))}
            </div>
          </div>

          {/* Rotated badge */}
          <div className="flex justify-center mb-8">
            <span
              className={`inline-block ${copy.badgeBg} ${copy.badgeText} border-2 border-black px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -rotate-2`}
            >
              Beta Access Open ✦
            </span>
          </div>

          {/* Headline */}
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.05] uppercase tracking-tight transition-all duration-500">
              <span className="block text-black">{copy.headline1}</span>
              <span
                className="block transition-colors duration-500"
                style={{ color: copy.accent, WebkitTextStroke: '2px black' }}
              >
                {copy.headline2}
              </span>
              <span className="block text-black">{copy.headline3}</span>
            </h1>
          </div>

          <p className="text-center max-w-2xl mx-auto text-lg md:text-xl text-gray-600 mb-10 font-medium leading-relaxed transition-all duration-300">
            {copy.subtext}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {currentUser ? (
              <Link
                to="/creator-dashboard"
                id="hero-cta-dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-black text-white text-base font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all"
                style={{ backgroundColor: copy.accent }}
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to={copy.ctaHref}
                  id="hero-cta-primary"
                  className={`inline-flex items-center gap-2 px-8 py-4 border-2 border-black text-base font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all ${copy.ctaStyle}`}
                >
                  {copy.cta} →
                </Link>
                <Link
                  to="/login"
                  id="hero-cta-login"
                  className="text-sm font-bold text-gray-600 underline underline-offset-4 hover:text-black transition-colors"
                >
                  Already have an account? Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Social Proof Strip ────────────────────────────────────────────── */}
      <div className="bg-black text-white py-5 border-b-2 border-black overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap justify-center gap-8 md:gap-16">
          {[
            { value: 800, suffix: '+', label: 'Verified Creators' },
            { value: 2.4, suffix: 'Cr+', prefix: '₹', label: 'Escrow Managed', decimals: 1 },
            { value: 97, suffix: '%', label: 'Completion Rate' },
            { value: 120, suffix: '+', label: 'Campaigns Run' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl md:text-3xl font-black tabular-nums">
                {stat.prefix || ''}
                <AnimatedCounter
                  target={stat.value}
                  suffix={stat.suffix}
                  decimals={stat.decimals || 0}
                />
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── How It Works ──────────────────────────────────────────────────── */}
      <div className="py-24 bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 mb-4">
              How It Works
            </span>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-black">
              Three steps to your first deal.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-black z-0" />

            {[
              {
                step: '01',
                icon: '🎯',
                title: 'Sign Up & Verify',
                desc: 'Create your account, complete KYC, and verify your YouTube channel. Takes under 5 minutes.',
                creator: true,
                brand: true,
              },
              {
                step: '02',
                icon: '🤝',
                title: 'Match & Negotiate',
                desc: 'Brands discover verified creators. Creators apply to high-budget campaigns. Terms negotiated inside the platform.',
                creator: true,
                brand: true,
              },
              {
                step: '03',
                icon: '💰',
                title: 'Deliver & Get Paid',
                desc: 'Escrow locks funds before production. AI verifies deliverables. Payment releases automatically.',
                creator: true,
                brand: true,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative z-10 bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-2 border-gray-200 px-2 py-0.5">
                    Step {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-black text-black uppercase tracking-wide mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Features Section ──────────────────────────────────────────────── */}
      <div className="py-24 bg-[#fafaf9] border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-black">
              Why creator<span className="text-[#e8473f]">.</span>stack?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 hover:-rotate-1 transition-transform group">
              <div className="w-16 h-16 bg-[#fff0ee] border-2 border-black rounded-xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform">
                🎥
              </div>
              <h3 className="text-xl font-black text-black uppercase tracking-wide mb-3">
                For Creators
              </h3>
              <p className="text-gray-600 font-medium leading-relaxed">
                Get your AI-calculated fair rate. Apply to verified campaigns. Sign legally-binding
                contracts. Receive payments automatically — no chasing required.
              </p>
            </div>

            <div className="bg-[#0f3460] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 hover:rotate-1 transition-transform group">
              <div className="w-16 h-16 bg-white border-2 border-black rounded-xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform">
                💼
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-wide mb-3">
                For Brands
              </h3>
              <p className="text-[#a0bcd8] font-medium leading-relaxed">
                Post a campaign in 5 minutes. Browse 800+ verified creators with real YouTube data.
                Lock escrow before production starts. Track ROI in real time.
              </p>
            </div>

            <div className="bg-black border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 hover:-rotate-1 transition-transform group">
              <div className="w-16 h-16 bg-[#a3e635] border-2 border-black rounded-xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform">
                🔐
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-wide mb-3">
                Secure Escrow
              </h3>
              <p className="text-gray-400 font-medium leading-relaxed">
                Funds locked before production begins. 10% TDS auto-deducted. AI delivery
                verification. PAN & UPI verified payouts. Full legal audit trail.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Trust Badges ──────────────────────────────────────────────────── */}
      <div className="py-16 bg-white border-b-2 border-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 mb-10">
            Built for the Indian creator economy
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: '✅', label: 'PAN Verified' },
              { icon: '🏦', label: 'UPI Penny Drop' },
              { icon: '🔐', label: 'Escrow Protected' },
              { icon: '📜', label: 'TDS Compliant' },
              { icon: '🎥', label: 'YouTube OAuth' },
              { icon: '⚖️', label: 'eStamp Contract' },
              { icon: '🤖', label: 'AI Delivery Check' },
            ].map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-4 py-2"
              >
                <span className="text-lg">{badge.icon}</span>
                <span className="text-xs font-black text-black uppercase tracking-widest">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Footer CTA ────────────────────────────────────────────────────── */}
      <div className="py-24 bg-black text-white text-center border-t-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <span className="inline-block bg-[#e8473f] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 mb-6">
            Ready to launch?
          </span>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-6">
            Your next deal is one click away.
          </h2>
          <p className="text-gray-400 font-medium mb-10 text-lg max-w-xl mx-auto">
            Free to join. No platform fees until you complete your first deal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              id="footer-cta-creator"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-[#e8473f] bg-[#e8473f] text-white text-base font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(232,71,63,0.5)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(232,71,63,0.5)] active:translate-y-0 active:shadow-none transition-all"
            >
              🎥 Start Creating for Free
            </Link>
            <Link
              to="/signup"
              id="footer-cta-brand"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-[#00b4d8] bg-[#00b4d8] text-[#050d18] text-base font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,180,216,0.4)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,180,216,0.4)] active:translate-y-0 active:shadow-none transition-all"
            >
              💼 Post Your First Campaign
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-[#050d18] text-white py-10 border-t-2 border-[#0f3460]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-2xl font-black tracking-tight">
            creator<span className="text-[#e8473f]">.</span>stack
          </span>
          <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <Link to="/login" className="hover:text-white transition-colors">
              Login
            </Link>
            <Link to="/signup" className="hover:text-white transition-colors">
              Sign Up
            </Link>
            <a href="mailto:officialcreator.stack@email.com" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
          <p className="text-gray-600 text-xs font-medium">
            © 2026 CreatorStack. Made for India's creator economy.
          </p>
        </div>
      </footer>
    </div>
  );
}
