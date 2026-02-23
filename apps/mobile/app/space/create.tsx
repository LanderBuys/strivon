import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Text, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { createSpace, CreateSpaceData } from '@/lib/api/spaces';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Toast } from '@/components/ui/Toast';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import { canCreatePrivateSpaces } from '@/lib/services/subscriptionService';

const CATEGORIES = [
  // Trading & Investing
  'Trading', 'Stock Market', 'Forex', 'Options Trading', 'Day Trading', 'Swing Trading', 'Futures', 'Commodities',
  // Crypto & Blockchain
  'Crypto', 'Cryptocurrency', 'Bitcoin', 'Ethereum', 'DeFi', 'NFTs', 'Altcoins', 'Crypto Mining', 'Blockchain',
  // Real Estate
  'Real Estate', 'Real Estate Investing', 'Property Investment', 'Rental Income', 'Flipping Houses', 'REITs', 'Wholesaling', 'House Hacking',
  // E-commerce & Online Business
  'E-commerce', 'Dropshipping', 'Amazon FBA', 'Shopify', 'Print on Demand', 'Online Store', 'Digital Products', 'Selling Online',
  // Affiliate Marketing & Sales
  'Affiliate Marketing', 'Sales', 'Lead Generation', 'Client Acquisition', 'Commission Based', 'Multi-Level Marketing',
  // Content Creation & Monetization
  'YouTube', 'Content Creation', 'Influencer Marketing', 'Social Media Marketing', 'Blogging', 'Podcasting', 'Streaming', 'TikTok',
  // Freelancing & Services
  'Freelancing', 'Consulting', 'Coaching', 'Mentorship', 'Virtual Assistant', 'Graphic Design', 'Web Development', 'Writing Services',
  // Business & Entrepreneurship
  'Entrepreneurship', 'Startups', 'Business Networking', 'Side Hustles', 'Passive Income', 'Business Development', 'Marketing', 'Branding',
  // Investing & Finance
  'Investing', 'Finance', 'Wealth Building', 'Financial Planning', 'Retirement Planning', 'Tax Strategies', 'Estate Planning', 'Portfolio Management',
  // Advanced Investing
  'Angel Investing', 'Venture Capital', 'Private Equity', 'Crowdfunding', 'Fundraising', 'IPO Trading',
  // Skills & Education
  'Skill Development', 'Online Courses', 'Teaching', 'Tutoring', 'Certification Programs', 'Career Development',
  // Gig Economy
  'Gig Economy', 'Uber', 'DoorDash', 'TaskRabbit', 'Fiverr', 'Upwork', 'Ridesharing', 'Food Delivery',
  // Rental & Sharing Economy
  'Rental Business', 'Airbnb', 'Car Rental', 'Equipment Rental', 'Sharing Economy',
  // Other Money Making
  'Reselling', 'Thrift Flipping', 'Arbitrage', 'Import/Export', 'Franchising', 'Licensing', 'Royalties', 'Dividend Investing'
];

const COLORS = [
  '#1D9BF0', '#61DAFB', '#FF6B6B', '#9B59B6', '#3498DB', 
  '#E74C3C', '#27AE60', '#F39C12', '#E67E22', '#16A085',
  '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
  '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
  '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548'
];

