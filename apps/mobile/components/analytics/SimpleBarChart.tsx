import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: BarData[];
  maxValue?: number;
  height?: number;
  showValues?: boolean;
}

export function SimpleBarChart({ data, maxValue, height = 120, showValues = true }: SimpleBarChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  
  return (
    <View style={styles.container}>
      <View style={[styles.chartContainer, { height }]}>
        {data.map((item, index) => {
          const barHeight = (item.value / max) * (height - 40);
          const barColor = item.color || colors.primary;
          
          return (
            <View key={index} style={styles.barWrapper}>
              {showValues && (
                <Text style={[styles.valueLabel, { color: colors.text }]} numberOfLines={1}>
                  {item.value > 0 ? item.value.toLocaleString() : ''}
                </Text>
              )}
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barHeight, 4),
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.label, { color: colors.secondary }]} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  valueLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
    marginBottom: 4,
    minHeight: 14,
  },
  barContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 4,
  },
  bar: {
    width: '80%',
    borderRadius: 4,
    minHeight: 4,
  },
  label: {
    fontSize: Typography.xs,
    marginTop: 4,
    textAlign: 'center',
  },
});

