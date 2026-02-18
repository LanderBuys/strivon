import { View, TouchableOpacity, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useEffect, useRef } from 'react';

type TabType = 'people' | 'projects' | 'topics';

interface SearchTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: TabType[] = ['people', 'projects', 'topics'];
const tabLabels: Record<TabType, string> = {
  people: 'People',
  projects: 'Posts',
  topics: 'Spaces',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_WIDTH = SCREEN_WIDTH / 3;

export function SearchTabs({ activeTab, onTabChange }: SearchTabsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const indicatorPosition = useRef(new Animated.Value(tabs.indexOf(activeTab))).current;

  useEffect(() => {
    Animated.spring(indicatorPosition, {
      toValue: tabs.indexOf(activeTab),
      useNativeDriver: true,
      tension: 68,
      friction: 8,
    }).start();
  }, [activeTab, indicatorPosition]);

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.surface,
      borderBottomColor: colors.divider,
    }]}>
      <View style={styles.tabsWrapper}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => {
              haptics.light();
              onTabChange(tab);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === tab ? colors.text : colors.secondary,
                  fontWeight: activeTab === tab ? '600' : '500',
                },
              ]}
            >
              {tabLabels[tab]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: colors.primary,
            transform: [
              {
                translateX: indicatorPosition.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: [0, TAB_WIDTH, TAB_WIDTH * 2],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  tabsWrapper: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: Typography.sm + 1,
    letterSpacing: 0.1,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: TAB_WIDTH,
    height: 3,
    borderRadius: 1.5,
  },
});


