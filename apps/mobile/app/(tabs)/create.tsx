import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Text, Alert, TextInput, Keyboard, KeyboardAvoidingView, Platform, InteractionManager, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { PostType } from '@/types/post';
import { EditablePostCard } from '@/components/create/EditablePostCard';
import { SpaceSelector } from '@/components/create/SpaceSelector';
import { MediaManager } from '@/components/create/MediaManager';
import { HashtagSuggestions } from '@/components/create/HashtagSuggestions';
import { MentionAutocomplete } from '@/components/create/MentionAutocomplete';
import { FormattingHelpModal } from '@/components/create/FormattingHelpModal';
import { DraftsManager } from '@/components/create/DraftsManager';
import { Toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { createPost } from '@/lib/api/posts';
import { getSpaces } from '@/lib/api/spaces';
import { Space } from '@/types/post';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useDebounce } from '@/hooks/useDebounce';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { mockUsers } from '@/lib/mocks/users';
import { draftService } from '@/lib/services/draftService';
import { BoostConversionModal } from '@/components/boost/BoostConversionModal';
import { canUseRewardedBoost, applyRewardedBoost, getRewardedBoostsToday } from '@/lib/services/boostService';
import { canUsePremiumBoost, applyPremiumBoost, getRemainingBoostCredits } from '@/lib/services/premiumBoostService';
import { canSchedulePosts, getSubscriptionTier, getMaxMediaItems, getMaxVideoDuration } from '@/lib/services/subscriptionService';
import { SchedulePostModal } from '@/components/create/SchedulePostModal';

type TabParamList = {
  index: undefined;
  spaces: undefined;
  create: undefined;
  inbox: undefined;
  profile: undefined;
};

