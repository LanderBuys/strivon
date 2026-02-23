import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  Pressable,
  StyleSheet, 
  TextInput, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { User } from '@/types/post';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useUserBadges } from '@/hooks/useUserBadges';
import { getSubscriptionTier } from '@/lib/services/subscriptionService';
import { MediaViewer } from '@/components/media/MediaViewer';
import { ProfileEditVisualAssets } from './ProfileEditVisualAssets';
import { ProfileEditBasicForm } from './ProfileEditBasicForm';
import { validateDisplayName, validateHandle, validateBio } from '@/lib/validation/schemas';
import { sanitizeText } from '@/lib/utils/sanitize';

interface ProfileEditModalProps {
  visible: boolean;
  user: User & { bio?: string; banner?: string | null; occupation?: string; country?: string; contentWarning?: string | null };
  onClose: () => void;
  onSave: (updates: Partial<User & { bio?: string; banner?: string | null; occupation?: string; country?: string; contentWarning?: string | null }>) => Promise<void>;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Helper to check if URI is a video
const isVideoUri = (uri: string | null | undefined): boolean => {
  if (!uri) return false;
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.3gp'];
  const videoMimeTypes = ['video/', 'video/mp4', 'video/quicktime', 'video/x-msvideo'];
  const lowerUri = uri.toLowerCase();
  // Check file extension
  if (videoExtensions.some(ext => lowerUri.includes(ext))) return true;
  // Check MIME type in URI (some URIs include MIME type)
  if (videoMimeTypes.some(mime => lowerUri.includes(mime))) return true;
  // Check for common video file patterns
  if (lowerUri.includes('video') && !lowerUri.includes('image')) return true;
  return false;
};

export function ProfileEditModal({ visible, user, onClose, onSave }: ProfileEditModalProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [occupation, setOccupation] = useState('');
  const [country, setCountry] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'pro-plus'>('free');
  const [customCreatorLabel, setCustomCreatorLabel] = useState('');
  const [featuredPostId, setFeaturedPostId] = useState<string | null>(null);
  const [contentWarning, setContentWarning] = useState<string | null>(null);
  const [showContentWarningOptions, setShowContentWarningOptions] = useState(false);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [mediaViewerItems, setMediaViewerItems] = useState<Array<{ id: string; uri: string; type: 'image' | 'video'; thumbnail?: string }>>([]);
  const [mediaViewerInitialIndex, setMediaViewerInitialIndex] = useState(0);
  
  const prevVisibleRef = useRef(false);
  const lastLoadedUserIdRef = useRef<string | null>(null);
  const userRef = useRef(user);
  userRef.current = user;

  // Get user badges (still used for other features)
  const { badges, loading: badgesLoading } = useUserBadges(user);

  // Check subscription tier for Pro+ features (profile/banner are photos only)
  useEffect(() => {
    if (!visible) return;
    const checkAccess = async () => {
      const tier = await getSubscriptionTier();
      setSubscriptionTier(tier);
      if (tier === 'pro-plus') {
        setCustomCreatorLabel(user.label || '');
      }
    };
    checkAccess();
  }, [visible, user?.id, user?.label]);

  // Load user data when modal opens or user id changes
  useEffect(() => {
    if (!visible || !user) {
      if (!visible) lastLoadedUserIdRef.current = null;
      return;
    }
    const userId = user.id ?? '';
    const justOpened = visible && !prevVisibleRef.current;
    prevVisibleRef.current = visible;
    if (justOpened || lastLoadedUserIdRef.current !== userId) {
      lastLoadedUserIdRef.current = userId;
      loadUserData();
    }
  }, [visible, user?.id]);

  const loadUserData = () => {
    const u = userRef.current;
    setName(u.name || '');
    setHandle(u.handle || '');
    setBio(u.bio || '');
    setOccupation(u.occupation || '');
    setCountry(u.country || '');
    setAvatar(u.avatar || null);
    setBanner(u.banner || null);
    setContentWarning(u.contentWarning ?? null);
    setCustomCreatorLabel(u.label || '');
  };

  


  const handlePickAvatar = async () => {
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
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking avatar:', error);
      Alert.alert('Error', 'Failed to pick profile picture.');
    }
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
        setBanner(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking banner:', error);
      Alert.alert('Error', 'Failed to pick banner.');
    }
  };

