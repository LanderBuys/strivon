import { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useEntranceAnimation } from '@/hooks/useEntranceAnimation';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyticsService } from '@/lib/services/analyticsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_KEY = '@strivon_onboarding_completed';

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: string;
  image?: string;
}

function SlideItem({
  item,
  index,
  colors,
}: {
  item: OnboardingSlide;
  index: number;
  colors: (typeof Colors)['light'];
}) {
  const { opacity, scale } = useEntranceAnimation(280, index * 50);

  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <Animated.View
        style={[
          styles.slideContent,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name={item.icon as any} size={64} color={colors.primary} />
        </View>
        <Text style={[styles.slideTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.slideDescription, { color: colors.secondary }]}>
          {item.description}
        </Text>
      </Animated.View>
    </View>
  );
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to Strivon',
    description: 'A modern social platform for entrepreneurs, builders, and creators to share their journey and connect with like-minded individuals.',
    icon: 'rocket',
    image: undefined,
  },
  {
    id: '2',
    title: 'Share Your Journey',
    description: 'Post updates, build logs, questions, wins, and collaborate with others in your community.',
    icon: 'document-text-outline',
    image: undefined,
  },
  {
    id: '3',
    title: 'Join Spaces',
    description: 'Discover and join communities around topics you care about. Connect with experts and learn from others.',
    icon: 'people',
    image: undefined,
  },
  {
    id: '4',
    title: 'Stay Connected',
    description: 'Message friends, get notifications, and never miss important updates from your network.',
    icon: 'chatbubbles',
    image: undefined,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      haptics.light();
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    haptics.medium();
    await handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      analyticsService.trackFunnel('onboarding', 'completed', { screen_index: currentIndex });
      haptics.success();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/(tabs)');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      haptics.light();
    }
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <SlideItem item={item} index={index} colors={colors} />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        {currentIndex < slides.length - 1 && (
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipButton}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipText, { color: colors.secondary }]}>Skip</Text>
          </TouchableOpacity>
        )}
        {currentIndex === slides.length - 1 && <View style={{ width: 60 }} />}
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: index === currentIndex ? colors.primary : colors.cardBorder,
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          {currentIndex > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, { borderColor: colors.cardBorder }]}
              onPress={handlePrevious}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
              <Text style={[styles.buttonText, { color: colors.text }]}>Previous</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonPrimary,
              { backgroundColor: colors.primary },
              currentIndex === 0 && styles.buttonFullWidth,
            ]}
            onPress={handleNext}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, styles.buttonPrimaryText]}>
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            {currentIndex < slides.length - 1 && (
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  skipButton: {
    padding: Spacing.sm,
  },
  skipText: {
    fontSize: Typography.base,
    fontWeight: '500',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
  },
  slideDescription: {
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: Typography.base * 1.5,
    opacity: 0.8,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  buttonFullWidth: {
    flex: 1,
  },
  buttonPrimary: {
    minHeight: 52,
  },
  buttonSecondary: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
  },
});

// Check if onboarding is needed
export async function shouldShowOnboarding(): Promise<boolean> {
  try {
    const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
    return !completed;
  } catch (error) {
    return true;
  }
}



