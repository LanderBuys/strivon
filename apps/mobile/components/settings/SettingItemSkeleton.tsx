import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function SettingItemSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { borderBottomColor: colors.divider }]}>
      <SkeletonLoader width={36} height={36} variant="circle" />
      <View style={styles.content}>
        <SkeletonLoader width="60%" height={16} borderRadius={4} />
        <View style={styles.subtitle}>
          <SkeletonLoader width="40%" height={12} borderRadius={4} />
        </View>
      </View>
      <SkeletonLoader width={24} height={24} variant="circle" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  content: {
    flex: 1,
    gap: Spacing.xs,
  },
  subtitle: {
    marginTop: 2,
  },
});


