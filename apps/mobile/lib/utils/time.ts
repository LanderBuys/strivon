/**
 * Formats a timestamp as a relative time string
 * @param timestamp - ISO timestamp string or Date object
 * @returns Formatted relative time string (e.g., "5m", "2h", "3d", "Yesterday", "Jan 15")
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Handle future dates
  if (diffInSeconds < 0) {
    return 'Just now';
  }
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  // Less than an hour (show minutes)
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m`;
  }
  
  // Less than 24 hours (show hours)
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h`;
  }
  
  // Less than 48 hours (show "Yesterday")
  if (diffInSeconds < 172800) {
    return 'Yesterday';
  }
  
  // Less than a week (show days)
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d`;
  }
  
  // Less than a year (show month and day)
  if (diffInSeconds < 31536000) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  // Older than a year (show month, day, and year)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Formats a timestamp as a human-readable distance from now
 * @param date - Date object or ISO timestamp string
 * @returns Formatted distance string (e.g., "2 hours ago", "3 days ago", "about 1 month ago")
 */
export function formatDistanceToNow(date: Date | string): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
  
  // Handle future dates
  if (diffInSeconds < 0) {
    return 'just now';
  }
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  // Less than an hour (show minutes)
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  
  // Less than 24 hours (show hours)
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  
  // Less than 48 hours (show "Yesterday")
  if (diffInSeconds < 172800) {
    return 'yesterday';
  }
  
  // Less than a week (show days)
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  
  // Less than a month (show weeks)
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  
  // Less than a year (show months)
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return months === 1 ? 'about 1 month ago' : `about ${months} months ago`;
  }
  
  // Older than a year (show years)
  const years = Math.floor(diffInSeconds / 31536000);
  return years === 1 ? 'about 1 year ago' : `about ${years} years ago`;
}

/**
 * Formats a date for chat date separators (Today, Yesterday, or short date).
 */
export function formatChatDateHeader(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}
