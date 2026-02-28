import React from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PostType } from '@/types/post';

interface EditablePostCardProps {
  title?: string;
  onTitleChange?: (text: string) => void;
  content?: string;
  onContentChange?: (text: string) => void;
  contentInputRef?: any;
  titleInputRef?: any;
  tags?: string[];
  onRemoveTag?: (tag: string) => void;
  postType?: PostType;
  validationErrors?: Record<string, string>;
  charCountColor?: string;
  isPoll?: boolean;
  onTogglePoll?: () => void;
  pollQuestion?: string;
  onPollQuestionChange?: (text: string) => void;
  pollOptions?: string[];
  onPollOptionsChange?: (options: string[]) => void;
  onAddPollOption?: () => void;
  onRemovePollOption?: (index: number) => void;
  onPollOptionChange?: (index: number, text: string) => void;
  showMentions?: boolean;
  onCloseMentions?: () => void;
  onSelectionChange?: (event: any) => void;
  onAddMedia?: () => void;
  mediaCount?: number;
  onShowFormattingHelp?: () => void;
  contentWarning?: string | null;
  onContentWarningPress?: () => void;
}

export function EditablePostCard({
  title,
  onTitleChange,
  content,
  onContentChange,
  contentInputRef,
  titleInputRef,
  tags = [],
  onRemoveTag,
  postType,
  validationErrors = {},
  charCountColor,
  isPoll = false,
  onTogglePoll,
  pollQuestion = '',
  onPollQuestionChange,
  pollOptions = [],
  onPollOptionsChange,
  onAddPollOption,
  onRemovePollOption,
  onPollOptionChange,
  showMentions,
  onCloseMentions,
  onSelectionChange,
  onAddMedia,
  mediaCount = 0,
  onShowFormattingHelp,
  contentWarning,
  onContentWarningPress,
}: EditablePostCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getPostTypeLabel = () => {
    switch (postType) {
      case PostType.BUILD_LOG:
        return 'Build Log';
      case PostType.QUESTION:
        return 'Question';
      case PostType.WIN:
        return 'Win';
      case PostType.LOSS:
        return 'Lesson';
      case PostType.COLLABORATION:
        return 'Collaboration';
      case PostType.MILESTONE:
        return 'Milestone';
      case PostType.TIP:
        return 'Tip';
      case PostType.RESOURCE:
        return 'Resource';
      case PostType.LAUNCH:
        return 'Launch';
      case PostType.SHIP:
        return 'Ship';
      case PostType.TAKEAWAY:
        return 'Takeaway';
      default:
        return 'Post';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Post Type Badge */}
      {postType && postType !== PostType.CONTENT && (
        <View style={[styles.typeBadge, { backgroundColor: colors.tint + '15' }]}>
          <Text style={[styles.typeBadgeText, { color: colors.tint }]}>
            {getPostTypeLabel()}
          </Text>
        </View>
      )}

      {/* Title Input */}
      {titleInputRef && (
        <View style={styles.titleContainer}>
          <TextInput
            ref={titleInputRef}
            style={[
              styles.titleInput,
              {
                color: colors.text,
                borderColor: validationErrors.title ? colors.error : colors.divider,
                backgroundColor: colors.background,
              },
            ]}
            value={title}
            onChangeText={onTitleChange}
            placeholder="Add a title (optional)"
            placeholderTextColor={colors.secondary}
            maxLength={100}
          />
          {validationErrors.title && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {validationErrors.title}
            </Text>
          )}
        </View>
      )}

      {/* Content Input */}
      <View style={styles.contentContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={contentInputRef}
            style={[
              styles.contentInput,
              {
                color: colors.text,
                borderColor: validationErrors.content ? colors.error : 'transparent',
                backgroundColor: colors.background,
                paddingRight: 80, // Space for icons
              },
            ]}
            value={content}
            onChangeText={onContentChange}
            onSelectionChange={onSelectionChange}
            placeholder={isPoll ? "What's your question?" : "What's on your mind?"}
            placeholderTextColor={colors.secondary}
            multiline
            textAlignVertical="top"
          />
          {/* Action Icons in bottom left corner */}
          <View style={styles.actionIcons}>
            {!isPoll && (
              <>
                <TouchableOpacity
                  onPress={onAddMedia}
                  style={styles.actionIcon}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons 
                    name={mediaCount > 0 ? "images" : "image-outline"} 
                    size={20} 
                    color={mediaCount > 0 ? colors.tint : colors.secondary} 
                  />
                  {mediaCount > 0 && (
                    <View style={[styles.mediaBadge, { backgroundColor: colors.tint }]}>
                      <Text style={styles.mediaBadgeText}>{mediaCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {onTogglePoll && (
                  <TouchableOpacity
                    onPress={onTogglePoll}
                    style={styles.actionIcon}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons 
                      name={isPoll ? "checkmark-circle" : "bar-chart-outline"} 
                      size={20} 
                      color={isPoll ? colors.tint : colors.secondary} 
                    />
                  </TouchableOpacity>
                )}
                {onContentWarningPress && (
                  <TouchableOpacity
                    onPress={onContentWarningPress}
                    style={styles.actionIcon}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons 
                      name={contentWarning ? "warning" : "warning-outline"} 
                      size={20} 
                      color={contentWarning ? colors.error : colors.secondary} 
                    />
                  </TouchableOpacity>
                )}
              </>
            )}
            {onShowFormattingHelp && (
              <TouchableOpacity
                onPress={onShowFormattingHelp}
                style={styles.actionIcon}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons 
                  name="information-circle-outline" 
                  size={20} 
                  color={colors.secondary} 
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {validationErrors.content && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {validationErrors.content}
          </Text>
        )}
        {!isPoll && (
          <View style={styles.footer}>
            <View style={styles.detectedItems}>
              {/* Show detected URLs, mentions, hashtags */}
              {(() => {
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const mentionRegex = /@(\w+)/g;
                const hashtagRegex = /#(\w+)/g;
                const urls = content?.match(urlRegex) || [];
                const mentions = content?.match(mentionRegex) || [];
                const hashtags = content?.match(hashtagRegex) || [];
                
                if (urls.length === 0 && mentions.length === 0 && hashtags.length === 0) {
                  return null;
                }
                
                return (
                  <View style={styles.detectedRow}>
                    {urls.length > 0 && (
                      <View style={[styles.detectedBadge, { backgroundColor: colors.tint + '15' }]}>
                        <Ionicons name="link" size={10} color={colors.tint} />
                        <Text style={[styles.detectedText, { color: colors.tint }]}>
                          {urls.length} link{urls.length > 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                    {mentions.length > 0 && (
                      <View style={[styles.detectedBadge, { backgroundColor: colors.tint + '15' }]}>
                        <Ionicons name="at" size={10} color={colors.tint} />
                        <Text style={[styles.detectedText, { color: colors.tint }]}>
                          {mentions.length} mention{mentions.length > 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                    {hashtags.length > 0 && (
                      <View style={[styles.detectedBadge, { backgroundColor: colors.tint + '15' }]}>
                        <Ionicons name="pricetag" size={10} color={colors.tint} />
                        <Text style={[styles.detectedText, { color: colors.tint }]}>
                          {hashtags.length} hashtag{hashtags.length > 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })()}
            </View>
            <View style={styles.charCount}>
              <Text
                style={[
                  styles.charCountText,
                  { color: charCountColor || colors.secondary },
                ]}
              >
                {content?.length || 0}/2000
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Poll Section */}
      {isPoll && (
        <View style={[styles.pollContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.pollLabel, { color: colors.text }]}>Poll Question</Text>
          <TextInput
            style={[
              styles.pollQuestionInput,
              {
                color: colors.text,
                borderColor: validationErrors.pollQuestion ? colors.error : colors.divider,
                backgroundColor: colors.surface,
              },
            ]}
            value={pollQuestion}
            onChangeText={onPollQuestionChange}
            placeholder="Ask your question..."
            placeholderTextColor={colors.secondary}
            multiline
          />
          {validationErrors.pollQuestion && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {validationErrors.pollQuestion}
            </Text>
          )}

          <Text style={[styles.pollLabel, { color: colors.text, marginTop: Spacing.md }]}>
            Options
          </Text>
          {pollOptions.map((option, index) => (
            <View key={index} style={styles.pollOptionRow}>
              <TextInput
                style={[
                  styles.pollOptionInput,
                  {
                    color: colors.text,
                    borderColor: colors.divider,
                    backgroundColor: colors.surface,
                  },
                ]}
                value={option}
                onChangeText={(text) => onPollOptionChange?.(index, text)}
                placeholder={`Option ${index + 1}`}
                placeholderTextColor={colors.secondary}
              />
              {pollOptions.length > 2 && (
                <TouchableOpacity
                  onPress={() => onRemovePollOption?.(index)}
                  style={styles.removeOptionButton}
                >
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {validationErrors.pollOptions && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {validationErrors.pollOptions}
            </Text>
          )}
          {pollOptions.length < 4 && (
            <TouchableOpacity
              onPress={onAddPollOption}
              style={[styles.addOptionButton, { borderColor: colors.divider }]}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.tint} />
              <Text style={[styles.addOptionText, { color: colors.tint }]}>
                Add Option
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tags.map((tag, index) => (
              <View
                key={index}
                style={[styles.tag, { backgroundColor: colors.tint + '15' }]}
              >
                <Text style={[styles.tagText, { color: colors.tint }]}>#{tag}</Text>
                {onRemoveTag && (
                  <TouchableOpacity
                    onPress={() => onRemoveTag(tag)}
                    style={styles.tagRemove}
                  >
                    <Ionicons name="close" size={14} color={colors.tint} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  titleContainer: {
    marginBottom: Spacing.md,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 50,
  },
  contentContainer: {
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    position: 'relative',
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionIcons: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  actionIcon: {
    padding: Spacing.xs,
    position: 'relative',
  },
  mediaBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  mediaBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  detectedItems: {
    flex: 1,
  },
  detectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  detectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  detectedText: {
    fontSize: 10,
    fontWeight: '500',
  },
  charCount: {
    paddingHorizontal: Spacing.xs,
  },
  charCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  pollContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
  },
  pollLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  pollQuestionInput: {
    fontSize: 16,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 60,
    marginBottom: Spacing.xs,
  },
  pollOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  pollOptionInput: {
    flex: 1,
    fontSize: 15,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  removeOptionButton: {
    padding: Spacing.xs,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  addOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagsContainer: {
    marginTop: Spacing.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    marginRight: Spacing.xs,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    marginRight: Spacing.xs,
  },
  tagRemove: {
    padding: 2,
  },
});
