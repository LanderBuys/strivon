import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export type FeedTabType = 'for-you' | 'following';

interface FeedTabsProps {
  activeTab: FeedTabType;
  onTabChange: (tab: FeedTabType) => void;
  filterButton?: React.ReactNode;
}

export function FeedTabs({ activeTab, onTabChange, filterButton }: FeedTabsProps) {
  const colors = Colors[useColorScheme() ?? 'light'];
  const haptics = useHapticFeedback();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }]}
      accessibilityRole="tablist"
    >
      <View style={styles.tabsContainer}>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab]}
            onPress={() => { haptics.light(); onTabChange('for-you'); }}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'for-you' }}
            accessibilityLabel="For You"
            accessibilityHint="Shows recommended posts"
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'for-you' ? colors.text : colors.secondary },
                activeTab === 'for-you' && styles.activeTabText,
              ]}
            >
              For You
            </Text>
            <View style={[styles.strip, { backgroundColor: colors.primary, opacity: activeTab === 'for-you' ? 1 : 0 }]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab]}
            onPress={() => { haptics.light(); onTabChange('following'); }}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'following' }}
            accessibilityLabel="Following"
            accessibilityHint="Shows posts from people you follow"
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'following' ? colors.text : colors.secondary },
                activeTab === 'following' && styles.activeTabText,
              ]}
            >
              Following
            </Text>
            <View style={[styles.strip, { backgroundColor: colors.primary, opacity: activeTab === 'following' ? 1 : 0 }]} />
          </TouchableOpacity>
        </View>
        {filterButton && <View style={styles.filterButtonWrapper}>{filterButton}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.sm,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  filterButtonWrapper: { marginLeft: Spacing.sm, paddingLeft: Spacing.sm },
  tabRow: { flex: 1, flexDirection: 'row' },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 48,
  },
  tabText: { fontSize: 15, fontWeight: '500', letterSpacing: 0.1 },
  activeTabText: { fontWeight: '700', letterSpacing: -0.1 },
  strip: {
    position: 'absolute',
    bottom: 0,
    left: Spacing.md,
    right: Spacing.md,
    height: 4,
    borderRadius: 2,
  },
});
