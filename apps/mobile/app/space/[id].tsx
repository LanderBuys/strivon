import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Text, RefreshControl, FlatList, Dimensions, Platform, TextInput, Modal, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Space, SpaceMember, SpaceEvent, Post, JoinRequest } from '@/types/post';
import { getSpaceById, joinSpace, leaveSpace, updateSpace, getSpaceMembers, getSpacePosts, getSpaceEvents, createSpaceEvent, joinSpaceEvent, requestToJoinSpace, getJoinRequests, approveJoinRequest, rejectJoinRequest, getUserJoinRequest, kickMember, banMember, updateMemberRole, getModerationLogs, addSpaceResource, removeSpaceResource, createChannel } from '@/lib/api/spaces';
import { mockUsers } from '@/lib/mocks/users';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Image as ExpoImage } from 'expo-image';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { mockUserSpaces } from '@/lib/mocks/users';
import { PostCard } from '@/components/feed/PostCard';
import { SpaceAnnouncements } from '@/components/spaces/SpaceAnnouncements';
import { canPinPosts, getMaxPinnedPosts, getSubscriptionTier } from '@/lib/services/subscriptionService';
import { useReportBlock } from '@/hooks/useReportBlock';
import { addReport, getRemovedPostIds } from '@/lib/services/reportQueueService';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { getSpaceInitials } from '@/lib/utils/spaceUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SpaceTab = 'feed' | 'channels' | 'members' | 'events' | 'resources' | 'rules' | 'requests' | 'logs' | 'analytics';

