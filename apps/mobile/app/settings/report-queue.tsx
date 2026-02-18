import { useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Text,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import {
  getPendingReports,
  dismissReport,
  removeReportedContent,
  type ReportItem,
} from '@/lib/services/reportQueueService';

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export default function ReportQueueScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const list = await getPendingReports();
    setReports(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  }, [load]);

  const handleDismiss = useCallback(
    async (report: ReportItem) => {
      haptics.light();
      setActingId(report.id);
      try {
        await dismissReport(report.id);
        await load();
      } finally {
        setActingId(null);
      }
    },
    [load, haptics]
  );

  const handleRemove = useCallback(
    async (report: ReportItem) => {
      haptics.medium();
      const contentType = report.type === 'post' ? 'post' : 'user';
      Alert.alert(
        'Remove content',
        report.type === 'post'
          ? 'This post will be hidden from the feed and spaces. You can\'t undo this.'
          : 'This marks the report as resolved. The reported user will not be banned in-app (add backend for that).',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              setActingId(report.id);
              try {
                await removeReportedContent(report.id);
                await load();
              } finally {
                setActingId(null);
              }
            },
          },
        ]
      );
    },
    [load, haptics]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Report queue</Text>
          <Text style={[styles.headerSubtitle, { color: colors.secondary }]}>
            Review reported content — remove or keep
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : reports.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <Ionicons name="shield-checkmark-outline" size={48} color={colors.secondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No reports to review</Text>
            <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>
              When someone reports content (gore, scams, etc.), it will appear here. You can remove the content or dismiss the report.
            </Text>
          </View>
        ) : (
          reports.map((report) => {
            const isActing = actingId === report.id;
            const targetLabel =
              report.type === 'post'
                ? `Post by ${report.targetUserName || report.targetUserHandle || report.targetUserId}`
                : `User ${report.targetUserName || report.targetUserHandle || report.targetUserId}`;
            const preview =
              report.type === 'post' && report.targetPostPreview
                ? report.targetPostPreview.slice(0, 120) + (report.targetPostPreview.length > 120 ? '…' : '')
                : null;

            return (
              <View
                key={report.id}
                style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: report.type === 'post' ? colors.primary + '20' : colors.error + '20' }]}>
                    <Text style={[styles.badgeText, { color: report.type === 'post' ? colors.primary : colors.error }]}>
                      {report.type === 'post' ? 'Post' : 'User'}
                    </Text>
                  </View>
                  <Text style={[styles.date, { color: colors.secondary }]}>{formatDate(report.createdAt)}</Text>
                </View>
                <Text style={[styles.targetLabel, { color: colors.text }]}>{targetLabel}</Text>
                {preview && (
                  <Text style={[styles.preview, { color: colors.secondary }]} numberOfLines={3}>
                    {preview}
                  </Text>
                )}
                <Text style={[styles.reason, { color: colors.text }]}>
                  <Text style={styles.reasonLabel}>Reason: </Text>
                  {report.reason}
                </Text>
                <Text style={[styles.reporter, { color: colors.secondary }]}>
                  Reported by {report.reporterName || report.reporterHandle || report.reporterId}
                </Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonDismiss, { borderColor: colors.border }]}
                    onPress={() => handleDismiss(report)}
                    disabled={isActing}
                  >
                    {isActing ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <Text style={[styles.buttonTextDismiss, { color: colors.text }]}>Keep</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonRemove, { backgroundColor: colors.error }]}
                    onPress={() => handleRemove(report)}
                    disabled={isActing}
                  >
                    <Text style={styles.buttonTextRemove}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { padding: Spacing.xs, marginRight: Spacing.xs },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: Typography.xl, fontWeight: '700' },
  headerSubtitle: { fontSize: Typography.sm, marginTop: 2 },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  centered: { paddingVertical: Spacing.xxl, alignItems: 'center' },
  empty: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: Typography.lg, fontWeight: '600', marginTop: Spacing.md },
  emptySubtitle: { fontSize: Typography.sm, marginTop: Spacing.sm, textAlign: 'center', lineHeight: 22 },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm },
  badgeText: { fontSize: Typography.xs, fontWeight: '600' },
  date: { fontSize: Typography.xs },
  targetLabel: { fontSize: Typography.base, fontWeight: '600', marginBottom: Spacing.xs },
  preview: { fontSize: Typography.sm, marginBottom: Spacing.sm, fontStyle: 'italic' },
  reason: { fontSize: Typography.sm, marginBottom: Spacing.xs },
  reasonLabel: { fontWeight: '600' },
  reporter: { fontSize: Typography.xs, marginBottom: Spacing.md },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  button: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  buttonDismiss: { borderWidth: 1 },
  buttonTextDismiss: { fontSize: Typography.sm, fontWeight: '600' },
  buttonRemove: {},
  buttonTextRemove: { color: '#fff', fontSize: Typography.sm, fontWeight: '600' },
});
