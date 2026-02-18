import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { ShareTarget, getShareTargets, sharePost } from '@/lib/api/posts';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Post } from '@/types/post';

interface SharePostModalProps {
  visible: boolean;
  post: Post | null;
  onClose: () => void;
  onShareComplete?: () => void;
  onExternalShareComplete?: () => void;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function SharePostModal({ visible, post, onClose, onShareComplete, onExternalShareComplete }: SharePostModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();

  const [targets, setTargets] = useState<ShareTarget[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [sharingExternal, setSharingExternal] = useState(false);

  useEffect(() => {
    if (visible) {
      loadTargets();
    } else {
      setSelectedTargets([]);
      setSearchQuery('');
    }
  }, [visible]);

  const loadTargets = async () => {
    setLoading(true);
    try {
      const data = await getShareTargets();
      setTargets(data);
    } catch (error) {
      console.error('Error loading share targets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Split by isFollowing from API (getShareTargets sets this)
  const followingTargets = targets.filter(t => t && t.isFollowing === true);
  const otherTargets = targets.filter(t => t && t.isFollowing !== true);

  const filteredFollowingTargets = followingTargets.filter(target =>
    target?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
  );
  
  const filteredOtherTargets = otherTargets.filter(target =>
    target?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
  );
  
  // Fallback: if separation didn't work, just show all targets
  const hasSeparatedLists = followingTargets.length > 0 || otherTargets.length > 0;
  const filteredTargets = searchQuery 
    ? (hasSeparatedLists 
        ? [...filteredFollowingTargets, ...filteredOtherTargets]
        : targets.filter(t => t?.name?.toLowerCase().includes(searchQuery.toLowerCase())))
    : (hasSeparatedLists 
        ? [...followingTargets, ...otherTargets]
        : targets);

  const toggleTarget = (targetId: string) => {
    haptics.light();
    setSelectedTargets(prev =>
      prev.includes(targetId)
        ? prev.filter(id => id !== targetId)
        : [...prev, targetId]
    );
  };

  const handleShareOutsideApp = async () => {
    if (!post) return;
    haptics.medium();
    const authorLabel = post.author?.name ? `${post.author.name}: ` : '';
    const content = post.content || post.title || '';
    const title = post.title || 'Post';
    const message = `${authorLabel}${content}`.trim() || title;

    const tryNativeShare = async (): Promise<boolean> => {
      if (Platform.OS === 'web' || typeof Share?.share !== 'function') return false;
      try {
        const contentObj: { message: string; title?: string } = { message };
        if (title) contentObj.title = title;
        const result = await Share.share(contentObj);
        return result.action === Share.sharedAction;
      } catch {
        return false;
      }
    };

    setSharingExternal(true);
    try {
      const shared = await tryNativeShare();
      if (shared) {
        onExternalShareComplete?.();
        return;
      }
      await Clipboard.setStringAsync(message);
      Alert.alert('Copied', 'Post copied to clipboard. Paste it anywhere to share.');
      onExternalShareComplete?.();
    } catch (err) {
      console.error('Share outside failed:', err);
      Alert.alert('Error', 'Could not share or copy. Please try again.');
    } finally {
      setSharingExternal(false);
    }
  };

  const handleShareInApp = async () => {
    if (selectedTargets.length === 0 || !post) return;

    setSharing(true);
    haptics.medium();
    try {
      await sharePost(post.id, selectedTargets);
      haptics.success();
      onShareComplete?.();
      const count = selectedTargets.length;
      Alert.alert(
        'Post shared',
        count === 1
          ? 'Shared to 1 conversation. You can find it in your inbox.'
          : `Shared to ${count} conversations. You can find them in your inbox.`,
        [{ text: 'OK', onPress: () => onClose() }]
      );
    } catch (error) {
      console.error('Error sharing post:', error);
      haptics.error();
      Alert.alert('Share failed', 'Could not share the post. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const renderTarget = ({ item }: { item: ShareTarget }) => {
    const isSelected = selectedTargets.includes(item.id);
    const isFollowing = followingTargets.some(t => t.id === item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.targetItem,
          {
            backgroundColor: isSelected ? colors.primary + '10' : (isFollowing ? colors.primary + '05' : colors.surface),
            borderColor: isSelected ? colors.primary : (isFollowing ? colors.primary + '20' : colors.cardBorder),
            borderWidth: isSelected ? 1.5 : (isFollowing ? 1 : StyleSheet.hairlineWidth),
          },
        ]}
        onPress={() => toggleTarget(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.targetContent}>
          {item.avatar ? (
            <ExpoImage
              source={{ uri: item.avatar }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[
              styles.avatar, 
              styles.avatarPlaceholder, 
              { 
                backgroundColor: isSelected ? colors.primary + '25' : colors.primary + '20' 
              }
            ]}>
              {item.type === 'space' ? (
                <Ionicons name="people" size={20} color={colors.primary} />
              ) : (
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {getInitials(item.name)}
                </Text>
              )}
            </View>
          )}
          
          <View style={styles.targetInfo}>
            <View style={styles.targetNameRow}>
              <Text style={[
                styles.targetName, 
                { 
                  color: colors.text,
                  fontWeight: isSelected ? '600' : (isFollowing ? '600' : '500'),
                }
              ]}>
                {item.name}
              </Text>
              {isFollowing && (
                <View style={[styles.followingBadge, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
                  <Text style={[styles.followingBadgeText, { color: colors.primary }]}>
                    Following
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.targetTypeRow}>
              <Ionicons 
                name={item.type === 'space' ? 'people-outline' : 'person-outline'} 
                size={12} 
                color={colors.secondary} 
              />
              <Text style={[styles.targetType, { color: colors.secondary }]}>
                {item.type === 'space' ? 'Space' : 'User'}
              </Text>
            </View>
          </View>
        </View>
        
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!post) return null;

  const postPreview = post.content || post.title || 'Shared post';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Handle */}
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: colors.secondary }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <View style={styles.headerTitleBlock}>
              <Text style={[styles.title, { color: colors.text }]}>Share</Text>
              <Text style={[styles.subtitle, { color: colors.secondary }]}>Post</Text>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.surface }]}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Share outside app — primary CTA */}
          <View style={[styles.shareOptionsSection, { borderBottomColor: colors.divider }]}>
            <TouchableOpacity
              style={[styles.shareOptionButton, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '40' }]}
              onPress={handleShareOutsideApp}
              disabled={sharingExternal}
              activeOpacity={0.8}
            >
              {sharingExternal ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <View style={[styles.shareOptionIconWrap, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="share-social" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.shareOptionTextWrap}>
                    <Text style={[styles.shareOptionLabel, { color: colors.text }]}>Link or other apps</Text>
                    <Text style={[styles.shareOptionHint, { color: colors.secondary }]}>Copy text, WhatsApp, Messages…</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.secondary} />
                </>
              )}
            </TouchableOpacity>
            <View style={styles.inAppSectionHeader}>
              <Ionicons name="people" size={14} color={colors.secondary} />
              <Text style={[styles.shareSectionLabel, { color: colors.secondary }]}>Send in app</Text>
            </View>
          </View>

          {/* Post Preview */}
          <View style={[styles.postPreview, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.postPreviewLabelRow}>
              <Ionicons name="chatbubble-outline" size={14} color={colors.secondary} />
              <Text style={[styles.postPreviewLabel, { color: colors.secondary }]}>Sharing</Text>
            </View>
            <View style={styles.postPreviewHeader}>
              {post.author.avatar ? (
                <ExpoImage
                  source={{ uri: post.author.avatar }}
                  style={styles.postAuthorAvatar}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.postAuthorAvatar, styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {getInitials(post.author.name)}
                  </Text>
                </View>
              )}
              <View style={styles.postPreviewInfo}>
                <Text style={[styles.postAuthorName, { color: colors.text }]}>
                  {post.author.name}
                </Text>
                <Text style={[styles.postAuthorHandle, { color: colors.secondary }]}>
                  {post.author.handle}
                </Text>
              </View>
            </View>
            <Text style={[styles.postPreviewText, { color: colors.text }]} numberOfLines={2}>
              {postPreview}
            </Text>
            {post.media && post.media.length > 0 && (
              <View style={styles.postMediaIndicator}>
                <Ionicons name="image-outline" size={14} color={colors.secondary} />
                <Text style={[styles.postMediaText, { color: colors.secondary }]}>
                  {post.media.length} {post.media.length === 1 ? 'media' : 'media'}
                </Text>
              </View>
            )}
          </View>

          {/* Select from people you follow */}
          {!loading && followingTargets.length > 0 && (
            <View style={[styles.quickSendSection, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.quickSendLabel, { color: colors.secondary }]}>
                Select from people you follow
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickSendScroll}
              >
                {followingTargets.map((target) => {
                  const isSelected = selectedTargets.includes(target.id);
                  return (
                    <TouchableOpacity
                      key={target.id}
                      style={[
                        styles.quickSendChip,
                        {
                          backgroundColor: isSelected ? colors.primary + '15' : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.cardBorder,
                          borderWidth: isSelected ? 1.5 : 1,
                        },
                      ]}
                      onPress={() => toggleTarget(target.id)}
                      activeOpacity={0.7}
                    >
                      {target.avatar ? (
                        <ExpoImage
                          source={{ uri: target.avatar }}
                          style={styles.quickSendAvatar}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={[styles.quickSendAvatar, styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                          {target.type === 'space' ? (
                            <Ionicons name="people" size={18} color={colors.primary} />
                          ) : (
                            <Text style={[styles.quickSendAvatarText, { color: colors.primary }]}>
                              {getInitials(target.name)}
                            </Text>
                          )}
                        </View>
                      )}
                      <Text style={[styles.quickSendName, { color: colors.text }]} numberOfLines={1}>
                        {target.name}
                      </Text>
                      {isSelected && (
                        <View style={[styles.quickSendCheck, { backgroundColor: colors.primary }]}>
                          <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Search */}
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Ionicons name="search" size={18} color={colors.secondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search people or spaces..."
              placeholderTextColor={colors.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Targets List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size={32} color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.secondary }]}>Loading...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredTargets}
              renderItem={({ item, index }) => {
                // Use the correct lists based on whether we're searching
                const activeFollowingList = searchQuery ? filteredFollowingTargets : followingTargets;
                const activeOtherList = searchQuery ? filteredOtherTargets : otherTargets;
                
                // Check if this item is in the following list
                const followingIds = new Set(activeFollowingList.map(t => t.id));
                const isFollowingItem = followingIds.has(item.id);
                
                // Find the index of this item in its respective list
                const followingIndex = activeFollowingList.findIndex(t => t.id === item.id);
                const otherIndex = activeOtherList.findIndex(t => t.id === item.id);
                
                // Show section header before first following item
                const showFollowingHeader = isFollowingItem && 
                  activeFollowingList.length > 0 && 
                  followingIndex === 0;
                
                // Show section header before first other item (only if there are following items)
                const showOthersHeader = !isFollowingItem && 
                  activeOtherList.length > 0 && 
                  otherIndex === 0 &&
                  activeFollowingList.length > 0;
                
                return (
                  <>
                    {showFollowingHeader && (
                      <View style={[styles.sectionHeader, { borderBottomColor: colors.divider }]}>
                        <Ionicons name="people" size={16} color={colors.primary} style={{ marginRight: Spacing.xs }} />
                        <Text style={[styles.sectionHeaderText, { color: colors.primary }]}>
                          People You Follow
                        </Text>
                      </View>
                    )}
                    {showOthersHeader && (
                      <View style={[styles.sectionHeader, { borderBottomColor: colors.divider, marginTop: Spacing.md }]}>
                        <Text style={[styles.sectionHeaderText, { color: colors.secondary }]}>
                          Others
                        </Text>
                      </View>
                    )}
                    {renderTarget({ item })}
                  </>
                );
              }}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={48} color={colors.secondary} style={{ opacity: 0.5 }} />
                  <Text style={[styles.emptyText, { color: colors.secondary }]}>
                    No {searchQuery ? 'results' : 'users or spaces'} found
                  </Text>
                </View>
              }
            />
          )}

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.divider, backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={[
                styles.shareButton,
                {
                  backgroundColor: selectedTargets.length > 0 ? colors.primary : colors.surface,
                  borderColor: selectedTargets.length > 0 ? colors.primary : colors.cardBorder,
                  opacity: sharing ? 0.8 : 1,
                },
              ]}
              onPress={handleShareInApp}
              disabled={selectedTargets.length === 0 || sharing}
              activeOpacity={0.85}
            >
              {sharing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color={selectedTargets.length > 0 ? '#FFFFFF' : colors.secondary} />
                  <Text style={[styles.shareButtonText, { color: selectedTargets.length > 0 ? '#FFFFFF' : colors.secondary }]}>
                    {selectedTargets.length === 0
                      ? 'Select people to send to'
                      : selectedTargets.length === 1
                        ? 'Send to 1 person'
                        : `Send to ${selectedTargets.length} people`}
                  </Text>
                  {selectedTargets.length > 0 && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>{selectedTargets.length}</Text>
                    </View>
                  )}
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    maxHeight: '88%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  headerTitleBlock: {
    flex: 1,
  },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.sm,
    fontWeight: '500',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareOptionsSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  shareOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  shareOptionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareOptionTextWrap: {
    flex: 1,
  },
  shareOptionLabel: {
    fontSize: Typography.base,
    fontWeight: '700',
  },
  shareOptionHint: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  inAppSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  shareSectionLabel: {
    fontSize: Typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  postPreview: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  postPreviewLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  postPreviewLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  postPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  postAuthorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.sm,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  postPreviewInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  postAuthorHandle: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  postPreviewText: {
    fontSize: Typography.sm,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
  postMediaIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  postMediaText: {
    fontSize: Typography.xs,
  },
  quickSendSection: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  quickSendLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickSendScroll: {
    paddingRight: Spacing.md,
    flexDirection: 'row',
  },
  quickSendChip: {
    width: 72,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: Spacing.sm,
    position: 'relative',
  },
  quickSendCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickSendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: Spacing.xs,
  },
  quickSendAvatarText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  quickSendName: {
    fontSize: Typography.xs,
    fontWeight: '500',
    maxWidth: 64,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.base,
    paddingVertical: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.sm,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sm,
    marginTop: Spacing.sm,
  },
  targetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xs,
  },
  targetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.md,
  },
  targetInfo: {
    flex: 1,
  },
  targetNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  targetName: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  followingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  followingBadgeText: {
    fontSize: Typography.xs - 1,
    fontWeight: '600',
  },
  targetTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  targetType: {
    fontSize: Typography.xs,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl + Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  shareButtonText: {
    fontSize: Typography.base,
    fontWeight: '700',
  },
  selectedBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: Typography.xs,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.xs,
  },
  sectionHeaderText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
