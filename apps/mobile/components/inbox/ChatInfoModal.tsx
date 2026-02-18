import { useMemo, useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, FlatList, Dimensions, Platform, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing, Typography, hexToRgba } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { blockUser, isUserBlocked } from '@/lib/services/blockUserService';
import { reportUser } from '@/lib/api/users';
import { useRouter } from 'expo-router';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { MediaViewer } from '@/components/media/MediaViewer';

interface ChatInfoModalProps {
  visible: boolean;
  user: any;
  isGroupChat?: boolean;
  groupName?: string;
  messages?: any[];
  members?: any[];
  nickname?: string;
  backgroundPhoto?: string;
  disappearingMessages?: boolean;
  onClose: () => void;
  onUpdateNickname?: (nickname: string) => void;
  onUpdateBackground?: (uri: string) => void;
  onUpdateDisappearingMessages?: (enabled: boolean) => void;
  onViewProfile?: (userId: string) => void;
}

type DetailsTab = 'info' | 'media' | 'members';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MEDIA_GAP = 1;
const MEDIA_COLS = 3;
const MEDIA_SIZE = Math.floor((SCREEN_WIDTH - (Spacing.lg * 2) - (MEDIA_GAP * (MEDIA_COLS - 1))) / MEDIA_COLS);

