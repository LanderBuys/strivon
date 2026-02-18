import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Text, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useFadeIn } from '@/hooks/useFadeIn';
import { Animated } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { SettingsSkeleton } from '@/components/settings/SettingsSkeleton';
import { getAllSessions, revokeSession, revokeAllOtherSessions, ActiveSession } from '@/lib/services/sessionService';

export default function ActiveSessionsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();
  const fadeAnim = useFadeIn(200);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const sessions = await getAllSessions();
      setSessions(sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      showToast('Failed to load active sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session?.isCurrent) {
      showToast('Cannot revoke current session', 'error');
      return;
    }

    Alert.alert(
      'Revoke Session',
      `Are you sure you want to revoke access from ${session?.device}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeSession(sessionId);
              await loadSessions(); // Reload sessions
              haptics.success();
              showToast('Session revoked', 'success');
            } catch (error) {
              console.error('Error revoking session:', error);
              showToast('Failed to revoke session', 'error');
            }
          },
        },
      ]
    );
  };

  const handleRevokeAll = () => {
    Alert.alert(
      'Revoke All Sessions',
      'Are you sure you want to revoke all other sessions? You will remain logged in on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke All',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeAllOtherSessions();
              await loadSessions(); // Reload sessions
              haptics.success();
              showToast('All other sessions revoked', 'success');
            } catch (error) {
              console.error('Error revoking sessions:', error);
              showToast('Failed to revoke sessions', 'error');
            }
          },
        },
      ]
    );
  };

  const renderSession = ({ item }: { item: ActiveSession }) => (
    <View style={[styles.sessionItem, { backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }]}>
      <View style={[styles.sessionIcon, { backgroundColor: item.isCurrent ? colors.primary + '15' : colors.secondary + '15' }]}>
        <Ionicons
          name={item.device.includes('iPhone') || item.device.includes('iPad') ? 'phone-portrait' : 'laptop'}
          size={20}
          color={item.isCurrent ? colors.primary : colors.secondary}
        />
      </View>
      <View style={styles.sessionContent}>
        <View style={styles.sessionHeader}>
          <Text style={[styles.sessionDevice, { color: colors.text }]}>{item.device}</Text>
          {item.isCurrent && (
            <View style={[styles.currentBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.currentBadgeText, { color: colors.primary }]}>Current</Text>
            </View>
          )}
        </View>
        <Text style={[styles.sessionLocation, { color: colors.secondary }]}>{item.location}</Text>
        <Text style={[styles.sessionTime, { color: colors.secondary }]}>Last active: {item.lastActive}</Text>
        <Text style={[styles.sessionIP, { color: colors.secondary }]}>IP: {item.ipAddress}</Text>
      </View>
      {!item.isCurrent && (
        <TouchableOpacity
          onPress={() => handleRevokeSession(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={24} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Active Sessions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <SettingsSkeleton />
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {sessions.length > 0 ? (
              <>
                <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
                  <FlatList
                    data={sessions}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSession}
                    scrollEnabled={false}
                  />
                </View>
                {sessions.filter(s => !s.isCurrent).length > 0 && (
                  <View style={styles.section}>
                    <TouchableOpacity
                      style={[styles.revokeAllButton, { borderColor: colors.error }]}
                      onPress={handleRevokeAll}
                    >
                      <Ionicons name="log-out-outline" size={18} color={colors.error} />
                      <Text style={[styles.revokeAllText, { color: colors.error }]}>Revoke All Other Sessions</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <EmptyState
                icon="phone-portrait-outline"
                title="No active sessions"
                message="Active sessions will appear here"
              />
            )}
          </Animated.View>
        )}
      </ScrollView>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
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
    paddingVertical: Spacing.md,
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
  sectionContent: {
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    overflow: 'hidden',
  },
  section: {
    padding: Spacing.md,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  sessionDevice: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  currentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  sessionLocation: {
    fontSize: Typography.sm,
    opacity: 0.7,
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: Typography.xs,
    opacity: 0.6,
    marginBottom: 2,
  },
  sessionIP: {
    fontSize: Typography.xs,
    opacity: 0.6,
    fontFamily: 'monospace',
  },
  revokeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  revokeAllText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
});


