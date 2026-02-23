import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Text, TextInput, FlatList, Alert, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useFadeIn } from '@/hooks/useFadeIn';
import { Animated } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { searchUsers, searchSpaces } from '@/lib/api/search';
import { getUserById } from '@/lib/api/users';
import { getSpaceById } from '@/lib/api/spaces';
import { useDebounce } from '@/hooks/useDebounce';

const FILTERS_KEY = '@strivon_content_filters';

interface MutedUser {
  id: string;
  name: string;
  handle: string;
  avatar?: string | null;
}

interface MutedSpace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

interface ContentFilters {
  mutedKeywords: string[];
  mutedUsers: MutedUser[];
  mutedSpaces: MutedSpace[];
}

export default function ContentFiltersScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [filters, setFilters] = useState<ContentFilters>({
    mutedKeywords: [],
    mutedUsers: [],
    mutedSpaces: [],
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<'keywords' | 'users' | 'spaces'>('keywords');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const fadeAnim = useFadeIn(200);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const stored = await AsyncStorage.getItem(FILTERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migrate old format (IDs only) to new format (full objects)
        if (parsed.mutedUsers && parsed.mutedUsers.length > 0 && typeof parsed.mutedUsers[0] === 'string') {
          // Old format - convert IDs to user objects
          const userPromises = parsed.mutedUsers.map(async (userId: string) => {
            try {
              const user = await getUserById(userId);
              if (!user) {
                return { id: userId, name: 'Unknown User', handle: `@user${userId}`, avatar: null };
              }
              return {
                id: user.id,
                name: user.name,
                handle: user.handle,
                avatar: user.avatar,
              };
            } catch {
              return {
                id: userId,
                name: 'Unknown User',
                handle: `@user${userId}`,
                avatar: null,
              };
            }
          });
          parsed.mutedUsers = await Promise.all(userPromises);
        }
        if (parsed.mutedSpaces && parsed.mutedSpaces.length > 0 && typeof parsed.mutedSpaces[0] === 'string') {
          // Old format - convert IDs to space objects
          const spacePromises = parsed.mutedSpaces.map(async (spaceId: string) => {
            try {
              const space = await getSpaceById(spaceId);
              if (!space) {
                throw new Error('Space not found');
              }
              return {
                id: space.id,
                name: space.name,
                description: space.description,
                icon: space.icon,
              };
            } catch {
              return {
                id: spaceId,
                name: 'Unknown Space',
                description: undefined,
                icon: undefined,
              };
            }
          });
          parsed.mutedSpaces = await Promise.all(spacePromises);
        }
        setFilters(parsed);
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const saveFilters = async (newFilters: ContentFilters) => {
    try {
      await AsyncStorage.setItem(FILTERS_KEY, JSON.stringify(newFilters));
      setFilters(newFilters);
      haptics.light();
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    const keyword = newKeyword.trim().toLowerCase();
    if (filters.mutedKeywords.includes(keyword)) {
      showToast('This keyword is already muted', 'info');
      return;
    }
    const updated = {
      ...filters,
      mutedKeywords: [...filters.mutedKeywords, keyword],
    };
    saveFilters(updated);
    setNewKeyword('');
    haptics.success();
    showToast('Keyword muted', 'success');
  };

  const handleRemoveKeyword = (keyword: string) => {
    const updated = {
      ...filters,
      mutedKeywords: filters.mutedKeywords.filter(k => k !== keyword),
    };
    saveFilters(updated);
    haptics.light();
    showToast('Keyword unmuted', 'success');
  };

  const handleRemoveUser = (userId: string) => {
    const updated = {
      ...filters,
      mutedUsers: filters.mutedUsers.filter(user => user.id !== userId),
    };
    saveFilters(updated);
    haptics.light();
    showToast('User unmuted', 'success');
  };

  const handleRemoveSpace = (spaceId: string) => {
    const updated = {
      ...filters,
      mutedSpaces: filters.mutedSpaces.filter(space => space.id !== spaceId),
    };
    saveFilters(updated);
    haptics.light();
    showToast('Space unmuted', 'success');
  };

  useEffect(() => {
    if (showSearchModal && debouncedSearchQuery.trim().length >= 2) {
      performSearch();
    } else {
      setSearchResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, showSearchModal, activeTab]);

  const performSearch = async () => {
    setSearchLoading(true);
    try {
      if (activeTab === 'users') {
        const results = await searchUsers(debouncedSearchQuery);
        setSearchResults(results);
      } else if (activeTab === 'spaces') {
        const results = await searchSpaces(debouncedSearchQuery);
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Error searching:', error);
      showToast('Failed to search', 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleMuteUser = (user: { id: string; name: string; handle: string; avatar?: string | null }) => {
    if (filters.mutedUsers.some(u => u.id === user.id)) {
      showToast('User is already muted', 'info');
      return;
    }
    const updated = {
      ...filters,
      mutedUsers: [...filters.mutedUsers, {
        id: user.id,
        name: user.name,
        handle: user.handle,
        avatar: user.avatar,
      }],
    };
    saveFilters(updated);
    setShowSearchModal(false);
    setSearchQuery('');
    haptics.success();
    showToast(`${user.name} muted`, 'success');
  };

  const handleMuteSpace = (space: { id: string; name: string; description?: string; icon?: string }) => {
    if (filters.mutedSpaces.some(s => s.id === space.id)) {
      showToast('Space is already muted', 'info');
      return;
    }
    const updated = {
      ...filters,
      mutedSpaces: [...filters.mutedSpaces, {
        id: space.id,
        name: space.name,
        description: space.description,
        icon: space.icon,
      }],
    };
    saveFilters(updated);
    setShowSearchModal(false);
    setSearchQuery('');
    haptics.success();
    showToast(`${space.name} muted`, 'success');
  };

  const renderKeyword = ({ item }: { item: string }) => (
    <View style={[styles.filterItem, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <Text style={[styles.filterText, { color: colors.text }]}>#{item}</Text>
      <TouchableOpacity
        onPress={() => handleRemoveKeyword(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close-circle" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Content Filters</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.tabs, { borderBottomColor: colors.divider }]}>
        {(['keywords', 'users', 'spaces'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => {
              haptics.light();
              setActiveTab(tab);
            }}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? colors.primary : colors.secondary },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
        {activeTab === 'keywords' && (
          <View style={styles.section}>
            <View style={[styles.addSection, { backgroundColor: colors.cardBackground }]}>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.cardBorder }]}
                placeholder="Add keyword to mute"
                placeholderTextColor={colors.secondary}
                value={newKeyword}
                onChangeText={setNewKeyword}
                onSubmitEditing={handleAddKeyword}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.addIconButton, { backgroundColor: colors.primary }]}
                onPress={handleAddKeyword}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {filters.mutedKeywords.length > 0 ? (
              <FlatList
                data={filters.mutedKeywords}
                keyExtractor={(item) => item}
                renderItem={renderKeyword}
                scrollEnabled={false}
                contentContainerStyle={styles.listContent}
              />
            ) : (
              <EmptyState
                icon="filter-outline"
                title="No muted keywords"
                message="Add keywords to hide posts containing them"
              />
            )}
          </View>
        )}

        {activeTab === 'users' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                haptics.light();
                setShowSearchModal(true);
              }}
            >
              <Ionicons name="search" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Search Users to Mute</Text>
            </TouchableOpacity>
            {filters.mutedUsers.length > 0 ? (
              <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground, marginTop: Spacing.md }]}>
                {filters.mutedUsers.map((user) => (
                  <View key={user.id} style={[styles.filterItem, { borderBottomColor: colors.divider }]}>
                    <View style={styles.userInfo}>
                      {user.avatar ? (
                        <Image source={{ uri: user.avatar }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                          <Ionicons name="person" size={16} color={colors.primary} />
                        </View>
                      )}
                      <View style={styles.userDetails}>
                        <Text style={[styles.filterText, { color: colors.text }]}>{user.name}</Text>
                        <Text style={[styles.userHandle, { color: colors.secondary }]}>{user.handle}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveUser(user.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                icon="people-outline"
                title="No muted users"
                message="Search and mute users to hide their content"
              />
            )}
          </View>
        )}

        {activeTab === 'spaces' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                haptics.light();
                setShowSearchModal(true);
              }}
            >
              <Ionicons name="search" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Search Spaces to Mute</Text>
            </TouchableOpacity>
            {filters.mutedSpaces.length > 0 ? (
              <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground, marginTop: Spacing.md }]}>
                {filters.mutedSpaces.map((space) => (
                  <View key={space.id} style={[styles.filterItem, { borderBottomColor: colors.divider }]}>
                    <View style={styles.spaceInfo}>
                      {space.icon ? (
                        <View style={[styles.spaceIcon, { backgroundColor: space.icon }]}>
                          <Text style={styles.spaceIconText}>{space.name.charAt(0)}</Text>
                        </View>
                      ) : (
                        <View style={[styles.spaceIconPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                          <Ionicons name="grid" size={16} color={colors.primary} />
                        </View>
                      )}
                      <View style={styles.spaceDetails}>
                        <Text style={[styles.filterText, { color: colors.text }]}>{space.name}</Text>
                        {space.description && (
                          <Text style={[styles.spaceDescription, { color: colors.secondary }]} numberOfLines={1}>
                            {space.description}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveSpace(space.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                icon="grid-outline"
                title="No muted spaces"
                message="Search and mute spaces to hide their content"
              />
            )}
          </View>
        )}
        </Animated.View>
      </ScrollView>
      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
            <TouchableOpacity
              onPress={() => {
                setShowSearchModal(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Search {activeTab === 'users' ? 'Users' : 'Spaces'}
            </Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.searchContainer}>
            <View style={[styles.searchInputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <Ionicons name="search" size={20} color={colors.secondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={`Search ${activeTab === 'users' ? 'users' : 'spaces'}...`}
                placeholderTextColor={colors.secondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.secondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <ScrollView style={styles.searchResults}>
            {searchLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.secondary }]}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <View style={[styles.resultsList, { backgroundColor: colors.cardBackground }]}>
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.resultItem, { borderBottomColor: colors.divider }]}
                    onPress={() => {
                      if (activeTab === 'users') {
                        handleMuteUser({
                          id: item.id,
                          name: item.name || 'Unknown User',
                          handle: item.handle || `@user${item.id}`,
                          avatar: item.avatar || null,
                        });
                      } else {
                        handleMuteSpace({
                          id: item.id,
                          name: item.name || 'Unknown Space',
                          description: item.description,
                          icon: item.icon,
                        });
                      }
                    }}
                  >
                    <View style={[styles.resultAvatar, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons
                        name={activeTab === 'users' ? 'person' : 'grid'}
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.resultContent}>
                      <Text style={[styles.resultName, { color: colors.text }]}>
                        {item.name || item.handle}
                      </Text>
                      {item.handle && (
                        <Text style={[styles.resultHandle, { color: colors.secondary }]}>
                          {item.handle}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="add-circle" size={24} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : searchQuery.trim().length >= 2 ? (
              <EmptyState
                icon="search-outline"
                title="No results found"
                message={`No ${activeTab === 'users' ? 'users' : 'spaces'} match your search`}
              />
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
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
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  tabText: {
    fontSize: Typography.base,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: Spacing.md,
  },
  addSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.base,
  },
  addIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    gap: Spacing.sm,
  },
  sectionContent: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterText: {
    fontSize: Typography.base,
    fontWeight: '500',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userHandle: {
    fontSize: Typography.sm,
    marginTop: 2,
  },
  spaceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  spaceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spaceIconText: {
    color: '#FFFFFF',
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  spaceIconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spaceDetails: {
    flex: 1,
  },
  spaceDescription: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  searchContainer: {
    padding: Spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.base,
  },
  searchResults: {
    flex: 1,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.sm,
  },
  resultsList: {
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultHandle: {
    fontSize: Typography.sm,
    opacity: 0.7,
  },
});

