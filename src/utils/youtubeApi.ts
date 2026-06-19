/**
 * YouTube Data API v3 — Real Channel Metrics Fetcher
 * 
 * Setup: Add VITE_YOUTUBE_API_KEY=<your_key> to .env
 * Google Cloud: Enable "YouTube Data API v3" in your project
 * 
 * Quota cost: ~3 units per creator verification (well within 10,000/day free tier)
 */

import { NICHES } from './niches';

export interface YouTubeChannelMetrics {
  channelId: string;
  channelName: string;
  handle: string;
  description: string;
  thumbnailUrl: string;
  bannerUrl?: string;
  inferredNiche?: string;
  inferredLanguage: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  avgViewsLast10: number; // Overall blended average
  engagementRate: number; // Overall blended engagement
  longFormAvgViews?: number;
  longFormEngagement?: number;
  shortsAvgViews?: number;
  shortsEngagement?: number;
  velocityTrend: 'accelerating' | 'stable' | 'declining';
  lastVideoDate: string;
  recentVideos: {
    title: string;
    thumbnailUrl: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    publishedAt: string;
    videoId: string;
  }[];
  verifiedAt: string;
  isVerified: boolean;
}

export type YouTubeAPIError =
  | { type: 'NOT_FOUND'; message: string }
  | { type: 'QUOTA_EXCEEDED'; message: string }
  | { type: 'INVALID_KEY'; message: string }
  | { type: 'NETWORK_ERROR'; message: string }
  | { type: 'INVALID_URL'; message: string };

const YT_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string;
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Extract channel identifier from various YouTube URL formats.
 * Supports:
 *   youtube.com/channel/UCxxxxx
 *   youtube.com/@handle
 *   youtube.com/c/customName
 *   youtube.com/user/username
 *   youtu.be channel URLs
 */
export function parseYouTubeChannelUrl(url: string): { type: 'id' | 'handle' | 'username'; value: string } | null {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const pathname = u.pathname;

    // /channel/UCxxxxx
    const channelMatch = pathname.match(/^\/channel\/(UC[a-zA-Z0-9_-]{22})/);
    if (channelMatch) return { type: 'id', value: channelMatch[1] };

    // /@handle
    const handleMatch = pathname.match(/^\/@([a-zA-Z0-9._-]+)/);
    if (handleMatch) return { type: 'handle', value: handleMatch[1] };

    // /c/customName
    const cMatch = pathname.match(/^\/c\/([a-zA-Z0-9._-]+)/);
    if (cMatch) return { type: 'username', value: cMatch[1] };

    // /user/username
    const userMatch = pathname.match(/^\/user\/([a-zA-Z0-9._-]+)/);
    if (userMatch) return { type: 'username', value: userMatch[1] };

    return null;
  } catch {
    return null;
  }
}

/**
 * Resolve a channel handle or username to a channel ID via YouTube search API.
 */
async function resolveChannelId(identifier: { type: 'id' | 'handle' | 'username'; value: string }): Promise<string> {
  if (identifier.type === 'id') return identifier.value;

  // For handles (@username), use the forHandle parameter
  if (identifier.type === 'handle') {
    const res = await fetch(
      `${YT_BASE}/channels?part=id&forHandle=${encodeURIComponent(identifier.value)}&key=${YT_API_KEY}`
    );
    const data = await res.json();
    if (data.items && data.items.length > 0) return data.items[0].id;
  }

  // For custom names or usernames, fall back to search
  const res = await fetch(
    `${YT_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(identifier.value)}&maxResults=1&key=${YT_API_KEY}`
  );
  const data = await res.json();
  if (data.items && data.items.length > 0) return data.items[0].id.channelId;

  throw new Error('Channel not found');
}

/**
 * Helper to infer our platform niche from YouTube's topic categories
 */
