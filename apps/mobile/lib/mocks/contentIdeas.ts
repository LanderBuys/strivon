/** Trending topic for content ideas dashboard. */
export interface MockTrendingTopic {
  id: string;
  topic: string;
  engagement: number;
  trend: 'up' | 'down' | 'stable';
}

/** Best time to post (day + hour + engagement score). */
export interface MockBestTimeToPost {
  day: string;
  hour: number;
  engagement: number;
}

export const mockTrendingTopics: MockTrendingTopic[] = [
  { id: '1', topic: '#TradingTips', engagement: 12500, trend: 'up' },
  { id: '2', topic: '#Dropshipping', engagement: 9800, trend: 'up' },
  { id: '3', topic: '#Entrepreneurship', engagement: 15200, trend: 'stable' },
  { id: '4', topic: '#BusinessGrowth', engagement: 8700, trend: 'down' },
  { id: '5', topic: '#StartupLife', engagement: 11200, trend: 'up' },
  { id: '6', topic: '#BuildInPublic', engagement: 18900, trend: 'up' },
  { id: '7', topic: '#ReactNative', engagement: 14200, trend: 'up' },
  { id: '8', topic: '#ProductManagement', engagement: 7600, trend: 'stable' },
  { id: '9', topic: '#UXDesign', engagement: 9300, trend: 'up' },
  { id: '10', topic: '#NoCode', engagement: 6800, trend: 'down' },
];

export const mockBestTimesToPost: MockBestTimeToPost[] = [
  { day: 'Monday', hour: 9, engagement: 450 },
  { day: 'Tuesday', hour: 14, engagement: 520 },
  { day: 'Wednesday', hour: 10, engagement: 480 },
  { day: 'Thursday', hour: 15, engagement: 510 },
  { day: 'Friday', hour: 11, engagement: 490 },
  { day: 'Saturday', hour: 12, engagement: 380 },
  { day: 'Sunday', hour: 10, engagement: 360 },
  { day: 'Monday', hour: 18, engagement: 440 },
  { day: 'Wednesday', hour: 8, engagement: 410 },
  { day: 'Thursday', hour: 12, engagement: 470 },
];
