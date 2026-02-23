import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { EditablePostCard } from '@/components/create/EditablePostCard';
import { MediaManager } from '@/components/create/MediaManager';
import { MentionAutocomplete } from '@/components/create/MentionAutocomplete';
import { HashtagSuggestions } from '@/components/create/HashtagSuggestions';
import { createSpaceAnnouncement, SpaceAnnouncementMediaItem } from '@/lib/services/spaceAnnouncementService';
import { getSpaceById } from '@/lib/api/spaces';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';

export default function AnnouncementComposeScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const haptics = useHapticFeedback();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const currentUserId = useCurrentUserId();

  const spaceId = params.id;

  const [spaceName, setSpaceName] = useState<string>('Space');
  const [spaceOwnerId, setSpaceOwnerId] = useState<string | undefined>(undefined);
  const [isJoined, setIsJoined] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<Array<{ uri: string; type?: string; duration?: number }>>([]);
  const [posting, setPosting] = useState(false);

  // Mentions / hashtags
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [hashtagQuery, setHashtagQuery] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const titleInputRef = useRef<TextInput>(null);
  const contentInputRef = useRef<TextInput>(null);

  const isOwner = useMemo(() => {
    if (!spaceOwnerId) return false;
    return spaceOwnerId === currentUserId || spaceOwnerId === `user-${currentUserId}`;
  }, [spaceOwnerId, currentUserId]);

  const canPost = useMemo(() => {
    return Boolean(spaceId) && isOwner && !posting && (content.trim().length > 0 || media.length > 0);
  }, [content, isOwner, media.length, posting, spaceId]);

  const ensureSpaceLoaded = useCallback(async () => {
    if (!spaceId) return;
    const space = await getSpaceById(spaceId);
    setSpaceName(space?.name || 'Space');
    setSpaceOwnerId(space?.ownerId);
    const joined = Boolean((space as any)?.isJoined);
    const owner = Boolean(space?.ownerId && (space.ownerId === currentUserId || space.ownerId === `user-${currentUserId}`));
    setIsJoined(joined || owner);
  }, [spaceId, currentUserId]);

  React.useEffect(() => {
    ensureSpaceLoaded();
  }, [ensureSpaceLoaded]);

  const handleSelectionChange = useCallback((event: any) => {
    setSelection({
      start: event.nativeEvent.selection.start,
      end: event.nativeEvent.selection.end,
    });
  }, []);

  const replaceTrailingToken = useCallback((text: string, tokenRegex: RegExp, replacement: string) => {
    // Replace the last token at the end of the string.
    return text.replace(tokenRegex, replacement);
  }, []);

  const handleContentChange = useCallback((text: string) => {
    setContent(text);

    // Mention detection
    const mentionMatch = text.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setMentionPosition(text.length);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }

    // Hashtag detection
    const hashtagMatch = text.match(/#(\w*)$/);
    if (hashtagMatch) {
      setHashtagQuery('#' + hashtagMatch[1]);
    } else if (!text.endsWith('#')) {
      setHashtagQuery('');
    }
  }, []);

  const handleSelectMention = useCallback((user: { handle: string; name: string }) => {
    haptics.light();
    const before = content.substring(0, mentionPosition - mentionQuery.length - 1);
    const after = content.substring(mentionPosition);
    const newText = `${before}@${user.handle} ${after}`;
    setContent(newText);
    setShowMentions(false);
    setMentionQuery('');
    setTimeout(() => {
      contentInputRef.current?.focus();
    }, 50);
  }, [content, haptics, mentionPosition, mentionQuery]);

  const handleSelectHashtag = useCallback((tag: string) => {
    haptics.light();
    const normalized = tag.startsWith('#') ? tag.slice(1) : tag;
    // Replace trailing hashtag token if user is typing one, otherwise insert at cursor.
    if (/#\w*$/.test(content)) {
      setContent((prev) => replaceTrailingToken(prev, /#\w*$/, `#${normalized} `));
      setHashtagQuery('');
      return;
    }

    const before = content.slice(0, selection.start);
    const after = content.slice(selection.end);
    setContent(`${before}#${normalized} ${after}`);
    setHashtagQuery('');
  }, [content, haptics, replaceTrailingToken, selection.end, selection.start]);

  const handlePickMedia = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos/videos to add media.');
        return;
      }

      const { getMaxMediaItems, getMaxVideoDuration } = await import('@/lib/services/subscriptionService');
      const maxMedia = await getMaxMediaItems();
      const maxVideo = await getMaxVideoDuration();

      if (media.length >= maxMedia) {
        Alert.alert(
          'Media Limit Reached',
          `You can add up to ${maxMedia} media item${maxMedia > 1 ? 's' : ''} per post. Upgrade to Pro for 10 items or Premium for 20 items.`,
          [{ text: 'OK' }]
        );
        return;
      }

      const remainingSlots = Math.max(0, maxMedia - media.length);
      if (remainingSlots === 0) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.85,
        ...(maxVideo > 0 && { videoMaxDuration: maxVideo }),
      });

      if (result.canceled) return;
      const assets = result.assets || [];
      if (assets.length === 0) return;

      const mapped = assets.map((a) => ({
        uri: a.uri,
        type: a.type === 'video' ? 'video' : 'image',
        duration: a.duration ?? undefined,
      }));
      setMedia((prev) => [...prev, ...mapped].slice(0, maxMedia));
    } catch {
      Alert.alert('Error', 'Failed to pick media.');
    }
  }, [media.length]);

  const handleRemoveMedia = useCallback((index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handlePublish = useCallback(async () => {
    if (!spaceId) return;
    if (!isOwner) {
      haptics.error();
      Alert.alert('Not allowed', 'Only the space owner can post announcements.');
      return;
    }

    const body = content.trim();
    if (!body && media.length === 0) return;

    const finalTitle = title.trim()
      ? title.trim()
      : body
      ? (body.split('\n')[0]?.trim() || body).slice(0, 80)
      : 'Announcement';

    const announcementMedia: SpaceAnnouncementMediaItem[] | undefined =
      media.length > 0
        ? media.map((m, idx) => ({
            id: `m-${Date.now()}-${idx}`,
            uri: m.uri,
            type: m.type === 'video' ? 'video' : 'image',
            thumbnail: m.uri,
            name: m.type === 'video' ? 'Video' : 'Image',
            duration: m.duration,
          }))
        : undefined;

    haptics.medium();
    setPosting(true);
    try {
      await createSpaceAnnouncement({
        spaceId,
        title: finalTitle || 'Announcement',
        body,
        media: announcementMedia,
        createdBy: currentUserId,
      });
      router.replace(`/space/${spaceId}/announcements`);
    } catch {
      Alert.alert('Error', 'Failed to post announcement.');
    } finally {
      setPosting(false);
    }
  }, [content, haptics, isOwner, media, router, spaceId, title]);

  if (!spaceId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.center}>
          <Text style={{ color: colors.secondary }}>Missing space id.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isJoined && !isOwner) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={styles.headerIconBtn}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              New announcement
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.secondary }]} numberOfLines={1}>
              {spaceName}
            </Text>
          </View>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.center}>
          <Ionicons name="lock-closed" size={34} color={colors.secondary} />
          <Text style={[styles.lockTitle, { color: colors.text }]}>Members only</Text>
          <Text style={[styles.lockText, { color: colors.secondary }]}>
            Join this space to view announcements.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              router.back();
            }}
            activeOpacity={0.7}
            style={styles.headerIconBtn}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              New announcement
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.secondary }]} numberOfLines={1}>
              {spaceName}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handlePublish}
            disabled={!canPost}
            activeOpacity={0.8}
            style={[
              styles.postBtn,
              {
                backgroundColor: colors.primary,
                opacity: canPost ? 1 : 0.5,
              },
            ]}
          >
            <Text style={styles.postBtnText}>{posting ? 'Posting…' : 'Post'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <EditablePostCard
            title={title}
            onTitleChange={setTitle}
            titleInputRef={titleInputRef}
            content={content}
            onContentChange={handleContentChange}
            contentInputRef={contentInputRef}
            onSelectionChange={handleSelectionChange}
            onAddMedia={handlePickMedia}
            mediaCount={media.length}
          />

          {showMentions && (
            <MentionAutocomplete
              visible={showMentions}
              query={mentionQuery}
              onSelect={handleSelectMention}
              position={mentionPosition}
            />
          )}

          {hashtagQuery && (
            <HashtagSuggestions
              query={hashtagQuery}
              onSelectHashtag={handleSelectHashtag}
            />
          )}

          {media.length > 0 && (
            <View style={styles.mediaBlock}>
              <MediaManager media={media} onRemove={handleRemoveMedia} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  headerIconBtn: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  headerCenter: { flex: 1, minWidth: 0 },
  headerRight: { width: 72 },
  headerTitle: {
    fontSize: Typography.base,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: Typography.xs,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.8,
  },
  postBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 18,
  },
  postBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.sm,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  mediaBlock: {
    marginTop: Spacing.md,
  },
  lockTitle: {
    marginTop: Spacing.md,
    fontSize: Typography.lg,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  lockText: {
    marginTop: Spacing.xs,
    fontSize: Typography.sm,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.8,
  },
});

