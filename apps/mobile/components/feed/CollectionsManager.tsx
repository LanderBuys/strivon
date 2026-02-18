import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList, TextInput, Alert } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/EmptyState';
import { collectionService, Collection } from '@/lib/services/collectionService';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';

interface CollectionsManagerProps {
  visible: boolean;
  postId: string;
  onClose: () => void;
  onCollectionSelect?: (collectionId: string) => void;
}

export function CollectionsManager({
  visible,
  postId,
  onClose,
  onCollectionSelect,
}: CollectionsManagerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [postCollections, setPostCollections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      loadCollections();
    }
  }, [visible, postId]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const fetchedCollections = await collectionService.getCollections();
      setCollections(fetchedCollections);
      const collectionsForPost = await collectionService.getCollectionsForPost(postId);
      setPostCollections(new Set(collectionsForPost.map(c => c.id)));
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCollection = useCallback(async (collectionId: string) => {
    try {
      const isInCollection = postCollections.has(collectionId);
      if (isInCollection) {
        await collectionService.removePostFromCollection(collectionId, postId);
        setPostCollections(prev => {
          const newSet = new Set(prev);
          newSet.delete(collectionId);
          return newSet;
        });
      } else {
        await collectionService.addPostToCollection(collectionId, postId);
        setPostCollections(prev => new Set(prev).add(collectionId));
      }
      haptics.light();
    } catch (error) {
      Alert.alert('Error', 'Failed to update collection');
    }
  }, [postId, postCollections, haptics]);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      Alert.alert('Error', 'Please enter a collection name');
      return;
    }

    try {
      const newCollection = await collectionService.createCollection(
        newCollectionName.trim(),
        newCollectionDescription.trim() || undefined,
        false
      );
      await collectionService.addPostToCollection(newCollection.id, postId);
      setNewCollectionName('');
      setNewCollectionDescription('');
      setShowCreateModal(false);
      loadCollections();
      haptics.success();
    } catch (error) {
      Alert.alert('Error', 'Failed to create collection');
    }
  };

  const handleDeleteCollection = useCallback(async (collectionId: string) => {
    Alert.alert(
      'Delete Collection',
      'Are you sure you want to delete this collection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await collectionService.deleteCollection(collectionId);
              haptics.success();
              loadCollections();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete collection');
            }
          },
        },
      ]
    );
  }, [haptics]);

  const renderCollection = useCallback(({ item: collection }: { item: Collection }) => {
    const isSelected = postCollections.has(collection.id);

    return (
      <TouchableOpacity
        style={[styles.collectionItem, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
        onPress={() => {
          if (onCollectionSelect) {
            onCollectionSelect(collection.id);
            onClose();
          } else {
            handleToggleCollection(collection.id);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.collectionContent}>
          {collection.coverImage ? (
            <ExpoImage
              source={{ uri: collection.coverImage }}
              style={styles.collectionCover}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.collectionCover, styles.collectionCoverPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="bookmark" size={20} color={colors.primary} />
            </View>
          )}
          <View style={styles.collectionInfo}>
            <Text style={[styles.collectionName, { color: colors.text }]} numberOfLines={1}>
              {collection.name}
            </Text>
            {collection.description && (
              <Text style={[styles.collectionDescription, { color: colors.secondary }]} numberOfLines={1}>
                {collection.description}
              </Text>
            )}
            <Text style={[styles.collectionCount, { color: colors.secondary }]}>
              {collection.postIds.length} post{collection.postIds.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <View style={styles.collectionActions}>
          {isSelected && (
            <View style={[styles.checkIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
          )}
          {!onCollectionSelect && (
            <TouchableOpacity
              onPress={() => handleDeleteCollection(collection.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [colors, postCollections, handleToggleCollection, handleDeleteCollection, onCollectionSelect, onClose]);

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Save to Collection</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                style={styles.addButton}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.center}>
              <Text style={[styles.loadingText, { color: colors.secondary }]}>Loading collections...</Text>
            </View>
          ) : (
            <FlatList
              data={collections}
              keyExtractor={(item) => item.id}
              renderItem={renderCollection}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <EmptyState
                  icon="bookmark"
                  title="No collections"
                  message="Create a collection to organize your saved posts"
                />
              }
            />
          )}
        </View>
      </Modal>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.createModal, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.createHeader, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.createTitle, { color: colors.text }]}>New Collection</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.createContent}>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.cardBorder }]}
                placeholder="Collection name"
                placeholderTextColor={colors.secondary}
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                autoFocus
              />
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.cardBorder }]}
                placeholder="Description (optional)"
                placeholderTextColor={colors.secondary}
                value={newCollectionDescription}
                onChangeText={setNewCollectionDescription}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.createFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.cardBorder }]}
                onPress={() => setShowCreateModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateCollection}
                activeOpacity={0.7}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addButton: {
    padding: Spacing.xs,
  },
  listContent: {
    padding: Spacing.md,
  },
  collectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  collectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  collectionCover: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  collectionCoverPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  collectionDescription: {
    fontSize: Typography.sm,
    marginBottom: 2,
  },
  collectionCount: {
    fontSize: Typography.xs,
  },
  collectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.base,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  createModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  createHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  createTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
  },
  createContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.base,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  createFooter: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  createButton: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: '600',
  },
});



