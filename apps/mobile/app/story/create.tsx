import { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getStoryExpirationHours } from '@/lib/services/subscriptionService';
import { createStory } from '@/lib/api/stories';
import { setPendingStoryMedia } from '@/lib/services/pendingStoryStore';

type PickedAsset = { uri: string; type: string };

export default function CreateStoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const haptics = useHapticFeedback();
  const [loading, setLoading] = useState(false);
  const [expirationHours, setExpirationHours] = useState(24);
  const [pickedAsset, setPickedAsset] = useState<PickedAsset | null>(null);

  useEffect(() => {
    getStoryExpirationHours().then(setExpirationHours);
  }, []);

  const postNow = async (asset: PickedAsset) => {
    setLoading(true);
    try {
      const newStory = await createStory({
        media: { uri: asset.uri, type: asset.type },
        expirationHours,
      });
      haptics.success();
      router.replace(`/story/${newStory.id}`);
    } catch (e) {
      console.error('Error posting story:', e);
      Alert.alert('Error', 'Failed to post story.');
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (asset: PickedAsset) => {
    setPendingStoryMedia(asset.uri, asset.type);
    router.push('/story/create-editor');
  };

  const handlePickMedia = async () => {
    haptics.light();
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos to create a story.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: false,
        quality: 0.9,
        allowsEditing: false,
        videoMaxDuration: 15,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setPickedAsset({ uri: asset.uri, type: asset.type ?? 'image' });
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media.');
    }
  };

  const handleTakePhoto = async () => {
    haptics.light();
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your camera to create a story.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.9,
        videoMaxDuration: 15,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setPickedAsset({ uri: asset.uri, type: asset.type ?? 'image' });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  // After picking media: choose Post now or Add text & stickers
  if (pickedAsset) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity
            onPress={() => { setPickedAsset(null); haptics.light(); }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Share story</ThemedText>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.content}>
          <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <ThemedText style={[styles.previewLabel, { color: colors.secondary }]}>
              {pickedAsset.type === 'video' ? 'Video' : 'Photo'} selected
            </ThemedText>
            <View style={styles.choiceButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => postNow(pickedAsset)}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Post now</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton, {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                }]}
                onPress={() => openEditor(pickedAsset)}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Ionicons name="text" size={20} color={colors.text} />
                <Text style={[styles.actionButtonText, { color: colors.text }]}>Add text & stickers</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>Create Story</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.createContainer}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="camera" size={64} color={colors.primary} />
          </View>
          <ThemedText type="title" style={[styles.createTitle, { color: colors.text }]}>
            Create Your Story
          </ThemedText>
          <ThemedText style={[styles.createMessage, { color: colors.secondary }]}>
            Stories disappear after {expirationHours} hours
          </ThemedText>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleTakePhoto}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Take Photo or Video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton, {
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
              }]}
              onPress={handlePickMedia}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Ionicons name="images" size={24} color={colors.text} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Choose from Library</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: Typography['2xl'],
    fontWeight: '700',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  createContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  createTitle: {
    fontSize: Typography.xl + 4,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  createMessage: {
    fontSize: Typography.base,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.md,
    minHeight: 52,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  previewCard: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: Typography.sm,
    marginBottom: Spacing.lg,
  },
  choiceButtons: {
    width: '100%',
    gap: Spacing.md,
  },
});
