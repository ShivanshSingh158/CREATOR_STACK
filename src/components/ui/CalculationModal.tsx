import React from 'react';
import { X, Calculator, Video, IndianRupee, TrendingUp, Zap, Target } from 'lucide-react';

interface CalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown?: {
    base_cpm_inr: number;
    audience_multiplier: number;
    engagement_premium: number;
    velocity_multiplier: number;
    final_cpm: number;
  };
}

export function CalculationModal({ isOpen, onClose, breakdown }: CalculationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-2 border-black bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Calculator className="w-5 h-5 text-indigo-700" />
            </div>
            <h2 className="text-xl font-black text-black">How We Calculate</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto p-6 space-y-8">
          {/* Section 1 */}
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Video className="w-4 h-4" /> 1. Real-Time View Metrics
            </h3>
            <div className="space-y-4">
              <div className="bg-blue-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4 rounded-xl">
                <p className="font-black text-black mb-1">The Data Source</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  We fetch up to your most recent 50 videos directly from your channel's raw{' '}
                  <code className="bg-white border-2 border-blue-200 px-1.5 py-0.5 rounded-md font-bold text-blue-800">
                    uploads
                  </code>{' '}
                  playlist to guarantee perfect chronological order.
                </p>
              </div>
              <div className="bg-purple-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4 rounded-xl">
                <p className="font-black text-black mb-1">Format Split & Raw Math</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  We separate Long Form (&gt; 60s) from YouTube Shorts (&le; 60s). We then take the{' '}
                  <strong className="text-black">exact sum of all views</strong> in that category
                  and divide by the number of videos.{' '}
                  <strong className="text-black">
                    No outliers are dropped, no numbers are filtered.
                  </strong>
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <IndianRupee className="w-4 h-4" /> 2. Fair Market Rate Engine
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4 rounded-xl bg-white">
                <Target className="w-5 h-5 text-indigo-600 mb-2" />
                <p className="font-bold text-black text-sm mb-1">Base Indian CPM</p>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  We scan your channel's YouTube topic metadata to auto-infer your exact niche
                  (e.g., Finance, Tech, Education). We then apply the true, premium 2026 Indian
                  Market Base CPM for that category.
                </p>
              </div>

              <div className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4 rounded-xl bg-white">
                <TrendingUp className="w-5 h-5 text-indigo-600 mb-2" />
                <p className="font-bold text-black text-sm mb-1">Audience Tier</p>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  A multiplier is applied based on your subscriber volume to classify you as a Nano,
                  Micro, Macro, or Mega creator.
                </p>
              </div>

              <div className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4 rounded-xl bg-white">
                <Zap className="w-5 h-5 text-amber-500 mb-2" />
                <p className="font-bold text-black text-sm mb-1">Engagement Premium</p>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  If your engagement rate is exceptionally high, we apply an exponential premium for
                  possessing a "cult audience."
                </p>
              </div>

              <div className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4 rounded-xl bg-white">
                <TrendingUp className="w-5 h-5 text-emerald-600 mb-2" />
                <p className="font-bold text-black text-sm mb-1">Velocity Bonus</p>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  If your newest videos are outperforming your older ones, we apply an accelerating
                  trend bonus to your rate.
                </p>
              </div>
            </div>

            <div className="mt-4 bg-emerald-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-5 rounded-xl text-sm text-emerald-900 font-medium">
              <p className="mb-3">
                <strong>The Result:</strong> These four factors produce your true dynamic{' '}
                <code className="bg-white border-2 border-emerald-200 px-1.5 py-0.5 rounded-md font-bold">
                  Final CPM
                </code>
                , which is then multiplied by your Long Form Average Views to generate your Base and
                Dedicated integration fees!
              </p>

              {breakdown && (
                <div className="bg-white border-2 border-emerald-800 rounded-lg p-4 mt-4 font-mono text-xs sm:text-sm text-center">
                  <p className="font-bold text-emerald-900 mb-2 uppercase tracking-widest text-[10px]">
                    Your Exact Valuation Math
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="bg-emerald-100 px-2 py-1 rounded border border-emerald-300">
                      ₹{breakdown.base_cpm_inr}
                    </span>
                    <span>×</span>
                    <span
                      className="bg-blue-100 px-2 py-1 rounded border border-blue-300"
                      title="Audience Premium"
                    >
                      {breakdown.audience_multiplier}x
                    </span>
                    <span>×</span>
                    <span
                      className="bg-amber-100 px-2 py-1 rounded border border-amber-300"
                      title="Engagement Premium"
                    >
                      {breakdown.engagement_premium}x
                    </span>
                    <span>×</span>
                    <span
                      className="bg-purple-100 px-2 py-1 rounded border border-purple-300"
                      title="Velocity Multiplier"
                    >
                      {breakdown.velocity_multiplier}x
                    </span>
                    <span>=</span>
                    <span className="bg-slate-900 text-white px-3 py-1.5 rounded font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(16,185,129,1)]">
                      CPM: ₹{Math.round(breakdown.final_cpm)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Video className="w-4 h-4" /> 3. YouTube Shorts Matrix
            </h3>
            <div className="bg-rose-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4 rounded-xl">
              <p className="font-black text-black mb-1">Separate CPM Reality + Labor Premium</p>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                The Indian market values swipe-based short-form content fundamentally differently.
                While base CPMs are lower, the labor (scripting, shooting, editing) remains high. We
                factor this in by calculating Shorts at ~35% of your Long-Form CPM, PLUS a base
                flat-fee labor premium. This provides brands and creators with an accurate,
                realistic reflection of short-form monetization that doesn't devalue your time.
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-black bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
