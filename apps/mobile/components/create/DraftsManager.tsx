import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, Text, Modal, Alert } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/EmptyState';
import { draftService, Draft } from '@/lib/services/draftService';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from '@/lib/utils/time';
import { getMaxDrafts } from '@/lib/services/subscriptionService';
import { useRouter } from 'expo-router';

interface DraftsManagerProps {
  visible: boolean;
  onClose: () => void;
  onSelectDraft: (draft: Draft) => void;
  onSaveCurrent?: () => Promise<void>;
  hasCurrentContent?: boolean;
}

export function DraftsManager({ visible, onClose, onSelectDraft, onSaveCurrent, hasCurrentContent = false }: DraftsManagerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maxDrafts, setMaxDrafts] = useState(-1);

  useEffect(() => {
    if (visible) {
      loadDrafts();
    }
  }, [visible]);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const fetchedDrafts = await draftService.getDrafts();
      setDrafts(fetchedDrafts);
      const max = await getMaxDrafts();
      setMaxDrafts(max);
    } catch (error) {
      console.error('Error loading drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = useCallback(async (draftId: string) => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this draft?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await draftService.deleteDraft(draftId);
              haptics.success();
              loadDrafts();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete draft');
            }
          },
        },
      ]
    );
  }, [haptics]);

  const handleSelectDraft = useCallback((draft: Draft) => {
    haptics.light();
    onSelectDraft(draft);
    onClose();
  }, [onSelectDraft, onClose, haptics]);

  const handleSaveCurrent = useCallback(async () => {
    if (!onSaveCurrent) return;
    
    try {
      setSaving(true);
      haptics.light();
      await onSaveCurrent();
      haptics.success();
      // Reload drafts to show the newly saved one
      await loadDrafts();
    } catch (error) {
      console.error('Error saving current post:', error);
      Alert.alert('Error', 'Failed to save draft. Please try again.');
      haptics.error();
    } finally {
      setSaving(false);
    }
  }, [onSaveCurrent, haptics]);

  const renderDraft = useCallback(({ item: draft }: { item: Draft }) => {
    const preview = draft.content.substring(0, 100) || draft.title?.substring(0, 100) || 'Empty draft';
    const timeAgo = formatDistanceToNow(new Date(draft.updatedAt));

    return (
      <TouchableOpacity
        style={[styles.draftItem, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
        onPress={() => handleSelectDraft(draft)}
        activeOpacity={0.7}
      >
        <View style={styles.draftContent}>
          {draft.media.length > 0 && (
            <ExpoImage
              source={{ uri: draft.media[0].uri }}
              style={styles.draftThumbnail}
              contentFit="cover"
            />
          )}
          <View style={styles.draftText}>
            {draft.title && (
              <Text style={[styles.draftTitle, { color: colors.text }]} numberOfLines={1}>
                {draft.title}
              </Text>
            )}
            <Text style={[styles.draftPreview, { color: colors.secondary }]} numberOfLines={2}>
              {preview}
            </Text>
            <View style={styles.draftMeta}>
              <Text style={[styles.draftTime, { color: colors.secondary }]}>
                {timeAgo}
              </Text>
              {draft.tags.length > 0 && (
                <Text style={[styles.draftTags, { color: colors.primary }]} numberOfLines={1}>
                  {draft.tags.slice(0, 3).map(t => `#${t}`).join(' ')}
                </Text>
              )}
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteDraft(draft.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [colors, handleSelectDraft, handleDeleteDraft]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Drafts</Text>
            {maxDrafts > 0 && (
              <Text style={[styles.headerSubtitle, { color: colors.secondary }]}>
                {drafts.length} / {maxDrafts} drafts
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {onSaveCurrent && hasCurrentContent && (
          <View style={[styles.saveCurrentSection, { borderBottomColor: colors.divider }]}>
            <TouchableOpacity
              onPress={handleSaveCurrent}
              disabled={saving}
              style={[
                styles.saveCurrentButton,
                {
                  backgroundColor: saving ? colors.surface : colors.primary,
                  opacity: saving ? 0.6 : 1,
                }
              ]}
              activeOpacity={0.7}
            >
              {saving ? (
                <Ionicons name="hourglass-outline" size={18} color="#FFFFFF" />
              ) : (
                <Ionicons name="bookmark" size={18} color="#FFFFFF" />
              )}
              <Text style={styles.saveCurrentButtonText}>
                {saving ? 'Saving...' : 'Save Current Post as Draft'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.center}>
            <Text style={[styles.loadingText, { color: colors.secondary }]}>Loading drafts...</Text>
          </View>
        ) : (
          <FlatList
            data={drafts}
            keyExtractor={(item) => item.id}
            renderItem={renderDraft}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon="document-text-outline"
                title="No drafts"
                message="Your saved drafts will appear here"
              />
            }
          />
        )}
      </View>
    </Modal>
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
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  listContent: {
    padding: Spacing.md,
  },
  draftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  draftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  draftThumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  draftText: {
    flex: 1,
  },
  draftTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  draftPreview: {
    fontSize: Typography.sm,
    marginBottom: Spacing.xs,
    lineHeight: Typography.sm * 1.4,
  },
  draftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  draftTime: {
    fontSize: Typography.xs,
  },
  draftTags: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.base,
  },
  saveCurrentSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  saveCurrentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  saveCurrentButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: '600',
  },
});



