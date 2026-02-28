import { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { getFirestoreUser, isProfileIncomplete, updateFirestoreUser } from '@/lib/firestore/users';
import { COUNTRIES, getCitiesForCountry } from '@/lib/data/locations';
import { getFirebaseAuth } from '@/lib/firebase';
import { uploadProfileImage } from '@/lib/services/profileImageUpload';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingScreen } from '@/components/LoadingScreen';

function normalizeHandle(input: string): string {
  return input.replace(/^@/, '').replace(/[^a-z0-9_]/gi, '').slice(0, 30).toLowerCase();
}

export default function CompleteProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, signOut, isFirebaseEnabled, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [pickerOpen, setPickerOpen] = useState<'country' | 'city' | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [loadingExiting, setLoadingExiting] = useState(false);

  const handleBackgroundLoad = () => {
    setBackgroundLoaded(true);
    setLoadingExiting(true);
  };

  const cityOptions = useMemo(() => getCitiesForCountry(country), [country]);
  const filteredCountries = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.toLowerCase().includes(q));
  }, [pickerSearch]);
  const filteredCities = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return cityOptions;
    return cityOptions.filter((c) => c.toLowerCase().includes(q));
  }, [cityOptions, pickerSearch]);

  const handleOpenPicker = (type: 'country' | 'city') => {
    setPickerSearch('');
    setPickerOpen(type);
  };
  const handleClosePicker = () => {
    setPickerOpen(null);
    setPickerSearch('');
  };

  useEffect(() => {
    if (!user?.uid || !isFirebaseEnabled) {
      setInitializing(false);
      return;
    }
    (async () => {
      try {
        const profile = await getFirestoreUser(user.uid);
        if (profile) {
          setName(profile.name || '');
          const h = profile.handle?.replace(/^@/, '') || '';
          setUsername(h);
          setOccupation(profile.occupation || '');
          setCountry(profile.country || '');
          setCity(profile.city || '');
          setBio(profile.bio || '');
          if (profile.avatar) setAvatarUri(profile.avatar);
          if (profile.banner) setBannerUri(profile.banner);
        }
      } catch {
        // keep defaults
      } finally {
        setInitializing(false);
      }
    })();
  }, [user?.uid, isFirebaseEnabled]);

  // If app opens to this screen (e.g. restored route) but user is not logged in, go to sign-in immediately
  useEffect(() => {
    if (isFirebaseEnabled && !authLoading && !user) {
      router.replace('/sign-in');
    }
  }, [isFirebaseEnabled, authLoading, user, router]);

  // If profile is already complete, go to app (avoid getting stuck on this screen)
  useEffect(() => {
    if (!isFirebaseEnabled || !user?.uid || initializing) return;
    let mounted = true;
    isProfileIncomplete(user.uid).then((incomplete) => {
      if (!mounted) return;
      if (!incomplete) router.replace('/(tabs)');
    });
    return () => { mounted = false; };
  }, [isFirebaseEnabled, user?.uid, initializing, router]);

  // Don't show this screen until auth is resolved; if not logged in redirect (handled in effect above)
  if (isFirebaseEnabled && authLoading) return null;
  if (isFirebaseEnabled && !user) return null;

  const pickImage = async (kind: 'avatar' | 'banner') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow access to your photos to set a profile picture or banner.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: kind === 'avatar',
        aspect: kind === 'avatar' ? [1, 1] : [3, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        if (kind === 'avatar') setAvatarUri(uri);
        else setBannerUri(uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handleSubmit = async () => {
    setError('');
    const displayName = name.trim();
    if (!displayName) {
      setError('Please enter your display name.');
      return;
    }
    const handleValue = normalizeHandle(username);
    if (handleValue.length < 3) {
      setError('Username must be at least 3 characters (letters, numbers, or underscore).');
      return;
    }
    const ageNum = age.trim() ? parseInt(age.trim(), 10) : undefined;
    if (ageNum !== undefined && (Number.isNaN(ageNum) || ageNum < 13 || ageNum > 120)) {
      setError('Please enter a valid age (13–120), or leave blank.');
      return;
    }
    if (!user?.uid) {
      setError('Not signed in.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let avatarUrl: string | null = null;
      let bannerUrl: string | null = null;
      let profileImageSkipped = false;
      if (avatarUri && (avatarUri.startsWith('file://') || avatarUri.startsWith('content://'))) {
        try {
          avatarUrl = await uploadProfileImage(avatarUri, 'avatar');
        } catch (e: any) {
          const msg = e?.message ?? '';
          if (msg.includes('permission') || msg.includes('unauthorized') || msg.includes('storage/') || msg.includes('Missing or insufficient')) {
            profileImageSkipped = true;
          } else {
            throw e;
          }
        }
      } else if (avatarUri && avatarUri.startsWith('http')) {
        avatarUrl = avatarUri;
      }
      if (bannerUri && (bannerUri.startsWith('file://') || bannerUri.startsWith('content://'))) {
        try {
          bannerUrl = await uploadProfileImage(bannerUri, 'banner');
        } catch (e: any) {
          const msg = e?.message ?? '';
          if (msg.includes('permission') || msg.includes('unauthorized') || msg.includes('storage/') || msg.includes('Missing or insufficient')) {
            profileImageSkipped = true;
          } else {
            throw e;
          }
        }
      } else if (bannerUri && bannerUri.startsWith('http')) {
        bannerUrl = bannerUri;
      }
      // Ensure auth token is fresh so Firestore accepts the write (avoids "insufficient permissions" right after sign-up)
      const auth = getFirebaseAuth();
      if (auth?.currentUser) {
        try {
          await auth.currentUser.getIdToken(true);
        } catch {
          // continue; use existing token
        }
      }
      await updateFirestoreUser(user.uid, {
        name: displayName,
        handle: handleValue.startsWith('@') ? handleValue : `@${handleValue}`,
        ...(ageNum !== undefined && !Number.isNaN(ageNum) ? { age: ageNum } : {}),
        occupation: occupation.trim() || undefined,
        country: country.trim() || undefined,
        city: city.trim() || undefined,
        bio: bio.trim().slice(0, 500) || undefined,
        ...(avatarUrl ? { avatar: avatarUrl } : {}),
        ...(bannerUrl ? { banner: bannerUrl } : {}),
        profileCompleted: true,
      });
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err?.message ?? 'Could not save profile. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isFirebaseEnabled || !user) {
    return (
      <ErrorBoundary>
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
          <ExpoImage source={require('@/assets/strivonbackgroundimage.png')} style={styles.backgroundImage} contentFit="cover" />
          <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.centered}>
              <Text style={[styles.errorText, { color: colors.secondary }]}>Please sign in first.</Text>
              <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/sign-in')}>
                <Text style={{ color: colors.primary }}>Go to sign in</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </ErrorBoundary>
    );
  }

  if (initializing) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ExpoImage source={require('@/assets/strivonbackgroundimage.png')} style={styles.backgroundImage} contentFit="cover" />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ExpoImage
          source={require('@/assets/strivonbackgroundimage.png')}
          style={styles.backgroundImage}
          contentFit="cover"
          transition={0}
          onLoad={handleBackgroundLoad}
        />
        {(!backgroundLoaded || loadingExiting) && (
          <View style={StyleSheet.absoluteFill}>
            <LoadingScreen animated visible={!backgroundLoaded} onExitComplete={() => setLoadingExiting(false)} />
          </View>
        )}
        {backgroundLoaded && (
        <SafeAreaView
          style={[styles.container, loadingExiting && styles.formHidden]}
          edges={['top']}
          pointerEvents={loadingExiting ? 'none' : 'auto'}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={async () => {
                    await signOut();
                    router.replace('/sign-in');
                  }}
                  hitSlop={12}
                  style={styles.backBtn}
                  accessibilityLabel="Go back"
                >
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Complete your profile</Text>
                <Text style={[styles.subtitle, { color: colors.secondary }]}>
                  Add a few details so others can find you on Strivon.
                </Text>
              </View>

              <View style={[styles.formCard, { backgroundColor: colors.background + 'E0' }]}>
                <View style={styles.form}>
                  {error ? (
                    <View style={[styles.errorBox, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
                      <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                    </View>
                  ) : null}

                  <Text style={[styles.sectionLabel, styles.sectionLabelFirst, { color: colors.secondary }]}>Profile photo & banner</Text>
                  <View style={styles.photoRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => pickImage('avatar')}
                      style={[styles.avatarTouch, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                    >
                      {avatarUri ? (
                        <Image key={avatarUri} source={{ uri: avatarUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Ionicons name="person-outline" size={32} color={colors.secondary} />
                          <Text style={[styles.photoLabel, { color: colors.secondary }]}>Photo</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => pickImage('banner')}
                      style={[styles.bannerTouch, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                    >
                      {bannerUri ? (
                        <Image key={bannerUri} source={{ uri: bannerUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                      ) : (
                        <View style={styles.bannerPlaceholder}>
                          <Ionicons name="image-outline" size={28} color={colors.secondary} />
                          <Text style={[styles.photoLabel, { color: colors.secondary }]}>Banner</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.sectionLabel, { color: colors.secondary }]}>Basic info</Text>
                  <Text style={[styles.label, { color: colors.text }]}>Display name</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                    placeholder="How you want to be called"
                    placeholderTextColor={colors.secondary}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!loading}
                  />

                  <Text style={[styles.label, { color: colors.text, marginTop: Spacing.lg }]}>Username</Text>
                  <Text style={[styles.hint, { color: colors.secondary }]}>Letters, numbers, and underscore only</Text>
                  <View style={[styles.inputRow, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                    <Text style={[styles.prefix, { color: colors.secondary }]}>@</Text>
                    <TextInput
                      style={[styles.inputInner, { color: colors.text }]}
                      placeholder="username"
                      placeholderTextColor={colors.secondary}
                      value={username}
                      onChangeText={(t) => setUsername(normalizeHandle(t))}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                  </View>

                  <Text style={[styles.label, { color: colors.text, marginTop: Spacing.lg }]}>Age (optional)</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                    placeholder="13–120"
                    placeholderTextColor={colors.secondary}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                    maxLength={3}
                    editable={!loading}
                  />

                  <Text style={[styles.label, { color: colors.text, marginTop: Spacing.lg }]}>Occupation (optional)</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                    placeholder="e.g. Trader, Entrepreneur"
                    placeholderTextColor={colors.secondary}
                    value={occupation}
                    onChangeText={setOccupation}
                    editable={!loading}
                  />

                  <Text style={[styles.label, { color: colors.text, marginTop: Spacing.md }]}>Country (recommended for local discovery)</Text>
                  <TouchableOpacity
                    style={[styles.pickerTouchable, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                    onPress={() => handleOpenPicker('country')}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerText, { color: country ? colors.text : colors.secondary }]}>
                      {country || 'Select country'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.secondary} />
                  </TouchableOpacity>

                  <Text style={[styles.label, { color: colors.text, marginTop: Spacing.lg }]}>City (optional)</Text>
                  <TouchableOpacity
                    style={[styles.pickerTouchable, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                    onPress={() => handleOpenPicker('city')}
                    disabled={loading || !country}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerText, { color: city ? colors.text : colors.secondary }]}>
                      {city || (country ? 'Select city' : 'Select country first')}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.secondary} />
                  </TouchableOpacity>

                  <Modal visible={pickerOpen !== null} transparent animationType="fade" onRequestClose={handleClosePicker}>
                    <Pressable style={styles.modalOverlay} onPress={handleClosePicker}>
                      <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
                          <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {pickerOpen === 'country' ? 'Select country' : 'Select city'}
                          </Text>
                          <TouchableOpacity onPress={handleClosePicker} hitSlop={12}>
                            <Ionicons name="close" size={24} color={colors.text} />
                          </TouchableOpacity>
                        </View>
                        <View style={[styles.searchWrap, { borderBottomColor: colors.divider }]}>
                          <Ionicons name="search-outline" size={20} color={colors.secondary} style={styles.searchIcon} />
                          <TextInput
                            style={[styles.searchInput, { color: colors.text, backgroundColor: colors.inputBackground }]}
                            placeholder={pickerOpen === 'country' ? 'Search countries...' : 'Search cities...'}
                            placeholderTextColor={colors.secondary}
                            value={pickerSearch}
                            onChangeText={setPickerSearch}
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                        </View>
                        {pickerOpen === 'country' && (
                          <FlatList
                            data={filteredCountries}
                            keyExtractor={(item) => item}
                            style={styles.pickerList}
                            ListEmptyComponent={
                              <View style={styles.emptyPicker}>
                                <Text style={[styles.emptyPickerText, { color: colors.secondary }]}>
                                  {pickerSearch.trim() ? 'No countries match your search' : 'No countries'}
                                </Text>
                              </View>
                            }
                            renderItem={({ item }) => (
                              <TouchableOpacity
                                style={[styles.optionRow, item === country && { backgroundColor: colors.primary + '18' }]}
                                onPress={() => { setCountry(item); setCity(''); handleClosePicker(); }}
                                activeOpacity={0.7}
                              >
                                <Text style={[styles.optionText, { color: colors.text }]}>{item}</Text>
                                {item === country && <Ionicons name="checkmark" size={22} color={colors.primary} />}
                              </TouchableOpacity>
                            )}
                          />
                        )}
                        {pickerOpen === 'city' && (
                          <FlatList
                            data={filteredCities}
                            keyExtractor={(item) => item}
                            style={styles.pickerList}
                            ListEmptyComponent={
                              <View style={styles.emptyPicker}>
                                <Text style={[styles.emptyPickerText, { color: colors.secondary }]}>
                                  {pickerSearch.trim() ? 'No cities match your search' : 'No cities listed for this country'}
                                </Text>
                              </View>
                            }
                            renderItem={({ item }) => (
                              <TouchableOpacity
                                style={[styles.optionRow, item === city && { backgroundColor: colors.primary + '18' }]}
                                onPress={() => { setCity(item); handleClosePicker(); }}
                                activeOpacity={0.7}
                              >
                                <Text style={[styles.optionText, { color: colors.text }]}>{item}</Text>
                                {item === city && <Ionicons name="checkmark" size={22} color={colors.primary} />}
                              </TouchableOpacity>
                            )}
                          />
                        )}
                      </View>
                    </Pressable>
                  </Modal>

                  <Text style={[styles.label, { color: colors.text, marginTop: Spacing.md }]}>Bio (optional)</Text>
                  <TextInput
                    style={[styles.input, styles.bioInput, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                    placeholder="A short bio about you"
                    placeholderTextColor={colors.secondary}
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                    editable={!loading}
                  />

                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Continue</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
        )}
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  formHidden: { opacity: 0 },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  container: { flex: 1 },
  keyboard: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: Spacing.lg, paddingBottom: Spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  header: { marginBottom: Spacing.lg },
  backBtn: { marginBottom: Spacing.md, alignSelf: 'flex-start' },
  title: { fontSize: Typography.xxl, fontWeight: '700', marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.base, lineHeight: 22 },
  formCard: {
    marginTop: Spacing.lg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  form: { marginTop: 0 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  sectionLabelFirst: { marginTop: 0 },
  label: { fontSize: Typography.sm, fontWeight: '600', marginBottom: Spacing.xs },
  hint: { fontSize: 12, marginBottom: Spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    minHeight: 48,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingLeft: Spacing.md,
    minHeight: 48,
  },
  prefix: { fontSize: Typography.base, marginRight: 4 },
  inputInner: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingRight: Spacing.md,
    fontSize: Typography.base,
  },
  pickerTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  pickerText: {
    fontSize: Typography.base,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  pickerList: {
    maxHeight: 360,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
  },
  optionText: {
    fontSize: 16,
  },
  emptyPicker: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyPickerText: {
    fontSize: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabelBlock: {
    flex: 1,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarTouch: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  bannerTouch: {
    flex: 1,
    minWidth: 100,
    height: 88,
    marginLeft: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bannerPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoLabel: { fontSize: 11, marginTop: 4 },
  bioInput: { minHeight: 80, textAlignVertical: 'top', paddingTop: Spacing.md },
  errorBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  errorText: { fontSize: Typography.sm },
  primaryButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonText: { color: '#fff', fontSize: Typography.base, fontWeight: '600' },
  backLink: { marginTop: Spacing.lg, padding: Spacing.md },
});