export function ChatInfoModal({
  visible,
  user,
  isGroupChat,
  groupName,
  messages = [],
  members = [],
  nickname,
  backgroundPhoto,
  disappearingMessages,
  onClose,
  onUpdateNickname,
  onUpdateBackground,
  onUpdateDisappearingMessages,
  onViewProfile,
}: ChatInfoModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const router = useRouter();
  const currentUserId = useCurrentUserId();
  const [tab, setTab] = useState<DetailsTab>(isGroupChat ? 'members' : 'info');
  const [draftNickname, setDraftNickname] = useState(nickname ?? '');
  const [userBlocked, setUserBlocked] = useState(false);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  useEffect(() => {
    setDraftNickname(nickname ?? '');
  }, [nickname]);

  useMemo(async () => {
    if (visible && !isGroupChat && user?.id) {
      const blocked = await isUserBlocked(String(user.id));
      setUserBlocked(blocked);
    }
  }, [visible, user, isGroupChat]);

  const handleReportUser = () => {
    if (!user?.id) return;
    const reasons = ['Spam', 'Harassment or bullying', 'Inappropriate content', 'Misinformation', 'Other'];
    Alert.alert(
      'Report',
      `Why are you reporting ${user.name || user.handle || 'this user'}?`,
      [
        ...reasons.map((reason) => ({
          text: reason,
          onPress: async () => {
            try {
              await reportUser(currentUserId, String(user.id), reason);
              haptics.success();
              Alert.alert('Report submitted', 'We\'ll review it and take action if needed.');
            } catch {
              Alert.alert('Error', 'Failed to submit report.');
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleBlockUser = () => {
    if (!user?.id) return;
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${user.name || user.handle || 'this user'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(String(user.id), user.name || 'Unknown User', user.handle || `@user${user.id}`, user.avatar);
              haptics.success();
              setUserBlocked(true);
              onClose();
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to block user. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handlePickBackground = async () => {
    haptics.light();
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos to set a chat background.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        haptics.success();
        onUpdateBackground?.(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking background:', error);
      Alert.alert('Error', 'Failed to pick background image.');
    }
  };

  const handleMediaPress = (item: { uri: string; type: 'image' | 'video' }, index: number) => {
    haptics.light();
    setSelectedMediaIndex(index);
    setShowMediaViewer(true);
  };

  const mediaItems = useMemo(() => {
    const out: Array<{ id: string; uri: string; type: 'image' | 'video'; thumbnail?: string }> = [];
    for (const m of messages || []) {
      const media = m?.media;
      if (!Array.isArray(media)) continue;
      for (let idx = 0; idx < media.length; idx++) {
        const item = media[idx];
        const t = (item?.type || '').toString().toLowerCase();
        const isImage = t === 'image';
        const isVideo = t === 'video';
        if (!isImage && !isVideo) continue;
        const uri = item?.url || item?.uri || item?.thumbnail;
        if (!uri) continue;
        out.push({ id: `${m.id || 'm'}-${idx}-${uri}`, uri, type: isVideo ? 'video' : 'image', thumbnail: item?.thumbnail });
      }
    }
    return out;
  }, [messages]);

  const title = isGroupChat ? (groupName || 'Group Chat') : (nickname || user?.name || 'Chat');

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.cardBorder, paddingTop: Spacing.lg + Spacing.md + Spacing.sm }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => { haptics.light(); onClose(); }} 
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[styles.backButtonIcon, { backgroundColor: colors.spaceBackground }]}>
                <Text style={[styles.backButtonText, { color: colors.text }]}>←</Text>
              </View>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Details</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces={true}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {isGroupChat ? (
                <View style={[styles.avatar, { backgroundColor: hexToRgba(colors.primary, 0.08) }]}>
                  <Ionicons name="people" size={48} color={colors.primary} style={{ opacity: 0.7 }} />
                </View>
              ) : user?.avatar ? (
                <ExpoImage source={{ uri: user.avatar }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, { backgroundColor: hexToRgba(colors.primary, 0.08) }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {(user?.name || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>
            <Text style={[styles.subtitle, { color: colors.secondary }]} numberOfLines={1}>
              {isGroupChat ? `${members.length} ${members.length === 1 ? 'member' : 'members'}` : (user?.label || 'Active now')}
            </Text>

            {!isGroupChat && user?.id && onViewProfile && (
              <TouchableOpacity
                style={[styles.viewProfileButton, { backgroundColor: colors.primary }]}
                onPress={() => { haptics.medium(); onViewProfile(String(user.id)); }}
                activeOpacity={0.9}
              >
                <Text style={styles.viewProfileButtonText}>View Profile</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {(['info', 'media', isGroupChat && 'members'] as const).filter(Boolean).map((t) => {
              if (!t) return null;
              const key = t as DetailsTab;
              const active = tab === key;
              const label = key === 'info' ? 'Info' : key === 'media' ? `Media${mediaItems.length ? ` · ${mediaItems.length}` : ''}` : `Members · ${members.length}`;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.tab, active && { backgroundColor: hexToRgba(colors.primary, 0.06) }]}
                  onPress={() => { haptics.selection(); setTab(key); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, { color: active ? colors.primary : colors.secondary, fontWeight: active ? '600' : '500' }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Content */}
          {tab === 'info' && (
            <View style={styles.infoContent}>
              {!isGroupChat && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Nickname</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.spaceBackground, borderColor: colors.divider }]}>
                    <TextInput
                      value={draftNickname}
                      onChangeText={setDraftNickname}
                      placeholder="Set a nickname"
                      placeholderTextColor={hexToRgba(colors.text, 0.4)}
                      style={[styles.textInput, { color: colors.text }]}
                    />
                  </View>
                  {draftNickname.trim() !== (nickname || '') && (
                    <TouchableOpacity
                      style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                      onPress={() => { 
                        haptics.light(); 
                        onUpdateNickname?.(draftNickname.trim());
                        haptics.success();
                      }}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.primaryButtonText}>Save Nickname</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Chat Settings</Text>
                
                <TouchableOpacity 
                  style={[styles.listItem, { borderBottomColor: colors.divider }]} 
                  activeOpacity={0.7}
                  onPress={handlePickBackground}
                >
                  <View style={styles.listItemLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: hexToRgba(colors.primary, 0.08) }]}>
                      <Ionicons name="image-outline" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.listItemText}>
                      <Text style={[styles.listItemLabel, { color: colors.text }]}>Background</Text>
                      <Text style={[styles.listItemValue, { color: colors.secondary }]} numberOfLines={1}>
                        {backgroundPhoto ? 'Custom' : 'Default'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={hexToRgba(colors.text, 0.2)} />
                </TouchableOpacity>

                <View style={[styles.listItem, { borderBottomColor: colors.divider }]}>
                  <View style={styles.listItemLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: hexToRgba(colors.primary, 0.08) }]}>
                      <Ionicons name="time-outline" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.listItemText}>
                      <Text style={[styles.listItemLabel, { color: colors.text }]}>Disappearing Messages</Text>
                      <Text style={[styles.listItemValue, { color: colors.secondary }]}>
                        {disappearingMessages ? 'Auto-delete after viewing' : 'Keep forever'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => { haptics.light(); onUpdateDisappearingMessages?.(!disappearingMessages); }}
                    style={[styles.switch, { backgroundColor: disappearingMessages ? colors.primary : hexToRgba(colors.text, 0.1) }]}
                    activeOpacity={0.9}
                  >
                    <Animated.View style={[styles.switchThumb, { transform: [{ translateX: disappearingMessages ? 22 : 2 }] }]} />
                  </TouchableOpacity>
                </View>
              </View>

              {!isGroupChat && user?.id && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>
                  <TouchableOpacity
                    style={[styles.destructiveButton, { borderColor: colors.cardBorder, backgroundColor: colors.spaceBackground }]}
                    onPress={handleReportUser}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="flag-outline" size={20} color={colors.text} />
                    <Text style={[styles.destructiveButtonText, { color: colors.text }]}>Report</Text>
                  </TouchableOpacity>
                  {!userBlocked ? (
                    <TouchableOpacity
                      style={[styles.destructiveButton, { borderColor: hexToRgba(colors.error, 0.2), backgroundColor: hexToRgba(colors.error, 0.05) }]}
                      onPress={handleBlockUser}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="ban-outline" size={20} color={colors.error} />
                      <Text style={[styles.destructiveButtonText, { color: colors.error }]}>Block User</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.blockedBanner, { backgroundColor: hexToRgba(colors.error, 0.08) }]}>
                      <Ionicons name="ban" size={20} color={colors.error} />
                      <Text style={[styles.blockedBannerText, { color: colors.error }]}>This user is blocked</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {tab === 'media' && (
            <View style={styles.mediaContent}>
              {mediaItems.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyIcon, { backgroundColor: hexToRgba(colors.primary, 0.06) }]}>
                    <Ionicons name="images-outline" size={32} color={hexToRgba(colors.primary, 0.4)} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No media yet</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>
                    Photos and videos you share will appear here
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={mediaItems}
                  keyExtractor={(i) => i.id}
                  numColumns={MEDIA_COLS}
                  scrollEnabled={false}
                  columnWrapperStyle={{ gap: MEDIA_GAP }}
                  contentContainerStyle={{ gap: MEDIA_GAP }}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity 
                      style={[styles.mediaItem, { width: MEDIA_SIZE, height: MEDIA_SIZE }]} 
                      activeOpacity={0.9}
                      onPress={() => handleMediaPress(item, index)}
                    >
                      <ExpoImage source={{ uri: item.thumbnail || item.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                      {item.type === 'video' && (
                        <View style={styles.playIcon}>
                          <Ionicons name="play" size={16} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          )}

          {tab === 'members' && isGroupChat && (
            <View style={styles.membersContent}>
              {members.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyIcon, { backgroundColor: hexToRgba(colors.primary, 0.06) }]}>
                    <Ionicons name="people-outline" size={32} color={hexToRgba(colors.primary, 0.4)} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No members</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>
                    Add members to get started
                  </Text>
                </View>
              ) : (
                <View style={styles.membersList}>
                  {members.map((m, idx) => (
                    <TouchableOpacity
                      key={String(m?.id ?? idx)}
                      style={[styles.memberItem, idx < members.length - 1 && { borderBottomColor: colors.divider }]}
                      onPress={() => { if (m?.id && onViewProfile) { haptics.light(); onViewProfile(String(m.id)); } }}
                      activeOpacity={0.7}
                    >
                      {m?.avatar ? (
                        <ExpoImage source={{ uri: m.avatar }} style={styles.memberAvatar} contentFit="cover" />
                      ) : (
                        <View style={[styles.memberAvatar, { backgroundColor: hexToRgba(colors.primary, 0.08) }]}>
                          <Text style={[styles.memberAvatarText, { color: colors.primary }]}>
                            {(m?.name || '?').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.memberDetails}>
                        <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>
                          {m?.name || 'Unknown'}
                        </Text>
                        {m?.label && <Text style={[styles.memberStatus, { color: colors.secondary }]} numberOfLines={1}>{m.label}</Text>}
                      </View>
                      {onViewProfile && <Ionicons name="chevron-forward" size={20} color={hexToRgba(colors.text, 0.15)} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      
      {/* Media Viewer */}
      <MediaViewer
        visible={showMediaViewer}
        mediaItems={mediaItems.map(item => ({
          id: item.id,
          uri: item.uri,
          type: item.type,
          thumbnail: item.thumbnail,
        }))}
        initialIndex={selectedMediaIndex}
        onClose={() => setShowMediaViewer(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: Spacing.sm,
  },
  backButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  content: {
    paddingBottom: Spacing.xl * 3,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  avatarContainer: {
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: Spacing.xs - 2,
  },
  subtitle: {
    fontSize: Typography.base,
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.6,
  },
  viewProfileButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl + Spacing.md,
    borderRadius: 20,
  },
  viewProfileButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: Typography.sm,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  infoContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl + Spacing.md,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.5,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
  },
  textInput: {
    fontSize: Typography.base,
    fontWeight: '400',
    paddingVertical: Spacing.md,
    minHeight: 44,
  },
  primaryButton: {
    paddingVertical: Spacing.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  listItemText: {
    flex: 1,
  },
  listItemLabel: {
    fontSize: Typography.base,
    fontWeight: '500',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  listItemValue: {
    fontSize: Typography.sm,
    fontWeight: '400',
    opacity: 0.6,
  },
  switch: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  destructiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  destructiveButtonText: {
    fontSize: Typography.base,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 10,
    gap: Spacing.sm,
  },
  blockedBannerText: {
    fontSize: Typography.base,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  mediaContent: {
    paddingHorizontal: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.base,
    fontWeight: '400',
    opacity: 0.5,
    textAlign: 'center',
    lineHeight: Typography.base * 1.4,
  },
  mediaItem: {
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E0E0E0',
  },
  playIcon: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  membersContent: {
    paddingHorizontal: Spacing.lg,
  },
  membersList: {},
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: Typography.base,
    fontWeight: '500',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  memberStatus: {
    fontSize: Typography.sm,
    fontWeight: '400',
    opacity: 0.6,
  },
});