export default function SpaceDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : undefined;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const haptics = useHapticFeedback();
  const currentUserId = useCurrentUserId();
  const [space, setSpace] = useState<Space | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [activeTab, setActiveTab] = useState<SpaceTab>('feed');
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [events, setEvents] = useState<SpaceEvent[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [loadingTab, setLoadingTab] = useState(false);
  const [moderationLogs, setModerationLogs] = useState<any[]>([]);
  const [actionSheet, setActionSheet] = useState<{ title: string; message?: string; options: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }> } | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [pinnedPosts, setPinnedPosts] = useState<Set<string>>(new Set());
  const [hiddenPosts, setHiddenPosts] = useState<Set<string>>(new Set());
  const [canPin, setCanPin] = useState(false);
  const [maxPinned, setMaxPinned] = useState(0);
  const [deletedPosts, setDeletedPosts] = useState<Set<string>>(new Set());
  const [removedPostIds, setRemovedPostIds] = useState<Set<string>>(new Set());
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'pro-plus'>('free');
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'text' | 'announcement'>('text');
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventIsOnline, setNewEventIsOnline] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SpaceEvent | null>(null);
  const [joinedEventIds, setJoinedEventIds] = useState<Set<string>>(new Set());
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceDescription, setNewResourceDescription] = useState('');
  const [newResourceMode, setNewResourceMode] = useState<'link' | 'file'>('link');
  const [newResourcePickedFile, setNewResourcePickedFile] = useState<{ uri: string; name: string } | null>(null);
  const [resourceActionLoading, setResourceActionLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const spaceIdRef = useRef<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const channelsSectionRef = useRef<View>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    // Simple toast - you can enhance this with a toast component
    console.log(`${type}: ${message}`);
  }, []);

  const openInviteMembersSheet = useCallback(() => {
    const inviteLink = `strivon://space/${id}?invite=${space?.id}`;
    setActionSheet({
      title: 'Invite Members',
      message: 'Share your space with others',
      options: [
        { text: 'Copy Invite Link', onPress: () => {
          setActionSheet(null);
          Clipboard.setStringAsync(inviteLink).then(() => showToast('Invite link copied!', 'success'));
        }},
        { text: 'Share via...', onPress: () => {
          setActionSheet(null);
          showToast('Share dialog opened', 'success');
        }},
        { text: 'Invite by Username', onPress: () => {
          setActionSheet(null);
          if (Platform.OS === 'ios') {
            Alert.prompt(
              'Invite Member',
              'Enter username to invite',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Invite', onPress: (username?: string) => {
                  if (username) showToast(`Invite sent to @${username}`, 'success');
                }},
              ],
              'plain-text'
            );
          } else {
            showToast('Use Copy Link or Share to invite', 'success');
          }
        }},
        { text: 'Cancel', style: 'cancel' as const, onPress: () => setActionSheet(null) },
      ],
    });
  }, [id, space?.id, showToast]);

  const { getReportBlockOptions } = useReportBlock({ showToast });

  useEffect(() => {
    spaceIdRef.current = space?.id ?? null;
  }, [space?.id]);

  useEffect(() => {
    if (id) {
      loadSpace();
    }
    checkPinningPermissions();
    loadSubscriptionTier();
  }, [id]);

  const loadSubscriptionTier = async () => {
    const tier = await getSubscriptionTier();
    setSubscriptionTier(tier);
  };

  const checkPinningPermissions = async () => {
    const canPinPostsValue = await canPinPosts();
    const maxPinnedValue = await getMaxPinnedPosts();
    setCanPin(canPinPostsValue);
    setMaxPinned(maxPinnedValue);
  };

  useEffect(() => {
    if (space && isJoined) {
      loadTabData();
      // Initialize pinned posts from space data
      if (space.pinnedPosts && space.pinnedPosts.length > 0) {
        setPinnedPosts(new Set(space.pinnedPosts));
      }
    }
  }, [activeTab, space, isJoined]);

  useEffect(() => {
    if (space && !isJoined && space.requiresApproval) {
      checkPendingRequest();
    }
  }, [space, isJoined]);

  const checkPendingRequest = useCallback(async () => {
    if (!space || !id) return;
    const currentUserId = mockUsers[0].id;
    const request = await getUserJoinRequest(id, currentUserId);
    setHasPendingRequest(!!request);
  }, [space, id]);

  const loadSpace = useCallback(async (isRefresh = false) => {
    if (!id) return;
    try {
      setLoadError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const fetchedSpace = await getSpaceById(id);
      if (fetchedSpace) {
      const currentUserId = mockUsers[0].id;
      // ALWAYS check ownerId first - this is the source of truth
      const isOwner = fetchedSpace.ownerId === currentUserId || fetchedSpace.ownerId === `user-${currentUserId}`;
      const isJoined = mockUserSpaces.includes(fetchedSpace.id) || isOwner;
      
      // Force owner role if user is owner, regardless of what's in fetchedSpace
      const finalMemberRole = isOwner ? 'owner' : (fetchedSpace.memberRole || (isJoined ? 'member' : undefined));
      
      const enrichedSpace = {
        ...fetchedSpace,
        isJoined: isJoined || isOwner, // Always join if owner
        memberRole: finalMemberRole,
        isTrending: fetchedSpace.memberCount > 1000,
        channels: fetchedSpace.channels.map(ch => ({
          ...ch,
          unreadCount: Math.floor(Math.random() * 10),
        })),
      };

      setSpace(enrichedSpace);
      setIsJoined(enrichedSpace.isJoined);
        // Don't auto-select channel - show space overview first
      }
    } catch (err) {
      console.error('Error loading space:', err);
      setLoadError(err instanceof Error ? err.message : 'Could not load space');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  const loadTabData = useCallback(async () => {
    if (!space || !id) return;
    
    setLoadingTab(true);
    try {
      switch (activeTab) {
        case 'members':
          const fetchedMembers = await getSpaceMembers(id);
          setMembers(fetchedMembers);
          break;
        case 'events':
          const fetchedEvents = await getSpaceEvents(id);
          setEvents(fetchedEvents);
          break;
        case 'feed': {
          const [postsResponse, removed] = await Promise.all([getSpacePosts(id, 1, 20), getRemovedPostIds()]);
          setPosts(postsResponse.data);
          setRemovedPostIds(removed);
          break;
        }
        case 'requests':
          const isOwner = space.ownerId === mockUsers[0].id || space.ownerId === `user-${mockUsers[0].id}`;
          const isAdmin = space.memberRole === 'admin';
          if (isOwner || isAdmin) {
            const fetchedRequests = await getJoinRequests(id);
            setJoinRequests(fetchedRequests);
          }
          break;
        case 'logs':
          const canViewLogs = space.ownerId === mockUsers[0].id || space.ownerId === `user-${mockUsers[0].id}` || space.memberRole === 'admin';
          if (canViewLogs) {
            const logs = await getModerationLogs(id);
            setModerationLogs(logs);
          }
          break;
      }
    } catch (error) {
      console.error('Error loading tab data:', error);
    } finally {
      setLoadingTab(false);
    }
  }, [activeTab, space, id]);

  const handleJoinSpace = useCallback(async () => {
    try {
      haptics.light();
      if (isJoined) {
        await leaveSpace(id!);
        setIsJoined(false);
        setSpace(prev => prev ? { ...prev, isJoined: false, memberCount: Math.max(0, prev.memberCount - 1) } : null);
      } else {
        // Check spaces join limit for free users
        const { getMaxSpaces } = await import('@/lib/services/subscriptionService');
        const maxSpaces = await getMaxSpaces();
        
        if (maxSpaces > 0) {
          // Count currently joined spaces
          const { getSpaces } = await import('@/lib/api/spaces');
          const allSpaces = await getSpaces();
          const joinedCount = allSpaces.filter(s => s.isJoined || mockUserSpaces.includes(s.id)).length;
          
          if (joinedCount >= maxSpaces) {
            Alert.alert(
              'Space Limit Reached',
              `You can join up to ${maxSpaces} spaces with your current plan. Upgrade to Pro for unlimited spaces.`,
              [
                { text: 'OK' },
                { text: 'Upgrade', onPress: () => router.push('/settings/subscription-info') },
              ]
            );
            return;
          }
        }

        // Check if space requires approval
        if (space?.requiresApproval) {
          setShowRequestModal(true);
        } else {
          await joinSpace(id!);
          setIsJoined(true);
          setSpace(prev => prev ? { ...prev, isJoined: true, memberCount: prev.memberCount + 1 } : null);
          haptics.success();
          setTimeout(() => loadTabData(), 500);
        }
      }
    } catch (error) {
      console.error('Error toggling space membership:', error);
    }
  }, [id, isJoined, space, haptics, loadTabData, router]);

  const handleSubmitJoinRequest = useCallback(async () => {
    if (!id) return;
    try {
      haptics.light();
      await requestToJoinSpace(id, requestMessage);
      setHasPendingRequest(true);
      setShowRequestModal(false);
      setRequestMessage('');
      haptics.success();
      showToast('Join request sent!', 'success');
    } catch (error) {
      console.error('Error submitting join request:', error);
      haptics.error();
    }
  }, [id, requestMessage, haptics]);

  const handleApproveRequest = useCallback(async (requestId: string) => {
    try {
      haptics.light();
      await approveJoinRequest(requestId);
      setJoinRequests(prev => prev.filter(r => r.id !== requestId));
      setSpace(prev => prev ? { ...prev, memberCount: (prev?.memberCount || 0) + 1 } : null);
      haptics.success();
    } catch (error) {
      console.error('Error approving request:', error);
      haptics.error();
    }
  }, [haptics]);

  const handleRejectRequest = useCallback(async (requestId: string) => {
    try {
      haptics.light();
      await rejectJoinRequest(requestId);
      setJoinRequests(prev => prev.filter(r => r.id !== requestId));
      haptics.light();
    } catch (error) {
      console.error('Error rejecting request:', error);
      haptics.error();
    }
  }, [haptics]);

  const handleMemberAction = useCallback((member: SpaceMember, action: string) => {
    if (!id || !space) return;
    
    const isOwner = space.ownerId === mockUsers[0].id || space.ownerId === `user-${mockUsers[0].id}`;
    const isAdmin = space.memberRole === 'admin';
    const isModerator = space.memberRole === 'moderator';
    const canManageMembers = isOwner || isAdmin || isModerator;
    
    if (!canManageMembers) return;
    
    if (member.role === 'owner') {
      Alert.alert('Cannot Moderate', 'You cannot moderate the space owner.');
      return;
    }
    
    if (member.role === 'admin' && !isOwner) {
      setActionSheet({
        title: 'Cannot Moderate',
        message: 'Only the owner can moderate admins.',
        options: [{ text: 'OK', onPress: () => setActionSheet(null) }],
      });
      return;
    }

    if (action === 'promote_admin' && !isOwner) return;
    if (action === 'promote_moderator' && !isOwner && !isAdmin) return;
    if ((action === 'demote' || action === 'kick' || action === 'ban') && isModerator && member.role === 'admin') {
      Alert.alert('Cannot Moderate', 'Only the owner or an admin can moderate admins.');
      return;
    }
    if (action === 'demote' && isModerator && member.role !== 'moderator') return;
    
    switch (action) {
      case 'promote_admin':
        setActionSheet({
          title: 'Promote to Admin',
          message: `Promote ${member.user.name} to admin?`,
          options: [
            { text: 'Cancel', style: 'cancel', onPress: () => setActionSheet(null) },
            {
              text: 'Promote',
              onPress: async () => {
                setActionSheet(null);
                try {
                  await updateMemberRole(id, member.id, 'admin');
                  setMembers(prev => prev.map(m => 
                    m.id === member.id ? { ...m, role: 'admin' } : m
                  ));
                  haptics.success();
                  showToast(`${member.user.name} promoted to admin`, 'success');
                } catch (error) {
                  haptics.error();
                  showToast('Failed to promote member', 'error');
                }
              },
            },
          ],
        });
        break;
        
      case 'promote_moderator':
        setActionSheet({
          title: 'Promote to Moderator',
          message: `Promote ${member.user.name} to moderator?`,
          options: [
            { text: 'Cancel', style: 'cancel', onPress: () => setActionSheet(null) },
            {
              text: 'Promote',
              onPress: async () => {
                setActionSheet(null);
                try {
                  await updateMemberRole(id, member.id, 'moderator');
                  setMembers(prev => prev.map(m => 
                    m.id === member.id ? { ...m, role: 'moderator' } : m
                  ));
                  haptics.success();
                  showToast(`${member.user.name} promoted to moderator`, 'success');
                } catch (error) {
                  haptics.error();
                  showToast('Failed to promote member', 'error');
                }
              },
            },
          ],
        });
        break;
        
      case 'demote':
        setActionSheet({
          title: 'Demote Member',
          message: `Demote ${member.user.name} to regular member?`,
          options: [
            { text: 'Cancel', style: 'cancel', onPress: () => setActionSheet(null) },
            {
              text: 'Demote',
              onPress: async () => {
                setActionSheet(null);
                try {
                  await updateMemberRole(id, member.id, 'member');
                  setMembers(prev => prev.map(m => 
                    m.id === member.id ? { ...m, role: 'member' } : m
                  ));
                  haptics.success();
                  showToast(`${member.user.name} demoted to member`, 'success');
                } catch (error) {
                  haptics.error();
                  showToast('Failed to demote member', 'error');
                }
              },
            },
          ],
        });
        break;
        
      case 'kick':
        setActionSheet({
          title: 'Kick Member',
          message: `Remove ${member.user.name} from this space?`,
          options: [
            { text: 'Cancel', style: 'cancel', onPress: () => setActionSheet(null) },
            {
              text: 'Kick',
              style: 'destructive',
              onPress: async () => {
                setActionSheet(null);
                try {
                  await kickMember(id, member.id);
                  setMembers(prev => prev.filter(m => m.id !== member.id));
                  setSpace(prev => prev ? { ...prev, memberCount: Math.max(0, (prev.memberCount || 0) - 1) } : null);
                  haptics.success();
                  showToast(`${member.user.name} has been removed`, 'success');
                } catch (error) {
                  haptics.error();
                  showToast('Failed to remove member', 'error');
                }
              },
            },
          ],
        });
        break;
        
      case 'ban':
        setActionSheet({
          title: 'Ban Member',
          message: `Ban ${member.user.name} from this space? They won't be able to rejoin.`,
          options: [
            { text: 'Cancel', style: 'cancel', onPress: () => setActionSheet(null) },
            {
              text: 'Ban',
              style: 'destructive',
              onPress: async () => {
                setActionSheet(null);
                try {
                  await banMember(id, member.id);
                  setMembers(prev => prev.filter(m => m.id !== member.id));
                  setSpace(prev => prev ? { ...prev, memberCount: Math.max(0, (prev.memberCount || 0) - 1) } : null);
                  haptics.success();
                  showToast(`${member.user.name} has been banned`, 'success');
                } catch (error) {
                  haptics.error();
                  showToast('Failed to ban member', 'error');
                }
              },
            },
          ],
        });
        break;
    }
  }, [id, space, haptics, showToast]);

  const renderFeedTab = () => {
    if (!isJoined) {
      return (
        <View style={[styles.emptyTab, { backgroundColor: colors.spaceBackground }]}>
          <IconSymbol name="lock-closed-outline" size={48} color={colors.secondary} />
          <Text style={[styles.emptyTabText, { color: colors.text }]}>Join to see posts</Text>
          <Text style={[styles.emptyTabSubtext, { color: colors.secondary }]}>
            Join this space to view and create posts
          </Text>
        </View>
      );
    }

    if (loadingTab) {
      return (
        <View style={styles.center}>
          <Text style={{ color: colors.secondary }}>Loading posts...</Text>
        </View>
      );
    }

    if (posts.length === 0) {
      return (
        <View style={[styles.emptyTab, { backgroundColor: colors.spaceBackground }]}>
          <IconSymbol name="newspaper-outline" size={48} color={colors.secondary} />
          <Text style={[styles.emptyTabText, { color: colors.text }]}>No posts yet</Text>
          <Text style={[styles.emptyTabSubtext, { color: colors.secondary }]}>
            Be the first to share something in this space
          </Text>
        </View>
      );
    }

    const isOwner = space?.ownerId === mockUsers[0].id || space?.ownerId === `user-${mockUsers[0].id}`;
    const isAdmin = space?.memberRole === 'admin';
    const isModerator = space?.memberRole === 'moderator';
    const canModerateContent = isOwner || isAdmin || isModerator;

    return (
      <View style={styles.feedContainer}>
        {space && (
          <>
            <SpaceAnnouncements space={space} />
          </>
        )}
        {/* Full-bleed posts: avoid double horizontal padding (main padding + PostCard margins) */}
        <View style={styles.feedPostsFullBleed}>
          {visiblePosts.map((post) => {
            const isPinned = pinnedPosts.has(post.id);

            const handleModeration = () => {
              haptics.medium();
              const moderationOptions: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }> = [];
              moderationOptions.push({
                text: 'Report post',
                onPress: () => {
                  setActionSheet(null);
                  const reasons = ['Spam', 'Harassment or bullying', 'Inappropriate content', 'Gore or violence', 'Scam or fraud', 'Misinformation', 'Other'];
                  Alert.alert('Report post', 'Why are you reporting this post?', [
                    ...reasons.map((reason) => ({
                      text: reason,
                      onPress: async () => {
                        await addReport({
                          type: 'post',
                          targetUserId: post.author?.id ?? '',
                          targetUserName: post.author?.name,
                          targetUserHandle: post.author?.handle,
                          targetPostId: post.id,
                          targetPostPreview: (post.content || post.title || '').slice(0, 300),
                          targetSpaceId: id ?? undefined,
                          reason,
                          reporterId: currentUserId,
                        });
                        showToast('Report submitted. We\'ll review it.', 'success');
                      },
                    })),
                    { text: 'Cancel', style: 'cancel' as const },
                  ]);
                },
              });
              if (canModerateContent) {
                if (canPin) {
                  moderationOptions.push({
                    text: isPinned ? 'Unpin Post' : `Pin Post${pinnedPosts.size >= maxPinned && !isPinned ? ` (${maxPinned} max)` : ''}`,
                    onPress: async () => {
                      setActionSheet(null);
                      if (!isPinned && pinnedPosts.size >= maxPinned) {
                        Alert.alert(
                          'Pin Limit Reached',
                          `You can only pin ${maxPinned} post${maxPinned > 1 ? 's' : ''} with your current plan. Upgrade to Pro+ to pin up to 5 posts.`,
                          [{ text: 'OK' }]
                        );
                        return;
                      }
                      const newPinnedPosts = new Set(pinnedPosts);
                      if (isPinned) {
                        newPinnedPosts.delete(post.id);
                        setPinnedPosts(newPinnedPosts);
                        showToast('Post unpinned', 'success');
                      } else {
                        newPinnedPosts.add(post.id);
                        setPinnedPosts(newPinnedPosts);
                        showToast('Post pinned', 'success');
                      }
                      if (space) {
                        setSpace({ ...space, pinnedPosts: Array.from(newPinnedPosts) });
                      }
                    },
                  });
                }
                moderationOptions.push({
                  text: 'Hide Post',
                  onPress: () => {
                    setActionSheet(null);
                    const newHiddenPosts = new Set(hiddenPosts);
                    newHiddenPosts.add(post.id);
                    setHiddenPosts(newHiddenPosts);
                    showToast('Post hidden', 'success');
                  },
                });
                moderationOptions.push({
                  text: 'Delete Post',
                  style: 'destructive' as const,
                  onPress: () => {
                    setActionSheet(null);
                    Alert.alert(
                      'Delete Post',
                      'Are you sure you want to delete this post? This action cannot be undone.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            const newDeletedPosts = new Set(deletedPosts);
                            newDeletedPosts.add(post.id);
                            setDeletedPosts(newDeletedPosts);
                            if (isPinned) {
                              const newPinnedPosts = new Set(pinnedPosts);
                              newPinnedPosts.delete(post.id);
                              setPinnedPosts(newPinnedPosts);
                            }
                            showToast('Post deleted', 'success');
                          },
                        },
                      ]
                    );
                  },
                });
              }

              if (post.author) {
                getReportBlockOptions({
                  id: post.author.id,
                  name: post.author.name,
                  handle: post.author.handle,
                  avatar: post.author.avatar,
                }).forEach((opt) => {
                  moderationOptions.push({
                    text: opt.text,
                    style: opt.style,
                    onPress: () => {
                      setActionSheet(null);
                      opt.onPress();
                    },
                  });
                });
              }
              moderationOptions.push({
                text: 'View Author',
                onPress: () => {
                  setActionSheet(null);
                  router.push(`/profile/${post.author?.id || ''}`);
                },
              });
              moderationOptions.push({ 
                text: 'Cancel', 
                style: 'cancel' as const, 
                onPress: () => setActionSheet(null) 
              });

              setActionSheet({
                title: 'Moderate Post',
                message: `Post by ${post.author.name}`,
                options: moderationOptions,
              });
            };

            return (
              <View
                key={post.id}
                style={[
                  styles.postWrapper,
                  isPinned && [styles.pinnedPostWrapper, { borderLeftColor: colors.primary }],
                ]}
              >
                {(canModerateContent || (post.author && getReportBlockOptions(post.author).length > 0)) && (
                  <TouchableOpacity
                    style={styles.postModerationButton}
                    onPress={handleModeration}
                    activeOpacity={0.7}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    <IconSymbol name="ellipsis-horizontal" size={18} color={colors.secondary} />
                  </TouchableOpacity>
                )}
                <View pointerEvents="box-none">
                  <PostCard
                    post={post}
                    onLike={() => {}}
                    onSave={() => {}}
                    onComment={() => {}}
                    onPress={() => router.push(`/thread/${post.id}`)}
                    onLongPress={(p) => {
                      if (!p.author) return;
                      const opts = getReportBlockOptions({ id: p.author.id, name: p.author.name, handle: p.author.handle, avatar: p.author.avatar });
                      if (opts.length === 0) return;
                      setActionSheet({
                        title: 'Options',
                        options: [...opts.map((o) => ({ text: o.text, style: o.style, onPress: () => { setActionSheet(null); o.onPress(); } })), { text: 'Cancel', style: 'cancel' as const, onPress: () => setActionSheet(null) }],
                      });
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Filter and search members - must be at component level
  const filteredMembers = useMemo(() => {
    if (!members.length) return [];
    
    let filtered = [...members];
    
    return filtered;
  }, [members]);

  // Filter and sort posts - must be at component level
  const visiblePosts = useMemo(() => {
    return posts
      .filter(post => !hiddenPosts.has(post.id) && !deletedPosts.has(post.id) && !removedPostIds.has(post.id))
      .sort((a, b) => {
        const aPinned = pinnedPosts.has(a.id);
        const bPinned = pinnedPosts.has(b.id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [posts, pinnedPosts, hiddenPosts, deletedPosts, removedPostIds]);

  const renderMembersTab = () => {
    if (!isJoined) {
      return (
        <View style={[styles.emptyTab, { backgroundColor: colors.spaceBackground }]}>
          <IconSymbol name="lock-closed-outline" size={48} color={colors.secondary} />
          <Text style={[styles.emptyTabText, { color: colors.text }]}>Join to see members</Text>
        </View>
      );
    }

    if (loadingTab) {
      return (
        <View style={styles.center}>
          <Text style={{ color: colors.secondary }}>Loading members...</Text>
        </View>
      );
    }

    const isOwner = space?.ownerId === mockUsers[0].id || space?.ownerId === `user-${mockUsers[0].id}`;
    const isAdmin = space?.memberRole === 'admin';
    const isModerator = space?.memberRole === 'moderator';
    const canManageMembers = isOwner || isAdmin || isModerator;
    const isOwnerOrAdmin = isOwner || isAdmin;
    
    // Use filtered members for grouping
    const groupedMembers = {
      owner: filteredMembers.filter(m => m.role === 'owner'),
      admin: filteredMembers.filter(m => m.role === 'admin'),
      moderator: filteredMembers.filter(m => m.role === 'moderator'),
      member: filteredMembers.filter(m => m.role === 'member'),
    };

    const filteredGroupedMembers = {
      owner: filteredMembers.filter(m => m.role === 'owner'),
      admin: filteredMembers.filter(m => m.role === 'admin'),
      moderator: filteredMembers.filter(m => m.role === 'moderator'),
      member: filteredMembers.filter(m => m.role === 'member'),
    };

    return (
      <View style={styles.membersContainer}>
        {/* Owner Tools */}
        {canManageMembers && selectedMembers.size > 0 && (
          <View style={[styles.memberToolsBar, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <TouchableOpacity
                style={[styles.bulkActionButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  haptics.medium();
                  setActionSheet({
                    title: 'Bulk Actions',
                    message: `${selectedMembers.size} members selected`,
                    options: [
                      { text: 'Promote to Moderator', onPress: () => {
                        setActionSheet(null);
                        showToast(`${selectedMembers.size} members promoted`, 'success');
                        setSelectedMembers(new Set());
                      }},
                      { text: 'Remove from Space', style: 'destructive' as const, onPress: () => {
                        setActionSheet(null);
                        showToast(`${selectedMembers.size} members removed`, 'success');
                        setSelectedMembers(new Set());
                      }},
                      { text: 'Export Selected', onPress: () => {
                        setActionSheet(null);
                        showToast('Export feature coming soon', 'success');
                      }},
                      { text: 'Cancel', style: 'cancel' as const, onPress: () => {
                        setActionSheet(null);
                        setSelectedMembers(new Set());
                      }},
                    ],
                  });
                }}
                activeOpacity={0.7}>
                <Text style={[styles.bulkActionText, { color: '#FFFFFF' }]}>
                  {selectedMembers.size} Selected
                </Text>
              </TouchableOpacity>
          </View>
        )}

        {filteredGroupedMembers.owner.length > 0 && (
          <View style={styles.memberGroup}>
            <Text style={[styles.memberGroupTitle, { color: colors.text }]}>Owner</Text>
            {groupedMembers.owner.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[styles.memberCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                onPress={() => {
                  haptics.light();
                  router.push(`/profile/${member.user.id}`);
                }}
                activeOpacity={0.7}>
                <ExpoImage source={{ uri: member.user.avatar || '' }} style={styles.memberAvatar} />
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.text }]}>{member.user.name}</Text>
                  <Text style={[styles.memberHandle, { color: colors.secondary }]}>{member.user.handle}</Text>
                </View>
                {member.isOnline && <View style={[styles.onlineIndicator, { backgroundColor: '#4ADE80' }]} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
        {groupedMembers.admin.length > 0 && (
          <View style={styles.memberGroup}>
            <Text style={[styles.memberGroupTitle, { color: colors.text }]}>Admins</Text>
            {groupedMembers.admin.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[styles.memberCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                onPress={() => {
                  haptics.light();
                  router.push(`/profile/${member.user.id}`);
                }}
                activeOpacity={0.7}>
                <ExpoImage source={{ uri: member.user.avatar || '' }} style={styles.memberAvatar} />
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.text }]}>{member.user.name}</Text>
                  <Text style={[styles.memberHandle, { color: colors.secondary }]}>{member.user.handle}</Text>
                </View>
                {member.isOnline && <View style={[styles.onlineIndicator, { backgroundColor: '#4ADE80' }]} />}
                {canManageMembers && (
                  <TouchableOpacity
                    style={styles.memberActionButton}
                    onPress={() => {
                      haptics.light();
                      const isOwnerCur = space?.ownerId === mockUsers[0].id || space?.ownerId === `user-${mockUsers[0].id}`;
                      const isAdminCur = space?.memberRole === 'admin';
                      const isModeratorCur = space?.memberRole === 'moderator';
                      const options: any[] = [];
                      if (member.role !== 'owner') {
                        if (member.role !== 'admin' && isOwnerCur) options.push({ text: 'Promote to Admin', onPress: () => handleMemberAction(member, 'promote_admin') });
                        if (member.role !== 'moderator' && member.role !== 'admin' && (isOwnerCur || isAdminCur)) options.push({ text: 'Promote to Moderator', onPress: () => handleMemberAction(member, 'promote_moderator') });
                        const canDemote = (member.role === 'moderator' || member.role === 'admin') && (isOwnerCur || isAdminCur || (isModeratorCur && member.role === 'moderator'));
                        if (canDemote) options.push({ text: 'Demote to Member', onPress: () => handleMemberAction(member, 'demote') });
                        options.push({ text: 'View Activity', onPress: () => { setActionSheet(null); setActionSheet({ title: 'Member Activity', message: `${member.user.name}\n\nPosts: ${Math.floor(Math.random() * 20)}\nComments: ${Math.floor(Math.random() * 50)}\nLast Active: ${Math.floor(Math.random() * 24)}h ago`, options: [{ text: 'OK', onPress: () => setActionSheet(null) }] }); }});
                        options.push({ text: 'Kick', style: 'destructive' as const, onPress: () => handleMemberAction(member, 'kick') });
                        options.push({ text: 'Ban', style: 'destructive' as const, onPress: () => handleMemberAction(member, 'ban') });
                      }
                      options.push({ text: 'Cancel', style: 'cancel' as const });
                      setActionSheet({ title: 'Member Actions', message: member.user.name, options: options.map(opt => ({ ...opt, onPress: () => { setActionSheet(null); opt.onPress(); } })) });
                    }}
                    activeOpacity={0.7}>
                    <IconSymbol name="ellipsis-horizontal" size={16} color={colors.secondary} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
        {groupedMembers.moderator.length > 0 && (
          <View style={styles.memberGroup}>
            <Text style={[styles.memberGroupTitle, { color: colors.text }]}>Moderators</Text>
            {groupedMembers.moderator.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[styles.memberCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                onPress={() => {
                  haptics.light();
                  router.push(`/profile/${member.user.id}`);
                }}
                activeOpacity={0.7}>
                <ExpoImage source={{ uri: member.user.avatar || '' }} style={styles.memberAvatar} />
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.text }]}>{member.user.name}</Text>
                  <Text style={[styles.memberHandle, { color: colors.secondary }]}>{member.user.handle}</Text>
                </View>
                {member.isOnline && <View style={[styles.onlineIndicator, { backgroundColor: '#4ADE80' }]} />}
                {canManageMembers && (
                  <TouchableOpacity
                    style={styles.memberActionButton}
                    onPress={() => {
                      haptics.light();
                      const isOwnerCur = space?.ownerId === mockUsers[0].id || space?.ownerId === `user-${mockUsers[0].id}`;
                      const isAdminCur = space?.memberRole === 'admin';
                      const isModeratorCur = space?.memberRole === 'moderator';
                      const options: any[] = [];
                      if (member.role !== 'owner') {
                        if (member.role !== 'admin' && isOwnerCur) options.push({ text: 'Promote to Admin', onPress: () => handleMemberAction(member, 'promote_admin') });
                        if (member.role !== 'moderator' && member.role !== 'admin' && (isOwnerCur || isAdminCur)) options.push({ text: 'Promote to Moderator', onPress: () => handleMemberAction(member, 'promote_moderator') });
                        const canDemote = (member.role === 'moderator' || member.role === 'admin') && (isOwnerCur || isAdminCur || (isModeratorCur && member.role === 'moderator'));
                        if (canDemote) options.push({ text: 'Demote to Member', onPress: () => handleMemberAction(member, 'demote') });
                        options.push({ text: 'View Activity', onPress: () => { setActionSheet(null); setActionSheet({ title: 'Member Activity', message: `${member.user.name}\n\nPosts: ${Math.floor(Math.random() * 20)}\nComments: ${Math.floor(Math.random() * 50)}\nLast Active: ${Math.floor(Math.random() * 24)}h ago`, options: [{ text: 'OK', onPress: () => setActionSheet(null) }] }); }});
                        options.push({ text: 'Kick', style: 'destructive' as const, onPress: () => handleMemberAction(member, 'kick') });
                        options.push({ text: 'Ban', style: 'destructive' as const, onPress: () => handleMemberAction(member, 'ban') });
                      }
                      options.push({ text: 'Cancel', style: 'cancel' as const });
                      setActionSheet({ title: 'Member Actions', message: member.user.name, options: options.map(opt => ({ ...opt, onPress: () => { setActionSheet(null); opt.onPress(); } })) });
                    }}
                    activeOpacity={0.7}>
                    <IconSymbol name="ellipsis-horizontal" size={16} color={colors.secondary} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
        {groupedMembers.member.length > 0 && (
          <View style={styles.memberGroup}>
            <View style={styles.memberGroupHeader}>
              <Text style={[styles.memberGroupTitle, { color: colors.text }]}>Members ({groupedMembers.member.length})</Text>
              {isOwnerOrAdmin && (
                <TouchableOpacity
                  style={[styles.inviteButton, { backgroundColor: colors.primary + '15' }]}
                  onPress={() => {
                    haptics.light();
                    openInviteMembersSheet();
                  }}
                  activeOpacity={0.7}>
                  <IconSymbol name="person-add" size={14} color={colors.primary} />
                  <Text style={[styles.inviteButtonText, { color: colors.primary }]}>Invite</Text>
                </TouchableOpacity>
              )}
            </View>
            {filteredGroupedMembers.member.slice(0, 50).map((member) => {
              const isSelected = selectedMembers.has(member.id);
              return (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberCard,
                    {
                      backgroundColor: isSelected ? colors.primary + '10' : colors.cardBackground,
                      borderColor: isSelected ? colors.primary : colors.cardBorder,
                      borderWidth: isSelected ? 2 : StyleSheet.hairlineWidth,
                    }
                  ]}
                  onPress={() => {
                    haptics.light();
                    router.push(`/profile/${member.user.id}`);
                  }}
                  onLongPress={() => {
                    if (isOwnerOrAdmin) {
                      haptics.medium();
                      const newSelected = new Set(selectedMembers);
                      if (isSelected) {
                        newSelected.delete(member.id);
                      } else {
                        newSelected.add(member.id);
                      }
                      setSelectedMembers(newSelected);
                    }
                  }}
                  activeOpacity={0.7}>
                  {canManageMembers && (
                    <TouchableOpacity
                      style={styles.memberSelectCheckbox}
                      onPress={() => {
                        haptics.light();
                        const newSelected = new Set(selectedMembers);
                        if (isSelected) {
                          newSelected.delete(member.id);
                        } else {
                          newSelected.add(member.id);
                        }
                        setSelectedMembers(newSelected);
                      }}
                      activeOpacity={0.7}>
                      <View style={[
                        styles.checkbox,
                        {
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                          borderColor: isSelected ? colors.primary : colors.cardBorder,
                        }
                      ]}>
                        {isSelected && (
                          <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                  <ExpoImage source={{ uri: member.user.avatar || '' }} style={styles.memberAvatar} />
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.text }]}>{member.user.name}</Text>
                    <Text style={[styles.memberHandle, { color: colors.secondary }]}>{member.user.handle}</Text>
                  </View>
                  {member.isOnline && <View style={[styles.onlineIndicator, { backgroundColor: '#4ADE80' }]} />}
                  {canManageMembers && (
                    <TouchableOpacity
                      style={styles.memberActionButton}
                      onPress={() => {
                        haptics.light();
                        const isOwnerCur = space?.ownerId === mockUsers[0].id || space?.ownerId === `user-${mockUsers[0].id}`;
                        const isAdminCur = space?.memberRole === 'admin';
                        const isModeratorCur = space?.memberRole === 'moderator';
                        const options: any[] = [];
                        if (member.role !== 'owner') {
                          if (member.role !== 'admin' && isOwnerCur) {
                            options.push({ text: 'Promote to Admin', onPress: () => handleMemberAction(member, 'promote_admin') });
                          }
                          if (member.role !== 'moderator' && member.role !== 'admin' && (isOwnerCur || isAdminCur)) {
                            options.push({ text: 'Promote to Moderator', onPress: () => handleMemberAction(member, 'promote_moderator') });
                          }
                          const canDemote = (member.role === 'moderator' || member.role === 'admin') && (isOwnerCur || isAdminCur || (isModeratorCur && member.role === 'moderator'));
                          if (canDemote) {
                            options.push({ text: 'Demote to Member', onPress: () => handleMemberAction(member, 'demote') });
                          }
                          options.push({ text: 'View Activity', onPress: () => {
                            setActionSheet(null);
                            setActionSheet({
                              title: 'Member Activity',
                              message: `${member.user.name}\n\nPosts: ${Math.floor(Math.random() * 20)}\nComments: ${Math.floor(Math.random() * 50)}\nLast Active: ${Math.floor(Math.random() * 24)}h ago`,
                              options: [{ text: 'OK', onPress: () => setActionSheet(null) }],
                            });
                          }});
                          options.push({ text: 'Kick', style: 'destructive' as const, onPress: () => handleMemberAction(member, 'kick') });
                          options.push({ text: 'Ban', style: 'destructive' as const, onPress: () => handleMemberAction(member, 'ban') });
                        }
                        options.push({ text: 'Cancel', style: 'cancel' as const });
                        setActionSheet({
                          title: 'Member Actions',
                          message: member.user.name,
                          options: options.map(opt => ({
                            ...opt,
                            onPress: () => {
                              setActionSheet(null);
                              opt.onPress();
                            },
                          })),
                        });
                      }}
                      activeOpacity={0.7}>
                      <IconSymbol name="ellipsis-horizontal" size={16} color={colors.secondary} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderEventsTab = () => {
    const isOwner = space?.ownerId === mockUsers[0].id || space?.ownerId === `user-${mockUsers[0].id}`;
    const isAdmin = space?.memberRole === 'admin';
    const canCreateEvents = isOwner || isAdmin;

    if (!isJoined) {
      return (
        <View style={[styles.emptyTab, { backgroundColor: colors.spaceBackground }]}>
          <IconSymbol name="lock-closed-outline" size={48} color={colors.secondary} />
          <Text style={[styles.emptyTabText, { color: colors.text }]}>Join to see events</Text>
        </View>
      );
    }

    if (loadingTab) {
      return (
        <View style={styles.center}>
          <Text style={{ color: colors.secondary }}>Loading events...</Text>
        </View>
      );
    }

    return (
      <View style={styles.eventsContainer}>
        {canCreateEvents && (
          <TouchableOpacity
            style={[styles.addEventButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
            onPress={() => {
              haptics.light();
              setNewEventTitle('');
              setNewEventDescription('');
              setNewEventDate('');
              setNewEventLocation('');
              setNewEventIsOnline(false);
              setShowEventModal(true);
            }}
            activeOpacity={0.7}>
            <IconSymbol name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.addEventButtonText, { color: colors.primary }]}>Create Event</Text>
          </TouchableOpacity>
        )}

        {events.length === 0 ? (
          <View style={[styles.emptyTab, { backgroundColor: colors.spaceBackground }]}>
            <IconSymbol name="calendar-outline" size={48} color={colors.secondary} />
            <Text style={[styles.emptyTabText, { color: colors.text }]}>No upcoming events</Text>
            <Text style={[styles.emptyTabSubtext, { color: colors.secondary }]}>
              {canCreateEvents ? 'Create an event to get started' : 'Check back later for space events and meetups'}
            </Text>
          </View>
        ) : (
          [...events]
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .map((event) => {
          const startDate = new Date(event.startTime);
          const isJoined = joinedEventIds.has(event.id) || (event.attendees && event.attendees.includes(mockUsers[0].id));
          return (
            <TouchableOpacity
              key={event.id}
              style={[styles.eventCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
              onPress={() => {
                haptics.light();
                setSelectedEvent(event);
              }}
              activeOpacity={0.7}>
              <View style={[styles.eventDate, { backgroundColor: categoryColor + '15' }]}>
                <Text style={[styles.eventDay, { color: categoryColor }]}>
                  {startDate.getDate()}
                </Text>
                <Text style={[styles.eventMonth, { color: categoryColor }]}>
                  {startDate.toLocaleDateString('en-US', { month: 'short' })}
                </Text>
              </View>
              <View style={styles.eventContent}>
                <View style={styles.eventTitleRow}>
                  <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
                  {isJoined && (
                    <View style={[styles.eventJoinedBadge, { backgroundColor: colors.primary + '20' }]}>
                      <IconSymbol name="checkmark-circle" size={12} color={colors.primary} />
                      <Text style={[styles.eventJoinedBadgeText, { color: colors.primary }]}>Joined</Text>
                    </View>
                  )}
                </View>
                {event.description && (
                  <Text style={[styles.eventDescription, { color: colors.secondary }]} numberOfLines={2}>
                    {event.description}
                  </Text>
                )}
                <View style={styles.eventMeta}>
                  {event.isOnline ? (
                    <View style={styles.eventMetaRow}>
                      <IconSymbol name="videocam-outline" size={12} color={colors.secondary} />
                      <Text style={[styles.eventMetaText, { color: colors.secondary }]}>Online</Text>
                    </View>
                  ) : (
                    <View style={styles.eventMetaRow}>
                      <IconSymbol name="location-outline" size={12} color={colors.secondary} />
                      <Text style={[styles.eventMetaText, { color: colors.secondary }]} numberOfLines={1}>{event.location}</Text>
                    </View>
                  )}
                  <View style={styles.eventMetaRow}>
                    <IconSymbol name="people-outline" size={12} color={colors.secondary} />
                    <Text style={[styles.eventMetaText, { color: colors.secondary }]}>
                      {event.attendees?.length || 0}{event.maxAttendees ? `/${event.maxAttendees}` : ''} attending
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
        )}
      </View>
    );
  };

  const openResourceUrl = useCallback(async (resource: { url?: string; title: string }) => {
    const raw = (resource.url || '').trim();
    if (!raw) return;
    const isFile = raw.startsWith('file://');
    const url = isFile ? raw : (raw.match(/^https?:\/\//i) ? raw : `https://${raw}`);
    try {
      if (isFile) {
        await Linking.openURL(url);
      } else {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          showToast('Cannot open this link', 'error');
        }
      }
    } catch {
      showToast(isFile ? 'Could not open file' : 'Could not open link', 'error');
    }
  }, [showToast]);

  const renderResourcesTab = () => {
    if (!space) return null;
    const isOwner = space?.ownerId === mockUsers[0].id || space?.ownerId === `user-${mockUsers[0].id}`;
    const isAdmin = space?.memberRole === 'admin';
    const canCreateResources = isOwner || isAdmin;

    return (
      <View style={styles.resourcesContainer}>
        {canCreateResources && (
          <TouchableOpacity
            style={[styles.addResourceButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
            onPress={() => {
              haptics.light();
              setNewResourceTitle('');
              setNewResourceUrl('');
              setNewResourceDescription('');
              setNewResourceMode('link');
              setNewResourcePickedFile(null);
              setShowResourceModal(true);
            }}
            activeOpacity={0.7}>
            <IconSymbol name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.addResourceButtonText, { color: colors.primary }]}>Add Resource</Text>
          </TouchableOpacity>
        )}

        {(!space.pinnedResources || space.pinnedResources.length === 0) ? (
          <View style={[styles.emptyTab, { backgroundColor: colors.spaceBackground }]}>
            <IconSymbol name="bookmark-outline" size={48} color={colors.secondary} />
            <Text style={[styles.emptyTabText, { color: colors.text }]}>No resources yet</Text>
            <Text style={[styles.emptyTabSubtext, { color: colors.secondary }]}>
              {canCreateResources ? 'Add resources to share with members' : 'Pinned resources will appear here'}
            </Text>
          </View>
        ) : (
          space.pinnedResources.map((resource) => (
            <TouchableOpacity
              key={resource.id}
              style={[styles.resourceCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
              activeOpacity={0.7}
              onPress={() => resource.url && openResourceUrl(resource)}
              onLongPress={canCreateResources ? () => {
                haptics.light();
                setActionSheet({
                  title: resource.title,
                  message: 'Remove this resource from the space?',
                  options: [
                    { text: 'Cancel', style: 'cancel', onPress: () => setActionSheet(null) },
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: async () => {
                        setActionSheet(null);
                        if (!space?.id) return;
                        setResourceActionLoading(true);
                        try {
                          const updated = await removeSpaceResource(space.id, resource.id);
                          if (updated) {
                            setSpace(prev => prev ? { ...prev, pinnedResources: updated.pinnedResources } : updated);
                            showToast('Resource removed', 'success');
                          }
                        } catch {
                          showToast('Failed to remove resource', 'error');
                        } finally {
                          setResourceActionLoading(false);
                        }
                      },
                    },
                  ],
                });
              } : undefined}
              accessibilityLabel={`${resource.title}${resource.description ? `, ${resource.description}` : ''}. Opens in browser.`}
              accessibilityRole="link">
              <View style={[styles.resourceIcon, { backgroundColor: categoryColor + '15' }]}>
                <IconSymbol
                  name={resource.type === 'link' ? 'link-outline' : resource.type === 'video' ? 'videocam-outline' : 'document-outline'}
                  size={20}
                  color={categoryColor}
                />
              </View>
              <View style={styles.resourceContent}>
                <Text style={[styles.resourceTitle, { color: colors.text }]}>{resource.title}</Text>
                {resource.description ? (
                  <Text style={[styles.resourceDescription, { color: colors.secondary }]} numberOfLines={2}>
                    {resource.description}
                  </Text>
                ) : null}
                {resource.url ? (
                  <Text style={[styles.resourceUrlHint, { color: colors.secondary }]} numberOfLines={1}>
                    {resource.url.startsWith('file://') ? 'File (opens on device)' : resource.url.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
                  </Text>
                ) : null}
              </View>
              <IconSymbol name="open-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  const renderRequestsTab = () => {
    if (!space || (space.memberRole !== 'owner' && space.memberRole !== 'admin')) {
      return (
        <View style={[styles.emptyTab, { backgroundColor: colors.spaceBackground }]}>
          <IconSymbol name="lock-closed-outline" size={48} color={colors.secondary} />
          <Text style={[styles.emptyTabText, { color: colors.text }]}>Access Denied</Text>
          <Text style={[styles.emptyTabSubtext, { color: colors.secondary }]}>
            Only owners and admins can view join requests
          </Text>
        </View>
      );
    }

    if (loadingTab) {
      return (
        <View style={styles.center}>
          <Text style={{ color: colors.secondary }}>Loading requests...</Text>
        </View>
      );
    }

    if (joinRequests.length === 0) {
      return (
        <View style={[styles.emptyTab, { backgroundColor: colors.spaceBackground }]}>
          <IconSymbol name="mail-outline" size={48} color={colors.secondary} />
          <Text style={[styles.emptyTabText, { color: colors.text }]}>No pending requests</Text>
          <Text style={[styles.emptyTabSubtext, { color: colors.secondary }]}>
            All join requests have been reviewed
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.requestsContainer}>
        <View style={[styles.requestsHeader, { borderBottomColor: colors.cardBorder }]}>
          <Text style={[styles.requestsHeaderTitle, { color: colors.text }]}>
            {joinRequests.length} Pending {joinRequests.length === 1 ? 'Request' : 'Requests'}
          </Text>
        </View>
        {joinRequests.map((request) => (
          <View key={request.id} style={[styles.requestCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <View style={styles.requestHeader}>
              <ExpoImage source={{ uri: request.user.avatar || '' }} style={styles.requestAvatar} />
              <View style={styles.requestUserInfo}>
                <Text style={[styles.requestUserName, { color: colors.text }]}>{request.user.name}</Text>
                <Text style={[styles.requestUserHandle, { color: colors.secondary }]}>{request.user.handle}</Text>
              </View>
              <Text style={[styles.requestTime, { color: colors.secondary }]}>
                {formatRequestTime(request.requestedAt)}
              </Text>
            </View>
            {request.message && (
              <View style={[styles.requestMessageContainer, { backgroundColor: colors.spaceBackground }]}>
                <Text style={[styles.requestMessage, { color: colors.text }]}>{request.message}</Text>
              </View>
            )}
            <View style={styles.requestActions}>
              <TouchableOpacity
                style={[styles.requestActionButton, styles.rejectButton, { borderColor: colors.cardBorder }]}
                onPress={() => handleRejectRequest(request.id)}
                activeOpacity={0.7}>
                <IconSymbol name="close-circle" size={16} color={colors.error} />
                <Text style={[styles.requestActionText, { color: colors.error }]}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.requestActionButton, styles.approveButton, { backgroundColor: colors.primary }]}
                onPress={() => handleApproveRequest(request.id)}
                activeOpacity={0.7}>
                <IconSymbol name="checkmark-circle" size={16} color="#FFFFFF" />
                <Text style={[styles.requestActionText, { color: '#FFFFFF' }]}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const formatRequestTime = useCallback((requestedAt: string): string => {
    const now = new Date();
    const requested = new Date(requestedAt);
    const diffMs = now.getTime() - requested.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }, []);

  const renderLogsTab = () => {
    if (!isJoined) {
      return (
        <View style={[styles.emptyTab, { backgroundColor: colors.spaceBackground }]}>
          <IconSymbol name="lock-closed-outline" size={48} color={colors.secondary} />
          <Text style={[styles.emptyTabText, { color: colors.text }]}>Join to see moderation logs</Text>
        </View>
      );
    }

    const isOwner = space?.ownerId === mockUsers[0].id || space?.ownerId === `user-${mockUsers[0].id}`;
    const isAdmin = space?.memberRole === 'admin';
    if (!isOwner && !isAdmin) {
      return (
        <View style={[styles.emptyTab, { backgroundColor: colors.spaceBackground }]}>
          <IconSymbol name="shield-outline" size={48} color={colors.secondary} />
          <Text style={[styles.emptyTabText, { color: colors.text }]}>Only owners and admins can view logs</Text>
        </View>
      );
    }

    if (loadingTab) {
      return (
        <View style={styles.center}>
          <Text style={{ color: colors.secondary }}>Loading logs...</Text>
        </View>
      );
    }

    const getLogIcon = (type: string) => {
      switch (type) {
        case 'message_deleted': return 'trash-outline';
        case 'member_kicked': return 'person-remove-outline';
        case 'member_banned': return 'ban-outline';
        case 'member_promoted': return 'arrow-up-circle-outline';
        case 'member_demoted': return 'arrow-down-circle-outline';
        case 'channel_created': return 'add-circle-outline';
        case 'channel_deleted': return 'remove-circle-outline';
        default: return 'document-text-outline';
      }
    };

    const getLogColor = (type: string) => {
      if (type.includes('deleted') || type.includes('banned') || type.includes('kicked')) {
        return colors.error;
      }
      if (type.includes('promoted') || type.includes('created')) {
        return '#4ADE80';
      }
      return colors.secondary;
    };

    const formatLogTime = (timestamp: string) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      
      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      const minutes = Math.floor(diff / (1000 * 60));
      if (minutes > 0) return `${minutes}m ago`;
      return 'Just now';
    };

    return (
      <View style={styles.logsContainer}>
        <View style={[styles.logsHeader, { borderBottomColor: colors.cardBorder }]}>
          <Text style={[styles.logsHeaderTitle, { color: colors.text }]}>
            Moderation Logs
          </Text>
          <Text style={[styles.logsHeaderSubtitle, { color: colors.secondary }]}>
            {moderationLogs.length} {moderationLogs.length === 1 ? 'action' : 'actions'}
          </Text>
        </View>
        {moderationLogs.length === 0 ? (
          <View style={[styles.emptyTab, { backgroundColor: colors.spaceBackground }]}>
            <IconSymbol name="document-text-outline" size={48} color={colors.secondary} />
            <Text style={[styles.emptyTabText, { color: colors.text }]}>No moderation actions yet</Text>
          </View>
        ) : (
          moderationLogs.map((log) => (
            <View key={log.id} style={[styles.logCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <View style={styles.logHeader}>
                <View style={[styles.logIconContainer, { backgroundColor: getLogColor(log.type) + '15' }]}>
                  <IconSymbol name={getLogIcon(log.type)} size={18} color={getLogColor(log.type)} />
                </View>
                <View style={styles.logContent}>
                  <Text style={[styles.logType, { color: colors.text }]}>
                    {log.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Text>
                  {log.reason && (
                    <Text style={[styles.logReason, { color: colors.secondary }]}>
                      {log.reason}
                    </Text>
                  )}
                </View>
                <Text style={[styles.logTime, { color: colors.secondary }]}>
                  {formatLogTime(log.timestamp)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderRulesTab = () => {
    if (!space) return null;
    if (!space.rules || space.rules.length === 0) {
      return (
        <View style={[styles.emptyTab, { backgroundColor: colors.spaceBackground }]}>
          <IconSymbol name="document-text-outline" size={48} color={colors.secondary} />
          <Text style={[styles.emptyTabText, { color: colors.text }]}>No rules set</Text>
        </View>
      );
    }

    return (
      <View style={styles.rulesContainer}>
        {space.guidelines && (
          <View style={[styles.guidelinesCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <Text style={[styles.guidelinesTitle, { color: colors.text }]}>Guidelines</Text>
            <Text style={[styles.guidelinesText, { color: colors.secondary }]}>{space.guidelines}</Text>
          </View>
        )}
        <View style={[styles.rulesCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <Text style={[styles.rulesTitle, { color: colors.text }]}>Community Rules</Text>
          {space.rules.map((rule, index) => (
            <View key={index} style={styles.ruleItem}>
              <View style={[styles.ruleNumber, { backgroundColor: categoryColor + '15' }]}>
                <Text style={[styles.ruleNumberText, { color: categoryColor }]}>{index + 1}</Text>
              </View>
              <Text style={[styles.ruleText, { color: colors.text }]}>{rule}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderAnalyticsTab = () => {
    const isOwner = space?.ownerId === mockUsers[0].id || space?.ownerId === `user-${mockUsers[0].id}`;
    const isAdmin = space?.memberRole === 'admin';
    
    if (!isOwner && !isAdmin) {
      return (
        <View style={[styles.emptyTab, { backgroundColor: colors.spaceBackground }]}>
          <IconSymbol name="lock-closed-outline" size={48} color={colors.secondary} />
          <Text style={[styles.emptyTabText, { color: colors.text }]}>Access Denied</Text>
          <Text style={[styles.emptyTabSubtext, { color: colors.secondary }]}>
            Only owners and admins can view analytics
          </Text>
        </View>
      );
    }

    // Space analytics is Pro+ only
    if (subscriptionTier !== 'pro-plus') {
      return (
        <View style={[styles.emptyTab, { backgroundColor: colors.spaceBackground }]}>
          <IconSymbol name="lock-closed-outline" size={48} color={colors.secondary} />
          <Text style={[styles.emptyTabText, { color: colors.text }]}>Pro+ Required</Text>
          <Text style={[styles.emptyTabSubtext, { color: colors.secondary }]}>
            Space analytics is available for Pro+ subscribers. Upgrade to unlock detailed insights about your space.
          </Text>
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/settings/subscription-info')}
            activeOpacity={0.7}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Pro+</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Mock analytics data
    const analytics = {
      totalPosts: posts.length,
      totalMembers: space.memberCount,
      activeMembers: Math.floor(space.memberCount * 0.3),
      newMembersThisWeek: Math.floor(Math.random() * 50 + 10),
      growthRate: Math.floor(Math.random() * 30 + 10),
      engagementRate: Math.floor(Math.random() * 40 + 20),
      avgPostsPerDay: (posts.length / 30).toFixed(1),
      totalChannels: space.channels?.length || 0,
      activeChannels: Math.floor((space.channels?.length || 0) * 0.7),
      pendingRequests: joinRequests.length,
    };

    return (
      <ScrollView style={styles.analyticsContainer} showsVerticalScrollIndicator={false}>
        {/* Overview Cards */}
        <View style={styles.analyticsOverview}>
          <View style={[styles.analyticsCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <View style={[styles.analyticsCardIcon, { backgroundColor: colors.primary + '15' }]}>
              <IconSymbol name="people-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.analyticsCardValue, { color: colors.text }]}>{analytics.totalMembers}</Text>
            <Text style={[styles.analyticsCardLabel, { color: colors.secondary }]}>Total Members</Text>
            <View style={styles.analyticsCardChange}>
              <IconSymbol name="arrow-up" size={12} color="#4ADE80" />
              <Text style={[styles.analyticsCardChangeText, { color: '#4ADE80' }]}>
                +{analytics.newMembersThisWeek} this week
              </Text>
            </View>
          </View>

          <View style={[styles.analyticsCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <View style={[styles.analyticsCardIcon, { backgroundColor: '#4ADE80' + '15' }]}>
              <IconSymbol name="newspaper-outline" size={20} color="#4ADE80" />
            </View>
            <Text style={[styles.analyticsCardValue, { color: colors.text }]}>{analytics.totalPosts}</Text>
            <Text style={[styles.analyticsCardLabel, { color: colors.secondary }]}>Total Posts</Text>
            <View style={styles.analyticsCardChange}>
              <IconSymbol name="trending-up" size={12} color="#4ADE80" />
              <Text style={[styles.analyticsCardChangeText, { color: '#4ADE80' }]}>
                {analytics.avgPostsPerDay} per day
              </Text>
            </View>
          </View>
        </View>

        {/* Engagement Metrics */}
        <View style={[styles.analyticsSection, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <Text style={[styles.analyticsSectionTitle, { color: colors.text }]}>Engagement</Text>
          <View style={styles.analyticsMetric}>
            <View style={styles.analyticsMetricLeft}>
              <IconSymbol name="flash-outline" size={16} color={colors.primary} />
              <Text style={[styles.analyticsMetricLabel, { color: colors.text }]}>Engagement Rate</Text>
            </View>
            <Text style={[styles.analyticsMetricValue, { color: colors.primary }]}>{analytics.engagementRate}%</Text>
          </View>
          <View style={styles.analyticsMetric}>
            <View style={styles.analyticsMetricLeft}>
              <IconSymbol name="people-outline" size={16} color="#4ADE80" />
              <Text style={[styles.analyticsMetricLabel, { color: colors.text }]}>Active Members</Text>
            </View>
            <Text style={[styles.analyticsMetricValue, { color: '#4ADE80' }]}>{analytics.activeMembers}</Text>
          </View>
          <View style={styles.analyticsMetric}>
            <View style={styles.analyticsMetricLeft}>
              <IconSymbol name="grid-outline" size={16} color={colors.secondary} />
              <Text style={[styles.analyticsMetricLabel, { color: colors.text }]}>Active Channels</Text>
            </View>
            <Text style={[styles.analyticsMetricValue, { color: colors.text }]}>{analytics.activeChannels}/{analytics.totalChannels}</Text>
          </View>
        </View>

        {/* Growth Metrics */}
        <View style={[styles.analyticsSection, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <Text style={[styles.analyticsSectionTitle, { color: colors.text }]}>Growth</Text>
          <View style={styles.analyticsMetric}>
            <View style={styles.analyticsMetricLeft}>
              <IconSymbol name="trending-up-outline" size={16} color="#F59E0B" />
              <Text style={[styles.analyticsMetricLabel, { color: colors.text }]}>Growth Rate</Text>
            </View>
            <Text style={[styles.analyticsMetricValue, { color: '#F59E0B' }]}>{analytics.growthRate}%</Text>
          </View>
          <View style={styles.analyticsMetric}>
            <View style={styles.analyticsMetricLeft}>
              <IconSymbol name="person-add-outline" size={16} color={colors.primary} />
              <Text style={[styles.analyticsMetricLabel, { color: colors.text }]}>New Members (Week)</Text>
            </View>
            <Text style={[styles.analyticsMetricValue, { color: colors.primary }]}>+{analytics.newMembersThisWeek}</Text>
          </View>
          <View style={styles.analyticsMetric}>
            <View style={styles.analyticsMetricLeft}>
              <IconSymbol name="mail-outline" size={16} color={colors.error} />
              <Text style={[styles.analyticsMetricLabel, { color: colors.text }]}>Pending Requests</Text>
            </View>
            <Text style={[styles.analyticsMetricValue, { color: colors.error }]}>{analytics.pendingRequests}</Text>
          </View>
        </View>

        {/* Channel Analytics */}
        {isOwner && space.channels && space.channels.length > 0 && (
          <View style={[styles.analyticsSection, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <Text style={[styles.analyticsSectionTitle, { color: colors.text }]}>Channel Activity</Text>
            {space.channels.slice(0, 5).map((channel) => {
              const channelPosts = Math.floor(Math.random() * 50);
              const channelActivity = Math.floor(Math.random() * 100);
              return (
                <View key={channel.id} style={styles.channelAnalyticsRow}>
                  <View style={styles.channelAnalyticsLeft}>
                    <IconSymbol name="chatbubble-outline" size={16} color={colors.primary} />
                    <Text style={[styles.channelAnalyticsName, { color: colors.text }]}>#{channel.name}</Text>
                  </View>
                  <View style={styles.channelAnalyticsStats}>
                    <Text style={[styles.channelAnalyticsStat, { color: colors.secondary }]}>
                      {channelPosts} posts
                    </Text>
                    <Text style={[styles.channelAnalyticsStat, { color: colors.secondary }]}>
                      {channelActivity}% active
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Content Moderation Stats */}
        {isOwner && (
          <View style={[styles.analyticsSection, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <Text style={[styles.analyticsSectionTitle, { color: colors.text }]}>Moderation</Text>
            <View style={styles.analyticsMetric}>
              <View style={styles.analyticsMetricLeft}>
                <IconSymbol name="shield-checkmark-outline" size={16} color="#4ADE80" />
                <Text style={[styles.analyticsMetricLabel, { color: colors.text }]}>Actions This Week</Text>
              </View>
              <Text style={[styles.analyticsMetricValue, { color: '#4ADE80' }]}>{moderationLogs.length}</Text>
            </View>
            <View style={styles.analyticsMetric}>
              <View style={styles.analyticsMetricLeft}>
                <IconSymbol name="ban-outline" size={16} color={colors.error} />
                <Text style={[styles.analyticsMetricLabel, { color: colors.text }]}>Banned Members</Text>
              </View>
              <Text style={[styles.analyticsMetricValue, { color: colors.error }]}>0</Text>
            </View>
            <View style={styles.analyticsMetric}>
              <View style={styles.analyticsMetricLeft}>
                <IconSymbol name="flag-outline" size={16} color="#F59E0B" />
                <Text style={[styles.analyticsMetricLabel, { color: colors.text }]}>Reports Pending</Text>
              </View>
              <Text style={[styles.analyticsMetricValue, { color: '#F59E0B' }]}>0</Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        {isOwner && (
          <View style={[styles.analyticsSection, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <Text style={[styles.analyticsSectionTitle, { color: colors.text }]}>Quick Actions</Text>
            <TouchableOpacity
              style={[styles.analyticsAction, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}
              onPress={() => {
                haptics.light();
                setActiveTab('members');
              }}
              activeOpacity={0.7}>
              <IconSymbol name="people-outline" size={18} color={colors.primary} />
              <Text style={[styles.analyticsActionText, { color: colors.primary }]}>Manage Members</Text>
              <IconSymbol name="chevron-forward" size={16} color={colors.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.analyticsAction, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}
              onPress={() => {
                haptics.light();
                setActiveTab('requests');
              }}
              activeOpacity={0.7}>
              <IconSymbol name="mail-outline" size={18} color={colors.primary} />
              <Text style={[styles.analyticsActionText, { color: colors.primary }]}>Review Requests</Text>
              {analytics.pendingRequests > 0 && (
                <View style={[styles.analyticsActionBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.analyticsActionBadgeText}>{analytics.pendingRequests}</Text>
                </View>
              )}
              <IconSymbol name="chevron-forward" size={16} color={colors.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.analyticsAction, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}
              onPress={() => {
                haptics.light();
                router.push(`/space/${id}/settings`);
              }}
              activeOpacity={0.7}>
              <IconSymbol name="settings-outline" size={18} color={colors.primary} />
              <Text style={[styles.analyticsActionText, { color: colors.primary }]}>Space Settings</Text>
              <IconSymbol name="chevron-forward" size={16} color={colors.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.analyticsAction, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}
              onPress={() => {
                haptics.light();
                setActiveTab('logs');
              }}
              activeOpacity={0.7}>
              <IconSymbol name="clipboard-outline" size={18} color={colors.primary} />
              <Text style={[styles.analyticsActionText, { color: colors.primary }]}>Moderation Logs</Text>
              <IconSymbol name="chevron-forward" size={16} color={colors.secondary} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  };

  if (!loading && loadError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.center, { padding: Spacing.lg }]}>
          <View style={[styles.errorIconWrap, { backgroundColor: (colors.error || '#EF4444') + '18' }]}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error || '#EF4444'} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Couldn't load space</Text>
          <Text style={[styles.errorMessage, { color: colors.secondary }]}>{loadError}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={[styles.errorButton, { backgroundColor: colors.primary }]}
              onPress={() => { haptics.light(); loadSpace(true); }}
              activeOpacity={0.8}
              accessibilityLabel="Retry loading space"
              accessibilityRole="button">
              <Text style={styles.errorButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.errorButtonSecondary, { borderColor: colors.cardBorder }]}
              onPress={() => { haptics.light(); setLoadError(null); router.back(); }}
              activeOpacity={0.8}
              accessibilityLabel="Go back"
              accessibilityRole="button">
              <Text style={[styles.errorButtonSecondaryText, { color: colors.text }]}>Go back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (loading || !space) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.center}>
          <Text style={{ color: colors.secondary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryColor = space.color || colors.primary;

  // Channel view
  if (selectedChannel) {
    const channel = space.channels.find(c => c.id === selectedChannel);
    
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.channelHeader, { backgroundColor: colors.background, borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setSelectedChannel(null)}
            activeOpacity={0.7}>
            <IconSymbol name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.channelHeaderContent}>
            {space.iconImage ? (
              <ExpoImage source={{ uri: space.iconImage }} style={styles.channelHeaderIcon} contentFit="cover" />
            ) : (
              <View style={[styles.channelHeaderIcon, { backgroundColor: categoryColor + '20' }]}>
                <Text style={[styles.channelHeaderIconText, { color: categoryColor }]}>
                  {getSpaceInitials(space.name)}
                </Text>
              </View>
            )}
            <View style={styles.channelHeaderText}>
              <Text style={[styles.channelHeaderName, { color: colors.text }]} numberOfLines={1}>
                #{channel?.name}
              </Text>
              <Text style={[styles.channelHeaderSpace, { color: colors.secondary }]} numberOfLines={1}>
                {space.name}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.channelTabsBar, { backgroundColor: colors.background, borderBottomColor: colors.cardBorder }]}>
          <FlatList
            horizontal
            data={space.channels}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = selectedChannel === item.id;
              const channelUnread = (item as any).unreadCount || 0;
              const hasUnread = channelUnread > 0;
              return (
                <TouchableOpacity
                  style={[
                    styles.channelTab,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.spaceBackground,
                      borderColor: hasUnread && !isSelected ? colors.error + '40' : 'transparent',
                      borderWidth: hasUnread && !isSelected ? 1 : 0,
                    },
                  ]}
                  onPress={() => {
                    haptics.light();
                    const isAnnouncementChannel = Boolean(
                      (item as any).type === 'announcement' || String(item.name).toLowerCase() === 'announcements'
                    );
                    if (isAnnouncementChannel) {
                      router.push(`/space/${id}/announcements`);
                      return;
                    }
                    router.push({
                      pathname: '/space/[spaceId]/channel/[channelId]',
                      params: { spaceId: id, channelId: item.id },
                    });
                  }}
                  activeOpacity={0.7}>
                  <Text style={[
                    styles.channelTabText,
                    { color: isSelected ? '#FFFFFF' : colors.text }
                  ]}>
                    #{item.name}
                  </Text>
                  {hasUnread && !isSelected && (
                    <View style={[styles.channelTabUnreadDot, { backgroundColor: colors.error }]} />
                  )}
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.channelTabsContent}
          />
        </View>
        
        <View style={styles.chatWrapper}>
          <View style={[styles.chatPlaceholder, { backgroundColor: colors.spaceBackground }]}>
            <IconSymbol name="chatbubbles-outline" size={48} color={colors.secondary} />
            <Text style={[styles.chatPlaceholderText, { color: colors.secondary }]}>
              Channel chat
            </Text>
            <Text style={[styles.chatPlaceholderSubtext, { color: colors.secondary }]}>
              Messages will appear here
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Space overview
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSpace(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}>
        
        {/* Navigation */}
        <View style={[styles.nav, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={styles.navBack}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            accessibilityRole="button">
            <IconSymbol name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.text }]}>Space</Text>
          {(() => {
            const isOwner = space?.ownerId === mockUsers[0].id || space?.ownerId === `user-${mockUsers[0].id}`;
            const isAdmin = space?.memberRole === 'admin';
            const canEdit = isOwner || isAdmin;
            
            if (!canEdit) return <View style={{ width: 40 }} />;
            
            return (
              <TouchableOpacity
                style={styles.navEdit}
                onPress={() => {
                  haptics.light();
                  router.push(`/space/${id}/settings`);
                }}
                activeOpacity={0.7}
                accessibilityLabel="Space settings"
                accessibilityRole="button">
                <IconSymbol name="create-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            );
          })()}
          {!isJoined && <View style={{ width: 40 }} />}
        </View>

        {/* Cover Image */}
        <View style={[styles.cover, { backgroundColor: categoryColor + '20' }]}>
          {space.banner ? (
            <ExpoImage source={{ uri: space.banner }} style={styles.coverImage} contentFit="cover" />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: categoryColor + '20' }]}>
              <Text style={[styles.coverIcon, { color: categoryColor }]}>
                {getSpaceInitials(space.name)}
              </Text>
            </View>
          )}
        </View>

        {/* Main Content */}
        <View style={styles.main}>
          {/* Space Header */}
          <View style={styles.spaceHeader}>
            <View style={styles.spaceHeaderTop}>
              <View style={styles.spaceHeaderLeft}>
                {space.iconImage ? (
                  <ExpoImage 
                    source={{ uri: space.iconImage }} 
                    style={styles.spaceAvatar} 
                    contentFit="cover"
                    onError={() => {
                      // Image failed to load
                    }}
                  />
                ) : (
                  <View style={[styles.spaceAvatar, { backgroundColor: categoryColor }]}>
                    <Text style={styles.spaceAvatarText}>
                      {getSpaceInitials(space.name)}
                    </Text>
                  </View>
                )}
                <View style={styles.spaceHeaderInfo}>
                  <View style={styles.spaceTitleRow}>
                    <Text style={[styles.spaceTitle, { color: colors.text }]} numberOfLines={1}>
                      {space.name}
                    </Text>
                    {space.isVerified && (
                      <View style={[styles.badge, { backgroundColor: '#1D9BF0' }]}>
                        <IconSymbol name="checkmark-circle" size={10} color="#FFFFFF" />
                      </View>
                    )}
                    {space.isOfficial && (
                      <View style={[styles.badge, { backgroundColor: '#10B981' }]}>
                        <IconSymbol name="shield-checkmark" size={10} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  {space.category && (
                    <View style={[styles.category, { backgroundColor: categoryColor + '15' }]}>
                      <Text style={[styles.categoryLabel, { color: categoryColor }]}>
                        {space.category}
                      </Text>
                    </View>
                  )}
                  {(() => {
                    const isOwner =
                      space.ownerId === mockUsers[0].id ||
                      space.ownerId === `user-${mockUsers[0].id}`;
                    const isAdmin = space.memberRole === 'admin';
                    const showBadge = isOwner || isAdmin;
                    const role = isOwner ? 'owner' : 'admin';

                    if (!showBadge) return null;

                    return (
                      <View
                        style={[
                          styles.roleBadge,
                          {
                            backgroundColor:
                              role === 'owner' ? '#F59E0B' + '20' : '#3B82F6' + '20',
                          },
                        ]}>
                        <IconSymbol
                          name={role === 'owner' ? 'star' : 'shield-checkmark'}
                          size={12}
                          color={role === 'owner' ? '#F59E0B' : '#3B82F6'}
                        />
                        <Text
                          style={[
                            styles.roleBadgeText,
                            { color: role === 'owner' ? '#F59E0B' : '#3B82F6' },
                          ]}>
                          {role === 'owner' ? 'Owner' : 'Admin'}
                        </Text>
                      </View>
                    );
                  })()}
                </View>
              </View>
            </View>
            <View style={styles.headerActions}>
              {isJoined ? (
                <View style={[styles.joinPill, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '35' }]}>
                  <IconSymbol
                    name="checkmark-circle"
                    size={14}
                    color={colors.primary}
                    style={styles.joinBtnIcon}
                  />
                  <Text style={[styles.joinPillText, { color: colors.text }]}>You’re in</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.joinBtn,
                    {
                      backgroundColor: hasPendingRequest 
                        ? colors.secondary + '40'
                        : colors.primary,
                      borderColor: 'transparent',
                      borderWidth: 0,
                      opacity: hasPendingRequest ? 0.6 : 1,
                    },
                  ]}
                  onPress={handleJoinSpace}
                  disabled={hasPendingRequest}
                  activeOpacity={0.8}
                  accessibilityLabel={hasPendingRequest ? 'Request pending' : space?.requiresApproval ? 'Request to join space' : 'Join space'}
                  accessibilityRole="button">
                  {!hasPendingRequest && (
                    <IconSymbol
                      name="add"
                      size={14}
                      color="#FFFFFF"
                      style={styles.joinBtnIcon}
                    />
                  )}
                  {hasPendingRequest && (
                    <IconSymbol
                      name="time-outline"
                      size={14}
                      color={colors.secondary}
                      style={styles.joinBtnIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.joinBtnText,
                      {
                        color: hasPendingRequest ? colors.secondary : '#FFFFFF',
                        fontWeight: '600',
                      },
                    ]}>
                    {hasPendingRequest
                      ? 'Request Pending'
                      : space?.requiresApproval
                        ? 'Request to Join'
                        : 'Join Space'}
                  </Text>
                </TouchableOpacity>
              )}
              {(() => {
                const isOwner = space.ownerId === mockUsers[0].id || space.ownerId === `user-${mockUsers[0].id}`;
                const isAdmin = space.memberRole === 'admin';
                const canManage = isOwner || isAdmin;
                
                if (!canManage) return null;
                
                return (
                  <TouchableOpacity
                    style={[styles.settingsButton, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '40' }]}
                    onPress={() => {
                      haptics.light();
                      const ownerOptions = isOwner ? [
                        { text: 'Analytics Dashboard', onPress: () => {
                          setActionSheet(null);
                          setActiveTab('analytics');
                        }},
                        { text: 'Manage Members', onPress: () => { setActionSheet(null); setActiveTab('members'); } },
                        { text: 'Join Requests', onPress: () => { 
                          setActionSheet(null); 
                          setActiveTab('requests');
                          if (joinRequests.length > 0) {
                            haptics.light();
                          }
                        }},
                        { text: 'Space Settings', onPress: () => {
                          setActionSheet(null);
                          router.push(`/space/${id}/settings`);
                        }},
                        { text: 'Manage Channels', onPress: () => {
                          setActionSheet(null);
                          setActiveTab('channels');
                        }},
                        { text: 'Moderation Logs', onPress: () => { setActionSheet(null); setActiveTab('logs'); } },
                        { text: 'Invite Members', onPress: () => {
                          setActionSheet(null);
                          openInviteMembersSheet();
                        }},
                        { text: 'Bulk Actions', onPress: () => {
                          setActionSheet(null);
                          setActionSheet({
                            title: 'Bulk Actions',
                            message: 'Select members in Members tab first',
                            options: [
                              { text: 'Promote to Moderator', onPress: () => {
                                setActionSheet(null);
                                if (selectedMembers.size > 0) {
                                  showToast(`${selectedMembers.size} members promoted`, 'success');
                                  setSelectedMembers(new Set());
                                } else {
                                  showToast('Select members first');
                                }
                              }},
                              { text: 'Remove Members', style: 'destructive' as const, onPress: () => {
                                setActionSheet(null);
                                if (selectedMembers.size > 0) {
                                  Alert.alert(
                                    'Remove Members',
                                    `Remove ${selectedMembers.size} members?`,
                                    [
                                      { text: 'Cancel', style: 'cancel' },
                                      { text: 'Remove', style: 'destructive' as const, onPress: () => {
                                        showToast(`${selectedMembers.size} members removed`, 'success');
                                        setSelectedMembers(new Set());
                                      }},
                                    ]
                                  );
                                } else {
                                  showToast('Select members first');
                                }
                              }},
                              { text: 'Export Data', onPress: () => {
                                setActionSheet(null);
                                showToast('Export feature coming soon', 'success');
                              }},
                              { text: 'Cancel', style: 'cancel' as const, onPress: () => setActionSheet(null) },
                            ],
                          });
                        }},
                        { text: 'Cancel', style: 'cancel' as const, onPress: () => setActionSheet(null) },
                      ] : [
                        { text: '👥 Manage Members', onPress: () => { setActionSheet(null); setActiveTab('members'); } },
                        { text: '📨 Join Requests', onPress: () => { setActionSheet(null); setActiveTab('requests'); } },
                        { text: '📢 Manage Channels', onPress: () => {
                          setActionSheet(null);
                          setActiveTab('channels');
                        }},
                        { text: '📋 Moderation Logs', onPress: () => { setActionSheet(null); setActiveTab('logs'); } },
                        { text: 'Cancel', style: 'cancel' as const, onPress: () => setActionSheet(null) },
                      ];
                      
                      setActionSheet({
                        title: isOwner ? 'Owner Dashboard' : 'Admin Panel',
                        message: isOwner 
                          ? `${space.memberCount} members • ${posts.length} posts • ${joinRequests.length} pending`
                          : 'Manage space members and content',
                        options: ownerOptions,
                      });
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel={isOwner ? 'Owner dashboard' : 'Admin panel'}
                  accessibilityRole="button">
                    <IconSymbol name="settings-outline" size={16} color={colors.primary} />
                    <Text style={[styles.settingsButtonText, { color: colors.primary }]}>
                      {isOwner ? 'Manage' : 'Admin'}
                    </Text>
                  </TouchableOpacity>
                );
              })()}
            </View>
          </View>

          {/* Description */}
          <Text style={[styles.desc, { color: colors.secondary }]}>
            {space.description}
          </Text>

          {/* Tags */}
          {space.tags && space.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {space.tags.map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: categoryColor + '15' }]}>
                  <Text style={[styles.tagText, { color: categoryColor }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Stats */}
          <View style={[styles.stats, { borderColor: colors.cardBorder }]}>
            <View style={styles.stat}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
                <IconSymbol name="people-outline" size={14} color={colors.primary} />
              </View>
              <View style={styles.statText}>
                <Text style={[styles.statNumber, { color: colors.text }]}>{space.memberCount.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.secondary }]}>Members</Text>
              </View>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.stat}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
                <IconSymbol name="pricetag-outline" size={14} color={colors.primary} />
              </View>
              <View style={styles.statText}>
                <Text style={[styles.statNumber, { color: colors.text }]}>{space.channels?.length || 0}</Text>
                <Text style={[styles.statLabel, { color: colors.secondary }]}>Channels</Text>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View style={[styles.tabsContainer, { borderColor: colors.cardBorder }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
              {(
                [
                  'feed',
                  'channels',
                  'members',
                  'events',
                  'resources',
                  'rules',
                  ...(space &&
                  ((space.ownerId === mockUsers[0].id || space.ownerId === `user-${mockUsers[0].id}`) ||
                    space.memberRole === 'admin')
                    ? (['analytics', 'requests', 'logs'] as const)
                    : ([] as const)),
                ] as SpaceTab[]
              ).map((tab) => {
                const tabIcons: Record<SpaceTab, string> = {
                  feed: 'newspaper-outline',
                  channels: 'grid-outline',
                  members: 'people-outline',
                  events: 'calendar-outline',
                  resources: 'bookmark-outline',
                  rules: 'document-text-outline',
                  analytics: 'stats-chart-outline',
                  requests: 'mail-outline',
                  logs: 'clipboard-outline',
                };
                const isActive = activeTab === tab;
                const showBadge = tab === 'requests' && joinRequests.length > 0;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.tab,
                      {
                        backgroundColor: isActive ? colors.primary : 'transparent',
                        borderBottomColor: isActive ? colors.primary : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      haptics.light();
                      setActiveTab(tab);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.tabIconContainer}>
                      <IconSymbol
                        name={tabIcons[tab]}
                        size={16}
                        color={isActive ? '#FFFFFF' : colors.secondary}
                      />
                      {showBadge && (
                        <View style={[styles.tabBadge, { backgroundColor: colors.error }]}>
                          <Text style={styles.tabBadgeText}>
                            {joinRequests.length > 9 ? '9+' : joinRequests.length}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.tabText,
                        {
                          color: isActive ? '#FFFFFF' : colors.secondary,
                          fontWeight: isActive ? '700' : '500',
                        },
                      ]}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Tab Content */}
          {activeTab === 'feed' && renderFeedTab()}
          {activeTab === 'channels' && (
            <View ref={channelsSectionRef} style={styles.channels}>
            <View style={styles.channelsHeader}>
              <View style={styles.channelsHeaderLeft}>
                <IconSymbol name="grid-outline" size={18} color={colors.text} />
                <Text style={[styles.channelsTitle, { color: colors.text }]}>Channels</Text>
                <Text style={[styles.channelsCount, { color: colors.secondary }]}>
                  {space.channels?.length || 0}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {(() => {
                  const isOwner = space.ownerId === mockUsers[0].id || space.ownerId === `user-${mockUsers[0].id}`;
                  const isAdmin = space.memberRole === 'admin';
                  if (isOwner || isAdmin) {
                    return (
                      <TouchableOpacity
                        style={[styles.addChannelButton, { backgroundColor: colors.primary + '15' }]}
                        onPress={() => {
                          haptics.light();
                          setNewChannelName('');
                          setNewChannelType('text');
                          setShowChannelModal(true);
                        }}
                        activeOpacity={0.7}>
                        <IconSymbol name="add" size={16} color={colors.primary} />
                        <Text style={[styles.addChannelText, { color: colors.primary }]}>Add</Text>
                      </TouchableOpacity>
                    );
                  }
                  return null;
                })()}
                {space.channels && space.channels.length > 0 && (
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => {
                      haptics.light();
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }}
                    activeOpacity={0.7}>
                    <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
                    <IconSymbol name="chevron-forward" size={14} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {(!space.channels || space.channels.length === 0) ? (
              <View style={[styles.emptyChannels, { backgroundColor: colors.spaceBackground }]}>
                <IconSymbol name="grid-outline" size={24} color={colors.secondary} />
                <Text style={[styles.emptyChannelsText, { color: colors.secondary }]}>
                  No channels yet
                </Text>
              </View>
            ) : !isJoined ? (
              <View style={[styles.lockedChannels, { backgroundColor: colors.spaceBackground }]}>
                <IconSymbol name="lock-closed" size={32} color={colors.secondary} />
                <Text style={[styles.lockedChannelsTitle, { color: colors.text }]}>
                  Channels are private
                </Text>
                <Text style={[styles.lockedChannelsText, { color: colors.secondary }]}>
                  Join this space to access channels
                </Text>
                <Text style={[styles.lockedChannelsCount, { color: colors.secondary }]}>
                  {space.channels.length} {space.channels.length === 1 ? 'channel' : 'channels'} available
                </Text>
              </View>
            ) : (
              space.channels.map((channel) => {
              const unreadCount = (channel as any).unreadCount || 0;
              const hasUnread = unreadCount > 0;
              const isActive = selectedChannel === channel.id;
              const isAnnouncementChannel = Boolean(
                (channel as any).type === 'announcement' || String(channel.name).toLowerCase() === 'announcements'
              );
              
              return (
                <TouchableOpacity
                  key={channel.id}
                  style={[
                    styles.channel,
                    {
                      backgroundColor: isActive ? colors.primary + '08' : colors.cardBackground,
                      borderColor: isActive ? colors.primary + '30' : colors.cardBorder,
                    },
                  ]}
                  onPress={() => {
                    haptics.selection();
                    if (isAnnouncementChannel) {
                      router.push(`/space/${id}/announcements`);
                      return;
                    }
                    router.push({
                      pathname: '/space/[spaceId]/channel/[channelId]',
                      params: { spaceId: id, channelId: channel.id },
                    });
                  }}
                  activeOpacity={0.7}>
                  <View style={[
                    styles.channelIcon,
                    {
                      backgroundColor: isActive ? colors.primary + '15' : colors.spaceBackground,
                    },
                  ]}>
                    <IconSymbol
                      name={isAnnouncementChannel ? 'megaphone-outline' : 'chatbubble-outline'}
                      size={14}
                      color={isActive ? colors.primary : colors.secondary}
                    />
                  </View>
                  <View style={styles.channelContent}>
                    <View style={styles.channelRowHeader}>
                      <Text style={[
                        styles.channelName,
                        {
                          color: isActive ? colors.primary : colors.text,
                          fontWeight: hasUnread ? '700' : '600',
                        },
                      ]}>
                        #{channel.name}
                      </Text>
                      {hasUnread && (
                        <View style={[styles.channelUnreadBadge, { backgroundColor: colors.error }]}>
                          <Text style={styles.channelUnreadText}>
                            {unreadCount > 99 ? '99+' : String(unreadCount)}
                          </Text>
                        </View>
                      )}
                    </View>
                    {channel.description && (
                      <Text
                        style={[
                          styles.channelDesc,
                          { color: colors.secondary },
                        ]}
                        numberOfLines={1}>
                        {channel.description}
                      </Text>
                    )}
                  </View>
                  <IconSymbol
                    name="chevron-forward"
                    size={14}
                    color={isActive ? colors.primary : colors.secondary}
                  />
                </TouchableOpacity>
              );
            })
            )}
          </View>
          )}
          {activeTab === 'members' && renderMembersTab()}
          {activeTab === 'events' && renderEventsTab()}
          {activeTab === 'resources' && renderResourcesTab()}
          {activeTab === 'rules' && renderRulesTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
          {activeTab === 'requests' && renderRequestsTab()}
          {activeTab === 'logs' && renderLogsTab()}
        </View>
      </ScrollView>

      {/* Join Request Modal */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowRequestModal(false);
          setRequestMessage('');
        }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Request to Join</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowRequestModal(false);
                  setRequestMessage('');
                }}
                activeOpacity={0.7}>
                <IconSymbol name="close" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDescription, { color: colors.secondary }]}>
              This space requires approval. Send a message to the owner (optional):
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder, color: colors.text }]}
              value={requestMessage}
              onChangeText={setRequestMessage}
              placeholder="Tell them why you'd like to join..."
              placeholderTextColor={colors.secondary}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { borderColor: colors.cardBorder }]}
                onPress={() => {
                  setShowRequestModal(false);
                  setRequestMessage('');
                }}
                activeOpacity={0.7}>
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit, { backgroundColor: colors.primary }]}
                onPress={handleSubmitJoinRequest}
                activeOpacity={0.7}>
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </Modal>

      {/* Channel Creation Modal */}
      <Modal
        visible={showChannelModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowChannelModal(false);
          setNewChannelName('');
        }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create Channel</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowChannelModal(false);
                  setNewChannelName('');
                }}
                activeOpacity={0.7}>
                <IconSymbol name="close" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDescription, { color: colors.secondary }]}>
              Add a new channel to your space
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder, color: colors.text }]}
              value={newChannelName}
              onChangeText={setNewChannelName}
              placeholder="Channel name (e.g., general, announcements)"
              placeholderTextColor={colors.secondary}
              maxLength={30}
            />
            <View style={styles.channelTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.channelTypeOption,
                  {
                    backgroundColor: newChannelType === 'text' ? colors.primary + '15' : colors.spaceBackground,
                    borderColor: newChannelType === 'text' ? colors.primary : colors.cardBorder,
                  }
                ]}
                onPress={() => {
                  haptics.light();
                  setNewChannelType('text');
                }}
                activeOpacity={0.7}>
                <IconSymbol name="chatbubble-outline" size={18} color={newChannelType === 'text' ? colors.primary : colors.secondary} />
                <Text style={[styles.channelTypeText, { color: newChannelType === 'text' ? colors.primary : colors.text }]}>
                  Text Channel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.channelTypeOption,
                  {
                    backgroundColor: newChannelType === 'announcement' ? colors.primary + '15' : colors.spaceBackground,
                    borderColor: newChannelType === 'announcement' ? colors.primary : colors.cardBorder,
                  }
                ]}
                onPress={() => {
                  haptics.light();
                  setNewChannelType('announcement');
                }}
                activeOpacity={0.7}>
                <IconSymbol name="megaphone-outline" size={18} color={newChannelType === 'announcement' ? colors.primary : colors.secondary} />
                <Text style={[styles.channelTypeText, { color: newChannelType === 'announcement' ? colors.primary : colors.text }]}>
                  Announcement
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { borderColor: colors.cardBorder }]}
                onPress={() => {
                  setShowChannelModal(false);
                  setNewChannelName('');
                }}
                activeOpacity={0.7}>
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit, { backgroundColor: colors.primary, opacity: newChannelName.trim() ? 1 : 0.5 }]}
                disabled={!newChannelName.trim()}
                onPress={async () => {
                  if (!newChannelName.trim() || !space?.id) return;
                  try {
                    const newChannel = await createChannel(space.id, {
                      name: newChannelName.trim(),
                      description: '',
                      type: newChannelType,
                    });
                    if (newChannel) {
                      setSpace(prev => prev ? { ...prev, channels: [...(prev.channels || []), newChannel] } : null);
                      haptics.success();
                      showToast(`Channel #${newChannel.name} created`, 'success');
                      setShowChannelModal(false);
                      setNewChannelName('');
                      setNewChannelType('text');
                    } else {
                      showToast('Failed to create channel', 'error');
                    }
                  } catch {
                    showToast('Failed to create channel', 'error');
                  }
                }}
                activeOpacity={0.7}>
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Event Creation Modal */}
      <Modal
        visible={showEventModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowEventModal(false);
          setNewEventTitle('');
          setNewEventDescription('');
          setNewEventDate('');
          setNewEventLocation('');
        }}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent}>
            <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Create Event</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowEventModal(false);
                    setNewEventTitle('');
                    setNewEventDescription('');
                    setNewEventDate('');
                    setNewEventLocation('');
                  }}
                  activeOpacity={0.7}>
                  <IconSymbol name="close" size={20} color={colors.secondary} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder, color: colors.text }]}
                value={newEventTitle}
                onChangeText={setNewEventTitle}
                placeholder="Event title *"
                placeholderTextColor={colors.secondary}
                maxLength={100}
              />
              <TextInput
                style={[styles.modalInput, styles.modalTextArea, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder, color: colors.text }]}
                value={newEventDescription}
                onChangeText={setNewEventDescription}
                placeholder="Description (optional)"
                placeholderTextColor={colors.secondary}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder, color: colors.text }]}
                value={newEventDate}
                onChangeText={setNewEventDate}
                placeholder="Date & Time (e.g., Dec 25, 2024 at 3:00 PM)"
                placeholderTextColor={colors.secondary}
              />
              <TouchableOpacity
                style={[
                  styles.modalCheckboxOption,
                  { backgroundColor: newEventIsOnline ? colors.primary + '15' : colors.spaceBackground, borderColor: colors.cardBorder }
                ]}
                onPress={() => {
                  haptics.light();
                  setNewEventIsOnline(!newEventIsOnline);
                }}
                activeOpacity={0.7}>
                <View style={[
                  styles.checkbox,
                  {
                    backgroundColor: newEventIsOnline ? colors.primary : 'transparent',
                    borderColor: newEventIsOnline ? colors.primary : colors.cardBorder,
                  }
                ]}>
                  {newEventIsOnline && (
                    <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
                  )}
                </View>
                <Text style={[styles.modalCheckboxText, { color: colors.text }]}>Online Event</Text>
              </TouchableOpacity>
              {!newEventIsOnline && (
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder, color: colors.text }]}
                  value={newEventLocation}
                  onChangeText={setNewEventLocation}
                  placeholder="Location (optional)"
                  placeholderTextColor={colors.secondary}
                  maxLength={200}
                />
              )}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel, { borderColor: colors.cardBorder }]}
                  onPress={() => {
                    setShowEventModal(false);
                    setNewEventTitle('');
                    setNewEventDescription('');
                    setNewEventDate('');
                    setNewEventLocation('');
                  }}
                  activeOpacity={0.7}>
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSubmit, { backgroundColor: colors.primary, opacity: newEventTitle.trim() ? 1 : 0.5 }]}
                  onPress={async () => {
                    if (!newEventTitle.trim() || !id) return;
                    try {
                      const startTime = newEventDate.trim() ? new Date(newEventDate).toISOString() : new Date().toISOString();
                      const startMs = new Date(startTime).getTime();
                      const endTime = new Date(startMs + 60 * 60 * 1000).toISOString();
                      const created = await createSpaceEvent(id, {
                        title: newEventTitle.trim(),
                        description: newEventDescription.trim() || undefined,
                        startTime,
                        endTime,
                        location: newEventIsOnline ? undefined : (newEventLocation.trim() || undefined),
                        isOnline: newEventIsOnline,
                        attendees: [],
                        maxAttendees: undefined,
                      });
                      setEvents(prev => [created, ...prev]);
                      haptics.success();
                      showToast('Event created!', 'success');
                      setShowEventModal(false);
                      setNewEventTitle('');
                      setNewEventDescription('');
                      setNewEventDate('');
                      setNewEventLocation('');
                      setNewEventIsOnline(false);
                    } catch {
                      haptics.error();
                      showToast('Failed to create event', 'error');
                    }
                  }}
                  disabled={!newEventTitle.trim()}
                  activeOpacity={0.7}>
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Event Detail Modal */}
      <Modal
        visible={selectedEvent !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedEvent(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.eventDetailModal, { backgroundColor: colors.cardBackground }]}>
            {selectedEvent && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>{selectedEvent.title}</Text>
                  <TouchableOpacity onPress={() => setSelectedEvent(null)} activeOpacity={0.7}>
                    <IconSymbol name="close" size={20} color={colors.secondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.eventDetailScroll} showsVerticalScrollIndicator={false}>
                  {selectedEvent.description ? (
                    <Text style={[styles.eventDetailDescription, { color: colors.secondary }]}>{selectedEvent.description}</Text>
                  ) : null}
                  <View style={[styles.eventDetailMeta, { backgroundColor: colors.spaceBackground }]}>
                    <View style={styles.eventDetailMetaRow}>
                      <IconSymbol name="calendar-outline" size={18} color={colors.primary} />
                      <Text style={[styles.eventDetailMetaText, { color: colors.text }]}>
                        {new Date(selectedEvent.startTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        {selectedEvent.endTime ? ` – ${new Date(selectedEvent.endTime).toLocaleTimeString(undefined, { timeStyle: 'short' })}` : ''}
                      </Text>
                    </View>
                    {selectedEvent.isOnline ? (
                      <View style={styles.eventDetailMetaRow}>
                        <IconSymbol name="videocam-outline" size={18} color={colors.primary} />
                        <Text style={[styles.eventDetailMetaText, { color: colors.text }]}>Online</Text>
                        {selectedEvent.meetingUrl ? (
                          <TouchableOpacity onPress={() => { /* could open link */ }} activeOpacity={0.7}>
                            <Text style={[styles.eventDetailLink, { color: colors.primary }]}>Join link</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ) : selectedEvent.location ? (
                      <View style={styles.eventDetailMetaRow}>
                        <IconSymbol name="location-outline" size={18} color={colors.primary} />
                        <Text style={[styles.eventDetailMetaText, { color: colors.text }]}>{selectedEvent.location}</Text>
                      </View>
                    ) : null}
                    <View style={styles.eventDetailMetaRow}>
                      <IconSymbol name="people-outline" size={18} color={colors.primary} />
                      <Text style={[styles.eventDetailMetaText, { color: colors.text }]}>
                        {selectedEvent.attendees?.length || 0}{selectedEvent.maxAttendees ? ` / ${selectedEvent.maxAttendees}` : ''} attending
                      </Text>
                    </View>
                  </View>
                  {(() => {
                    const isJoined = joinedEventIds.has(selectedEvent.id) || (selectedEvent.attendees && selectedEvent.attendees.includes(mockUsers[0].id));
                    return (
                      <TouchableOpacity
                        style={[styles.eventDetailJoinButton, { backgroundColor: isJoined ? colors.spaceBackground : colors.primary, borderColor: colors.cardBorder }]}
                        onPress={async () => {
                          if (isJoined) {
                            setSelectedEvent(null);
                            return;
                          }
                          if (!id) return;
                          try {
                            await joinSpaceEvent(id, selectedEvent.id);
                            setJoinedEventIds(prev => new Set(prev).add(selectedEvent.id));
                            setEvents(prev => prev.map(e => e.id === selectedEvent.id
                              ? { ...e, attendees: [...(e.attendees || []), mockUsers[0].id] }
                              : e));
                            haptics.success();
                            showToast("You're in! See you there.", 'success');
                            setSelectedEvent(null);
                          } catch {
                            haptics.error();
                            showToast('Could not join event', 'error');
                          }
                        }}
                        activeOpacity={0.8}
                        disabled={false}>
                        <Text style={[styles.eventDetailJoinButtonText, { color: isJoined ? colors.secondary : '#FFFFFF' }]}>
                          {isJoined ? 'Joined' : 'Join event'}
                        </Text>
                        {isJoined && <IconSymbol name="checkmark-circle" size={18} color={colors.primary} />}
                      </TouchableOpacity>
                    );
                  })()}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Resource Creation Modal */}
      <Modal
        visible={showResourceModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowResourceModal(false);
          setNewResourceTitle('');
          setNewResourceUrl('');
          setNewResourceDescription('');
          setNewResourceMode('link');
          setNewResourcePickedFile(null);
        }}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Add Resource</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowResourceModal(false);
                    setNewResourceTitle('');
                    setNewResourceUrl('');
                    setNewResourceDescription('');
                    setNewResourceMode('link');
                    setNewResourcePickedFile(null);
                  }}
                  activeOpacity={0.7}>
                  <IconSymbol name="close" size={20} color={colors.secondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.resourceTypeLabel, { color: colors.secondary }]}>Add as</Text>
              <View style={styles.resourceTypeRow}>
                <TouchableOpacity
                  style={[styles.resourceModeChip, { borderColor: colors.cardBorder, backgroundColor: newResourceMode === 'link' ? colors.primary + '20' : colors.spaceBackground }]}
                  onPress={() => { setNewResourceMode('link'); setNewResourcePickedFile(null); }}
                  activeOpacity={0.7}>
                  <IconSymbol name="link-outline" size={18} color={newResourceMode === 'link' ? colors.primary : colors.secondary} />
                  <Text style={[styles.resourceTypeChipText, { color: newResourceMode === 'link' ? colors.primary : colors.text }]}>Link</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.resourceModeChip, { borderColor: colors.cardBorder, backgroundColor: newResourceMode === 'file' ? colors.primary + '20' : colors.spaceBackground }]}
                  onPress={() => { setNewResourceMode('file'); setNewResourceUrl(''); }}
                  activeOpacity={0.7}>
                  <IconSymbol name="document-outline" size={18} color={newResourceMode === 'file' ? colors.primary : colors.secondary} />
                  <Text style={[styles.resourceTypeChipText, { color: newResourceMode === 'file' ? colors.primary : colors.text }]}>File</Text>
                </TouchableOpacity>
              </View>

              {newResourceMode === 'file' ? (
                <>
                  <TouchableOpacity
                    style={[styles.pickFileButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}
                    onPress={async () => {
                      try {
                        const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
                        if (result.canceled) return;
                        const file = result.assets[0];
                        setNewResourcePickedFile({ uri: file.uri, name: file.name });
                        setNewResourceTitle(prev => prev || file.name);
                        haptics.success();
                      } catch (e) {
                        console.error(e);
                        showToast('Could not pick file', 'error');
                      }
                    }}
                    activeOpacity={0.7}>
                    <IconSymbol name="document-outline" size={22} color={colors.primary} />
                    <Text style={[styles.pickFileButtonText, { color: colors.primary }]}>
                      {newResourcePickedFile ? newResourcePickedFile.name : 'Pick file from device'}
                    </Text>
                    {newResourcePickedFile ? <IconSymbol name="checkmark-circle" size={18} color={colors.primary} /> : null}
                  </TouchableOpacity>
                  {newResourcePickedFile && (
                    <TouchableOpacity onPress={() => setNewResourcePickedFile(null)} style={styles.clearFileRow}>
                      <Text style={[styles.clearFileText, { color: colors.secondary }]}>Clear file</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder, color: colors.text }]}
                  value={newResourceUrl}
                  onChangeText={setNewResourceUrl}
                  placeholder="URL * (e.g. https://example.com/doc)"
                  placeholderTextColor={colors.secondary}
                  autoCapitalize="none"
                  keyboardType="url"
                  autoCorrect={false}
                />
              )}

              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder, color: colors.text }]}
                value={newResourceTitle}
                onChangeText={setNewResourceTitle}
                placeholder="Title *"
                placeholderTextColor={colors.secondary}
                maxLength={100}
              />
              <TextInput
                style={[styles.modalInput, styles.modalTextArea, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder, color: colors.text }]}
                value={newResourceDescription}
                onChangeText={setNewResourceDescription}
                placeholder="Description (optional)"
                placeholderTextColor={colors.secondary}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel, { borderColor: colors.cardBorder }]}
                  onPress={() => {
                    setShowResourceModal(false);
                    setNewResourceTitle('');
                    setNewResourceUrl('');
                    setNewResourceDescription('');
                    setNewResourceMode('link');
                    setNewResourcePickedFile(null);
                  }}
                  activeOpacity={0.7}>
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalButtonSubmit,
                    {
                      backgroundColor: colors.primary,
                      opacity: (newResourceTitle.trim() && (newResourceMode === 'file' ? newResourcePickedFile : newResourceUrl.trim()) && !resourceActionLoading) ? 1 : 0.5,
                    },
                  ]}
                  disabled={!newResourceTitle.trim() || (newResourceMode === 'file' ? !newResourcePickedFile : !newResourceUrl.trim()) || resourceActionLoading}
                  onPress={async () => {
                    const sid = spaceIdRef.current;
                    const title = newResourceTitle.trim();
                    const urlOrUri = newResourceMode === 'file' && newResourcePickedFile
                      ? newResourcePickedFile.uri
                      : newResourceUrl.trim();
                    if (!title || !urlOrUri || !sid) {
                      showToast('Please fill title and ' + (newResourceMode === 'file' ? 'pick a file' : 'URL'), 'error');
                      return;
                    }
                    setResourceActionLoading(true);
                    try {
                      const updated = await addSpaceResource(sid, {
                        title,
                        url: urlOrUri,
                        description: newResourceDescription.trim() || undefined,
                        type: newResourceMode === 'file' ? 'document' : 'link',
                      });
                      if (updated) {
                        setSpace(prev => prev ? { ...prev, pinnedResources: updated.pinnedResources } : updated);
                        haptics.success();
                        showToast('Resource added', 'success');
                        setShowResourceModal(false);
                        setNewResourceTitle('');
                        setNewResourceUrl('');
                        setNewResourceDescription('');
                        setNewResourceMode('link');
                        setNewResourcePickedFile(null);
                      } else {
                        showToast('Failed to add resource', 'error');
                      }
                    } catch {
                      showToast('Failed to add resource', 'error');
                    } finally {
                      setResourceActionLoading(false);
                    }
                  }}
                  activeOpacity={0.7}>
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>{resourceActionLoading ? 'Adding…' : 'Add'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Custom Action Sheet */}
      <Modal
        visible={!!actionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setActionSheet(null)}>
        <TouchableOpacity
          style={styles.actionSheetOverlay}
          activeOpacity={1}
          onPress={() => setActionSheet(null)}>
          <View style={[styles.actionSheetContainer, { backgroundColor: colors.cardBackground }]}>
            {actionSheet && (
              <>
                <View style={styles.actionSheetHeader}>
                  <Text style={[styles.actionSheetTitle, { color: colors.text }]}>
                    {actionSheet.title}
                  </Text>
                  {actionSheet.message && (
                    <Text style={[styles.actionSheetMessage, { color: colors.secondary }]}>
                      {actionSheet.message}
                    </Text>
                  )}
                </View>
                <View style={[styles.actionSheetDivider, { backgroundColor: colors.cardBorder }]} />
                <View style={styles.actionSheetOptions}>
                  {actionSheet.options.map((option, index) => {
                    const isDestructive = option.style === 'destructive';
                    const isCancel = option.style === 'cancel';
                    const showDivider = index > 0 && !isDestructive;
                    
                    return (
                      <View key={index}>
                        {showDivider && (
                          <View style={[styles.actionSheetDivider, { backgroundColor: colors.cardBorder }]} />
                        )}
                        {isDestructive && index > 0 && (
                          <View style={[styles.actionSheetDivider, { backgroundColor: colors.cardBorder, marginTop: Spacing.sm }]} />
                        )}
                        <TouchableOpacity
                          style={[
                            styles.actionSheetOption,
                            index === actionSheet.options.length - 1 && styles.actionSheetOptionLast,
                          ]}
                          onPress={() => {
                            haptics.light();
                            option.onPress();
                          }}
                          activeOpacity={0.7}>
                          <Text
                            style={[
                              styles.actionSheetOptionText,
                              {
                                color: isDestructive
                                  ? colors.error
                                  : isCancel
                                  ? colors.secondary
                                  : colors.primary,
                                fontWeight: isCancel ? '500' : '600',
                              },
                            ]}>
                            {option.text}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Floating Action Button for Creating Posts */}
      {isJoined && activeTab === 'feed' && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => {
            haptics.medium();
            router.push(`/(tabs)/create?spaceId=${id}`);
          }}
          activeOpacity={0.8}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
      </SafeAreaView>
    );
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: Typography.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    maxWidth: 280,
  },
  errorActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  errorButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  errorButtonSecondary: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  errorButtonSecondaryText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  // Channel View
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  channelHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  channelHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelHeaderIconText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  channelHeaderText: {
    flex: 1,
  },
  channelHeaderName: {
    fontSize: Typography.base,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  channelHeaderSpace: {
    fontSize: Typography.xs,
    fontWeight: '500',
    marginTop: 1,
  },
  channelTabsBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.sm,
  },
  channelTabsContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  channelTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 24,
    marginRight: Spacing.sm,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelTabText: {
    fontSize: Typography.sm,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  channelTabUnreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: Spacing.xs / 2,
  },
  chatWrapper: {
    flex: 1,
  },
  chatPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xxl,
  },
  chatPlaceholderText: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  chatPlaceholderSubtext: {
    fontSize: Typography.sm,
    fontWeight: '500',
    opacity: 0.7,
  },
  // Overview
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.md,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  navBack: {
    padding: Spacing.xs,
  },
  navTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  navEdit: {
    padding: Spacing.xs,
  },
  cover: {
    height: 140,
    width: '100%',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverIcon: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -2,
  },
  main: {
    padding: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  spaceHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: Spacing.md,
    marginTop: 0,
  },
  spaceHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  spaceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  spaceAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  spaceAvatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  spaceHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  spaceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs + 2,
    flexWrap: 'wrap',
  },
  spaceTitle: {
    fontSize: Typography.xl,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    rowGap: Spacing.sm,
    columnGap: Spacing.sm,
    marginTop: Spacing.md,
    alignSelf: 'stretch',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 90,
    justifyContent: 'center',
  },
  settingsButtonText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  category: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  categoryLabel: {
    fontSize: Typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  roleBadgeText: {
    fontSize: Typography.xs - 1,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 120,
    flex: 1,
    justifyContent: 'center',
    marginTop: 0,
  },
  joinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  joinPillText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  joinBtnIcon: {
    marginHorizontal: 0,
  },
  joinBtnText: {
    fontSize: Typography.sm,
    letterSpacing: -0.1,
  },
  lockedChannels: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    minHeight: 160,
  },
  lockedChannelsTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  lockedChannelsText: {
    fontSize: Typography.sm,
    textAlign: 'center',
    opacity: 0.7,
    marginTop: Spacing.xs / 2,
  },
  lockedChannelsCount: {
    fontSize: Typography.xs,
    marginTop: Spacing.sm,
    opacity: 0.6,
  },
  desc: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.5,
    marginBottom: Spacing.lg,
    opacity: 0.7,
    fontWeight: '400',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: {
    flex: 1,
  },
  statNumber: {
    fontSize: Typography.xl + 2,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: Typography.sm,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: 48,
  },
  channels: {
    marginTop: Spacing.xs,
  },
  channelsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingHorizontal: 0,
  },
  channelsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  channelsTitle: {
    fontSize: Typography.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  channelsCount: {
    fontSize: Typography.xs,
    fontWeight: '700',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  viewAllText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  emptyChannels: {
    padding: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    minHeight: 120,
  },
  emptyChannelsText: {
    fontSize: Typography.base,
    fontWeight: '600',
    opacity: 0.7,
  },
  channel: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md + 4,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  channelIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelContent: {
    flex: 1,
  },
  channelRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  channelName: {
    fontSize: Typography.base + 1,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  channelUnreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  channelUnreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  channelDesc: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.5,
    opacity: 0.7,
    marginTop: 4,
  },
  // New tab styles
  tabsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tabsScroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.xs,
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: Typography.sm,
    letterSpacing: -0.1,
  },
  tabIconContainer: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  feedContainer: {
    paddingTop: Spacing.md,
  },
  // Cancels the `main` padding so PostCards can use near-full width.
  feedPostsFullBleed: {
    marginHorizontal: -Spacing.lg,
  },
  emptyTab: {
    padding: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    minHeight: 200,
  },
  emptyTabText: {
    fontSize: Typography.lg,
    fontWeight: '700',
  },
  emptyTabSubtext: {
    fontSize: Typography.sm,
    textAlign: 'center',
    opacity: 0.7,
  },
  membersContainer: {
    paddingTop: Spacing.md,
  },
  memberGroup: {
    marginBottom: Spacing.lg,
  },
  memberGroupTitle: {
    fontSize: Typography.sm,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  memberHandle: {
    fontSize: Typography.sm,
    marginTop: 2,
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  memberGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  inviteButtonText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  memberActionButton: {
    padding: Spacing.xs,
  },
  eventsContainer: {
    paddingTop: Spacing.md,
  },
  eventCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  eventDate: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDay: {
    fontSize: Typography.xl,
    fontWeight: '800',
  },
  eventMonth: {
    fontSize: Typography.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  eventContent: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
    flexWrap: 'wrap',
  },
  eventTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: Typography.base,
    fontWeight: '700',
  },
  eventJoinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  eventJoinedBadgeText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: Typography.sm,
    marginBottom: Spacing.sm,
    lineHeight: Typography.sm * 1.4,
  },
  eventMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
  },
  eventMetaText: {
    fontSize: Typography.xs,
  },
  eventDetailModal: {
    maxHeight: '80%',
  },
  eventDetailScroll: {
    maxHeight: 400,
  },
  eventDetailDescription: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.45,
    marginBottom: Spacing.md,
  },
  eventDetailMeta: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  eventDetailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  eventDetailMetaText: {
    flex: 1,
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  eventDetailLink: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  eventDetailJoinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  eventDetailJoinButtonText: {
    fontSize: Typography.base,
    fontWeight: '700',
  },
  resourcesContainer: {
    paddingTop: Spacing.md,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  resourceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  resourceDescription: {
    fontSize: Typography.sm,
    opacity: 0.7,
  },
  resourceUrlHint: {
    fontSize: Typography.xs,
    opacity: 0.7,
    marginTop: 2,
  },
  resourceTypeLabel: {
    fontSize: Typography.sm,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  resourceTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  resourceTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  resourceTypeChipText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  resourceModeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pickFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    marginBottom: Spacing.sm,
  },
  pickFileButtonText: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  clearFileRow: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  clearFileText: {
    fontSize: Typography.sm,
  },
  rulesContainer: {
    paddingTop: Spacing.md,
  },
  guidelinesCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.md,
  },
  guidelinesTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  guidelinesText: {
    fontSize: Typography.base,
    lineHeight: Typography.base * 1.5,
  },
  rulesCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rulesTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  ruleNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ruleNumberText: {
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  ruleText: {
    flex: 1,
    fontSize: Typography.base,
    lineHeight: Typography.base * 1.4,
  },
  requestsContainer: {
    paddingTop: Spacing.md,
  },
  requestsHeader: {
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  requestsHeaderTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
  },
  requestCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.md,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  requestUserInfo: {
    flex: 1,
  },
  requestUserName: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  requestUserHandle: {
    fontSize: Typography.xs,
    marginTop: 1,
  },
  requestTime: {
    fontSize: Typography.xs,
  },
  requestMessageContainer: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  requestMessage: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.4,
  },
  requestActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },
  requestActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rejectButton: {
    backgroundColor: 'transparent',
  },
  approveButton: {
    borderWidth: 0,
  },
  requestActionText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
  },
  modalDescription: {
    fontSize: Typography.sm,
    marginBottom: Spacing.md,
    lineHeight: Typography.sm * 1.4,
  },
  modalInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.base,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalButtonSubmit: {
    borderWidth: 0,
  },
  modalButtonText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  actionSheetHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  actionSheetTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  actionSheetMessage: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.5,
    marginTop: Spacing.xs,
  },
  actionSheetDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.sm,
  },
  actionSheetOptions: {
    paddingHorizontal: Spacing.md,
  },
  actionSheetOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  actionSheetOptionLast: {
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
  actionSheetOptionText: {
    fontSize: Typography.base,
    textAlign: 'center',
  },
  addChannelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  addChannelText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  logsContainer: {
    flex: 1,
  },
  logsHeader: {
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logsHeaderTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  logsHeaderSubtitle: {
    fontSize: Typography.sm,
  },
  logCard: {
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  logContent: {
    flex: 1,
  },
  logType: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  logReason: {
    fontSize: Typography.sm,
  },
  logTime: {
    fontSize: Typography.xs,
  },
  // Analytics styles
  analyticsContainer: {
    flex: 1,
    paddingTop: Spacing.md,
  },
  analyticsOverview: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  analyticsCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  analyticsCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  analyticsCardValue: {
    fontSize: Typography.xl + 4,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: Spacing.xs / 2,
  },
  analyticsCardLabel: {
    fontSize: Typography.sm,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  analyticsCardChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  analyticsCardChangeText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  analyticsSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  analyticsSectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  analyticsMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  analyticsMetricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  analyticsMetricLabel: {
    fontSize: Typography.base,
    fontWeight: '500',
  },
  analyticsMetricValue: {
    fontSize: Typography.lg,
    fontWeight: '700',
  },
  analyticsAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  analyticsActionText: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  analyticsActionBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  analyticsActionBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  // Enhanced Member Management Styles
  memberToolsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  bulkActionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginLeft: 'auto',
  },
  bulkActionText: {
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  memberSelectCheckbox: {
    marginRight: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelAnalyticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  channelAnalyticsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  channelAnalyticsName: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  channelAnalyticsStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  channelAnalyticsStat: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  feedModerationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  feedModerationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  feedModerationText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  feedModerationSubtext: {
    fontSize: Typography.xs,
    fontWeight: '400',
  },
  postModerationBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  postWrapper: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  pinnedPostWrapper: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.md - 3,
  },
  postModerationButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  addEventButtonText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  addResourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  addResourceButtonText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  channelTypeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  channelTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  channelTypeText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  modalCheckboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.md,
  },
  modalCheckboxText: {
    fontSize: Typography.base,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  upgradeButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: '600',
  },
});
