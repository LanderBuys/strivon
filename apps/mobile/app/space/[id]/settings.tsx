import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Text, TextInput, Switch, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Space } from '@/types/post';
import { getSpaceById, updateSpace } from '@/lib/api/spaces';
import { mockUsers } from '@/lib/mocks/users';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export default function SpaceSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [iconImage, setIconImage] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [rules, setRules] = useState<string[]>(['']);
  const [guidelines, setGuidelines] = useState('');
  const [tags, setTags] = useState<string[]>(['']);
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');

  const COLORS = [
    '#1D9BF0', '#61DAFB', '#FF6B6B', '#9B59B6', '#3498DB', 
    '#E74C3C', '#27AE60', '#F39C12', '#E67E22', '#16A085',
    '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
    '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
    '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548'
  ];

  const CATEGORIES = [
    'Trading', 'Stock Market', 'Crypto', 'Cryptocurrency', 'Bitcoin', 'Ethereum', 'DeFi', 'NFTs',
    'Real Estate', 'Real Estate Investing', 'Property Investment', 'Rental Income',
    'E-commerce', 'Dropshipping', 'Amazon FBA', 'Shopify', 'Print on Demand',
    'Affiliate Marketing', 'Sales', 'Lead Generation',
    'YouTube', 'Content Creation', 'Influencer Marketing', 'Social Media Marketing',
    'Freelancing', 'Consulting', 'Coaching', 'Mentorship',
    'Entrepreneurship', 'Startups', 'Business Networking', 'Side Hustles',
    'Investing', 'Finance', 'Wealth Building', 'Financial Planning',
  ];

  useEffect(() => {
    if (id) {
      loadSpace();
    }
  }, [id]);

  const loadSpace = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const fetchedSpace = await getSpaceById(id);
      if (fetchedSpace) {
        setSpace(fetchedSpace);
        setName(fetchedSpace.name || '');
        setDescription(fetchedSpace.description || '');
        setCategory(fetchedSpace.category || '');
        setSelectedColor(fetchedSpace.color || COLORS[0]);
        setIsPrivate(fetchedSpace.isPrivate || false);
        setRequiresApproval(fetchedSpace.requiresApproval || false);
        setIconImage(fetchedSpace.iconImage || null);
        setBannerImage(fetchedSpace.banner || null);
        setRules(fetchedSpace.rules && fetchedSpace.rules.length > 0 ? fetchedSpace.rules : ['']);
        setGuidelines(fetchedSpace.guidelines || '');
        setTags(fetchedSpace.tags && fetchedSpace.tags.length > 0 ? fetchedSpace.tags : ['']);
        setCountry(fetchedSpace.country || '');
        setState(fetchedSpace.state || '');
        setCity(fetchedSpace.city || '');
      }
    } catch (error) {
      console.error('Error loading space:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const pickImage = async (type: 'icon' | 'banner') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        haptics.light();
        if (type === 'icon') {
          setIconImage(result.assets[0].uri);
        } else {
          setBannerImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleAddRule = () => {
    setRules([...rules, '']);
  };

  const handleRemoveRule = (index: number) => {
    if (rules.length > 1) {
      setRules(rules.filter((_, i) => i !== index));
    }
  };

  const handleUpdateRule = (index: number, value: string) => {
    const updated = [...rules];
    updated[index] = value;
    setRules(updated);
  };

  const handleAddTag = () => {
    setTags([...tags, '']);
  };

  const handleRemoveTag = (index: number) => {
    if (tags.length > 1) {
      setTags(tags.filter((_, i) => i !== index));
    }
  };

  const handleUpdateTag = (index: number, value: string) => {
    const updated = [...tags];
    updated[index] = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setTags(updated);
  };

  const handleSave = async () => {
    if (!id || !name.trim()) return;
    
    setSaving(true);
    try {
      const updated = await updateSpace(id, {
        name: name.trim(),
        description: description.trim(),
        category: category || undefined,
        color: selectedColor,
        iconImage: iconImage || undefined,
        banner: bannerImage || undefined,
        isPrivate,
        requiresApproval,
        rules: rules.filter(r => r.trim().length > 0),
        guidelines: guidelines.trim() || undefined,
        tags: tags.filter(t => t.trim().length > 0),
        country: country.trim() || undefined,
        state: state.trim() || undefined,
        city: city.trim() || undefined,
      });

      if (updated) {
        haptics.success();
        router.back();
      }
    } catch (error) {
      haptics.error();
      console.error('Error saving space:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Space Settings</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Text style={{ color: colors.secondary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Space Settings</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !name.trim()}
          style={[styles.saveButton, { opacity: saving || !name.trim() ? 0.5 : 1 }]}>
          <Text style={[styles.saveButtonText, { color: colors.primary }]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Banner</Text>
          <TouchableOpacity
            style={[styles.imagePicker, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder }]}
            onPress={() => pickImage('banner')}>
            {bannerImage ? (
              <ExpoImage source={{ uri: bannerImage }} style={styles.bannerImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <IconSymbol name="image-outline" size={32} color={colors.secondary} />
                <Text style={[styles.imagePlaceholderText, { color: colors.secondary }]}>Add Banner</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Icon */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Icon</Text>
          <TouchableOpacity
            style={[styles.iconPicker, { backgroundColor: selectedColor + '20', borderColor: colors.cardBorder }]}
            onPress={() => pickImage('icon')}>
            {iconImage ? (
              <ExpoImage source={{ uri: iconImage }} style={styles.iconImage} />
            ) : (
              <View style={[styles.iconPlaceholder, { backgroundColor: selectedColor }]}>
                <Text style={styles.iconPlaceholderText}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Space Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder, color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter space name"
              placeholderTextColor={colors.secondary}
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder, color: colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your space"
              placeholderTextColor={colors.secondary}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: category === cat ? colors.primary + '20' : colors.spaceBackground,
                      borderColor: category === cat ? colors.primary : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setCategory(cat)}>
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: category === cat ? colors.primary : colors.text },
                    ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Color</Text>
            <View style={styles.colorGrid}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    {
                      backgroundColor: color,
                      borderColor: selectedColor === color ? colors.text : 'transparent',
                      borderWidth: selectedColor === color ? 3 : 0,
                    },
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacy</Text>
          
          <View style={[styles.switchRow, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <View style={styles.switchLabel}>
              <IconSymbol name="lock-closed-outline" size={20} color={colors.text} />
              <View style={styles.switchText}>
                <Text style={[styles.switchTitle, { color: colors.text }]}>Private Space</Text>
                <Text style={[styles.switchDescription, { color: colors.secondary }]}>
                  Only members can see and join this space
                </Text>
              </View>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: colors.cardBorder, true: colors.primary + '80' }}
              thumbColor={isPrivate ? colors.primary : colors.secondary}
            />
          </View>

          <View style={[styles.switchRow, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <View style={styles.switchLabel}>
              <IconSymbol name="checkmark-circle-outline" size={20} color={colors.text} />
              <View style={styles.switchText}>
                <Text style={[styles.switchTitle, { color: colors.text }]}>Require Approval</Text>
                <Text style={[styles.switchDescription, { color: colors.secondary }]}>
                  Members must request to join
                </Text>
              </View>
            </View>
            <Switch
              value={requiresApproval}
              onValueChange={setRequiresApproval}
              trackColor={{ false: colors.cardBorder, true: colors.primary + '80' }}
              thumbColor={requiresApproval ? colors.primary : colors.secondary}
            />
          </View>
        </View>

        {/* Rules */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Rules</Text>
          {rules.map((rule, index) => (
            <View key={index} style={styles.ruleRow}>
              <TextInput
                style={[styles.ruleInput, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder, color: colors.text }]}
                value={rule}
                onChangeText={(value) => handleUpdateRule(index, value)}
                placeholder={`Rule ${index + 1}`}
                placeholderTextColor={colors.secondary}
              />
              {rules.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveRule(index)}>
                  <IconSymbol name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary + '15' }]}
            onPress={handleAddRule}>
            <IconSymbol name="add" size={20} color={colors.primary} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>Add Rule</Text>
          </TouchableOpacity>
        </View>

        {/* Guidelines */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Guidelines</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder, color: colors.text }]}
            value={guidelines}
            onChangeText={setGuidelines}
            placeholder="Add community guidelines..."
            placeholderTextColor={colors.secondary}
            multiline
            numberOfLines={6}
            maxLength={1000}
          />
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tags</Text>
          {tags.map((tag, index) => (
            <View key={index} style={styles.tagRow}>
              <Text style={[styles.tagPrefix, { color: colors.secondary }]}>#</Text>
              <TextInput
                style={[styles.tagInput, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder, color: colors.text }]}
                value={tag}
                onChangeText={(value) => handleUpdateTag(index, value)}
                placeholder="tag-name"
                placeholderTextColor={colors.secondary}
                autoCapitalize="none"
              />
              {tags.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveTag(index)}>
                  <IconSymbol name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary + '15' }]}
            onPress={handleAddTag}>
            <IconSymbol name="add" size={20} color={colors.primary} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>Add Tag</Text>
          </TouchableOpacity>
        </View>

        {/* Location (optional) — for "Spaces in your area" */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Location (optional)</Text>
          <Text style={[styles.sectionHint, { color: colors.secondary }]}>
            Add country/region/city so this space appears in &quot;Spaces in your area&quot; for builders nearby.
          </Text>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Country</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder, color: colors.text }]}
            value={country}
            onChangeText={setCountry}
            placeholder="e.g. Germany, USA"
            placeholderTextColor={colors.secondary}
          />
          <Text style={[styles.fieldLabel, { color: colors.text }]}>State / Region</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder, color: colors.text }]}
            value={state}
            onChangeText={setState}
            placeholder="e.g. Texas, Berlin"
            placeholderTextColor={colors.secondary}
          />
          <Text style={[styles.fieldLabel, { color: colors.text }]}>City</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder, color: colors.text }]}
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Austin, Toronto"
            placeholderTextColor={colors.secondary}
          />
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
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
  },
  saveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  saveButtonText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  sectionHint: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  imagePicker: {
    width: '100%',
    height: 120,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: Typography.sm,
    marginTop: Spacing.xs,
  },
  iconPicker: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  iconPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPlaceholderText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.base,
  },
  textArea: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.base,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginTop: Spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: Spacing.sm,
  },
  categoryChipText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchText: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  switchTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: Typography.xs,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  ruleInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: Typography.sm,
    marginRight: Spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tagPrefix: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  tagInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: Typography.sm,
    marginRight: Spacing.xs,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  addButtonText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
});


