export interface ScrapedMetrics {
  platform: 'YouTube' | 'Instagram';
  creator_name: string;
  niche: string;
  language: string;
  follower_count: number;
  avg_views_last_10: number;
  engagement_rate_percentage: number;
  viewership_velocity_trend: 'stable' | 'accelerating' | 'declining';
}

export interface ValuationOutput {
  fair_rate_card: {
    base_integration_fee: number;
    dedicated_video_fee: number;
    max_market_rate: number;
  };
  revenue_leakage_annual: number;
  data_justification: string;
}

export function calculateCreatorValuation(data: ScrapedMetrics): ValuationOutput {
  // 1. BASELINE METRICS FOR INDIAN MARKET
  const BASE_CPM_INR = 150; // Standard baseline CPM

  // 2. NICHE MULTIPLIERS (Indian Context)
  const highNiches = ['Personal Finance', 'Crypto', 'Tech', 'B2B SaaS', 'Business', 'Finance'];
  const midHighNiches = ['Beauty', 'Fashion', 'Fitness', 'Automobile', 'Travel', 'Lifestyle'];
  const midNiches = ['Gaming', 'Vlogging', 'Infotainment', 'Tech Unboxing'];
  const lowNiches = ['Comedy', 'Memes', 'Roasting', 'Entertainment'];

  let nicheMultiplier = 1.0;
  if (highNiches.some(n => data.niche.includes(n))) nicheMultiplier = 1.8;
  else if (midHighNiches.some(n => data.niche.includes(n))) nicheMultiplier = 1.3;
  else if (lowNiches.some(n => data.niche.includes(n))) nicheMultiplier = 0.7;

  // 3. VELOCITY MULTIPLIER
  const velocityMultiplier = data.viewership_velocity_trend === 'accelerating' ? 1.3 : 
                             data.viewership_velocity_trend === 'declining' ? 0.8 : 1.0;

  // 4. ENGAGEMENT MULTIPLIER
  // Average ER is ~3%. Above that adds a premium.
  const engagementPremium = data.engagement_rate_percentage > 3.0 
    ? 1 + ((data.engagement_rate_percentage - 3.0) * 0.1) 
    : 1.0;

  // 5. CORE ALGORITHM CALCULATION
  // Heavily weighted on avg_views and engagement, not just followers.
  const adjustedCPM = BASE_CPM_INR * nicheMultiplier * velocityMultiplier * engagementPremium;
  const baseValue = (data.avg_views_last_10 / 1000) * adjustedCPM;

  // Base integration (45-60s mention)
  let integrationFee = Math.round(baseValue);
  
  // Dedicated Video (100% focused)
  let dedicatedFee = Math.round(baseValue * 2.5);

  // Max Market Rate
  let maxRate = Math.round(dedicatedFee * 1.2);

  // 6. LONG-TAIL ADJUSTMENT & LEAKAGE
  let actualCurrentRate = integrationFee * 0.5; // Assume they charge 50% of worth usually
  
  // Specific correction for micro-creators (10k-50k)
  if (data.follower_count >= 10000 && data.follower_count <= 50000) {
    actualCurrentRate = 5000; // Micro-creators routinely undercharge flat rates like 5k
  }

  // Ensure fees aren't lower than absolute minimum standard for effort
  if (integrationFee < 10000) integrationFee = 10000;
  if (dedicatedFee < 25000) dedicatedFee = 25000;

  // Calculate annual leakage (assuming 24 deals a year, 2 per month)
  const lossPerDeal = integrationFee - actualCurrentRate;
  const annualLeakage = lossPerDeal > 0 ? lossPerDeal * 24 : 0;

  // 7. DATA JUSTIFICATION
  let justification = `Based on an average of ${data.avg_views_last_10.toLocaleString()} views across recent content with an engagement depth of ${data.engagement_rate_percentage}%, your audience commands a premium in the ${data.niche} cohort. `;
  
  if (data.follower_count >= 10000 && data.follower_count <= 50000) {
    justification += `As a micro-creator with a ${data.viewership_velocity_trend} velocity, you are suffering from severe information asymmetry and actively losing revenue by accepting generic flat fees.`;
  } else {
    justification += `Your ${data.viewership_velocity_trend} viewership trend justifies a high-tier integration rate over raw follower count metrics.`;
  }

  return {
    fair_rate_card: {
      base_integration_fee: integrationFee,
      dedicated_video_fee: dedicatedFee,
      max_market_rate: maxRate
    },
    revenue_leakage_annual: annualLeakage,
    data_justification: justification
  };
}

// SIMULATOR TO GENERATE FAKE METRICS FROM A URL (For Hackathon Demo purposes)
export function simulateScrapingFromURL(url: string, nicheInput: string): ScrapedMetrics {
  const isYoutube = url.includes('youtube') || url.includes('youtu.be');
  const randomFollowers = Math.floor(Math.random() * 40000) + 12000; // Bias towards micro-creators 12k - 52k
  const randomViews = Math.floor(randomFollowers * (Math.random() * 0.4 + 0.1)); // 10-50% view-to-follower ratio
  const randomER = parseFloat((Math.random() * 5 + 1.5).toFixed(1)); // 1.5% to 6.5% ER
  const velocityTypes: ('stable'|'accelerating'|'declining')[] = ['stable', 'accelerating', 'declining'];

  return {
    platform: isYoutube ? 'YouTube' : 'Instagram',
    creator_name: 'Creator from URL',
    niche: nicheInput || 'Technology', // Fallback or passed in
    language: 'Hindi/English',
    follower_count: randomFollowers,
    avg_views_last_10: randomViews,
    engagement_rate_percentage: randomER,
    viewership_velocity_trend: velocityTypes[Math.floor(Math.random() * velocityTypes.length)]
  };
}
