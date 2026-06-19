/**
 * YouTube Data API v3 — Real Channel Metrics Fetcher
 * 
 * Setup: Add VITE_YOUTUBE_API_KEY=<your_key> to .env
 * Google Cloud: Enable "YouTube Data API v3" in your project
 * 
 * Quota cost: ~3 units per creator verification (well within 10,000/day free tier)
 */

export interface YouTubeChannelMetrics {
  channelId: string;
  channelName: string;
  handle: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  avgViewsLast10: number;
  engagementRate: number; // (likes + comments) / views * 100
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

  // --- Step 1: Fetch channel statistics & snippet ---
  const channelRes = await fetch(
    `${YT_BASE}/channels?part=statistics,snippet,brandingSettings&id=${channelId}&key=${YT_API_KEY}`
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
  const handle = snippet.customUrl || `@${channelName.toLowerCase().replace(/\s+/g, '')}`;

  // --- Step 2: Fetch last 10 video IDs via search ---
  const searchRes = await fetch(
    `${YT_BASE}/search?part=id&channelId=${channelId}&order=date&type=video&maxResults=10&key=${YT_API_KEY}`
  );
  const searchData = await searchRes.json();
  const videoIds: string[] = (searchData.items || []).map((item: any) => item.id.videoId).filter(Boolean);

  // --- Step 3: Fetch video statistics for last 10 videos ---
  let recentVideos: YouTubeChannelMetrics['recentVideos'] = [];
  let avgViewsLast10 = 0;
  let engagementRate = 0;
  let velocityTrend: 'accelerating' | 'stable' | 'declining' = 'stable';

  if (videoIds.length > 0) {
    const videoRes = await fetch(
      `${YT_BASE}/videos?part=statistics,snippet&id=${videoIds.join(',')}&key=${YT_API_KEY}`
    );
    const videoData = await videoRes.json();

    const videos = (videoData.items || []).map((v: any) => ({
      title: v.snippet?.title || '',
      thumbnailUrl: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.medium?.url || '',
      viewCount: parseInt(v.statistics?.viewCount || '0'),
      likeCount: parseInt(v.statistics?.likeCount || '0'),
      commentCount: parseInt(v.statistics?.commentCount || '0'),
      publishedAt: v.snippet?.publishedAt || '',
      videoId: v.id,
    }));

    recentVideos = videos;

    const totalViews = videos.reduce((s: number, v: any) => s + v.viewCount, 0);
    avgViewsLast10 = videos.length > 0 ? Math.round(totalViews / videos.length) : 0;

    const totalEngagement = videos.reduce((s: number, v: any) => s + v.likeCount + v.commentCount, 0);
    engagementRate = totalViews > 0 ? parseFloat(((totalEngagement / totalViews) * 100).toFixed(2)) : 0;

    // Velocity: compare avg of first 5 vs last 5 (most recent first)
    if (videos.length >= 6) {
      const recent5Avg = videos.slice(0, 5).reduce((s: number, v: any) => s + v.viewCount, 0) / 5;
      const older5Avg = videos.slice(5, 10).reduce((s: number, v: any) => s + v.viewCount, 0) / 5;
      if (recent5Avg > older5Avg * 1.2) velocityTrend = 'accelerating';
      else if (recent5Avg < older5Avg * 0.8) velocityTrend = 'declining';
      else velocityTrend = 'stable';
    }
  }

  return {
    channelId,
    channelName,
    handle,
    description,
    thumbnailUrl,
    subscriberCount,
    viewCount: totalViewCount,
    videoCount,
    avgViewsLast10,
    engagementRate,
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
export function youTubeMetricsToScraped(metrics: YouTubeChannelMetrics, niche: string): import('./valuationEngine').ScrapedMetrics {
  return {
    platform: 'YouTube',
    creator_name: metrics.channelName,
    niche: niche || 'Technology',
    language: 'Hindi/English', // Cannot be determined from API — creator inputs this
    follower_count: metrics.subscriberCount,
    avg_views_last_10: metrics.avgViewsLast10,
    engagement_rate_percentage: metrics.engagementRate,
    viewership_velocity_trend: metrics.velocityTrend,
  };
}
