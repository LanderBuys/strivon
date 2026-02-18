import { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Text, Linking, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { useDebounce } from '@/hooks/useDebounce';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  icon: string;
  content: string;
}

const helpArticles: HelpArticle[] = [
  {
    id: 'creating-first-post',
    title: 'Creating Your First Post',
    category: 'Getting Started',
    icon: 'create-outline',
    content: `# Creating Your First Post

Welcome to Strivon! Here's how to create your first post:

1. **Tap the compose button** (the + icon) at the bottom of your feed
2. **Write your message** - Share your thoughts, ideas, or updates
3. **Add media** (optional) - Tap the image icon to add photos or videos
4. **Choose visibility** - Set who can see your post (public, followers only, or specific spaces)
5. **Post it!** - Tap the "Post" button to share

**Tips:**
- Use hashtags to reach more people
- Tag other users with @username
- Add location to connect with local community
- Save drafts to finish later`,
  },
  {
    id: 'finding-following-users',
    title: 'Finding and Following Users',
    category: 'Getting Started',
    icon: 'people-outline',
    content: `# Finding and Following Users

Discover and connect with people on Strivon:

**Search for Users:**
1. Tap the search icon in the navigation bar
2. Type a name or username
3. Browse results and tap on a profile
4. Tap "Follow" to see their posts in your feed

**Discover New People:**
- Check "Who to Follow" suggestions
- Browse trending users
- See who your friends follow
- Explore spaces to find like-minded people

**Following vs Followers:**
- **Following**: People whose posts appear in your feed
- **Followers**: People who see your posts in their feed`,
  },
  {
    id: 'joining-spaces',
    title: 'Joining Spaces',
    category: 'Getting Started',
    icon: 'grid-outline',
    content: `# Joining Spaces

Spaces are communities around topics you care about:

**Finding Spaces:**
1. Tap the "Spaces" tab
2. Browse trending or recommended spaces
3. Use search to find specific topics
4. Tap on a space to view details

**Joining a Space:**
1. Open the space you're interested in
2. Tap "Join" button
3. Start participating in discussions!

**Space Features:**
- Post to the space community
- Join channels for specific topics
- Get notifications for space activity
- Invite friends to join`,
  },
  {
    id: 'privacy-settings',
    title: 'Privacy Settings',
    category: 'Account & Privacy',
    icon: 'lock-closed-outline',
    content: `# Privacy Settings

Control who can see your content and interact with you:

**Profile Visibility:**
- Public: Anyone can see your profile
- Followers only: Only people you approve can see your posts
- Private: You approve all follow requests

**Content Controls:**
- Who can mention you
- Who can tag you in posts
- Who can send you messages
- Show/hide your online status

**Access Settings:**
Go to Settings > Privacy to customize all privacy options`,
  },
  {
    id: 'two-factor-auth',
    title: 'Security & Two-Factor Auth',
    category: 'Account & Privacy',
    icon: 'shield-checkmark-outline',
    content: `# Security & Two-Factor Authentication

Protect your account with two-factor authentication:

**Setting Up 2FA:**
1. Go to Settings > Security
2. Tap "Two-Factor Authentication"
3. Scan the QR code with your authenticator app
4. Enter the 6-digit code to verify
5. Save your backup codes in a safe place

**Using 2FA:**
- You'll need your password + 6-digit code to sign in
- Codes refresh every 30 seconds
- Use backup codes if you lose access to your authenticator

**Security Tips:**
- Use a strong, unique password
- Enable 2FA for extra protection
- Review active sessions regularly
- Don't share your backup codes`,
  },
  {
    id: 'content-filters',
    title: 'Content Filters',
    category: 'Account & Privacy',
    icon: 'filter-outline',
    content: `# Content Filters

Control what content you see:

**Mute Keywords:**
- Hide posts containing specific words or phrases
- Go to Settings > Content Filters > Keywords
- Add keywords you want to avoid

**Mute Users:**
- Hide posts from specific users without blocking them
- Search and mute users you don't want to see
- You can unmute them anytime

**Mute Spaces:**
- Hide content from specific spaces
- Useful for reducing noise from busy communities
- Your muted list is private`,
  },
  {
    id: 'blocking-users',
    title: 'Blocking Users',
    category: 'Account & Privacy',
    icon: 'ban-outline',
    content: `# Blocking Users

Block users who are harassing or spamming you:

**How to Block:**
1. Open the user's profile or chat
2. Tap the menu (three dots)
3. Select "Block User"
4. Confirm the action

**What Happens When You Block:**
- They can't see your posts or profile
- They can't send you messages
- They can't follow you
- You won't see their content

**Unblocking:**
- Go to Settings > Blocked Users
- Find the user and tap "Unblock"
- They'll be able to see your public content again`,
  },
  {
    id: 'messaging',
    title: 'Messaging',
    category: 'Features',
    icon: 'chatbubbles-outline',
    content: `# Messaging

Connect privately with other users:

**Starting a Conversation:**
1. Tap the Messages icon
2. Tap the compose button
3. Search for a user
4. Start chatting!

**Message Features:**
- Send text, photos, videos, and voice messages
- React to messages with emojis
- Reply to specific messages
- Set custom chat backgrounds
- Enable disappearing messages

**Group Chats:**
- Create group chats with multiple people
- Add or remove members
- Set group names and photos`,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    category: 'Features',
    icon: 'notifications-outline',
    content: `# Notifications

Stay updated with what matters to you:

**Notification Types:**
- Likes, comments, and reposts
- New followers
- Mentions and tags
- Direct messages
- Space activity

**Customize Notifications:**
1. Go to Settings > Notifications
2. Toggle specific notification types on/off
3. Set quiet hours
4. Choose notification sounds

**Push Notifications:**
- Enable push notifications to get alerts even when the app is closed
- Manage notification permissions in your device settings`,
  },
  {
    id: 'report-problem',
    title: 'Report a Problem',
    category: 'Support',
    icon: 'flag-outline',
    content: `# Report a Problem

Help us improve Strivon by reporting issues:

**What to Report:**
- Bugs or app crashes
- Inappropriate content
- Spam or harassment
- Account issues
- Feature requests

**How to Report:**
1. Go to Settings > Help Center
2. Tap "Report a Problem"
3. Describe the issue in detail
4. Include screenshots if possible
5. Submit your report

**Response Time:**
- We typically respond within 24-48 hours
- Critical issues are prioritized
- Check your email for updates`,
  },
  {
    id: 'community-guidelines',
    title: 'Community Guidelines',
    category: 'Support',
    icon: 'document-text-outline',
    content: `# Community Guidelines

Help keep Strivon a positive place:

**Be Respectful:**
- Treat others with kindness
- No harassment, bullying, or hate speech
- Respect different opinions

**Share Authentically:**
- Post original content
- Give credit when sharing others' work
- Don't spam or post misleading information

**Respect Privacy:**
- Don't share others' private information
- Ask permission before posting photos of others
- Respect boundaries

**Consequences:**
- Violations may result in warnings, temporary suspension, or permanent ban
- Repeated violations lead to stricter penalties`,
  },
];

