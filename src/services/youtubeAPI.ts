export interface YouTubeAPIError extends Error {
  code?: string;
}

export const fetchYouTubeChannelMetrics = async (url: string): Promise<any> => {
  return {
    channelName: 'Mock Channel',
    inferredNiche: 'Technology',
    subscriberCount: 100000,
    avgViewsLast10: 50000,
    engagementRate: 5,
    recentVideos: [],
    velocityTrend: 0,
  };
};

export const youTubeMetricsToScraped = (metrics: any, niche: string, currentRate?: number): any => {
  return {
    niche,
    metrics: {
      subscriberCount: metrics.subscriberCount,
      avgViews: metrics.avgViewsLast10,
      engagementRate: metrics.engagementRate,
    },
    currentRate,
  };
};
