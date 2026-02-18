import { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Modal, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { mockUsers } from '@/lib/mocks/users';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getMaxGroupChatMembers } from '@/lib/services/subscriptionService';
import { Alert } from 'react-native';

interface GroupChatCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, memberIds: string[]) => void;
}

export function GroupChatCreateModal({ visible, onClose, onCreateGroup }: GroupChatCreateModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const currentUserId = useCurrentUserId();
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxMembers, setMaxMembers] = useState(0);

  useEffect(() => {
    if (visible) {
      loadGroupChatLimits();
    }
  }, [visible]);

  const loadGroupChatLimits = async () => {
    const max = await getMaxGroupChatMembers();
    setMaxMembers(max);
  };

  // Filter out current user and apply search
  const availableUsers = useMemo(() => {
    return mockUsers
      .filter(user => user.id !== currentUserId)
      .filter(user => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return user.name.toLowerCase().includes(query) || 
               user.handle.toLowerCase().includes(query);
      });
  }, [searchQuery, currentUserId]);

  const handleToggleMember = (userId: string) => {
    haptics.light();
    
    // Check member limit
    if (!selectedMembers.includes(userId) && maxMembers > 0 && selectedMembers.length >= maxMembers) {
      Alert.alert(
        'Member Limit Reached',
        `You can add up to ${maxMembers} members to a group chat with your current plan. ${maxMembers === 50 ? 'Upgrade to Pro+ for up to 500 members.' : 'Upgrade to Pro for group chats.'}`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    setSelectedMembers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      haptics.error?.();
      return;
    }
    if (selectedMembers.length === 0) {
      haptics.error?.();
      return;
    }

    // Check if group chats are allowed (maxMembers > 0)
    if (maxMembers === 0) {
      Alert.alert(
        'Group Chats Not Available',
        'Group chats are available for Pro and Pro+ subscribers. Upgrade to create group chats.',
        [
          { text: 'OK' },
        ]
      );
      return;
    }

    // Check member limit
    if (maxMembers > 0 && selectedMembers.length > maxMembers) {
      Alert.alert(
        'Member Limit Exceeded',
        `You can add up to ${maxMembers} members to a group chat. ${maxMembers === 50 ? 'Upgrade to Pro+ for up to 500 members.' : ''}`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    haptics.success();
    onCreateGroup(groupName.trim(), selectedMembers);
    handleClose();
  };

  const handleClose = () => {
    setGroupName('');
    setSelectedMembers([]);
    setSearchQuery('');
    onClose();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderUserItem = ({ item }: { item: typeof mockUsers[0] }) => {
    const isSelected = selectedMembers.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.userItem, { 
          backgroundColor: colors.background,
          borderBottomColor: colors.divider,
        }]}
        onPress={() => handleToggleMember(item.id)}
        activeOpacity={0.6}
      >
        <View style={styles.userInfo}>
          {item.avatar ? (
            <ExpoImage
              source={{ uri: item.avatar }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {getInitials(item.name)}
              </Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.userHandle, { color: colors.secondary }]} numberOfLines={1}>
              {item.handle}
            </Text>
          </View>
        </View>
        <View style={[
          styles.checkbox,
          { 
            borderColor: isSelected ? colors.primary : colors.divider,
            backgroundColor: isSelected ? colors.primary : 'transparent',
          }
        ]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              activeOpacity={0.6}
            >
              <IconSymbol name="close" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              New Group Chat
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView 
            style={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>
                Group Name
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colorScheme === 'dark' ? colors.surface : colors.spaceBackground,
                  borderColor: colors.divider,
                  color: colors.text,
                }]}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Enter group name"
                placeholderTextColor={colors.secondary}
                maxLength={50}
                autoFocus
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Add Members
                </Text>
                <Text style={[styles.countText, { color: colors.secondary }]}>
                  {selectedMembers.length}{maxMembers > 0 ? ` / ${maxMembers}` : ''} {selectedMembers.length === 1 ? 'member' : 'members'}
                </Text>
              </View>
              
              <View style={[styles.searchContainer, { 
                backgroundColor: colorScheme === 'dark' ? colors.surface : colors.spaceBackground,
                borderColor: colors.divider,
              }]}>
                <Ionicons name="search" size={16} color={colors.secondary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search users..."
                  placeholderTextColor={colors.secondary}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => setSearchQuery('')} 
                    style={styles.clearButton}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="close-circle" size={16} color={colors.secondary} />
                  </TouchableOpacity>
                )}
              </View>

              <FlatList
                data={availableUsers}
                keyExtractor={(item) => item.id}
                renderItem={renderUserItem}
                scrollEnabled={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.secondary }]}>
                      {searchQuery ? 'No users found' : 'No users available'}
                    </Text>
                  </View>
                }
              />
            </View>
          </ScrollView>

          <View style={[styles.footer, { 
            backgroundColor: colors.background,
            borderTopColor: colors.divider,
          }]}>
            <TouchableOpacity
              style={[
                styles.createButton,
                { 
                  backgroundColor: groupName.trim() && selectedMembers.length > 0 
                    ? colors.primary 
                    : colors.divider,
                }
              ]}
              onPress={handleCreate}
              disabled={!groupName.trim() || selectedMembers.length === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.createButtonText}>
                Create Group
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 34,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  countText: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  input: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    marginTop: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    minHeight: 36,
  },
  searchIcon: {
    marginRight: Spacing.sm,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sm + 1,
    padding: 0,
    margin: 0,
  },
  clearButton: {
    marginLeft: Spacing.xs,
    padding: Spacing.xs,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: Typography.sm + 2,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  userHandle: {
    fontSize: Typography.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sm,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  createButton: {
    borderRadius: 24,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: '700',
  },
});