function inferNicheFromTopics(topicCategories?: string[]): string {
  if (!topicCategories || topicCategories.length === 0) return 'Daily Vlogs'; // default
  
  const topicsStr = topicCategories.map(t => t.toLowerCase()).join(' ');
  
  // Advanced mapping to 50+ Niches
  if (topicsStr.includes('video_game') || topicsStr.includes('action_game') || topicsStr.includes('role-playing_game') || topicsStr.includes('strategy_game')) {
    if (topicsStr.includes('pc')) return 'PC Gaming';
    if (topicsStr.includes('mobile')) return 'Mobile Gaming';
    if (topicsStr.includes('esports')) return 'Esports';
    return 'Console Gaming';
  }
  
  if (topicsStr.includes('technology') || topicsStr.includes('computer')) {
    if (topicsStr.includes('software') || topicsStr.includes('programming')) return 'Software Development';
    if (topicsStr.includes('hardware')) return 'Tech Hardware';
    if (topicsStr.includes('artificial_intelligence')) return 'AI & Machine Learning';
    return 'Consumer Tech';
  }
  
  if (topicsStr.includes('finance') || topicsStr.includes('business') || topicsStr.includes('economics')) {
    if (topicsStr.includes('stock') || topicsStr.includes('trading')) return 'Stock Trading';
    if (topicsStr.includes('real_estate')) return 'Real Estate Investing';
    if (topicsStr.includes('cryptocurrency')) return 'Crypto & Web3';
    return 'Personal Finance';
  }
  
  if (topicsStr.includes('education') || topicsStr.includes('knowledge')) {
    if (topicsStr.includes('language')) return 'Language Learning';
    if (topicsStr.includes('science')) return 'Science & Engineering';
    return 'EdTech';
  }
  
  if (topicsStr.includes('health') || topicsStr.includes('fitness')) {
    if (topicsStr.includes('bodybuilding')) return 'Bodybuilding';
    if (topicsStr.includes('yoga')) return 'Yoga & Mindfulness';
    return 'Home Workouts';
  }
  
  if (topicsStr.includes('food') || topicsStr.includes('cooking')) {
    if (topicsStr.includes('baking')) return 'Baking';
    if (topicsStr.includes('vegan')) return 'Vegan/Plant-Based';
    return 'Home Cooking';
  }
  
  if (topicsStr.includes('beauty') || topicsStr.includes('fashion')) {
    if (topicsStr.includes('makeup')) return 'Makeup Tutorials';
    if (topicsStr.includes('streetwear')) return 'Streetwear';
    return 'Skincare';
  }
  
  if (topicsStr.includes('vehicle') || topicsStr.includes('auto')) {
    if (topicsStr.includes('motorcycle')) return 'Motorcycles';
    return 'Car Reviews';
  }
  
  if (topicsStr.includes('music') || topicsStr.includes('entertainment')) {
    if (topicsStr.includes('comedy')) return 'Comedy Sketches';
    if (topicsStr.includes('film')) return 'Movie Reviews';
    if (topicsStr.includes('animation')) return 'Anime & Manga';
    return 'Daily Vlogs';
  }
  
  return 'Daily Vlogs'; // default fallback
}

/**
 * Helper to infer language from YouTube's snippet data
 */
function inferLanguage(snippet: any): string {
  const langCode = snippet.defaultLanguage || snippet.country || '';
  const langLower = langCode.toLowerCase();
  
  if (langLower.startsWith('hi')) return 'Hindi';
  if (langLower.startsWith('ta')) return 'Tamil';
  if (langLower.startsWith('te')) return 'Telugu';
  if (langLower.startsWith('bn')) return 'Bengali';
  if (langLower.startsWith('mr')) return 'Marathi';
  if (langLower.startsWith('gu')) return 'Gujarati';
  if (langLower.startsWith('pa')) return 'Punjabi';
  if (langLower.startsWith('kn')) return 'Kannada';
  if (langLower.startsWith('ml')) return 'Malayalam';
  if (langLower.startsWith('or')) return 'Odia';
  if (langLower.startsWith('en')) return 'English';
  
  if (snippet.country === 'IN' || langLower.includes('in')) return 'Hinglish';
  return 'English';
}

/**
 * Lightweight function to quickly detect niche from URL without fetching videos.
 */
export async function detectChannelNiche(channelUrl: string): Promise<string | null> {
  const urlLower = channelUrl.toLowerCase();
  
  if (!YT_API_KEY || YT_API_KEY === 'YOUR_YOUTUBE_DATA_API_V3_KEY_HERE') {
    // Basic heuristics if no API key
    if (urlLower.includes('gaming') || urlLower.includes('game')) return 'PC Gaming';
    if (urlLower.includes('tech')) return 'Consumer Tech';
    if (urlLower.includes('code') || urlLower.includes('dev')) return 'Software Development';
    if (urlLower.includes('finance') || urlLower.includes('crypto')) return 'Crypto & Web3';
    if (urlLower.includes('beauty') || urlLower.includes('makeup')) return 'Makeup Tutorials';
    return null;
  }

  const parsed = parseYouTubeChannelUrl(channelUrl);
  if (!parsed) {
    // Still try simple heuristic if URL is not fully formed yet
    if (urlLower.includes('gaming')) return 'PC Gaming';
    return null;
  }

  try {
    const channelId = await resolveChannelId(parsed);
    const channelRes = await fetch(
      `${YT_BASE}/channels?part=topicDetails,snippet&id=${channelId}&key=${YT_API_KEY}`
    );
    const data = await channelRes.json();
    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      let niche = inferNicheFromTopics(channel.topicDetails?.topicCategories);
      
      // Better inference from description if topics didn't hit perfectly
      if (niche === 'Daily Vlogs') {
        const desc = channel.snippet?.description?.toLowerCase() || '';
        if (desc.includes('gaming')) niche = 'PC Gaming';
        else if (desc.includes('tech')) niche = 'Consumer Tech';
        else if (desc.includes('finance') || desc.includes('money')) niche = 'Personal Finance';
        else if (desc.includes('code') || desc.includes('software')) niche = 'Software Development';
      }
      return niche;
    }
  } catch (e) {
    console.error('Error auto-detecting niche:', e);
  }
  return null;
}

