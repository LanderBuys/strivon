# News API Setup

This app uses NewsAPI.org to fetch real business news articles.

## Getting a Free API Key

1. Visit [NewsAPI.org](https://newsapi.org/)
2. Sign up for a free account (Developer plan)
3. Get your API key from the dashboard

## Setting Up the API Key

### Step 1: Create .env file

Create a `.env` file in the `apps/mobile` directory (same folder as `package.json`):

```env
EXPO_PUBLIC_NEWS_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your actual NewsAPI key.

### Step 2: Restart Expo Dev Server

**IMPORTANT:** After creating or updating the `.env` file, you MUST restart your Expo dev server:

1. Stop the current server (Ctrl+C)
2. Clear the cache: `npm run reset` or `expo start --clear`
3. Start again: `npm start`

Environment variables are loaded when Expo starts, so changes won't take effect until you restart.

### Step 3: Verify It's Working

When you open the News tab, check the console/logs. You should see:
- ✅ `NewsAPI Key Status: Found` (if key is loaded)
- ✅ `Fetching news from: ...` (when loading articles)
- ✅ `NewsAPI Success: X articles found` (when successful)

If you see `NewsAPI Key Status: Not found`, the key isn't being loaded. Make sure:
- The `.env` file is in `apps/mobile/` directory
- The variable name is exactly `EXPO_PUBLIC_NEWS_API_KEY`
- You've restarted the Expo server after creating the file

## Free Plan Limitations

- **100 requests per day** - Be mindful of API usage
- **24-hour delay** - Articles are delayed by 24 hours
- **Last 30 days only** - Can only access articles from the last 30 days
- **Development only** - Free plan is for development/testing

## Fallback Behavior

If no API key is provided or if the API fails, the app will automatically fall back to mock data so you can still test the feature.

## Production Use

For production use, you'll need at least the Business tier ($449/month) from NewsAPI.org, or consider alternative news APIs.