  const handleRemoveAvatar = () => {
    haptics.light();
    setAvatar(null);
  };

  const handleRemoveBanner = () => {
    haptics.light();
    setBanner(null);
  };

  const handleVideoPress = (uri: string, type: 'avatar' | 'banner') => {
    if (!isVideoUri(uri)) return;
    
    haptics.light();
    const items = [{
      id: type,
      uri: uri,
      type: 'video' as const,
    }];
    setMediaViewerItems(items);
    setMediaViewerInitialIndex(0);
    setShowMediaViewer(true);
  };

  const validate = (): boolean => {
    const nameErr = validateDisplayName(name.trim());
    if (nameErr) {
      Alert.alert('Validation Error', nameErr);
      return false;
    }
    const handleRaw = handle.trim().startsWith('@') ? handle.trim().slice(1) : handle.trim();
    const handleErr = validateHandle(handleRaw);
    if (handleErr) {
      Alert.alert('Validation Error', handleErr);
      return false;
    }
    const bioErr = validateBio(bio);
    if (bioErr) {
      Alert.alert('Validation Error', bioErr);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    haptics.light();
    
    try {
      await onSave({
        name: sanitizeText(name, 100),
        handle: (handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`).slice(0, 31),
        bio: sanitizeText(bio, 500) || undefined,
        occupation: sanitizeText(occupation, 50) || undefined,
        country: sanitizeText(country, 60) || undefined,
        avatar: avatar || undefined,
        banner: banner || undefined,
        contentWarning: contentWarning ? sanitizeText(contentWarning, 100) : null,
        label: subscriptionTier === 'pro-plus' ? sanitizeText(customCreatorLabel, 50) || undefined : user.label,
      });
      haptics.success();
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
      haptics.error();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { 
            borderBottomColor: colors.divider,
            backgroundColor: colors.cardBackground,
            paddingTop: insets.top + Spacing.md,
          }]}>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <Text style={[styles.cancelText, { color: colors.secondary }]}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.7}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <ProfileEditVisualAssets
              banner={banner}
              avatar={avatar}
              name={name}
              colors={colors}
              colorScheme={colorScheme}
              isVideoUri={isVideoUri}
              getInitials={getInitials}
              onPickBanner={handlePickBanner}
              onRemoveBanner={handleRemoveBanner}
              onPickAvatar={handlePickAvatar}
              onRemoveAvatar={handleRemoveAvatar}
              onVideoPress={handleVideoPress}
            />

            <ProfileEditBasicForm
              name={name}
              handle={handle}
              occupation={occupation}
              country={country}
              bio={bio}
              colors={colors}
              onChangeName={setName}
              onChangeHandle={setHandle}
              onChangeOccupation={setOccupation}
              onChangeCountry={setCountry}
              onChangeBio={setBio}
            />

            {/* Content Warning Section */}
            <View style={styles.contentWarningSection}>
              <View style={styles.sectionDivider}>
                <View style={[styles.sectionDividerLine, { backgroundColor: colors.divider }]} />
                <View style={styles.sectionDividerContent}>
                  <Ionicons name="warning" size={14} color={colors.secondary} />
                  <Text style={[styles.sectionDividerText, { color: colors.secondary }]}>
                    Content Warning
                  </Text>
                </View>
                <View style={[styles.sectionDividerLine, { backgroundColor: colors.divider }]} />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Mark your profile with a content warning
                </Text>
                <Text style={[styles.hint, { color: colors.secondary, marginBottom: Spacing.md }]}>
                  This warning will be displayed to viewers before they see your profile content
                </Text>

                {/* Quick Preset Buttons */}
                <View style={styles.presetButtonsContainer}>
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
                      style={[styles.presetButton, {
                        backgroundColor: contentWarning === option 
                          ? colors.error + '15' 
                          : colors.surface,
                        borderColor: contentWarning === option 
                          ? colors.error 
                          : colors.cardBorder,
                      }]}
                    >
                      <Text style={[styles.presetButtonText, { 
                        color: contentWarning === option 
                          ? colors.error 
                          : colors.text 
                      }]}>
                        {option}
                      </Text>
                      {contentWarning === option && (
                        <Ionicons name="checkmark-circle" size={18} color={colors.error} style={{ marginLeft: Spacing.xs }} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Input */}
                <View style={styles.field}>
                  <Text style={[styles.subLabel, { color: colors.secondary, marginTop: Spacing.md }]}>
                    Or enter custom warning text
                  </Text>
                  <TextInput
                    style={[styles.input, {
                      backgroundColor: colors.surface,
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
                  <View style={[styles.contentWarningActiveContainer, {
                    backgroundColor: colors.error + '08',
                    borderColor: colors.error + '20',
                    marginTop: Spacing.sm,
                  }]}>
                    <View style={styles.contentWarningActiveHeader}>
                      <Ionicons name="warning" size={18} color={colors.error} />
                      <Text style={[styles.contentWarningActiveText, { color: colors.text, flex: 1 }]}>
                        {contentWarning}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          haptics.light();
                          setContentWarning(null);
                        }}
                        activeOpacity={0.7}
                        style={styles.removeWarningButton}
                      >
                        <Ionicons name="close-circle" size={22} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>

          </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
      
      {/* Media Viewer for Videos */}
      <MediaViewer
        visible={showMediaViewer}
        mediaItems={mediaViewerItems}
        initialIndex={mediaViewerInitialIndex}
        onClose={() => setShowMediaViewer(false)}
      />
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  titleContainer: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  bannerSection: {
    marginBottom: Spacing.lg,
  },
  bannerContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    opacity: 0.5,
  },
  imageButton: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    borderRadius: 50,
    borderWidth: 4,
    padding: 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarTouchable: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 1,
  },
  avatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  form: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xl,
  },
  visualAssetsSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  postCardCustomizationSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xl,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.md,
  },
  collapsibleHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  collapsibleHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  sectionDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  sectionDividerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  sectionDividerText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  field: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    letterSpacing: -0.2,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
    letterSpacing: -0.1,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    minHeight: 48,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.sm,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  customizationSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionDescription: {
    fontSize: 13,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  customizationCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  cardDescription: {
    fontSize: 12,
    marginBottom: Spacing.md,
    lineHeight: 16,
  },
  paletteSelector: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  paletteSelectorContent: {
    paddingRight: Spacing.md,
    gap: Spacing.sm,
  },
  paletteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    marginRight: Spacing.sm,
  },
  paletteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  colorCheckmark: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  backgroundImageContainer: {
    marginTop: Spacing.xs,
  },
  backgroundImageWrapper: {
    position: 'relative',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  backgroundImagePreview: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.lg,
  },
  backgroundImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  imageActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  imageActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  backgroundImagePlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  placeholderIconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  backgroundImagePlaceholderText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  backgroundImagePlaceholderHint: {
    fontSize: 12,
    marginTop: -Spacing.xs,
  },
  colorPreview: {
    width: '100%',
    minHeight: 200,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: Spacing.xs,
    position: 'relative',
  },
  previewBanner: {
    width: '100%',
    height: 80,
  },
  previewAvatar: {
    position: 'absolute',
    top: 50,
    left: Spacing.md,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  previewContent: {
    paddingTop: 40,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  previewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  previewNameBar: {
    borderRadius: 4,
  },
  previewBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  previewHandleBar: {
    borderRadius: 4,
  },
  previewBioBar: {
    borderRadius: 4,
  },
  previewStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  previewStat: {
    flex: 1,
    height: 36,
    borderRadius: BorderRadius.md,
  },
  previewAccents: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  previewAccentButton: {
    width: 80,
    height: 32,
    borderRadius: 16,
  },
  previewAccentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modeToggle: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentWarningSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xl,
  },
  presetButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentWarningActiveContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  contentWarningActiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  contentWarningActiveText: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeWarningButton: {
    marginLeft: 'auto',
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoPlayOverlaySmall: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 50,
  },
});