export default function CreatePostScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const haptics = useHapticFeedback();
  const params = useLocalSearchParams<{ spaceId?: string }>();
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<Array<{ uri: string; type?: string; duration?: number }>>([]);
  const [selectedPostType, setSelectedPostType] = useState<PostType>(PostType.CONTENT);
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [spacesLoadError, setSpacesLoadError] = useState(false);
  const [compressingMedia, setCompressingMedia] = useState(false);
  
  // Mentions state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const contentInputRef = useRef<TextInput>(null);
  const titleInputRef = useRef<TextInput>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  
  // Hashtag input state
  const [hashtagInput, setHashtagInput] = useState('');
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false,
  });
  
  // Formatting help modal state
  const [showFormattingHelp, setShowFormattingHelp] = useState(false);
  const [showDraftsManager, setShowDraftsManager] = useState(false);
  const [showContentWarningModal, setShowContentWarningModal] = useState(false);
  
  // Poll state
  const [isPoll, setIsPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  
  // Content warning state
  const [contentWarning, setContentWarning] = useState<string | null>(null);
  
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [canSchedule, setCanSchedule] = useState(false);
  
  // Boost state
  const [useRewardedBoost, setUseRewardedBoost] = useState(false);
  const [boostReachImprovement, setBoostReachImprovement] = useState<number | null>(null);
  const [showBoostConversionModal, setShowBoostConversionModal] = useState(false);
  const [canBoost, setCanBoost] = useState(false);
  const [boostsToday, setBoostsToday] = useState(0);
  const [usePremiumBoost, setUsePremiumBoost] = useState(false);
  const [remainingPremiumBoosts, setRemainingPremiumBoosts] = useState(0);
  const [canUsePremium, setCanUsePremium] = useState(false);
  const [maxMediaItems, setMaxMediaItems] = useState(10);
  const [maxVideoDuration, setMaxVideoDuration] = useState(-1); // -1 means unlimited
  
  // Form reset key to force re-render
  const [formKey, setFormKey] = useState(0);
  const [savingDraft, setSavingDraft] = useState(false);
  
  // Show toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
  };

  const handleSaveDraft = useCallback(async (silent = false) => {
    if (!content.trim() && media.length === 0 && !isPoll) {
      if (!silent) {
        showToast('Nothing to save', 'info');
      }
      return;
    }

    try {
      setSavingDraft(true);
      await draftService.saveDraft({
        title: title.trim() || undefined,
        content: content.trim() || '',
        tags,
        media,
        postType: selectedPostType,
        selectedSpaces,
        contentWarning: contentWarning || null,
        poll: isPoll && pollQuestion.trim() ? {
          question: pollQuestion.trim(),
          options: pollOptions.filter(opt => opt.trim().length > 0),
        } : undefined,
      });
      if (!silent) {
        showToast('Draft saved', 'success');
        haptics.success();
      }
    } catch (error: any) {
      console.error('Error saving draft:', error);
      if (error?.message?.startsWith('DRAFT_LIMIT_REACHED')) {
        const maxDrafts = error.message.split(':')[1] || '5';
        Alert.alert(
          'Draft Limit Reached',
          `You can save up to ${maxDrafts} drafts with your current plan. Upgrade to Pro for unlimited drafts.`,
          [
            { text: 'OK' },
            { text: 'Upgrade', onPress: () => router.push('/settings/subscription-info') },
          ]
        );
      } else if (!silent) {
        showToast('Failed to save draft', 'error');
      }
    } finally {
      setSavingDraft(false);
    }
  }, [content, media, isPoll, pollQuestion, pollOptions, selectedSpaces, tags, title, selectedPostType, haptics]);

  // Reset form function
  const resetForm = useCallback(() => {
    setFormKey(prev => prev + 1);
    setTitle('');
    setContent('');
    setTags([]);
    setMedia([]);
    setSelectedPostType(PostType.CONTENT);
    setIsPoll(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setSelectedSpaces([]);
    setContentWarning(null);
    setHashtagInput('');
    setShowMentions(false);
    setValidationErrors({});
    setSelection({ start: 0, end: 0 });
    setUseRewardedBoost(false);
    setUsePremiumBoost(false);
    setBoostReachImprovement(null);
    setShowBoostConversionModal(false);
    checkBoostAvailability();
    checkPremiumBoostAvailability();
    setTimeout(() => {
      if (contentInputRef.current) {
        contentInputRef.current.clear();
        contentInputRef.current.blur();
      }
      Keyboard.dismiss();
    }, 50);
  }, []);

  // Load spaces on mount
  useEffect(() => {
    loadSpaces();
  }, []);

  // Check boost availability on mount and when screen comes into focus
  useEffect(() => {
    checkBoostAvailability();
    checkPremiumBoostAvailability();
  }, []);

  // Refresh boost availability when screen comes into focus (e.g., after changing subscription tier)
  useFocusEffect(
    useCallback(() => {
      checkBoostAvailability();
      checkScheduleAvailability();
      loadMediaLimits();
      checkPremiumBoostAvailability();
    }, [])
  );

  const checkPremiumBoostAvailability = async () => {
    const canUse = await canUsePremiumBoost();
    const remaining = await getRemainingBoostCredits();
    setCanUsePremium(canUse);
    setRemainingPremiumBoosts(remaining);
  };

  // Load media limits on mount
  useEffect(() => {
    loadMediaLimits();
  }, []);

  const loadMediaLimits = async () => {
    const maxMedia = await getMaxMediaItems();
    const maxVideo = await getMaxVideoDuration();
    setMaxMediaItems(maxMedia);
    setMaxVideoDuration(maxVideo);
  };

  // Check schedule availability
  useEffect(() => {
    checkScheduleAvailability();
  }, []);

  const checkScheduleAvailability = async () => {
    const available = await canSchedulePosts();
    setCanSchedule(available);
  };

  const checkBoostAvailability = async () => {
    // Check if user can use rewarded boost (we'll use a temporary post ID for checking)
    const available = await canUseRewardedBoost('temp-check', false);
    setCanBoost(available);
    const today = await getRewardedBoostsToday();
    setBoostsToday(today);
  };

  // Pre-select space if spaceId is provided in params
  useEffect(() => {
    if (params.spaceId && spaces.length > 0 && selectedSpaces.length === 0) {
      const spaceExists = spaces.some(s => s.id === params.spaceId);
      if (spaceExists) {
        setSelectedSpaces([params.spaceId]);
      }
    }
  }, [params.spaceId, spaces, selectedSpaces.length]);

  // Track if we just posted to prevent form reload
  const justPostedRef = useRef(false);
  
  // Reset form when screen comes into focus (if we didn't just post)
  useFocusEffect(
    useCallback(() => {
      if (justPostedRef.current) {
        justPostedRef.current = false;
        resetForm();
        return;
      }
      resetForm();
    }, [resetForm])
  );

  const loadSpaces = useCallback(async () => {
    setLoadingSpaces(true);
    setSpacesLoadError(false);
    try {
      const fetchedSpaces = await getSpaces();
      setSpaces(fetchedSpaces);
    } catch (error) {
      console.error('Error loading spaces:', error);
      setSpacesLoadError(true);
      showToast('Couldn\'t load spaces', 'error');
    } finally {
      setLoadingSpaces(false);
    }
  }, []);

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos and videos to add media to your post.');
        return;
      }

      // Check media limit
      if (media.length >= maxMediaItems) {
        Alert.alert(
          'Media Limit Reached',
          `You can add up to ${maxMediaItems} media item${maxMediaItems > 1 ? 's' : ''} per post. Upgrade to Pro for 10 items or Pro+ for 20 items.`,
          [
            { text: 'OK' },
            { text: 'Upgrade', onPress: () => router.push('/settings/subscription-info') },
          ]
        );
        return;
      }

      const remainingSlots = maxMediaItems - media.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: remainingSlots,
        ...(maxVideoDuration > 0 && { videoMaxDuration: maxVideoDuration }),
      });
      
      if (!result.canceled && result.assets) {
        setCompressingMedia(true);
        try {
          const newMedia = result.assets.map(asset => ({
            uri: asset.uri,
            type: asset.type === 'video' ? 'video' as const : 'image' as const,
            duration: asset.duration ?? undefined,
          }));
          setMedia(prev => [...prev, ...newMedia]);
          showToast(`${result.assets.length} media item(s) added`, 'success');
        } catch (error) {
          showToast('Error processing media', 'error');
        } finally {
          setCompressingMedia(false);
        }
      }
    } catch (error) {
      console.error('Error picking media:', error);
      showToast('Failed to pick media', 'error');
    }
  };

  const handleAddTag = (tag: string) => {
    const tagWithoutHash = tag.startsWith('#') ? tag.slice(1) : tag;
    if (!tags.includes(tagWithoutHash) && tags.length < 10) {
      setTags(prev => [...prev, tagWithoutHash]);
      setHashtagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    const tagWithoutHash = tag.startsWith('#') ? tag.slice(1) : tag;
    setTags(prev => prev.filter(t => t !== tagWithoutHash));
  };

  const handleRemoveMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleReorderMedia = (fromIndex: number, toIndex: number) => {
    setMedia(prev => {
      const newMedia = [...prev];
      const [removed] = newMedia.splice(fromIndex, 1);
      newMedia.splice(toIndex, 0, removed);
      return newMedia;
    });
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    
    // Automatic @ mention detection - shows autocomplete when @ is typed
    const mentionMatch = text.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setMentionPosition(text.length);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }

    // Automatic # hashtag detection - shows suggestions when # is typed
    const hashtagMatch = text.match(/#(\w*)$/);
    if (hashtagMatch) {
      setHashtagInput('#' + hashtagMatch[1]);
    } else if (!text.endsWith('#')) {
      setHashtagInput('');
    }

    // URLs are automatically detected and will be rendered as links
    // No special formatting needed - just paste or type a URL
  };

  const handleSelectionChange = (event: any) => {
    setSelection({
      start: event.nativeEvent.selection.start,
      end: event.nativeEvent.selection.end,
    });
  };

  const handleSelectMention = (user: { handle: string; name: string }) => {
    haptics.light();
    const before = content.substring(0, mentionPosition - mentionQuery.length - 1);
    const after = content.substring(mentionPosition);
    const newText = `${before}@${user.handle} ${after}`;
    setContent(newText);
    setShowMentions(false);
    setMentionQuery('');
    setTimeout(() => {
      contentInputRef.current?.focus();
      const newPosition = before.length + user.handle.length + 2;
      contentInputRef.current?.setNativeProps({
        selection: { start: newPosition, end: newPosition },
      });
    }, 100);
  };

  const handleToggleSpace = (spaceId: string) => {
    setSelectedSpaces(prev => 
      prev.includes(spaceId)
        ? prev.filter(id => id !== spaceId)
        : [...prev, spaceId]
    );
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, text: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = text;
    setPollOptions(newOptions);
  };

  const validatePost = (): boolean => {
    const errors: Record<string, string> = {};

    if (isPoll) {
      if (!pollQuestion.trim()) {
        errors.pollQuestion = 'Poll question is required.';
      }
      const validOptions = pollOptions.filter(opt => opt.trim().length > 0);
      if (validOptions.length < 2) {
        errors.pollOptions = 'Poll must have at least 2 options.';
      } else {
        const trimmed = validOptions.map(o => o.trim().toLowerCase());
        const unique = new Set(trimmed);
        if (unique.size !== trimmed.length) {
          errors.pollOptions = 'Poll options must be different from each other.';
        }
      }
    } else {
      if (!content.trim() && media.length === 0) {
        errors.content = 'Please add some text or media to your post.';
      }
    }

    if (content.length > 2000) {
      errors.content = 'Content exceeds maximum length of 2000 characters.';
    }

    // Check media limit based on subscription
    if (media.length > maxMediaItems) {
      errors.media = `Maximum ${maxMediaItems} media item${maxMediaItems > 1 ? 's' : ''} allowed.`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePublish = async () => {
    if (!validatePost()) {
      const firstError = Object.values(validationErrors)[0];
      Alert.alert('Cannot Post', firstError);
      return;
    }

    setLoading(true);
    
    try {
      const postData: any = {
        type: selectedPostType,
        title: title.trim() || undefined,
        content: content.trim() || '',
        tags: tags,
        spaces: selectedSpaces,
        media: media.map(item => ({ uri: item.uri, type: item.type || 'image' })) as any,
        contentWarning: contentWarning || null,
        useRewardedBoost: useRewardedBoost && canBoost,
      };

      if (isPoll && pollQuestion.trim()) {
        const validOptions = pollOptions.filter(opt => opt.trim().length > 0);
        if (validOptions.length >= 2) {
          postData.poll = {
            question: pollQuestion.trim(),
            options: validOptions.map((text, index) => ({
              id: `option-${index}`,
              text: text.trim(),
              votes: 0,
            })),
            totalVotes: 0,
          };
        }
      }

      // Check if post is scheduled
      if (scheduledDate && scheduledDate > new Date()) {
        // Save as scheduled post
        const { saveScheduledPost } = await import('@/lib/services/scheduledPostsService');
        await saveScheduledPost(postData, scheduledDate);
        showToast(`Post scheduled for ${scheduledDate.toLocaleString()}`, 'success');
        setLoading(false);
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 500);
        return;
      }

      const newPost = await createPost(postData);
      
      // Apply premium boost if user selected it (for Pro/Pro+ users)
      if (usePremiumBoost && newPost.id) {
        try {
          const baseReach = newPost.views || newPost.likes + (newPost.comments || 0) || 100;
          const boostResult = await applyPremiumBoost(newPost.id, baseReach);
          showToast(`Post boosted! ${boostResult.reachImprovement}% reach increase`, 'success');
          await checkPremiumBoostAvailability(); // Refresh remaining credits
        } catch (error: any) {
          console.error('Error applying premium boost:', error);
          Alert.alert('Boost Error', error.message || 'Failed to apply boost');
        }
      }
      
      // Apply rewarded boost if user selected it (for free users)
      let boostResult = null;
      if (useRewardedBoost && canBoost && newPost.id) {
        // Apply boost with actual post ID
        const baseReach = newPost.views || newPost.likes + (newPost.comments || 0) || 100;
        boostResult = await applyRewardedBoost(newPost.id, baseReach);
        setBoostReachImprovement(boostResult.reachImprovement);
      }
      
      // Record activity for badges
      const { recordActivity } = await import('@/lib/services/activityService');
      const { incrementPosts } = await import('@/lib/services/userMetricsService');
      await recordActivity('post');
      await incrementPosts();
      
      justPostedRef.current = true;
      const newKey = formKey + 1;
      setFormKey(newKey);
      
      setTitle('');
      setContent('');
      setTags([]);
      setMedia([]);
      setSelectedPostType(PostType.CONTENT);
      setIsPoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setSelectedSpaces([]);
      setHashtagInput('');
      setShowMentions(false);
      setValidationErrors({});
      setLoading(false);
      
      Keyboard.dismiss();
      
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.setNativeProps({ text: '' });
        }
        if (contentInputRef.current) {
          contentInputRef.current.setNativeProps({ text: '' });
        }
      }, 0);
      
      showToast('Post created!', 'success');
      
      // Show conversion modal if rewarded boost was used
      if (boostResult && boostResult.reachImprovement) {
        setShowBoostConversionModal(true);
      } else {
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 200);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
      console.error('Error creating post:', error);
      setLoading(false);
      Alert.alert('Error', errorMessage, [
        { text: 'OK' },
        { text: 'Retry', onPress: () => handlePublish() },
      ]);
    }
  };
  
  // Automatic formatting - no manual buttons needed
  // URLs: Just paste or type a URL (http:// or https://) - automatically detected
  // Mentions: Type @username - autocomplete appears automatically
  // Hashtags: Type #hashtag - suggestions appear automatically

  const hasContent = content.trim().length > 0;
  const hasMedia = media.length > 0;
  const hasValidPoll = isPoll && pollQuestion.trim().length > 0 && pollOptions.filter(opt => opt.trim().length > 0).length >= 2;
  const canPublish = hasContent || hasMedia || hasValidPoll;

  const getCharCountColor = () => {
    const ratio = content.length / 2000;
    if (ratio >= 1) return colors.error;
    if (ratio >= 0.9) return colors.warning;
    return colors.secondary;
  };

  // Filter users for mentions
  const filteredUsers = mockUsers.filter(user =>
    user.handle.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.closeButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Create Post</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => {
                if (savingDraft) return;
                haptics.light();
                setShowDraftsManager(true);
              }}
              disabled={savingDraft}
              style={[
                styles.saveDraftButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                  opacity: savingDraft ? 0.6 : 1,
                }
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="bookmark-outline" size={16} color={colors.secondary} />
              <Text style={[styles.saveDraftText, { color: colors.secondary }]}>
                {savingDraft ? 'Saving…' : 'Drafts'}
              </Text>
            </TouchableOpacity>
            {canSchedule && (
              <TouchableOpacity
                onPress={() => {
                  haptics.light();
                  setShowScheduleModal(true);
                }}
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: scheduledDate ? colors.primary + '15' : 'transparent',
                    borderColor: colors.cardBorder,
                  }
                ]}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="time-outline" 
                  size={18} 
                  color={scheduledDate ? colors.primary : colors.secondary} 
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handlePublish}
              disabled={loading || compressingMedia || !canPublish}
              style={[
                styles.postButton,
                {
                  backgroundColor: (loading || compressingMedia || !canPublish) 
                    ? colors.secondary 
                    : colors.primary,
                }
              ]}
              activeOpacity={0.7}
            >
              {loading || compressingMedia ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.postButtonText}>Posting</Text>
                </View>
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Editable Post Card */}
        <EditablePostCard
          key={`post-card-${formKey}`}
          title={title}
          onTitleChange={setTitle}
          content={content}
          onContentChange={handleContentChange}
          contentInputRef={contentInputRef}
          titleInputRef={titleInputRef}
          tags={tags}
          onRemoveTag={handleRemoveTag}
          postType={selectedPostType}
          validationErrors={validationErrors}
          charCountColor={getCharCountColor()}
          isPoll={isPoll}
          onTogglePoll={() => {
            haptics.light();
            setIsPoll(!isPoll);
          }}
          pollQuestion={pollQuestion}
          onPollQuestionChange={setPollQuestion}
          pollOptions={pollOptions}
          onPollOptionChange={handlePollOptionChange}
          onAddPollOption={handleAddPollOption}
          onRemovePollOption={handleRemovePollOption}
          showMentions={showMentions}
          onCloseMentions={() => setShowMentions(false)}
          onSelectionChange={handleSelectionChange}
          onAddMedia={handlePickPhoto}
          mediaCount={media.length}
          contentWarning={contentWarning}
          onContentWarningPress={() => {
            haptics.light();
            setShowContentWarningModal(true);
          }}
          onShowFormattingHelp={() => {
            haptics.light();
            console.log('Opening formatting help modal');
            setShowFormattingHelp(true);
          }}
        />

        {/* Media Manager */}
        {media.length > 0 && (
          <View style={styles.mediaManagerContainer}>
            <MediaManager
              media={media}
              onRemove={handleRemoveMedia}
              onReorder={handleReorderMedia}
            />
          </View>
        )}

        {/* Mention Autocomplete */}
        {showMentions && (
          <MentionAutocomplete
            visible={showMentions}
            query={mentionQuery}
            onSelect={handleSelectMention}
            position={mentionPosition}
          />
        )}

        {/* Hashtag Suggestions */}
        {hashtagInput && (
          <HashtagSuggestions
            query={hashtagInput}
            onSelectHashtag={handleAddTag}
          />
        )}

        {/* Space Selector */}
        {loadingSpaces && (
          <View style={[styles.spaceSelectorContainer, styles.spaceLoader]}>
            <Text style={[styles.spaceLoaderText, { color: colors.secondary }]}>Loading spaces…</Text>
          </View>
        )}
        {!loadingSpaces && spaces.length > 0 && (
          <View style={styles.spaceSelectorContainer}>
            <SpaceSelector
              spaces={spaces}
              selectedSpaces={selectedSpaces}
              onToggleSpace={handleToggleSpace}
            />
          </View>
        )}
        {!loadingSpaces && spaces.length === 0 && spacesLoadError && (
          <View style={[styles.spaceSelectorContainer, styles.spaceErrorRow]}>
            <Text style={[styles.spaceErrorText, { color: colors.secondary }]}>Couldn't load spaces</Text>
            <TouchableOpacity
              onPress={() => loadSpaces()}
              style={[styles.spaceRetryButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.7}
            >
              <Text style={styles.spaceRetryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Premium Boost Option (Pro/Pro+) */}
        {canUsePremium && (
          <View style={styles.boostContainer}>
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                if (remainingPremiumBoosts <= 0) {
                  Alert.alert(
                    'No Boosts Remaining',
                    `You've used all your premium boosts this month. Your monthly boost credits will reset next month.`,
                    [{ text: 'OK' }]
                  );
                  return;
                }
                setUsePremiumBoost(!usePremiumBoost);
              }}
              style={[
                styles.boostButton,
                {
                  backgroundColor: usePremiumBoost ? colors.primary + '15' : colors.surface,
                  borderColor: usePremiumBoost ? colors.primary : colors.cardBorder,
                }
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.boostButtonContent}>
                <Ionicons 
                  name={usePremiumBoost ? "rocket" : "rocket-outline"} 
                  size={20} 
                  color={usePremiumBoost ? colors.primary : colors.secondary} 
                />
                <View style={styles.boostButtonText}>
                  <Text style={[styles.boostButtonTitle, { color: colors.text }]}>
                    Premium Boost
                  </Text>
                  <Text style={[styles.boostButtonSubtitle, { color: colors.secondary }]}>
                    {remainingPremiumBoosts} boost{remainingPremiumBoosts !== 1 ? 's' : ''} remaining this month
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Rewarded Boost Option (Free users) */}
        {canBoost && (
          <View style={styles.boostContainer}>
            <TouchableOpacity
              onPress={async () => {
                if (useRewardedBoost) {
                  // Already boosted, show info
                  Alert.alert(
                    'Boost Active',
                    `This post will be boosted with ${boostReachImprovement || '10-25'}% more reach after publishing.`,
                    [{ text: 'OK' }]
                  );
                  return;
                }

                haptics.light();
                try {
                  // Simulate watching rewarded ad
                  // In production, integrate with actual ad SDK
                  Alert.alert(
                    'Watch Ad to Boost',
                    'Watch a short ad to boost this post and reach more people?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Watch Ad',
                        onPress: async () => {
                          // Simulate ad watching (3-5 seconds)
                          await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
                          
                          // Mark boost as selected (will be applied when post is published)
                          setUseRewardedBoost(true);
                          
                          showToast('Boost ready! Post will be boosted after publishing.', 'success');
                          haptics.success();
                          
                          // Refresh boost availability
                          await checkBoostAvailability();
                        },
                      },
                    ]
                  );
                } catch (error) {
                  console.error('Error applying boost:', error);
                  Alert.alert('Error', 'Failed to apply boost. Please try again.');
                }
              }}
              style={[
                styles.boostButton,
                {
                  backgroundColor: useRewardedBoost ? colors.primary + '15' : colors.surface,
                  borderColor: useRewardedBoost ? colors.primary : colors.cardBorder,
                }
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.boostButtonContent}>
                <Ionicons 
                  name={useRewardedBoost ? "rocket" : "rocket-outline"} 
                  size={20} 
                  color={useRewardedBoost ? colors.primary : colors.secondary} 
                />
                <View style={styles.boostButtonText}>
                  <Text style={[styles.boostButtonTitle, { color: colors.text }]}>
                    {useRewardedBoost ? 'Post Will Be Boosted' : 'Boost This Post'}
                  </Text>
                  <Text style={[styles.boostButtonSubtitle, { color: colors.secondary }]}>
                    {useRewardedBoost 
                      ? `Reach ${boostReachImprovement || '10-25'}% more people` 
                      : `Watch an ad to reach more people (${2 - boostsToday} left today)`
                    }
                  </Text>
                </View>
                {useRewardedBoost && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Formatting Help Modal */}
      <FormattingHelpModal
        visible={showFormattingHelp}
        onClose={() => setShowFormattingHelp(false)}
      />
      
      {/* Drafts Manager */}
      <DraftsManager
        visible={showDraftsManager}
        onClose={() => setShowDraftsManager(false)}
        onSelectDraft={(draft) => {
          setTitle(draft.title || '');
          setContent(draft.content || '');
          setTags(draft.tags || []);
          setMedia(draft.media || []);
          setSelectedPostType(draft.postType as PostType);
          setSelectedSpaces(draft.selectedSpaces || []);
          setContentWarning(draft.contentWarning || null);
          if (draft.poll) {
            setIsPoll(true);
            setPollQuestion(draft.poll.question);
            const opts = draft.poll.options || [];
            setPollOptions([...opts, '', ''].slice(0, 4));
          } else {
            setIsPoll(false);
            setPollQuestion('');
            setPollOptions(['', '']);
          }
          setShowDraftsManager(false);
          showToast('Draft loaded', 'success');
        }}
        onSaveCurrent={async () => {
          await handleSaveDraft(false);
        }}
        hasCurrentContent={!!(content.trim() || media.length > 0 || isPoll)}
      />
      
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />

      {/* Boost Conversion Modal */}
      {boostReachImprovement && (
        <BoostConversionModal
          visible={showBoostConversionModal}
          reachImprovement={boostReachImprovement}
          onClose={() => {
            setShowBoostConversionModal(false);
            setTimeout(() => {
              navigation.navigate('index');
            }, 200);
          }}
        />
      )}

      {/* Schedule Post Modal */}
      <SchedulePostModal
        visible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={(date) => {
          setScheduledDate(date);
          showToast(`Post scheduled for ${date.toLocaleString()}`, 'success');
        }}
      />

      {/* Content Warning Modal */}
      <Modal
        visible={showContentWarningModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowContentWarningModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowContentWarningModal(false)}
            style={StyleSheet.absoluteFill}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, justifyContent: 'flex-end' }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Content Warning</Text>
                <TouchableOpacity
                  onPress={() => setShowContentWarningModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.modalScrollView} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.modalScrollContent}
              >
                <Text style={[styles.modalDescription, { color: colors.secondary }]}>
                  This warning will be displayed to viewers before they see your post content
                </Text>

                {/* Preset Options */}
                <View style={styles.modalPresetContainer}>
                    {[
                      'Mature Content',
                      'Sensitive Topics',
                      'Strong Language',
                      'Violence',
                      'NSFW Content',
                  ].map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => {
                        haptics.light();
                        if (contentWarning === option) {
                          setContentWarning(null);
                        } else {
                          setContentWarning(option);
                        }
                      }}
                      activeOpacity={0.7}
                      style={[styles.modalPresetButton, {
                        backgroundColor: contentWarning === option 
                          ? colors.error + '15' 
                          : colors.background,
                        borderColor: contentWarning === option 
                          ? colors.error 
                          : colors.cardBorder,
                      }]}
                    >
                      <Text style={[styles.modalPresetText, { 
                        color: contentWarning === option 
                          ? colors.error 
                          : colors.text 
                      }]}>
                        {option}
                      </Text>
                      {contentWarning === option && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.error} style={{ marginLeft: Spacing.xs }} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Input */}
                <View style={styles.modalInputContainer}>
                  <Text style={[styles.modalInputLabel, { color: colors.text }]}>
                    Or enter custom warning text
                  </Text>
                  <TextInput
                    style={[styles.modalInput, {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: contentWarning && !['Mature Content', 'Sensitive Topics', 'Strong Language', 'Violence', 'NSFW Content'].includes(contentWarning)
                        ? colors.error
                        : colors.cardBorder,
                    }]}
                    value={contentWarning && !['Mature Content', 'Sensitive Topics', 'Strong Language', 'Violence', 'NSFW Content'].includes(contentWarning)
                      ? contentWarning
                      : ''}
                    onChangeText={(text) => {
                      const trimmed = text.trim();
                      setContentWarning(trimmed || null);
                    }}
                    placeholder="e.g., Contains mature themes, graphic content, etc."
                    placeholderTextColor={colors.secondary}
                    maxLength={100}
                  />
                </View>

                {/* Current Warning Display */}
                {contentWarning && (
                  <View style={[styles.modalActiveWarning, {
                    backgroundColor: colors.error + '08',
                    borderColor: colors.error + '20',
                  }]}>
                    <View style={styles.modalActiveWarningHeader}>
                      <Ionicons name="warning" size={18} color={colors.error} />
                      <Text style={[styles.modalActiveWarningText, { color: colors.text, flex: 1 }]}>
                        {contentWarning}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          haptics.light();
                          setContentWarning(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-circle" size={22} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: colors.divider }]}>
                <TouchableOpacity
                  onPress={() => {
                    haptics.light();
                    setShowContentWarningModal(false);
                  }}
                  style={styles.modalDoneButton}
                >
                  <Text style={styles.modalDoneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  draftsButton: {
    padding: Spacing.xs,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl * 2,
  },
  mediaManagerContainer: {
    marginBottom: Spacing.md,
  },
  spaceSelectorContainer: {
    marginTop: Spacing.md,
  },
  spaceLoader: {
    paddingVertical: Spacing.md,
  },
  spaceLoaderText: {
    fontSize: 14,
  },
  spaceErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  spaceErrorText: {
    fontSize: 14,
  },
  spaceRetryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  spaceRetryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  boostContainer: {
    marginTop: Spacing.md,
  },
  boostButton: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.md,
  },
  boostButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  boostButtonText: {
    flex: 1,
    gap: 2,
  },
  boostButtonTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  boostButtonSubtitle: {
    fontSize: Typography.sm,
  },
  errorText: {
    fontSize: Typography.sm,
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerLeftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDraftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 70,
    minHeight: 36,
  },
  saveDraftText: {
    fontSize: 13,
    fontWeight: '600',
  },
  postButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: 500,
    height: '75%',
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
    zIndex: 1000,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalScrollView: {
    flex: 1,
    minHeight: 400,
  },
  modalScrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  modalPresetContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modalPresetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalPresetText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalInputContainer: {
    marginBottom: Spacing.md,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  modalInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
    minHeight: 44,
  },
  modalActiveWarning: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalActiveWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalActiveWarningText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalFooter: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
  },
  modalDoneButton: {
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    minHeight: 50,
    backgroundColor: '#1DA1F2', // Bright blue color for visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