const helpTopics = [
  {
    category: 'Getting Started',
    items: helpArticles.filter(a => a.category === 'Getting Started'),
  },
  {
    category: 'Features',
    items: helpArticles.filter(a => a.category === 'Features'),
  },
  {
    category: 'Account & Privacy',
    items: helpArticles.filter(a => a.category === 'Account & Privacy'),
  },
  {
    category: 'Support',
    items: helpArticles.filter(a => a.category === 'Support'),
  },
];

export default function HelpCenterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredTopics = useMemo(() => {
    if (!debouncedSearch.trim()) return helpTopics;
    
    const query = debouncedSearch.toLowerCase();
    const filtered: typeof helpTopics = [];
    
    helpTopics.forEach(category => {
      const matchingItems = category.items.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query)
      );
      if (matchingItems.length > 0) {
        filtered.push({ ...category, items: matchingItems });
      }
    });
    
    return filtered;
  }, [debouncedSearch]);

  const handleTopicPress = (article: HelpArticle) => {
    haptics.light();
    setSelectedArticle(article);
  };

  const handleContactSupport = () => {
    haptics.light();
    Linking.openURL('mailto:support@strivon.app?subject=Support Request');
  };

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchSection}>
          <View style={[styles.searchBox, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <Ionicons name="search" size={20} color={colors.secondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search for help..."
              placeholderTextColor={colors.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {filteredTopics.length === 0 && debouncedSearch.trim() ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={colors.secondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No results found</Text>
            <Text style={[styles.emptySubtext, { color: colors.secondary }]}>
              Try different keywords or browse categories below
            </Text>
          </View>
        ) : (
          filteredTopics.map((category, categoryIndex) => (
          <View key={categoryIndex} style={styles.category}>
            <Text style={[styles.categoryTitle, { color: colors.secondary }]}>{category.category}</Text>
            <View style={[styles.categoryContent, { backgroundColor: colors.cardBackground }]}>
              {category.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.topicItem,
                    { borderBottomColor: colors.divider },
                    itemIndex === category.items.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => handleTopicPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.topicIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.topicTitle, { color: colors.text }]}>{item.title}</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
          ))
        )}

        <Modal
          visible={selectedArticle !== null}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedArticle(null)}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
              <TouchableOpacity
                onPress={() => setSelectedArticle(null)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
                {selectedArticle?.title}
              </Text>
              <View style={{ width: 40 }} />
            </View>
            <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
              {selectedArticle && (
                <View>
                  <View style={[styles.articleHeader, { borderBottomColor: colors.divider }]}>
                    <View style={[styles.articleIcon, { backgroundColor: colors.primary + '15' }]}>
                      <Ionicons name={selectedArticle.icon as any} size={24} color={colors.primary} />
                    </View>
                    <Text style={[styles.articleCategory, { color: colors.secondary }]}>
                      {selectedArticle.category}
                    </Text>
                  </View>
                  <Text style={[styles.articleContent, { color: colors.text }]}>
                    {selectedArticle.content}
                  </Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        <View style={styles.contactSection}>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: colors.primary }]}
            onPress={handleContactSupport}
            activeOpacity={0.7}
          >
            <Ionicons name="mail" size={20} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  searchSection: {
    padding: Spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchPlaceholder: {
    fontSize: Typography.base,
  },
  category: {
    marginTop: Spacing.lg,
  },
  categoryTitle: {
    fontSize: Typography.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  categoryContent: {
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  topicIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicTitle: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: '500',
  },
  contactSection: {
    padding: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: '600',
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.base,
    padding: 0,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.lg,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: Typography.sm,
    marginTop: Spacing.sm,
    textAlign: 'center',
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
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: Spacing.md,
  },
  articleHeader: {
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  articleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  articleCategory: {
    fontSize: Typography.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  articleContent: {
    fontSize: Typography.base,
    lineHeight: Typography.base * 1.6,
  },
});