/**
 * Main function: fetch real YouTube channel metrics from a URL.
 * Returns full verified metrics or throws a typed error.
 */
export async function fetchYouTubeChannelMetrics(channelUrl: string): Promise<YouTubeChannelMetrics> {
  if (!YT_API_KEY || YT_API_KEY === 'YOUR_YOUTUBE_DATA_API_V3_KEY_HERE') {
    throw { type: 'INVALID_KEY', message: 'YouTube API key not configured. Add VITE_YOUTUBE_API_KEY to your .env file.' } as YouTubeAPIError;
  }

  const parsed = parseYouTubeChannelUrl(channelUrl);
  if (!parsed) {
    throw { type: 'INVALID_URL', message: 'Could not parse YouTube channel URL. Please paste a valid channel link.' } as YouTubeAPIError;
  }

  let channelId: string;
  try {
    channelId = await resolveChannelId(parsed);
  } catch {
    throw { type: 'NOT_FOUND', message: 'Channel not found. Please check the URL and try again.' } as YouTubeAPIError;
  }

  // --- Step 1: Fetch channel statistics & snippet & contentDetails & topicDetails ---
  const channelRes = await fetch(
    `${YT_BASE}/channels?part=statistics,snippet,brandingSettings,contentDetails,topicDetails&id=${channelId}&key=${YT_API_KEY}`
  );

  if (!channelRes.ok) {
    const err = await channelRes.json();
    if (channelRes.status === 403) {
      throw { type: err.error?.errors?.[0]?.reason === 'quotaExceeded' ? 'QUOTA_EXCEEDED' : 'INVALID_KEY', message: err.error?.message || 'API access denied.' } as YouTubeAPIError;
    }
    throw { type: 'NETWORK_ERROR', message: `YouTube API error: ${channelRes.status}` } as YouTubeAPIError;
  }

  const channelData = await channelRes.json();
  if (!channelData.items || channelData.items.length === 0) {
    throw { type: 'NOT_FOUND', message: 'Channel not found on YouTube.' } as YouTubeAPIError;
  }

  const channel = channelData.items[0];
  const stats = channel.statistics;
  const snippet = channel.snippet;

  const subscriberCount = parseInt(stats.subscriberCount || '0');
  const totalViewCount = parseInt(stats.viewCount || '0');
  const videoCount = parseInt(stats.videoCount || '0');
  const channelName = snippet.title || '';
  const description = snippet.description || '';
  const thumbnailUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '';
  const rawBanner = channel.brandingSettings?.image?.bannerExternalUrl;
  const bannerUrl = rawBanner ? `${rawBanner}=w1080-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj` : '';
  const handle = snippet.customUrl || `@${channelName.toLowerCase().replace(/\s+/g, '')}`;
  const inferredNiche = inferNicheFromTopics(channel.topicDetails?.topicCategories);
  const inferredLanguage = inferLanguage(snippet);

  // --- Step 2: Fetch last 50 video IDs via the 'uploads' playlist ---
  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw { type: 'NOT_FOUND', message: 'Could not find uploads playlist for this channel.' } as YouTubeAPIError;
  }

  const playlistRes = await fetch(
    `${YT_BASE}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${YT_API_KEY}`
  );
  const playlistData = await playlistRes.json();
  const videoIds: string[] = (playlistData.items || []).map((item: any) => item.contentDetails?.videoId).filter(Boolean);

  // --- Step 3: Fetch video statistics for last 10 videos ---
  let recentVideos: YouTubeChannelMetrics['recentVideos'] = [];
  let avgViewsLast10 = 0;
  let engagementRate = 0;
  let velocityTrend: 'accelerating' | 'stable' | 'declining' = 'stable';

  if (videoIds.length > 0) {
    const videoRes = await fetch(
      `${YT_BASE}/videos?part=statistics,snippet,contentDetails&id=${videoIds.join(',')}&key=${YT_API_KEY}`
    );
    const videoData = await videoRes.json();

    // Helper to parse ISO 8601 duration (PT#H#M#S) into seconds
    const parseDuration = (durationStr: string) => {
      const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 0;
      const h = parseInt(match[1] || '0', 10);
      const m = parseInt(match[2] || '0', 10);
      const s = parseInt(match[3] || '0', 10);
      return h * 3600 + m * 60 + s;
    };

    // Map videos and calculate duration
    let allVideos = (videoData.items || []).map((v: any) => ({
      title: v.snippet?.title || '',
      thumbnailUrl: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.medium?.url || '',
      viewCount: parseInt(v.statistics?.viewCount || '0'),
      likeCount: parseInt(v.statistics?.likeCount || '0'),
      commentCount: parseInt(v.statistics?.commentCount || '0'),
      publishedAt: v.snippet?.publishedAt || '',
      videoId: v.id,
      durationSeconds: parseDuration(v.contentDetails?.duration || 'PT0S')
    }));

    // Helper to calculate raw true average
    const calculateRawAverage = (videoList: any[]) => {
      if (videoList.length === 0) return { avgViews: 0, avgEng: 0, totalViews: 0 };
      
      const totalV = videoList.reduce((s, v) => s + v.viewCount, 0);
      const totalE = videoList.reduce((s, v) => s + v.likeCount + v.commentCount, 0);
      
      return {
        avgViews: Math.round(totalV / videoList.length),
        avgEng: totalV > 0 ? parseFloat(((totalE / totalV) * 100).toFixed(2)) : 0,
        totalViews: totalV
      };
    };

    // Segregate into long form and shorts (using all 50 fetched videos)
    const longFormVideos = allVideos.filter((v: any) => v.durationSeconds > 60);
    const shortVideos = allVideos.filter((v: any) => v.durationSeconds <= 60);

    // Keep the most recent 15 for the UI display grid
    recentVideos = allVideos.slice(0, 15);

    // 1. Long Form Raw Calculation (over up to 50 videos)
    const longFormStats = calculateRawAverage(longFormVideos);
    
    // 2. Shorts Raw Calculation (over up to 50 videos)
    const shortStats = calculateRawAverage(shortVideos);

    // 3. Overall Blended (weighted by volume)
    // We base the valuation ONLY on Long Form if they are a long-form channel, or blended if mixed.
    // If they have long form, use long form for the primary engine to prevent shorts from tanking their CPM!
    if (longFormVideos.length >= shortVideos.length || longFormVideos.length > 5) {
       avgViewsLast10 = longFormStats.avgViews;
       engagementRate = longFormStats.avgEng;
    } else {
       avgViewsLast10 = shortStats.avgViews;
       engagementRate = shortStats.avgEng;
    }

    Object.assign(recentVideos, {
      longFormAvgViews: longFormStats.avgViews,
      longFormEngagement: longFormStats.avgEng,
      shortsAvgViews: shortStats.avgViews,
      shortsEngagement: shortStats.avgEng
    });

    // Velocity: compare avg of newest 20% vs oldest 20% of the fetched 50
    if (allVideos.length >= 10) {
      const sliceSize = Math.floor(allVideos.length * 0.2);
      const recentAvg = allVideos.slice(0, sliceSize).reduce((s: number, v: any) => s + v.viewCount, 0) / sliceSize;
      const olderAvg = allVideos.slice(-sliceSize).reduce((s: number, v: any) => s + v.viewCount, 0) / sliceSize;
      if (recentAvg > olderAvg * 1.2) velocityTrend = 'accelerating';
      else if (recentAvg < olderAvg * 0.8) velocityTrend = 'declining';
      else velocityTrend = 'stable';
    }
  }

  return {
    channelId,
    channelName,
    handle,
    description,
    thumbnailUrl,
    bannerUrl,
    inferredNiche,
    inferredLanguage,
    subscriberCount,
    viewCount: totalViewCount,
    videoCount,
    avgViewsLast10,
    engagementRate,
    longFormAvgViews: (recentVideos as any).longFormAvgViews,
    longFormEngagement: (recentVideos as any).longFormEngagement,
    shortsAvgViews: (recentVideos as any).shortsAvgViews,
    shortsEngagement: (recentVideos as any).shortsEngagement,
    velocityTrend,
    lastVideoDate: recentVideos[0]?.publishedAt || '',
    recentVideos,
    verifiedAt: new Date().toISOString(),
    isVerified: true,
  };
}

/**
 * Convert real YouTube metrics to the ValuationEngine ScrapedMetrics format.
 */
export function youTubeMetricsToScraped(metrics: YouTubeChannelMetrics, niche: string, currentRate?: number): import('./valuationEngine').ScrapedMetrics {
  return {
    platform: 'YouTube',
    creator_name: metrics.channelName,
    niche: niche || 'Technology',
    language: metrics.inferredLanguage,
    follower_count: metrics.subscriberCount,
    avg_views_last_10: metrics.avgViewsLast10, // Legacy fallback
    long_form_avg_views: metrics.longFormAvgViews,
    shorts_avg_views: metrics.shortsAvgViews,
    engagement_rate_percentage: metrics.engagementRate,
    viewership_velocity_trend: metrics.velocityTrend,
    current_rate: currentRate
  };
}
