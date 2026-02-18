export interface UserAnalytics {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalReposts: number;
  totalSaves: number;
  totalViews: number;
  totalEngagements: number;
  engagementRate: number;
  growth: { 
    posts: number;
    likes: number;
    comments: number;
    engagement: number;
  };
  topPosts: Array<{ 
    postId: string; 
    title?: string; 
    engagement: number;
    likes: number;
    comments: number;
    views: number;
  }>;
  bestTimeToPost: Array<{ day: string; hour: string; engagement: number }>;
  dailyStats: Array<{ label: string; value: number }>;
  engagementBreakdown: {
    likes: number;
    comments: number;
    reposts: number;
    saves: number;
  };
  averageEngagement: number;
  reach: number;
}