/** Premade space icon images (Discord-style) – each is a distinct image URL */
const DICEBEAR_BASE = 'https://api.dicebear.com/7.x';
const PRESET_SPACE_ICONS: { id: string; imageUrl: string }[] = [
  { id: 'rocket', imageUrl: `${DICEBEAR_BASE}/identicon/png?seed=rocket&size=256&backgroundColor=eef2ff` },
  { id: 'chart', imageUrl: `${DICEBEAR_BASE}/identicon/png?seed=chart&size=256&backgroundColor=f0fdf4` },
  { id: 'people', imageUrl: `${DICEBEAR_BASE}/shapes/png?seed=people&size=256&backgroundColor=fff7ed` },
  { id: 'chat', imageUrl: `${DICEBEAR_BASE}/identicon/png?seed=chat&size=256&backgroundColor=fdf2f8` },
  { id: 'build', imageUrl: `${DICEBEAR_BASE}/rings/png?seed=build&size=256&backgroundColor=f2f3f5` },
  { id: 'trophy', imageUrl: `${DICEBEAR_BASE}/identicon/png?seed=trophy&size=256&backgroundColor=eef2ff` },
  { id: 'folder', imageUrl: `${DICEBEAR_BASE}/shapes/png?seed=folder&size=256&backgroundColor=f0fdf4` },
  { id: 'growth', imageUrl: `${DICEBEAR_BASE}/identicon/png?seed=growth&size=256&backgroundColor=fff7ed` },
  { id: 'idea', imageUrl: `${DICEBEAR_BASE}/rings/png?seed=idea&size=256&backgroundColor=fdf2f8` },
  { id: 'target', imageUrl: `${DICEBEAR_BASE}/identicon/png?seed=target&size=256&backgroundColor=f2f3f5` },
  { id: 'trend', imageUrl: `${DICEBEAR_BASE}/shapes/png?seed=trend&size=256&backgroundColor=eef2ff` },
  { id: 'shop', imageUrl: `${DICEBEAR_BASE}/identicon/png?seed=shop&size=256&backgroundColor=f0fdf4` },
  { id: 'game', imageUrl: `${DICEBEAR_BASE}/rings/png?seed=game&size=256&backgroundColor=fff7ed` },
  { id: 'mobile', imageUrl: `${DICEBEAR_BASE}/identicon/png?seed=mobile&size=256&backgroundColor=fdf2f8` },
  { id: 'star', imageUrl: `${DICEBEAR_BASE}/shapes/png?seed=star&size=256&backgroundColor=f2f3f5` },
  { id: 'home', imageUrl: `${DICEBEAR_BASE}/identicon/png?seed=home&size=256&backgroundColor=eef2ff` },
  { id: 'tools', imageUrl: `${DICEBEAR_BASE}/rings/png?seed=tools&size=256&backgroundColor=f0fdf4` },
  { id: 'book', imageUrl: `${DICEBEAR_BASE}/identicon/png?seed=book&size=256&backgroundColor=fff7ed` },
  { id: 'money', imageUrl: `${DICEBEAR_BASE}/shapes/png?seed=money&size=256&backgroundColor=fdf2f8` },
  { id: 'handshake', imageUrl: `${DICEBEAR_BASE}/identicon/png?seed=handshake&size=256&backgroundColor=f2f3f5` },
  { id: 'write', imageUrl: `${DICEBEAR_BASE}/rings/png?seed=write&size=256&backgroundColor=eef2ff` },
  { id: 'music', imageUrl: `${DICEBEAR_BASE}/identicon/png?seed=music&size=256&backgroundColor=f0fdf4` },
  { id: 'camera', imageUrl: `${DICEBEAR_BASE}/shapes/png?seed=camera&size=256&backgroundColor=fff7ed` },
  { id: 'globe', imageUrl: `${DICEBEAR_BASE}/identicon/png?seed=globe&size=256&backgroundColor=fdf2f8` },
  { id: 'laptop', imageUrl: `${DICEBEAR_BASE}/rings/png?seed=laptop&size=256&backgroundColor=f2f3f5` },
  { id: 'science', imageUrl: `${DICEBEAR_BASE}/identicon/png?seed=science&size=256&backgroundColor=eef2ff` },
  { id: 'office', imageUrl: `${DICEBEAR_BASE}/shapes/png?seed=office&size=256&backgroundColor=f0fdf4` },
  { id: 'flame', imageUrl: `${DICEBEAR_BASE}/identicon/png?seed=flame&size=256&backgroundColor=fff7ed` },
  { id: 'bolt', imageUrl: `${DICEBEAR_BASE}/rings/png?seed=bolt&size=256&backgroundColor=fdf2f8` },
  { id: 'palette', imageUrl: `${DICEBEAR_BASE}/identicon/png?seed=palette&size=256&backgroundColor=f2f3f5` },
];

