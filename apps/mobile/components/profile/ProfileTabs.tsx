import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, hexToRgba } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

type ProfileTabType = 'posts' | 'saved';

export type ProfileViewMode = 'list' | 'grid';

interface ProfileTabsProps {
  activeTab: ProfileTabType;
  onTabChange: (tab: ProfileTabType) => void;
  accentColor?: string;
  textColor?: string;
  showSavedTab?: boolean;
  viewMode?: ProfileViewMode;
  onViewModeChange?: (mode: ProfileViewMode) => void;
  counts?: { posts?: number; saved?: number };
}

const TAB_LABELS: Record<ProfileTabType, string> = { posts: 'Posts', saved: 'Saved' };

export function ProfileTabs({ activeTab, onTabChange, accentColor, textColor, showSavedTab = true, viewMode = 'grid', onViewModeChange, counts }: ProfileTabsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const tabs = showSavedTab ? (['posts', 'saved'] as const) : (['posts'] as const);
  const showViewToggle = onViewModeChange != null;

  const accent = accentColor || colors.primary;
  const fg = textColor || colors.text;
  const muted = textColor ? hexToRgba(textColor, 0.55) : colors.textMuted;

  const handleTabPress = (tab: ProfileTabType) => {
    haptics.selection();
    if (tab === 'posts' && showViewToggle && activeTab === 'posts') {
      onViewModeChange!(viewMode === 'grid' ? 'list' : 'grid');
      return;
    }
    onTabChange(tab);
  };

  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        const count = counts?.[tab];
        return (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => handleTabPress(tab)}
            activeOpacity={0.6}
            accessibilityLabel={tab === 'posts' && showViewToggle ? `${TAB_LABELS[tab]}, tap to switch list or grid` : TAB_LABELS[tab]}
            accessibilityRole="tab"
          >
            <Text style={[styles.label, { color: isActive ? fg : muted }, isActive && styles.labelActive]}>
              {TAB_LABELS[tab]}
              {count != null && (
                <Text style={[styles.count, { color: isActive ? fg : muted }]}>  {count}</Text>
              )}
            </Text>
            {isActive && <View style={[styles.underline, { backgroundColor: accent }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 4,
  },
  label: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  labelActive: {
    fontWeight: '700',
  },
  count: {
    fontSize: Typography.sm,
    fontWeight: '500',
    opacity: 0.9,
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: Spacing.lg,
    right: Spacing.lg,
    height: 2,
    borderRadius: 1,
  },
});
