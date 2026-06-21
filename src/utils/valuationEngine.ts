export interface ScrapedMetrics {
  platform: 'YouTube' | 'Instagram';
  creator_name: string;
  niche: string;
  language: string;
  follower_count: number;
  avg_views_last_10: number;
  long_form_avg_views?: number;
  shorts_avg_views?: number;
  engagement_rate_percentage: number;
  viewership_velocity_trend: 'stable' | 'accelerating' | 'declining';
  current_rate?: number; // Real user-reported rate
}

export interface ValuationOutput {
  fair_rate_card: {
    base_integration_fee: number | null;
    dedicated_video_fee: number | null;
    shorts_fee: number | null;
    max_market_rate: number | null;
  };
  breakdown: {
    base_cpm_inr: number;
    audience_multiplier: number;
    engagement_premium: number;
    velocity_multiplier: number;
    final_cpm: number;
  };
  revenue_leakage_annual: number;
  data_justification: string;
}

export function calculateCreatorValuation(data: ScrapedMetrics): ValuationOutput {
  // 1. DYNAMIC BASE CPMs BY NICHE (Indian Context)
  const nLower = data.niche.toLowerCase();
  let baseCpmInr = 150; // Fallback baseline

  if (
    nLower.includes('finance') ||
    nLower.includes('crypto') ||
    nLower.includes('web3') ||
    nLower.includes('investing')
  )
    baseCpmInr = 1500;
  else if (
    nLower.includes('tech') ||
    nLower.includes('saas') ||
    nLower.includes('ai') ||
    nLower.includes('software') ||
    nLower.includes('coding') ||
    nLower.includes('developer')
  )
    baseCpmInr = 1200;
  else if (
    nLower.includes('business') ||
    nLower.includes('startup') ||
    nLower.includes('edtech') ||
    nLower.includes('education')
  )
    baseCpmInr = 1000;
  else if (
    nLower.includes('auto') ||
    nLower.includes('car') ||
    nLower.includes('bike') ||
    nLower.includes('real estate')
  )
    baseCpmInr = 800;
  else if (
    nLower.includes('health') ||
    nLower.includes('fitness') ||
    nLower.includes('medical') ||
    nLower.includes('doctor')
  )
    baseCpmInr = 600;
  else if (
    nLower.includes('beauty') ||
    nLower.includes('fashion') ||
    nLower.includes('makeup') ||
    nLower.includes('style')
  )
    baseCpmInr = 500;
  else if (
    nLower.includes('lifestyle') ||
    nLower.includes('travel') ||
    nLower.includes('food') ||
    nLower.includes('vlog')
  )
    baseCpmInr = 350;
  else if (nLower.includes('gaming') || nLower.includes('sports') || nLower.includes('parenting'))
    baseCpmInr = 250;
  else if (
    nLower.includes('comedy') ||
    nLower.includes('entertainment') ||
    nLower.includes('prank') ||
    nLower.includes('news') ||
    nLower.includes('gossip')
  )
    baseCpmInr = 150;

  // 2. AUDIENCE TIER MULTIPLIER (The Micro-Creator Premium)
  // Micro audiences are highly targeted, mega audiences are mass market.
  let audienceMultiplier: number;
  if (data.follower_count < 10000)
    audienceMultiplier = 1.5; // Nano
  else if (data.follower_count >= 10000 && data.follower_count < 100000)
    audienceMultiplier = 1.2; // Micro
  else if (data.follower_count >= 100000 && data.follower_count < 500000)
    audienceMultiplier = 1.0; // Mid-Tier
  else if (data.follower_count >= 500000 && data.follower_count < 1000000)
    audienceMultiplier = 0.8; // Macro
  else audienceMultiplier = 0.6; // Mega (>1M)

  // 3. NON-LINEAR ENGAGEMENT PREMIUM
  // Engagement rates scale non-linearly. High ER is exponentially more valuable.
  let engagementPremium: number;
  if (data.engagement_rate_percentage < 2.0) engagementPremium = 0.8;
  else if (data.engagement_rate_percentage >= 2.0 && data.engagement_rate_percentage < 4.0)
    engagementPremium = 1.0;
  else if (data.engagement_rate_percentage >= 4.0 && data.engagement_rate_percentage < 7.0)
    engagementPremium = 1.25;
  else if (data.engagement_rate_percentage >= 7.0 && data.engagement_rate_percentage < 10.0)
    engagementPremium = 1.6;
  else engagementPremium = 2.0; // Cult Audience

  // 4. VELOCITY MULTIPLIER
  const velocityMultiplier =
    data.viewership_velocity_trend === 'accelerating'
      ? 1.2
      : data.viewership_velocity_trend === 'declining'
        ? 0.85
        : 1.0;

  // 5. CORE PRICING ALGORITHM
  const finalCpm = baseCpmInr * audienceMultiplier * engagementPremium * velocityMultiplier;

  const lfViews =
    data.long_form_avg_views !== undefined ? data.long_form_avg_views : data.avg_views_last_10;
  const sViews = data.shorts_avg_views !== undefined ? data.shorts_avg_views : 0;

  let integrationFee: number | null = null;
  let dedicatedFee: number | null = null;
  let shortsFee: number | null = null;
  let maxRate: number | null = null;

  // Calculate Long-Form Rates ONLY if they actually make Long-Form videos
  if (lfViews > 0) {
    const baseValue = (lfViews / 1000) * finalCpm;
    integrationFee = Math.round(baseValue);
    dedicatedFee = Math.round(baseValue * 2.5);
    maxRate = Math.round(dedicatedFee * 1.2);

    // Realistic floors for micro creators
    if (integrationFee < 1000) integrationFee = 1000;
    if (dedicatedFee < 2500) dedicatedFee = 2500;
  }

  // Calculate Shorts Rates ONLY if they actually make Shorts
  if (sViews > 0) {
    const sBaseValue = (sViews / 1000) * finalCpm;
    // Shorts CPM is generally lower, but labor is high. Add a base labor premium + 35% of CPM value
    shortsFee = Math.round(sBaseValue * 0.35) + 1000;
    if (shortsFee < 1500) shortsFee = 1500; // Realistic floor
  }

  // Calculate annual leakage (assuming 24 deals a year, 2 per month)
  // ONLY calculate leakage if the user explicitly provided their actual real-world rate.
  let lossPerDeal = 0;
  if (data.current_rate) {
    if (integrationFee) {
      lossPerDeal = integrationFee - data.current_rate;
    } else if (shortsFee) {
      lossPerDeal = shortsFee - data.current_rate;
    }
  }
  const annualLeakage = lossPerDeal > 0 ? lossPerDeal * 24 : 0;

  // 7. DYNAMIC DATA JUSTIFICATION
  let tierName = 'Mid-Tier';
  if (audienceMultiplier === 1.5) tierName = 'Nano';
  else if (audienceMultiplier === 1.2) tierName = 'Micro';
  else if (audienceMultiplier === 0.8) tierName = 'Macro';
  else if (audienceMultiplier === 0.6) tierName = 'Mega';

  let justification = `Based on an average of ${data.avg_views_last_10.toLocaleString()} views per video, your ${data.niche} channel is classified as a ${tierName} creator. `;

  justification += `The current market CPM for ${data.niche} content is roughly ₹${baseCpmInr}. `;

  if (engagementPremium >= 1.6) {
    justification += `Because your engagement rate (${data.engagement_rate_percentage}%) is exceptionally high, you command a premium rate for possessing a cult-like audience. `;
  }

  if (audienceMultiplier > 1.0) {
    justification += `As a ${tierName} creator, brands are willing to pay a higher CPM for your highly targeted, hyper-niche audience compared to mass-market channels. `;
  } else if (audienceMultiplier < 1.0) {
    justification += `As a ${tierName} creator, your rates reflect a volume discount typical for mass-market reach. `;
  }

  if (lossPerDeal > 0 && data.current_rate) {
    justification += `Your current reported rate of ₹${data.current_rate.toLocaleString()} results in a massive ₹${annualLeakage.toLocaleString()} annual revenue leakage. Use these verified numbers to negotiate your true market worth.`;
  } else if (data.current_rate) {
    justification += `Your current rate perfectly aligns with or exceeds your algorithmic market worth. Keep closing strong deals!`;
  } else {
    justification += `Update your current integration rate in your profile to uncover potential hidden revenue leakage.`;
  }

  return {
    fair_rate_card: {
      base_integration_fee: integrationFee,
      dedicated_video_fee: dedicatedFee,
      shorts_fee: shortsFee,
      max_market_rate: maxRate,
    },
    breakdown: {
      base_cpm_inr: baseCpmInr,
      audience_multiplier: audienceMultiplier,
      engagement_premium: engagementPremium,
      velocity_multiplier: velocityMultiplier,
      final_cpm: finalCpm,
    },
    revenue_leakage_annual: annualLeakage,
    data_justification: justification,
  };
}
