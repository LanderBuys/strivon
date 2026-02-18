import { View, TouchableOpacity, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useEffect, useRef } from 'react';
import { Colors, Spacing, Typography, hexToRgba } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;
const TAB_WIDTH = screenWidth / 2; // 2 tabs: posts, saved

type ProfileTabType = 'posts' | 'saved';

interface ProfileTabsProps {
  activeTab: ProfileTabType;
  onTabChange: (tab: ProfileTabType) => void;
  accentColor?: string;
  textColor?: string;
  counts?: {
    posts?: number;
    saved?: number;
  };
}

const TABS: ProfileTabType[] = ['posts', 'saved'];
const TAB_LABELS: Record<ProfileTabType, string> = {
  posts: 'Posts',
  saved: 'Saved',
};
const TAB_ICONS: Record<ProfileTabType, keyof typeof Ionicons.glyphMap> = {
  posts: 'grid-outline',
  saved: 'bookmark-outline',
};

const TAB_ICONS_ACTIVE: Record<ProfileTabType, keyof typeof Ionicons.glyphMap> = {
  posts: 'grid',
  saved: 'bookmark',
};

export function ProfileTabs({ activeTab, onTabChange, accentColor, textColor, counts }: ProfileTabsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  
  const effectiveAccentColor = accentColor || colors.primary;
  const effectiveTextColor = textColor || colors.text;
  const inactiveColor = textColor ? hexToRgba(textColor, 0.45) : colors.secondary;
  const borderColor = textColor ? hexToRgba(textColor, 0.08) : colors.divider;
  const activeBgColor = textColor ? hexToRgba(effectiveAccentColor, 0.08) : hexToRgba(colors.primary, 0.08);

  const activeIndex = TABS.indexOf(activeTab);
  const indicatorPosition = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(indicatorPosition, {
      toValue: activeIndex,
      useNativeDriver: true,
      tension: 68,
      friction: 8,
    }).start();
  }, [activeTab, activeIndex, indicatorPosition]);

  const handleTabPress = (tab: ProfileTabType) => {
    haptics.selection();
    onTabChange(tab);
  };

  return (
    <View style={[styles.container, { borderBottomColor: borderColor }]}>
      <View style={styles.tabsWrapper}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                isActive && { backgroundColor: activeBgColor },
              ]}
              onPress={() => handleTabPress(tab)}
              activeOpacity={0.6}
            >
              <View style={styles.tabContent}>
                <Ionicons
                  name={isActive ? TAB_ICONS_ACTIVE[tab] : TAB_ICONS[tab]}
                  size={16}
                  color={isActive ? effectiveAccentColor : inactiveColor}
                  style={styles.tabIcon}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isActive ? effectiveAccentColor : inactiveColor,
                    },
                    isActive && styles.activeTabText,
                  ]}
                >
                  {TAB_LABELS[tab]}
                  {counts != null && (counts[tab] ?? 0) >= 0 && (
                    <Text style={[styles.tabCount, { color: isActive ? effectiveAccentColor : inactiveColor }]}>
                      {' '}({counts[tab] ?? 0})
                    </Text>
                  )}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
    paddingVertical: Spacing.xs,
  },
  tabsWrapper: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md + 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: 10,
    marginHorizontal: Spacing.xs / 2,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  tabIcon: {
    // Icon spacing handled by gap
  },
  tabText: {
    fontSize: Typography.sm + 2,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
  activeTabText: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tabCount: {
    fontWeight: '500',
    opacity: 0.9,
  },
});
