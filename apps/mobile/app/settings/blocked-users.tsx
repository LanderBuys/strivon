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
import { getBlockedUsers, unblockUser, BlockedUser } from '@/lib/services/blockUserService';

export default function BlockedUsersScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();
  const fadeAnim = useFadeIn(200);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      const users = await getBlockedUsers();
      setBlockedUsers(users);
    } catch (error) {
      console.error('Error loading blocked users:', error);
      showToast('Failed to load blocked users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = (userId: string) => {
    Alert.alert(
      'Unblock User',
      'Are you sure you want to unblock this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'default',
          onPress: async () => {
            try {
              await unblockUser(userId);
              await loadBlockedUsers(); // Reload list
              haptics.success();
              showToast('User unblocked', 'success');
            } catch (error) {
              console.error('Error unblocking user:', error);
              showToast('Failed to unblock user', 'error');
            }
          },
        },
      ]
    );
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <View style={[styles.userItem, { backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }]}>
      <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
        {item.avatar ? (
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        ) : (
          <Ionicons name="person" size={20} color={colors.primary} />
        )}
      </View>
      <View style={styles.userContent}>
        <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.userUsername, { color: colors.secondary }]}>@{item.username}</Text>
      </View>
      <TouchableOpacity
        onPress={() => handleUnblock(item.id)}
        style={[styles.unblockButton, { borderColor: colors.cardBorder }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={[styles.unblockText, { color: colors.primary }]}>Unblock</Text>
      </TouchableOpacity>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Blocked Users</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <SettingsSkeleton />
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {blockedUsers.length > 0 ? (
              <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
                <FlatList
                  data={blockedUsers}
                  keyExtractor={(item) => item.id}
                  renderItem={renderBlockedUser}
                  scrollEnabled={false}
                />
              </View>
            ) : (
              <EmptyState
                icon="ban-outline"
                title="No blocked users"
                message="Users you block will appear here. You can unblock them at any time."
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
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: Typography.lg,
    fontWeight: '600',
  },
  userContent: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: Typography.sm,
    opacity: 0.7,
  },
  unblockButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  unblockText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
});


