# Strivon

A modern social platform for entrepreneurs, builders, and creators to share their journey, connect with like-minded individuals, and collaborate on projects.

## 🚀 Features

### Core Features
- **Feed**: Personalized feed with "For You", "Following", and "Spaces" tabs
- **Posts**: Multiple post types including Build Logs, Questions, Wins/Losses, Collaborations, and Content
- **Stories**: Share ephemeral content with your network
- **Spaces**: Join communities and channels around specific topics
- **Threads**: Engage in conversations with threaded replies
- **Inbox**: Manage messages and notifications
- **Search**: Find people, projects, and topics with AI-powered suggestions
- **Profile**: Showcase your journey with streaks and metrics

### Version 2.0.0 New Features ✨
- **Real-Time Notifications**: Push notifications with granular settings
- **Offline Support**: Smart caching for offline access to your feed
- **Analytics Dashboard**: Comprehensive analytics for posts, engagement, and growth
- **Enhanced Search**: AI-powered search suggestions and recommendations
- **Performance**: Cache-first loading for instant feed access

## 📱 Tech Stack

### Mobile App (React Native/Expo)
- **Framework**: Expo Router with React Native
- **Language**: TypeScript
- **State Management**: React Hooks
- **Styling**: React Native StyleSheet with theme system
- **Navigation**: Expo Router (file-based routing)
- **Animations**: React Native Reanimated

### Web App (Next.js)
- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4

## 🏗️ Project Structure

```
strivon/
├── apps/
│   ├── mobile/          # React Native mobile app
│   │   ├── app/         # Expo Router pages
│   │   ├── components/  # Reusable components
│   │   ├── lib/         # Utilities and API clients
│   │   ├── hooks/       # Custom React hooks
│   │   ├── types/       # TypeScript type definitions
│   │   └── constants/   # Theme and constants
│   └── web/             # Next.js web app
└── packages/            # Shared packages (future)
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ and npm
- For mobile development:
  - Expo CLI (`npm install -g expo-cli`)
  - iOS Simulator (Mac) or Android Studio (for Android)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd strivon
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:

**Mobile App:**
```bash
npm run dev:mobile
# or
cd apps/mobile && npm start
```

**Web App:**
```bash
npm run dev:web
# or
cd apps/web && npm run dev
```

## 📱 Mobile App Development

The mobile app uses Expo Router for file-based routing. Key directories:

- `app/` - Routes and screens
- `components/` - Reusable UI components
- `lib/api/` - API client and data fetching
- `lib/services/` - Service layer (notifications, caching, achievements, analytics)
- `lib/utils/` - Utility functions
- `types/` - TypeScript type definitions
- `constants/` - Theme, spacing, and constants

### Running on Devices

- **iOS Simulator**: Press `i` in the Expo CLI
- **Android Emulator**: Press `a` in the Expo CLI
- **Physical Device**: Scan QR code with Expo Go app

## 🌐 Web App Development

The web app is built with Next.js and Tailwind CSS. It's currently in early development.

## 🎨 Design System

The app uses a consistent design system with:

- **Colors**: Light and dark mode support
- **Spacing**: Consistent spacing scale (xs, sm, md, lg, xl, xxl)
- **Typography**: Responsive font sizes
- **Components**: Reusable UI components in `components/ui/`

## 🔧 Key Improvements

### Version 2.0.0 Improvements
- **Real-Time Notifications**: Full push notification support with Expo Notifications
- **Offline Caching**: Smart caching system using AsyncStorage for offline access
- **Analytics**: Comprehensive analytics service with user and post insights
- **AI Search**: Context-aware search suggestions
- **Performance**: Cache-first loading strategy for instant feed access

### Error Handling
- Error boundaries for graceful error handling
- User-friendly error messages
- Retry mechanisms in API client

### Performance
- Component memoization for optimized re-renders
- FlatList optimizations (virtualization, batching)
- Optimistic updates for better UX
- Cache-first data loading
- Smart image caching

### User Experience
- Loading skeletons for better perceived performance
- Empty states with helpful messages
- Pull-to-refresh functionality
- Smooth animations and transitions
- Accessibility improvements (screen reader support, better contrast)

### Code Quality
- TypeScript for type safety
- Utility functions for common operations
- Consistent code organization
- Comprehensive error handling
- Service layer architecture for better separation of concerns

## 📝 API Integration

Currently, the app uses mock data. The API client is set up for future backend integration:

- Base URL configuration via environment variables
- Retry logic for network errors
- Timeout handling
- Error types and handling

To integrate with a backend, update the API functions in `lib/api/` and set `EXPO_PUBLIC_API_URL` environment variable.

## 🆕 Version 2.0.0 Highlights

See [CHANGELOG.md](apps/mobile/CHANGELOG.md) for detailed release notes.

### Major Additions
- **NotificationService**: Real-time push notifications with settings management
- **CacheService**: Offline support with intelligent caching
- **AchievementService**: Gamification system with progress tracking
- **AnalyticsService**: Comprehensive analytics and insights

### New Screens
- `/achievements` - View and track achievements
- `/analytics` - Analytics dashboard with insights

### New Components
- `AchievementCard` - Display achievements with progress
- `AnalyticsCard` - Analytics metrics visualization
- `AISuggestions` - AI-powered search suggestions

## 🧪 Testing

```bash
# Type-check mobile app
cd apps/mobile && npm run typecheck

# Lint and build web app
cd apps/web && npm run lint && npm run build
```

## 📦 Building & launch

**Before releasing to real users**, follow **[LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md)** for environment variables, Firebase, assets, and store submission.

### Mobile App
```bash
cd apps/mobile
# Build for production (requires EAS CLI and eas.json)
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Web App
```bash
cd apps/web
npm run build
npm start
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Ensure code passes linting
4. Submit a pull request

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

Built with [Expo](https://expo.dev) and [Next.js](https://nextjs.org)
