import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Story } from '@/types/post';
import { StoryCircle } from './StoryCircle';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { mockUsers } from '@/lib/mocks/users';

interface StoriesBarProps {
  stories: Story[];
}

export const StoriesBar = React.memo(function StoriesBar({ stories }: StoriesBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // Separate own story (most recent) and others, group by user
  const { ownStory, otherStories } = useMemo(() => {
    const ownStories = stories.filter(s => s.isOwn);
    const own = ownStories.length > 0
      ? ownStories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      : undefined;
    const others = stories.filter(s => !s.isOwn);
    
    // Group by user and get the first (most recent) story for each user
    const userMap = new Map<string, Story>();
    others.forEach(story => {
      const userId = story.author.id;
      if (!userMap.has(userId)) {
        userMap.set(userId, story);
      } else {
        // Keep the most recent story (compare by createdAt)
        const existing = userMap.get(userId)!;
        if (new Date(story.createdAt) > new Date(existing.createdAt)) {
          userMap.set(userId, story);
        }
      }
    });
    
    // Convert map to array - one story per user
    let uniqueUserStories = Array.from(userMap.values());
    
    // Sort: unviewed stories first, then viewed stories at the end
    uniqueUserStories.sort((a, b) => {
      const aViewed = a.isViewed ? 1 : 0;
      const bViewed = b.isViewed ? 1 : 0;
      return aViewed - bViewed; // 0 (unviewed) comes before 1 (viewed)
    });
    
    return { ownStory: own, otherStories: uniqueUserStories };
  }, [stories]);

  // For "Your story" circle when user has no stories yet (tap = create)
  const currentUser = mockUsers[0];
  const yourStoryForCircle: Story = useMemo(() => {
    if (ownStory) return ownStory;
    return {
      id: 'create',
      author: {
        id: currentUser.id,
        name: currentUser.name,
        handle: currentUser.handle,
        avatar: currentUser.avatar ?? null,
        ...('label' in currentUser && { label: (currentUser as { label?: string }).label }),
      },
      media: { id: '', type: 'image', url: '' },
      mediaUrl: '',
      mediaType: 'image',
      createdAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      views: 0,
      isViewed: false,
      isOwn: true,
    };
  }, [ownStory, currentUser]);

  const handleStoryPress = (storyId: string) => {
    router.push(`/story/${storyId}`);
  };

  const handleOwnStoryPress = () => {
    if (ownStory) {
      router.push(`/story/${ownStory.id}`);
    } else {
      router.push('/story/create');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: Spacing.md }]}
        style={styles.scrollView}
      >
        <StoryCircle
          story={yourStoryForCircle}
          onPress={handleOwnStoryPress}
          onAddPress={ownStory ? () => router.push('/story/create') : undefined}
          isFirst={true}
        />
        {otherStories.map((story) => (
          <StoryCircle
            key={story.id}
            story={story}
            onPress={() => handleStoryPress(story.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    alignItems: 'center',
    paddingRight: Spacing.md,
    gap: 0,
  },
});