export default function CreateSpaceScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [channels, setChannels] = useState<string[]>(['']);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [iconImage, setIconImage] = useState<string | null>(null);
  const [selectedPresetImageUrl, setSelectedPresetImageUrl] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [rules, setRules] = useState<string[]>(['']);
  const [guidelines, setGuidelines] = useState('');
  const [tags, setTags] = useState<string[]>(['']);
  const [categorySearch, setCategorySearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [canCreatePrivate, setCanCreatePrivate] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false,
  });

  useEffect(() => {
    checkPrivateSpaceAccess();
  }, []);

  const checkPrivateSpaceAccess = async () => {
    const canCreate = await canCreatePrivateSpaces();
    setCanCreatePrivate(canCreate);
    if (!canCreate && isPrivate) {
      setIsPrivate(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleAddChannel = () => {
    setChannels([...channels, '']);
  };

  const handleRemoveChannel = (index: number) => {
    if (channels.length > 1) {
      setChannels(channels.filter((_, i) => i !== index));
    }
  };

  const handleChannelChange = (index: number, value: string) => {
    const newChannels = [...channels];
    newChannels[index] = value;
    setChannels(newChannels);
  };

  const handleAddRule = () => {
    setRules([...rules, '']);
  };

  const handleRemoveRule = (index: number) => {
    if (rules.length > 1) {
      setRules(rules.filter((_, i) => i !== index));
    }
  };

  const handleRuleChange = (index: number, value: string) => {
    const newRules = [...rules];
    newRules[index] = value;
    setRules(newRules);
  };

  const handleAddTag = () => {
    if (tags.length < 10) {
      setTags([...tags, '']);
    }
  };

  const handleRemoveTag = (index: number) => {
    if (tags.length > 1) {
      setTags(tags.filter((_, i) => i !== index));
    } else {
      setTags(['']);
    }
  };

  const handleTagChange = (index: number, value: string) => {
    const newTags = [...tags];
    newTags[index] = value.replace(/\s+/g, '-').toLowerCase();
    setTags(newTags);
  };

  const handlePickBanner = async () => {
    haptics.light();
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos to set a banner.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        haptics.success();
        setBannerImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking banner:', error);
      Alert.alert('Error', 'Failed to pick banner image.');
    }
  };

  const handlePickIcon = async () => {
    haptics.light();
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos to set a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.9,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        haptics.success();
        setIconImage(result.assets[0].uri);
        setSelectedPresetImageUrl(null);
      }
    } catch (error) {
      console.error('Error picking icon:', error);
      Alert.alert('Error', 'Failed to pick profile picture.');
    }
  };

  const handleRemoveBanner = () => {
    haptics.light();
    setBannerImage(null);
  };

  const handleRemoveIcon = () => {
    haptics.light();
    setIconImage(null);
  };

  const handleSelectPresetImage = (imageUrl: string) => {
    haptics.light();
    setSelectedPresetImageUrl(prev => (prev === imageUrl ? null : imageUrl));
  };

  const displayIconUrl = iconImage || selectedPresetImageUrl;

  // Get initials from space name (fallback when no preset selected)
  const getInitials = (spaceName: string): string => {
    if (!spaceName.trim()) return '?';
    const words = spaceName.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return spaceName.substring(0, 2).toUpperCase();
  };

  // Filter categories based on search
  const filteredCategories = categorySearch.trim()
    ? CATEGORIES.filter(cat => 
        cat.toLowerCase().includes(categorySearch.toLowerCase())
      )
    : CATEGORIES;

  const handleCreate = async () => {
    // Validation - name is required
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a space name.');
      return;
    }

    setLoading(true);
    haptics.light();

    try {
      const spaceData: CreateSpaceData = {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        color: selectedColor || undefined,
        banner: bannerImage || undefined,
        iconImage: iconImage || selectedPresetImageUrl || undefined,
        isPrivate: canCreatePrivate ? isPrivate : false, // Only allow private if user has access
        requiresApproval: requiresApproval,
        rules: rules.filter(r => r.trim().length > 0),
        guidelines: guidelines.trim() || undefined,
        tags: tags.filter(t => t.trim().length > 0),
        channels: channels
          .filter(ch => ch.trim().length > 0)
          .map(ch => ({ name: ch.trim() })),
      };

      const newSpace = await createSpace(spaceData);
      haptics.success();
      showToast('Space created successfully!', 'success');
      
      // Navigate to the new space after a short delay
      setTimeout(() => {
        router.replace(`/space/${newSpace.id}`);
      }, 500);
    } catch (error) {
      console.error('Error creating space:', error);
      haptics.error();
      showToast('Failed to create space. Please try again.', 'error');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        
        {/* Header */}
        <View style={[styles.header, styles.headerSafe, { backgroundColor: colors.background, borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}>
            <IconSymbol name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Create Space</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          {/* Name */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Name <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter space name"
              placeholderTextColor={colors.secondary}
              maxLength={50}
            />
          </View>

          {/* Banner */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Banner</Text>
            {bannerImage ? (
              <View style={styles.imagePreviewContainer}>
                <ExpoImage
                  source={{ uri: bannerImage }}
                  style={styles.bannerPreview}
                  contentFit="cover"
                />
                <TouchableOpacity
                  style={[styles.removeImageButton, { backgroundColor: colors.error }]}
                  onPress={handleRemoveBanner}
                  activeOpacity={0.7}>
                  <IconSymbol name="close-circle" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.imagePickerButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                onPress={handlePickBanner}
                activeOpacity={0.7}>
                <IconSymbol name="image-outline" size={24} color={colors.secondary} />
                <Text style={[styles.imagePickerText, { color: colors.secondary }]}>Add Banner Image</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Icon – premade image logos or custom upload */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Icon</Text>
            <View style={styles.iconContainer}>
              {displayIconUrl ? (
                <View style={styles.imagePreviewContainer}>
                  <ExpoImage
                    source={{ uri: displayIconUrl }}
                    style={styles.iconPreviewImage}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={[styles.removeImageButton, { backgroundColor: colors.error }]}
                    onPress={() => {
                      haptics.light();
                      if (iconImage) setIconImage(null);
                      else setSelectedPresetImageUrl(null);
                    }}
                    activeOpacity={0.7}>
                    <IconSymbol name="close-circle" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[
                  styles.iconPlaceholder,
                  { 
                    backgroundColor: selectedColor ? selectedColor + '20' : colors.primary + '20',
                  }
                ]}>
                  <Text style={[
                    styles.iconPlaceholderText,
                    { color: selectedColor || colors.primary }
                  ]}>
                    {name.trim() ? getInitials(name) : 'SP'}
                  </Text>
                </View>
              )}
              <Text style={[styles.iconPresetLabel, { color: colors.text }]}>Choose a logo</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetIconsScroll}
                style={styles.presetIconsScrollView}>
                {PRESET_SPACE_ICONS.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetIconOption,
                      {
                        borderColor: selectedPresetImageUrl === preset.imageUrl ? (selectedColor || colors.primary) : colors.cardBorder,
                        borderWidth: selectedPresetImageUrl === preset.imageUrl ? 2 : StyleSheet.hairlineWidth,
                      },
                    ]}
                    onPress={() => handleSelectPresetImage(preset.imageUrl)}
                    activeOpacity={0.7}>
                    <ExpoImage
                      source={{ uri: preset.imageUrl }}
                      style={styles.presetIconImage}
                      contentFit="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={[styles.imagePickerButton, styles.iconPickerButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                onPress={handlePickIcon}
                activeOpacity={0.7}>
                <IconSymbol name="camera-outline" size={20} color={colors.secondary} />
                <Text style={[styles.imagePickerText, { color: colors.secondary }]}>Upload custom image</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.hint, { color: colors.secondary }]}>
              Pick a logo above or upload your own
            </Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, color: colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="What is this space about?"
              placeholderTextColor={colors.secondary}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
            <TextInput
              style={[styles.input, styles.categorySearch, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, color: colors.text }]}
              value={categorySearch}
              onChangeText={setCategorySearch}
              placeholder="Search categories..."
              placeholderTextColor={colors.secondary}
              maxLength={30}
            />
            <View style={[styles.categoryGrid, { backgroundColor: colors.spaceBackground }]}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryScrollContent}>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: category === cat ? colors.primary : colors.cardBackground,
                          borderColor: category === cat ? colors.primary : colors.cardBorder,
                        },
                      ]}
                      onPress={() => {
                        haptics.light();
                        setCategory(category === cat ? '' : cat);
                        setCategorySearch('');
                      }}
                      activeOpacity={0.7}>
                      <Text style={[styles.categoryText, { color: category === cat ? '#FFFFFF' : colors.text }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={[styles.hint, { color: colors.secondary, padding: Spacing.md }]}>
                    No categories found
                  </Text>
                )}
              </ScrollView>
            </View>
            {category && (
              <View style={[styles.selectedCategoryBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.selectedCategoryText, { color: colors.primary }]}>
                  Selected: {category}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    haptics.light();
                    setCategory('');
                  }}
                  activeOpacity={0.7}>
                  <IconSymbol name="close-circle" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Privacy Settings */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Privacy Settings</Text>
            <View style={styles.privacyContainer}>
              <TouchableOpacity
                style={[
                  styles.privacyOption,
                  {
                    backgroundColor: isPrivate ? colors.primary + '15' : colors.cardBackground,
                    borderColor: isPrivate ? colors.primary : colors.cardBorder,
                  },
                ]}
                onPress={() => {
                  haptics.light();
                  setIsPrivate(!isPrivate);
                }}
                activeOpacity={0.7}>
                <View style={styles.privacyOptionLeft}>
                  <IconSymbol 
                    name={isPrivate ? "lock-closed" : "lock-open"} 
                    size={20} 
                    color={isPrivate ? colors.primary : colors.secondary} 
                  />
                  <View style={styles.privacyOptionText}>
                    <Text style={[styles.privacyOptionTitle, { color: colors.text }]}>
                      Private Space
                    </Text>
                    <Text style={[styles.privacyOptionDesc, { color: colors.secondary }]}>
                      Only invited members can join
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.toggle,
                  { backgroundColor: isPrivate ? colors.primary : colors.cardBorder }
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    { transform: [{ translateX: isPrivate ? 18 : 0 }] }
                  ]} />
                </View>
              </TouchableOpacity>

              {isPrivate && (
                <TouchableOpacity
                  style={[
                    styles.privacyOption,
                    styles.privacyOptionNested,
                    {
                      backgroundColor: requiresApproval ? colors.primary + '15' : colors.cardBackground,
                      borderColor: requiresApproval ? colors.primary : colors.cardBorder,
                    },
                  ]}
                  onPress={() => {
                    haptics.light();
                    setRequiresApproval(!requiresApproval);
                  }}
                  activeOpacity={0.7}>
                  <View style={styles.privacyOptionLeft}>
                    <IconSymbol 
                      name={requiresApproval ? "checkmark-circle" : "close-circle"} 
                      size={18} 
                      color={requiresApproval ? colors.primary : colors.secondary} 
                    />
                    <View style={styles.privacyOptionText}>
                      <Text style={[styles.privacyOptionTitle, { color: colors.text }]}>
                        Require Approval
                      </Text>
                      <Text style={[styles.privacyOptionDesc, { color: colors.secondary }]}>
                        Approve members before they join
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.toggle,
                    { backgroundColor: requiresApproval ? colors.primary : colors.cardBorder }
                  ]}>
                    <View style={[
                      styles.toggleThumb,
                      { transform: [{ translateX: requiresApproval ? 18 : 0 }] }
                    ]} />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <View style={styles.channelsHeader}>
              <Text style={[styles.label, { color: colors.text }]}>Tags</Text>
              {tags.length < 10 && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddTag}
                  activeOpacity={0.7}>
                  <IconSymbol name="add" size={16} color={colors.primary} />
                  <Text style={[styles.addButtonText, { color: colors.primary }]}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.hint, { color: colors.secondary }]}>
              Add tags to help people discover your space (max 10)
            </Text>
            {tags.map((tag, index) => (
              <View key={index} style={styles.tagRow}>
                <Text style={[styles.tagPrefix, { color: colors.secondary }]}>#</Text>
                <TextInput
                  style={[styles.input, styles.tagInput, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, color: colors.text }]}
                  value={tag}
                  onChangeText={(value) => handleTagChange(index, value)}
                  placeholder="tag-name"
                  placeholderTextColor={colors.secondary}
                  maxLength={20}
                  autoCapitalize="none"
                />
                {tags.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveTag(index)}
                    activeOpacity={0.7}>
                    <IconSymbol name="close-circle" size={20} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Rules */}
          <View style={styles.section}>
            <View style={styles.channelsHeader}>
              <Text style={[styles.label, { color: colors.text }]}>Community Rules</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddRule}
                activeOpacity={0.7}>
                <IconSymbol name="add" size={16} color={colors.primary} />
                <Text style={[styles.addButtonText, { color: colors.primary }]}>Add</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.hint, { color: colors.secondary }]}>
              Set rules for your community (optional)
            </Text>
            {rules.map((rule, index) => (
              <View key={index} style={styles.ruleRow}>
                <View style={[styles.ruleNumber, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.ruleNumberText, { color: colors.primary }]}>{index + 1}</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.ruleInput, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, color: colors.text }]}
                  value={rule}
                  onChangeText={(value) => handleRuleChange(index, value)}
                  placeholder={`Rule ${index + 1}`}
                  placeholderTextColor={colors.secondary}
                  maxLength={200}
                  multiline
                />
                {rules.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveRule(index)}
                    activeOpacity={0.7}>
                    <IconSymbol name="close-circle" size={20} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Guidelines */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Guidelines</Text>
            <Text style={[styles.hint, { color: colors.secondary, marginBottom: Spacing.sm }]}>
              Optional: Add community guidelines or welcome message
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, color: colors.text }]}
              value={guidelines}
              onChangeText={setGuidelines}
              placeholder="Welcome to our community! Here's what you should know..."
              placeholderTextColor={colors.secondary}
              multiline
              numberOfLines={4}
              maxLength={1000}
            />
          </View>


          {/* Color */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Theme Color</Text>
            <Text style={[styles.hint, { color: colors.secondary, marginBottom: Spacing.sm }]}>
              Used for space branding and initials background
            </Text>
            <View style={styles.colorContainer}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    {
                      backgroundColor: color,
                      borderColor: selectedColor === color ? colors.text : 'transparent',
                      borderWidth: selectedColor === color ? 3 : StyleSheet.hairlineWidth,
                    },
                  ]}
                  onPress={() => {
                    haptics.light();
                    setSelectedColor(selectedColor === color ? '' : color);
                  }}
                  activeOpacity={0.7}
                />
              ))}
            </View>
            {selectedColor && (
              <View style={[styles.selectedColorBadge, { backgroundColor: selectedColor + '15' }]}>
                <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
                <Text style={[styles.selectedColorText, { color: selectedColor }]}>
                  {selectedColor}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    haptics.light();
                    setSelectedColor('');
                  }}
                  activeOpacity={0.7}>
                  <IconSymbol name="close-circle" size={16} color={selectedColor} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Channels */}
          <View style={styles.section}>
            <View style={styles.channelsHeader}>
              <Text style={[styles.label, { color: colors.text }]}>Initial Channels</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddChannel}
                activeOpacity={0.7}>
                <IconSymbol name="add" size={18} color={colors.primary} />
                <Text style={[styles.addButtonText, { color: colors.primary }]}>Add</Text>
              </TouchableOpacity>
            </View>
            {channels.map((channel, index) => (
              <View key={index} style={styles.channelRow}>
                <TextInput
                  style={[styles.input, styles.channelInput, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, color: colors.text }]}
                  value={channel}
                  onChangeText={(value) => handleChannelChange(index, value)}
                  placeholder={`Channel ${index + 1} name`}
                  placeholderTextColor={colors.secondary}
                  maxLength={30}
                />
                {channels.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveChannel(index)}
                    activeOpacity={0.7}>
                    <IconSymbol name="close-circle" size={20} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <Text style={[styles.hint, { color: colors.secondary }]}>
              Leave empty to create a default &quot;general&quot; channel
            </Text>
          </View>

        </ScrollView>

        {/* Create Button */}
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={[
              styles.createButton,
              {
                backgroundColor: loading || !name.trim() ? colors.secondary + '40' : colors.primary,
              },
            ]}
            onPress={handleCreate}
            disabled={loading || !name.trim()}
            activeOpacity={0.7}>
            <Text style={styles.createButtonText}>
              {loading ? 'Creating...' : 'Create Space'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSafe: {
    ...Platform.select({
      ios: {
        paddingTop: Spacing.xl,
      },
    }),
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    letterSpacing: -0.1,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    minHeight: 44,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  categoryScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  categoryScrollContent: {
    gap: Spacing.sm,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  categorySearch: {
    marginBottom: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: Spacing.sm,
  },
  categoryText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  selectedCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  selectedCategoryText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconPreviewContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  iconPlaceholderText: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
  },
  iconPresetLabel: {
    fontSize: Typography.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  presetIconsScrollView: {
    marginHorizontal: -Spacing.lg,
  },
  presetIconsScroll: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  presetIconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  presetIconImage: {
    width: 48,
    height: 48,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  selectedColorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  colorPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  selectedColorText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    flex: 1,
  },
  channelsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  addButtonText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  channelInput: {
    flex: 1,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  hint: {
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        paddingBottom: Spacing.lg,
      },
    }),
  },
  createButton: {
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
  imagePickerButton: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 120,
  },
  iconPickerButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  imagePickerText: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  bannerPreview: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
  },
  iconPreviewImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
  },
  removeImageButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    padding: Spacing.xs,
    borderRadius: 20,
  },
  privacyContainer: {
    gap: Spacing.sm,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.xs,
  },
  privacyOptionNested: {
    marginLeft: Spacing.lg,
    marginTop: Spacing.xs,
  },
  privacyOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  privacyOptionText: {
    flex: 1,
  },
  privacyOptionTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  privacyOptionDesc: {
    fontSize: Typography.xs,
    opacity: 0.7,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tagPrefix: {
    fontSize: Typography.base,
    fontWeight: '600',
    paddingLeft: Spacing.xs,
  },
  tagInput: {
    flex: 1,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  ruleNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  ruleNumberText: {
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  ruleInput: {
    flex: 1,
    minHeight: 44,
  },
});

