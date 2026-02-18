import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function SettingsSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      {[1, 2, 3].map((section) => (
        <View key={section} style={styles.section}>
          <View style={styles.sectionHeader}>
            <SkeletonLoader width={80} height={12} borderRadius={4} />
          </View>
          <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={[styles.skeletonItem, { borderBottomColor: colors.divider }]}>
                <SkeletonLoader width={36} height={36} variant="circle" />
                <View style={styles.skeletonContent}>
                  <SkeletonLoader width="60%" height={16} borderRadius={4} />
                  <View style={styles.skeletonSubtitle}>
                    <SkeletonLoader width="40%" height={12} borderRadius={4} />
                  </View>
                </View>
                <SkeletonLoader width={24} height={24} variant="circle" />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionContent: {
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  skeletonContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  skeletonSubtitle: {
    marginTop: 4,
  },
});


