// app.config.js - Use this to load environment variables
// Expo will use this instead of app.json if it exists

module.exports = {
  expo: {
    name: "Strivon",
    slug: "strivon",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/logoStrivon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/logoStrivon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.strivon.mobile",
      buildNumber: process.env.EXPO_IOS_BUILD_NUMBER || "1"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/logoStrivon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.strivon.mobile",
      versionCode: parseInt(process.env.EXPO_ANDROID_VERSION_CODE || "1", 10)
    },
    web: {
      favicon: "./assets/logoStrivon.png"
    },
    scheme: "mobile",
    plugins: [
      "expo-router",
      [
        "expo-image-picker",
        {
          photosPermission: "The app accesses your photos to let you share them.",
          cameraPermission: "The app accesses your camera to let you take photos."
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/logoStrivon.png",
          color: "#1D9BF0",
          sounds: []
        }
      ],
      "expo-video",
      "expo-font"
    ],
    notification: {
      icon: "./assets/logoStrivon.png",
      color: "#1D9BF0"
    },
    extra: {
      newsApiKey: process.env.EXPO_PUBLIC_NEWS_API_KEY,
      apiUrl: process.env.EXPO_PUBLIC_API_URL || '',
      requireAuth: process.env.EXPO_PUBLIC_REQUIRE_AUTH === 'true',
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    },
  },
};
