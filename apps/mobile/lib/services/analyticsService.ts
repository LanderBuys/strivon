/** Get start date for period (inclusive); all = no cutoff */
function getPeriodStart(period: string): Date | null {
  const now = new Date();
  if (period === 'all') return null;
  const start = new Date(now);
  if (period === '7d') start.setDate(start.getDate() - 7);
  else if (period === '30d') start.setDate(start.getDate() - 30);
  else if (period === '90d') start.setDate(start.getDate() - 90);
  else return null;
  return start;
}

function parseDate(createdAt: string | undefined): Date | null {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  return isNaN(d.getTime()) ? null : d;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Event tracking: send to your analytics backend (e.g. Firebase Analytics, Mixpanel). */
let analyticsUserId: string | null = null;
const eventQueue: Array<{ name: string; props?: Record<string, unknown> }> = [];

export const analyticsService = {
  setUserId: (userId: string | null) => {
    analyticsUserId = userId;
  },
  trackEvent: (name: string, props?: Record<string, unknown>) => {
    eventQueue.push({ name, props });
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log('[Analytics]', name, props);
    }
    // TODO: send to backend/Firebase Analytics
  },
  trackScreen: (screenName: string) => {
    analyticsService.trackEvent('screen_view', { screen_name: screenName });
  },
  trackFunnel: (funnelName: string, step: string, props?: Record<string, unknown>) => {
    analyticsService.trackEvent('funnel_step', { funnel: funnelName, step, ...props });
  },
  trackRetention: (metric: string, value: number | string) => {
    analyticsService.trackEvent('retention', { metric, value });
  },
  getUserAnalytics: async (userId: string, posts: any[], period: string) => {
    const periodStart = getPeriodStart(period);
    const isInPeriod = (createdAt: string | undefined) => {
      if (!periodStart) return true;
      const d = parseDate(createdAt);
          return d != null && d >= periodStart;
    };

    const userPosts = posts.filter(
      (p) => (p.author?.id === userId || p.author?.id === '1') && isInPeriod(p.createdAt)
    );

    const totalPosts = userPosts.length;
    const totalLikes = userPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const totalComments = userPosts.reduce((sum, p) => sum + (p.comments || 0), 0);
    const totalReposts = userPosts.reduce((sum, p) => sum + (p.reposts || 0), 0);
    const totalSaves = userPosts.reduce((sum, p) => sum + (p.saves || 0), 0);
    const totalViews = userPosts.reduce((sum, p) => sum + (p.views || 0), 0);

    const totalEngagements = totalLikes + totalComments + totalReposts + totalSaves;
    const estimatedReach = totalViews > 0 ? totalViews : totalPosts * 50;
    const engagementRate =
      estimatedReach > 0 ? Math.min(100, (totalEngagements / estimatedReach) * 100) : 0;

    // Growth: compare first half vs second half of period (simple heuristic)
    const sorted = [...userPosts].sort(
      (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);
    const engagementFirst =
      firstHalf.reduce((s, p) => s + (p.likes || 0) + (p.comments || 0) + (p.reposts || 0) + (p.saves || 0), 0) || 1;
    const engagementSecond = secondHalf.reduce(
      (s, p) => s + (p.likes || 0) + (p.comments || 0) + (p.reposts || 0) + (p.saves || 0),
      0
    );
    const growth = {
      posts: totalPosts >= 2 ? Math.round(((secondHalf.length - firstHalf.length) / Math.max(1, firstHalf.length)) * 100) : 0,
      likes: Math.round(((engagementSecond - engagementFirst) / engagementFirst) * 100) || 0,
      comments: Math.round(((engagementSecond - engagementFirst) / engagementFirst) * 100) || 0,
      engagement: Math.round(((engagementSecond - engagementFirst) / engagementFirst) * 100) || 0,
    };

    // Top posts by engagement
    const topPosts = userPosts
      .map((p) => ({
        postId: p.id,
        title: p.title || (typeof p.content === 'string' ? p.content.substring(0, 50) : '') || 'Untitled Post',
        engagement: (p.likes || 0) + (p.comments || 0) + (p.reposts || 0) + (p.saves || 0),
        likes: p.likes || 0,
        comments: p.comments || 0,
        views: p.views || 0,
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);

    // Daily stats: last 7 days (or weekdays) from post dates
    const dayCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    userPosts.forEach((p) => {
      const d = parseDate(p.createdAt);
      if (d) {
        const day = d.getDay();
        const eng = (p.likes || 0) + (p.comments || 0) + (p.reposts || 0) + (p.saves || 0);
        dayCounts[day] = (dayCounts[day] || 0) + eng;
      }
    });
    const dailyStats = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      label: DAY_LABELS[day],
      value: dayCounts[day] || 0,
    }));

    // Best time to post: group by day + hour, sum engagement
    const slotKey = (d: Date) => `${d.getDay()}-${d.getHours()}`;
    const slotEngagement: Record<string, number> = {};
    userPosts.forEach((p) => {
      const d = parseDate(p.createdAt);
      if (d) {
        const key = slotKey(d);
        const eng = (p.likes || 0) + (p.comments || 0) + (p.reposts || 0) + (p.saves || 0);
        slotEngagement[key] = (slotEngagement[key] || 0) + eng;
      }
    });
    const bestTimeToPost = Object.entries(slotEngagement)
      .map(([key, engagement]) => {
        const [dayNum, hourNum] = key.split('-').map(Number);
        return {
          day: DAY_NAMES[dayNum],
          hour: String(hourNum),
          engagement,
        };
      })
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);

    // If no time slots from data, provide sensible defaults
    if (bestTimeToPost.length === 0) {
      bestTimeToPost.push(
        { day: 'Monday', hour: '10', engagement: 0 },
        { day: 'Wednesday', hour: '14', engagement: 0 },
        { day: 'Friday', hour: '18', engagement: 0 }
      );
    }

    const engagementBreakdown = {
      likes: totalLikes,
      comments: totalComments,
      reposts: totalReposts,
      saves: totalSaves,
    };

    return {
      totalPosts,
      totalLikes,
      totalComments,
      totalReposts,
      totalSaves,
      totalViews,
      totalEngagements,
      engagementRate,
      growth,
      topPosts,
      bestTimeToPost,
      dailyStats,
      engagementBreakdown,
      averageEngagement: totalPosts > 0 ? Math.round(totalEngagements / totalPosts) : 0,
      reach: totalViews > 0 ? totalViews : Math.max(0, totalPosts * 50),
    };
  },
};
