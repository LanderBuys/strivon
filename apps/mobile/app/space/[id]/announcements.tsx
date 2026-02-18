import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';

import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { getSpaceById } from '@/lib/api/spaces';
import { getUserById } from '@/lib/api/users';
import { mockUserSpaces } from '@/lib/mocks/users';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { formatDistanceToNow } from '@/lib/utils/time';
import { MediaViewer } from '@/components/media/MediaViewer';
import { FormattedPostText } from '@/components/feed/FormattedPostText';
import {
  deleteSpaceAnnouncement,
  getSpaceAnnouncements,
  SpaceAnnouncement,
  updateSpaceAnnouncement,
} from '@/lib/services/spaceAnnouncementService';

export default function SpaceAnnouncementsScreen() {
  const params = useLocalSearchParams<{ id?: string; compose?: string }>();
  const router = useRouter();
  const haptics = useHapticFeedback();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const currentUserId = useCurrentUserId();

  const spaceId = params.id;
  const [loading, setLoading] = useState(true);
  const [spaceOwnerId, setSpaceOwnerId] = useState<string | undefined>(undefined);
  const [spaceName, setSpaceName] = useState<string>('Space');
  const [isJoined, setIsJoined] = useState(false);
  const [announcements, setAnnouncements] = useState<SpaceAnnouncement[]>([]);
  const [authorById, setAuthorById] = useState<Record<string, { name: string; handle: string; avatar: string | null }>>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<SpaceAnnouncement | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItems, setViewerItems] = useState<Array<{ id: string; uri: string; type: 'image' | 'video'; thumbnail?: string }>>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  const audioSoundRef = useRef<Audio.Sound | null>(null);
  const [playingAudioUri, setPlayingAudioUri] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const isOwner = useMemo(() => {
    if (!spaceOwnerId) return false;
    return spaceOwnerId === currentUserId || spaceOwnerId === `user-${currentUserId}`;
  }, [spaceOwnerId, currentUserId]);

  const listRef = useRef<FlatList<SpaceAnnouncement>>(null);

  const orderedAnnouncements = useMemo(
    () => announcements.slice().reverse(), // oldest -> newest for chat scroll
    [announcements]
  );

  const load = useCallback(async () => {
    if (!spaceId) return;
    setLoading(true);
    try {
      const space = await getSpaceById(spaceId);
      setSpaceOwnerId(space?.ownerId);
      setSpaceName(space?.name || 'Space');
      const joined = Boolean((space as any)?.isJoined) || mockUserSpaces.includes(spaceId);
      const owner = Boolean(space?.ownerId && (space.ownerId === currentUserId || space.ownerId === `user-${currentUserId}`));
      setIsJoined(joined || owner);

      // Service returns newest-first.
      const list = await getSpaceAnnouncements(spaceId);
      setAnnouncements(list);
    } finally {
      setLoading(false);
    }
  }, [spaceId, currentUserId]);

  useFocusEffect(
    useCallback(() => {
      load();
      return () => {};
    }, [load])
  );

  useEffect(() => {
    // After loading, keep the view at the "bottom" (newest)
    if (!loading) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
    }
  }, [loading, orderedAnnouncements.length]);

  useEffect(() => {
    let cancelled = false;
    const normalizeId = (id: string) => (id.startsWith('user-') ? id.slice(5) : id);

    (async () => {
      const ids = Array.from(
        new Set(
          announcements
            .map((a) => (a?.createdBy ? String(a.createdBy) : ''))
            .filter(Boolean)
            .map(normalizeId)
        )
      );
      const missing = ids.filter((id) => !authorById[id]);
      if (missing.length === 0) return;

      const fetched = await Promise.all(
        missing.map(async (id) => {
          try {
            return await getUserById(id);
          } catch {
            return null;
          }
        })
      );

      if (cancelled) return;
      setAuthorById((prev) => {
        const next = { ...prev };
        fetched.forEach((u) => {
          if (!u) return;
          next[String(u.id)] = { name: u.name, handle: u.handle, avatar: u.avatar ?? null };
        });
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [announcements, authorById]);

  useEffect(() => {
    return () => {
      // Cleanup audio player
      if (audioSoundRef.current) {
        audioSoundRef.current.unloadAsync().catch(() => {});
        audioSoundRef.current = null;
      }
    };
  }, []);

  const toggleAudio = useCallback(async (uri: string) => {
    try {
      haptics.light();
      if (playingAudioUri === uri && audioSoundRef.current) {
        if (audioPlaying) {
          await audioSoundRef.current.pauseAsync();
          setAudioPlaying(false);
        } else {
          await audioSoundRef.current.playAsync();
          setAudioPlaying(true);
        }
        return;
      }

      // Switch to a new audio
      if (audioSoundRef.current) {
        await audioSoundRef.current.unloadAsync();
        audioSoundRef.current = null;
      }

      const sound = new Audio.Sound();
      await sound.loadAsync({ uri }, { shouldPlay: true });
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        setAudioPlaying(status.isPlaying);
        if (status.didJustFinish) {
          setAudioPlaying(false);
          setPlayingAudioUri(null);
        }
      });
      audioSoundRef.current = sound;
      setPlayingAudioUri(uri);
      setAudioPlaying(true);
    } catch {
      Alert.alert('Error', 'Could not play audio.');
      setAudioPlaying(false);
      setPlayingAudioUri(null);
    }
  }, [audioPlaying, haptics, playingAudioUri]);

  const renderItem = useCallback(
    ({ item }: { item: SpaceAnnouncement }) => {
      const media = item.media ?? [];
      const mediaVisual = media.filter((m) => m.type === 'image' || m.type === 'video');
      const docs = media.filter((m) => m.type === 'document');
      const audios = media.filter((m) => m.type === 'audio');
      const normalizeId = (id: string) => (id.startsWith('user-') ? id.slice(5) : id);
      const author = authorById[normalizeId(item.createdBy || '')];
      const isEdited = Boolean(item.updatedAt) && item.updatedAt !== item.createdAt;
      const body = (item.body || '').trim();
      const shouldTruncateBody =
        body.length > 280 || body.split('\n').length > 6;
      const isExpanded = expandedIds.has(item.id);
      return (
        <View style={styles.row}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
                borderLeftColor: colors.error,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                {author?.avatar ? (
                  <ExpoImage source={{ uri: author.avatar }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={[styles.avatarFallback, { backgroundColor: colors.error + '15' }]}>
                    <Ionicons name="megaphone" size={16} color={colors.error} />
                  </View>
                )}
                <View style={styles.cardHeaderText}>
                  <View style={styles.metaRow}>
                    <Text style={[styles.authorName, { color: colors.text }]} numberOfLines={1}>
                      {author?.name || 'Announcement'}
                    </Text>
                    {author?.handle ? (
                      <Text style={[styles.authorHandle, { color: colors.secondary }]} numberOfLines={1}>
                        {author.handle}
                      </Text>
                    ) : null}
                    <Text style={[styles.metaDot, { color: colors.secondary }]}>·</Text>
                    <Text style={[styles.metaText, { color: colors.secondary }]} numberOfLines={1}>
                      {formatDistanceToNow(item.createdAt)}
                    </Text>
                    {isEdited && (
                      <>
                        <Text style={[styles.metaDot, { color: colors.secondary }]}>·</Text>
                        <Text style={[styles.metaText, { color: colors.secondary }]} numberOfLines={1}>
                          Edited
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.cardHeaderRight}>
                <View
                  style={[
                    styles.announcePill,
                    { backgroundColor: colors.error + '12', borderColor: colors.error + '35' },
                  ]}
                >
                  <Ionicons name="megaphone-outline" size={12} color={colors.error} />
                  <Text style={[styles.announcePillText, { color: colors.error }]}>Announcement</Text>
                </View>
                {isOwner && (
                  <View style={styles.ownerActions}>
                    <TouchableOpacity
                      onPress={() => {
                        haptics.light();
                        setEditing(item);
                        setEditDraft(item.body || '');
                      }}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.ownerActionBtn}
                    >
                      <Ionicons name="create-outline" size={18} color={colors.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (!spaceId) return;
                        haptics.light();
                        Alert.alert('Delete announcement?', 'This cannot be undone.', [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              await deleteSpaceAnnouncement(spaceId, item.id);
                              load();
                            },
                          },
                        ]);
                      }}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.ownerActionBtn}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.secondary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Title is full-width (not offset by avatar) */}
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={3}>
              {item.title}
            </Text>

            {item.body ? (
              <View style={styles.cardBody}>
                <FormattedPostText
                  text={item.body}
                  color={colors.text}
                  numberOfLines={shouldTruncateBody && !isExpanded ? 6 : undefined}
                  ellipsizeMode="tail"
                  style={styles.bodyText}
                />
                {shouldTruncateBody ? (
                  <TouchableOpacity
                    onPress={() => {
                      haptics.light();
                      setExpandedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(item.id)) next.delete(item.id);
                        else next.add(item.id);
                        return next;
                      });
                    }}
                    activeOpacity={0.7}
                    style={styles.readMoreBtn}
                  >
                    <Text style={[styles.readMoreText, { color: colors.primary }]}>
                      {isExpanded ? 'Show less' : 'Read more'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            {mediaVisual.length > 0 && (
              <View style={styles.mediaBlock}>
                {(() => {
                  const items = mediaVisual;
                  const openAt = (idx: number) => {
                    haptics.light();
                    setViewerItems(
                      items.map((x) => ({
                        id: x.id,
                        uri: x.uri,
                        type: x.type as 'image' | 'video',
                        thumbnail: x.thumbnail,
                      }))
                    );
                    setViewerIndex(idx);
                    setViewerOpen(true);
                  };
                  const tile = (m: any, idx: number, style: any, overlayText?: string) => {
                    const isVideo = m.type === 'video';
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={[styles.mediaTileNew, style, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder }]}
                        activeOpacity={0.9}
                        onPress={() => openAt(idx)}
                      >
                        {m.type === 'image' ? (
                          <ExpoImage source={{ uri: m.uri }} style={styles.mediaThumb} contentFit="cover" />
                        ) : (
                          <View style={styles.videoThumb}>
                            {m.thumbnail ? (
                              <ExpoImage source={{ uri: m.thumbnail }} style={styles.mediaThumb} contentFit="cover" />
                            ) : null}
                            <View style={styles.videoOverlay}>
                              <Ionicons name="play-circle" size={34} color="#FFFFFF" />
                            </View>
                          </View>
                        )}
                        {isVideo && (
                          <View style={styles.videoBadge}>
                            <Text style={styles.videoBadgeText}>VIDEO</Text>
                          </View>
                        )}
                        {overlayText ? (
                          <View style={styles.moreOverlay}>
                            <Text style={styles.moreOverlayText}>{overlayText}</Text>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    );
                  };

                  if (items.length === 1) {
                    return <View style={styles.mediaOne}>{tile(items[0], 0, styles.mediaOneTile)}</View>;
                  }
                  if (items.length === 2) {
                    return (
                      <View style={styles.mediaTwo}>
                        {tile(items[0], 0, styles.mediaTwoTile)}
                        {tile(items[1], 1, styles.mediaTwoTile)}
                      </View>
                    );
                  }
                  if (items.length === 3) {
                    return (
                      <View style={styles.mediaThree}>
                        {tile(items[0], 0, styles.mediaThreeLeft)}
                        <View style={styles.mediaThreeRight}>
                          {tile(items[1], 1, styles.mediaThreeRightTile)}
                          {tile(items[2], 2, styles.mediaThreeRightTile)}
                        </View>
                      </View>
                    );
                  }
                  const extra = items.length - 4;
                  return (
                    <View style={styles.mediaFour}>
                      {tile(items[0], 0, styles.mediaFourTile)}
                      {tile(items[1], 1, styles.mediaFourTile)}
                      {tile(items[2], 2, styles.mediaFourTile)}
                      {tile(items[3], 3, styles.mediaFourTile, extra > 0 ? `+${extra}` : undefined)}
                    </View>
                  );
                })()}
              </View>
            )}

            {docs.length > 0 && (
              <View style={styles.filesBlock}>
                {docs.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.fileRow, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder }]}
                    activeOpacity={0.8}
                    onPress={async () => {
                      haptics.light();
                      try {
                        await Linking.openURL(d.uri);
                      } catch {
                        Alert.alert('File', d.name || 'Document');
                      }
                    }}
                  >
                    <Ionicons name="document-outline" size={18} color={colors.primary} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                        {d.name || 'Document'}
                      </Text>
                      <Text style={[styles.fileMeta, { color: colors.secondary }]} numberOfLines={1}>
                        {d.mimeType || 'file'}
                      </Text>
                    </View>
                    <Ionicons name="open-outline" size={18} color={colors.secondary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {audios.length > 0 && (
              <View style={styles.filesBlock}>
                {audios.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.fileRow, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder }]}
                    activeOpacity={0.8}
                    onPress={() => toggleAudio(a.uri)}
                  >
                    <Ionicons
                      name={playingAudioUri === a.uri && audioPlaying ? 'pause' : 'play'}
                      size={18}
                      color={colors.primary}
                    />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                        {a.name || 'Voice message'}
                      </Text>
                      <Text style={[styles.fileMeta, { color: colors.secondary }]} numberOfLines={1}>
                        {typeof a.duration === 'number' ? `${Math.round(a.duration)}s` : 'audio'}
                      </Text>
                    </View>
                    <Ionicons name="volume-high-outline" size={18} color={colors.secondary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      );
    },
    [audioPlaying, colors, haptics, isOwner, load, playingAudioUri, spaceId, toggleAudio]
  );

  if (!spaceId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.secondary }]}>Missing space id.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!loading && !isOwner && !isJoined) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              router.back();
            }}
            activeOpacity={0.7}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleBlock}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              Announcements
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.secondary }]} numberOfLines={1}>
              {spaceName}
            </Text>
          </View>

          <View style={[styles.postBtnPlaceholder, styles.headerRight]} />
        </View>

        <View style={styles.center}>
          <Ionicons name="lock-closed" size={34} color={colors.secondary} />
          <Text style={[styles.emptyTitle, { color: colors.text, marginTop: Spacing.sm }]}>Members only</Text>
          <Text style={[styles.emptyText, { color: colors.secondary, marginTop: Spacing.xs }]}>
            Join this space to view announcements.
          </Text>
          <TouchableOpacity
            onPress={() => {
              haptics.medium();
              router.push(`/space/${spaceId}`);
            }}
            activeOpacity={0.85}
            style={[styles.joinBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.joinBtnText, { color: '#FFFFFF' }]}>Go to space</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            router.back();
          }}
          activeOpacity={0.7}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleBlock}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            Announcements
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.secondary }]} numberOfLines={1}>
            {spaceName}
          </Text>
        </View>

        {isOwner ? (
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              router.push(`/space/${spaceId}/announcement-compose`);
            }}
            activeOpacity={0.7}
            style={[styles.postBtn, styles.headerRight]}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={[styles.postBtnPlaceholder, styles.headerRight]} />
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.secondary }]}>Loading announcements…</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={orderedAnnouncements}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No announcements</Text>
                <Text style={[styles.emptyText, { color: colors.secondary }]}>
                  {isOwner ? 'Post the first update for your members.' : 'Check back later for updates.'}
                </Text>
              </View>
            }
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        <View style={[styles.readOnly, { borderTopColor: colors.cardBorder, backgroundColor: colors.background }]}>
          <Ionicons name={isOwner ? 'create-outline' : 'lock-closed'} size={14} color={colors.secondary} />
          <Text style={[styles.readOnlyText, { color: colors.secondary }]}>
            {isOwner ? 'Post announcements from the editor.' : 'Only the owner can post announcements.'}
          </Text>
          {isOwner ? (
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                router.push(`/space/${spaceId}/announcement-compose`);
              }}
              activeOpacity={0.8}
              style={[styles.inlinePostBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.inlinePostBtnText}>Post</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={!!editing}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setEditing(null);
          setEditDraft('');
        }}
      >
        <Pressable
          style={styles.editOverlay}
          onPress={() => {
            setEditing(null);
            setEditDraft('');
          }}
        >
          <Pressable
            style={[styles.editSheet, { backgroundColor: colors.cardBackground }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.editHeader}>
              <Text style={[styles.editTitle, { color: colors.text }]}>Edit announcement</Text>
              <TouchableOpacity
                onPress={() => {
                  haptics.light();
                  setEditing(null);
                  setEditDraft('');
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={editDraft}
              onChangeText={setEditDraft}
              placeholder="Update the announcement…"
              placeholderTextColor={colors.secondary}
              multiline
              style={[
                styles.editInput,
                { color: colors.text, backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder },
              ]}
            />

            <View style={styles.editActions}>
              <TouchableOpacity
                onPress={() => {
                  haptics.light();
                  setEditing(null);
                  setEditDraft('');
                }}
                activeOpacity={0.8}
                style={[styles.editBtn, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder }]}
              >
                <Text style={[styles.editBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={
                  editSaving ||
                  !spaceId ||
                  !editing ||
                  (!editDraft.trim() && (!editing.media || editing.media.length === 0))
                }
                onPress={async () => {
                  if (!spaceId || !editing) return;
                  const body = editDraft.trim();
                  const hasMedia = Boolean(editing.media && editing.media.length > 0);
                  if (!body && !hasMedia) return;

                  const firstLine = body ? (body.split('\n')[0]?.trim() || body) : hasMedia ? 'Media' : 'Announcement';
                  const title = firstLine.length > 64 ? `${firstLine.slice(0, 64).trim()}…` : firstLine;

                  haptics.medium();
                  setEditSaving(true);
                  try {
                    await updateSpaceAnnouncement(spaceId, editing.id, { title: title || 'Announcement', body });
                    setEditing(null);
                    setEditDraft('');
                    await load();
                  } catch {
                    Alert.alert('Error', 'Failed to update announcement.');
                  } finally {
                    setEditSaving(false);
                  }
                }}
                activeOpacity={0.85}
                style={[
                  styles.editBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity:
                      editSaving ||
                      !spaceId ||
                      !editing ||
                      (!editDraft.trim() && (!editing.media || editing.media.length === 0))
                        ? 0.55
                        : 1,
                  },
                ]}
              >
                <Text style={[styles.editBtnText, { color: '#FFFFFF' }]}>{editSaving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <MediaViewer
        visible={viewerOpen}
        mediaItems={viewerItems}
        initialIndex={viewerIndex}
        onClose={() => setViewerOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  backBtn: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: Typography.base,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'left',
  },
  headerSubtitle: {
    fontSize: Typography.xs,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.8,
  },
  postBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D9BF0',
  },
  headerRight: {
    marginLeft: 'auto',
  },
  postBtnPlaceholder: {
    width: 36,
    height: 36,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  row: {
    width: '100%',
  },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    width: '100%',
    borderLeftWidth: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardHeaderLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  authorName: {
    fontSize: Typography.sm,
    fontWeight: '800',
    letterSpacing: -0.1,
    maxWidth: '70%',
  },
  authorHandle: {
    marginLeft: 8,
    fontSize: Typography.xs,
    fontWeight: '700',
    opacity: 0.9,
  },
  metaDot: {
    marginHorizontal: 6,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  metaText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    opacity: 0.85,
  },
  cardTitle: {
    marginTop: Spacing.sm,
    fontSize: Typography.xl,
    fontWeight: '800',
    letterSpacing: -0.35,
    lineHeight: Math.round(Typography.xl * 1.2),
    textAlign: 'left',
  },
  announcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  announcePillText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  cardBody: {
    marginTop: Spacing.sm,
  },
  bodyText: {
    fontSize: Typography.base,
    lineHeight: Math.round(Typography.base * 1.65),
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  readMoreBtn: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: Typography.sm,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  bubble: {
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    // Make it look like a chat bubble (not full width)
    maxWidth: '92%',
    alignSelf: 'flex-start',
  },
  mediaBlock: {
    marginTop: Spacing.md,
  },
  mediaTileNew: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.lg,
  },
  mediaOne: {},
  mediaOneTile: {
    width: '100%',
    height: 220,
  },
  mediaTwo: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  mediaTwoTile: {
    flex: 1,
    height: 170,
  },
  mediaThree: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  mediaThreeLeft: {
    flex: 2,
    height: 240,
  },
  mediaThreeRight: {
    flex: 1,
    gap: Spacing.sm,
  },
  mediaThreeRightTile: {
    flex: 1,
    height: 115,
  },
  mediaFour: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  mediaFourTile: {
    width: '48%',
    height: 150,
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreOverlayText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  mediaThumb: {
    width: '100%',
    height: '100%',
  },
  videoThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  videoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  filesBlock: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  fileName: {
    fontSize: Typography.sm,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  fileMeta: {
    fontSize: Typography.xs,
    fontWeight: '600',
    opacity: 0.8,
    marginTop: 2,
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  bubbleTitle: {
    fontSize: Typography.base,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  bubbleMeta: {
    fontSize: Typography.xs,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.75,
  },
  deleteBtn: {
    padding: Spacing.xs,
    marginRight: -Spacing.xs,
  },
  ownerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginRight: -Spacing.xs,
  },
  ownerActionBtn: {
    padding: Spacing.xs,
  },
  bubbleBody: {
    fontSize: Typography.base,
    lineHeight: Typography.base * 1.5,
    fontWeight: '500',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  emptyState: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.8,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexWrap: 'wrap',
  },
  attachmentChip: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  attachmentThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  attachmentIconThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  removeAttachmentBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  // Attachment/voice UI removed (posting moved to announcement-compose)
  editOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  editSheet: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editTitle: {
    fontSize: Typography.base,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  editInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.base,
    fontWeight: '500',
    minHeight: 120,
    maxHeight: 220,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },
  editBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontSize: Typography.sm,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  // (menuSheet/menuRow/voiceSheet/composerInput/sendBtn styles removed)
  readOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  readOnlyText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    flex: 1,
  },
  inlinePostBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  inlinePostBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.sm,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  joinBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  joinBtnText: {
    fontSize: Typography.sm,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
});

