import { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';

// Subscription plans and features will be added here

export default function SubscriptionInfoScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Subscription Info</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
            <Ionicons name="star" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Subscription Plans</Text>
          <Text style={[styles.heroSubtitle, { color: colors.secondary }]}>
            Premium features coming soon
          </Text>
        </View>

        {/* Placeholder Section */}
        <View style={styles.section}>
          <View style={[styles.placeholderCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <Ionicons name="construct-outline" size={48} color={colors.secondary} />
            <Text style={[styles.placeholderTitle, { color: colors.text }]}>Plans Under Development</Text>
            <Text style={[styles.placeholderText, { color: colors.secondary }]}>
              We're working on exciting premium features. Check back soon!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.xl * 2,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.lg,
  },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  heroTitle: {
    fontSize: Typography.xxl + 4,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: Typography.base * 1.6,
    opacity: 0.8,
    paddingHorizontal: Spacing.md,
  },
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  sectionHeaderContainer: {
    marginBottom: Spacing.xl + 4,
    paddingBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.xxl + 2,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    letterSpacing: -1,
  },
  sectionSubtitle: {
    fontSize: Typography.base,
    opacity: 0.65,
    lineHeight: Typography.base * 1.5,
  },
  plansContainer: {
    paddingRight: Spacing.xl,
    paddingLeft: Spacing.md,
    gap: Spacing.xl,
  },
  planCard: {
    width: 340,
    padding: 0,
    borderRadius: BorderRadius.xl + 4,
    borderWidth: 1.5,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  planCardPopular: {
    borderWidth: 2.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs + 2,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: Typography.xs + 2,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  planTopSection: {
    paddingTop: Spacing.xl + 12,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
  },
  planHeaderContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  planIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  planTitleSection: {
    flex: 1,
    justifyContent: 'center',
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
    flexWrap: 'wrap',
  },
  planName: {
    fontSize: Typography.xxl + 4,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: Typography.xxl + 4,
  },
  planBadge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  planBadgeText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#FFFFFF',
  },
  planDescription: {
    fontSize: Typography.sm,
    opacity: 0.75,
    lineHeight: Typography.sm * 1.6,
    marginTop: Spacing.xs,
  },
  planPriceSection: {
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  planPriceAmount: {
    fontSize: Typography.xxl + 16,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: Typography.xxl + 16,
  },
  planPricePeriod: {
    fontSize: Typography.base + 2,
    opacity: 0.65,
    fontWeight: '600',
  },
  planFeatures: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md + 2,
    maxHeight: 400,
  },
  planFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  planFeatureCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
    flexShrink: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  planFeatureText: {
    fontSize: Typography.sm + 1,
    flex: 1,
    lineHeight: Typography.sm * 1.7,
    fontWeight: '500',
    letterSpacing: -0.15,
    paddingTop: 2,
  },
  planButton: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.md + 6,
    borderRadius: BorderRadius.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    minHeight: 52,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  planButtonText: {
    fontSize: Typography.base + 1,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  featureCategory: {
    marginBottom: Spacing.xl,
  },
  featureCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  featureCategoryTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  featureItem: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  featureItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureItemTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  featureItemDescription: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.6,
    opacity: 0.8,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  faqItem: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: Typography.base,
    fontWeight: '700',
    flex: 1,
    marginRight: Spacing.sm,
    letterSpacing: -0.2,
  },
  faqAnswer: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.7,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    opacity: 0.85,
  },
  ctaSection: {
    marginTop: Spacing.xl * 2,
    marginHorizontal: Spacing.md,
    padding: Spacing.xl + 8,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  ctaTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  ctaSubtitle: {
    fontSize: Typography.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: Typography.sm * 1.5,
  },
  ctaButton: {
    paddingHorizontal: Spacing.xl + 8,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.md,
    minWidth: 200,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  rulesSection: {
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: Spacing.md,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  rulesContent: {
    flex: 1,
  },
  rulesTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  rulesList: {
    gap: Spacing.xs,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  ruleText: {
    fontSize: Typography.sm,
    flex: 1,
    lineHeight: Typography.sm * 1.4,
  },
  placeholderCard: {
    padding: Spacing.xl * 2,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    minHeight: 300,
  },
  placeholderTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: Typography.base * 1.5,
    opacity: 0.8,
  },
});

