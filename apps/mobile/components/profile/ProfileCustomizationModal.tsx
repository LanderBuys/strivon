import { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useRouter } from 'expo-router';
import { getProfilePageCustomization, setProfilePageCustomization } from '@/lib/services/badgePerksService';
import { canUseAdvancedProfileCustomization } from '@/lib/services/subscriptionService';

// Import color palettes and helper functions from ProfileEditModal
const COLOR_PALETTES = {
  ocean: {
    name: 'Ocean',
    icon: 'water',
    colors: [
      '#0EA5E9', '#0284C7', '#0369A1', '#075985', '#0C4A6E',
      '#06B6D4', '#0891B2', '#0E7490', '#155E75', '#164E63',
      '#22D3EE', '#38BDF8', '#60A5FA', '#818CF8', '#A78BFA',
    ],
  },
  sunset: {
    name: 'Sunset',
    icon: 'sunny',
    colors: [
      '#F97316', '#EA580C', '#DC2626', '#B91C1C', '#991B1B',
      '#FB923C', '#F59E0B', '#EAB308', '#FCD34D', '#FDE047',
      '#F87171', '#FB7185', '#F472B6', '#EC4899', '#DB2777',
    ],
  },
  forest: {
    name: 'Forest',
    icon: 'leaf',
    colors: [
      '#10B981', '#059669', '#047857', '#065F46', '#064E3B',
      '#22C55E', '#16A34A', '#15803D', '#166534', '#14532D',
      '#34D399', '#4ADE80', '#6EE7B7', '#86EFAC', '#A7F3D0',
    ],
  },
  lavender: {
    name: 'Lavender',
    icon: 'flower',
    colors: [
      '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95',
      '#A78BFA', '#C084FC', '#D8B4FE', '#E9D5FF', '#F3E8FF',
      '#9333EA', '#A855F7', '#C026D3', '#D946EF', '#EC4899',
    ],
  },
  neutral: {
    name: 'Neutral',
    icon: 'contrast',
    colors: [
      '#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB',
      '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937',
      '#111827', '#0F172A', '#1A1A1A', '#000000', '#0A0A0A',
    ],
  },
  vibrant: {
    name: 'Vibrant',
    icon: 'flash',
    colors: [
      '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A',
      '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95',
      '#EC4899', '#DB2777', '#BE185D', '#9F1239', '#831843',
      '#F59E0B', '#D97706', '#B45309', '#92400E', '#78350F',
    ],
  },
  pastel: {
    name: 'Pastel',
    icon: 'color-palette',
    colors: [
      '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6',
      '#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1',
      '#FCE7F3', '#FBCFE8', '#F9A8D4', '#F472B6', '#EC4899',
      '#DCFCE7', '#BBF7D0', '#86EFAC', '#4ADE80', '#22C55E',
      '#FEF3C7', '#FDE68A', '#FCD34D', '#FBBF24', '#F59E0B',
    ],
  },
  dark: {
    name: 'Dark',
    icon: 'moon',
    colors: [
      '#0F172A', '#1E293B', '#334155', '#475569', '#64748B',
      '#1A1A1A', '#2A2A2A', '#3A3A3A', '#4A4A4A', '#5A5A5A',
      '#000000', '#0A0A0A', '#111827', '#1F2937', '#374151',
    ],
  },
  coral: {
    name: 'Coral',
    icon: 'heart',
    colors: [
      '#F87171', '#EF4444', '#DC2626', '#B91C1C', '#991B1B',
      '#FB7185', '#F43F5E', '#E11D48', '#BE123C', '#9F1239',
      '#FDBA74', '#FB923C', '#F97316', '#EA580C', '#C2410C',
      '#FCA5A5', '#F87171', '#EF4444', '#DC2626', '#B91C1C',
    ],
  },
  mint: {
    name: 'Mint',
    icon: 'snow',
    colors: [
      '#06B6D4', '#0891B2', '#0E7490', '#155E75', '#164E63',
      '#14B8A6', '#0D9488', '#0F766E', '#115E59', '#134E4A',
      '#22D3EE', '#38BDF8', '#60A5FA', '#818CF8', '#A78BFA',
      '#5EEAD4', '#2DD4BF', '#14B8A6', '#0D9488', '#0F766E',
    ],
  },
};

const BACKGROUND_COLORS_BY_PALETTE: Record<keyof typeof COLOR_PALETTES, Array<{ color: string; name: string }>> = {
  ocean: [
    { color: '#DBEAFE', name: 'Sky Blue' },
    { color: '#E0F2FE', name: 'Light Blue' },
    { color: '#BFDBFE', name: 'Blue 200' },
    { color: '#0EA5E9', name: 'Ocean' },
    { color: '#0284C7', name: 'Blue 600' },
    { color: '#0C4A6E', name: 'Deep Blue' },
    { color: '#075985', name: 'Ocean Deep' },
    { color: '#164E63', name: 'Teal Dark' },
  ],
  sunset: [
    { color: '#FEF3C7', name: 'Warm Cream' },
    { color: '#FED7AA', name: 'Peach' },
    { color: '#FDE68A', name: 'Yellow 200' },
    { color: '#F97316', name: 'Orange' },
    { color: '#EA580C', name: 'Orange 600' },
    { color: '#DC2626', name: 'Red 600' },
    { color: '#991B1B', name: 'Deep Red' },
    { color: '#7F1D1D', name: 'Burgundy' },
  ],
  forest: [
    { color: '#DCFCE7', name: 'Mint' },
    { color: '#ECFDF5', name: 'Light Green' },
    { color: '#BBF7D0', name: 'Green 200' },
    { color: '#10B981', name: 'Emerald' },
    { color: '#059669', name: 'Green 600' },
    { color: '#064E3B', name: 'Forest Dark' },
    { color: '#065F46', name: 'Emerald Dark' },
    { color: '#134E4A', name: 'Mint Dark' },
  ],
  lavender: [
    { color: '#F3E8FF', name: 'Lavender' },
    { color: '#E9D5FF', name: 'Light Purple' },
    { color: '#DDD6FE', name: 'Purple 200' },
    { color: '#8B5CF6', name: 'Purple' },
    { color: '#7C3AED', name: 'Purple 600' },
    { color: '#4C1D95', name: 'Deep Purple' },
    { color: '#5B21B6', name: 'Purple Dark' },
    { color: '#6D28D9', name: 'Violet' },
  ],
  neutral: [
    { color: '#FFFFFF', name: 'White' },
    { color: '#F9FAFB', name: 'Off White' },
    { color: '#F3F4F6', name: 'Light Gray' },
    { color: '#E5E7EB', name: 'Gray' },
    { color: '#9CA3AF', name: 'Gray 400' },
    { color: '#6B7280', name: 'Gray 500' },
    { color: '#4B5563', name: 'Gray 600' },
    { color: '#374151', name: 'Gray 700' },
    { color: '#1F2937', name: 'Gray 800' },
    { color: '#111827', name: 'Gray 900' },
  ],
  vibrant: [
    { color: '#FEF3C7', name: 'Yellow' },
    { color: '#DBEAFE', name: 'Blue' },
    { color: '#FCE7F3', name: 'Pink' },
    { color: '#3B82F6', name: 'Blue 500' },
    { color: '#8B5CF6', name: 'Purple 500' },
    { color: '#EC4899', name: 'Pink 500' },
    { color: '#2563EB', name: 'Blue 600' },
    { color: '#7C3AED', name: 'Purple 600' },
  ],
  pastel: [
    { color: '#FEF3C7', name: 'Pastel Yellow' },
    { color: '#DBEAFE', name: 'Pastel Blue' },
    { color: '#DCFCE7', name: 'Pastel Green' },
    { color: '#FCE7F3', name: 'Pastel Pink' },
    { color: '#E0E7FF', name: 'Pastel Purple' },
    { color: '#F0FDF4', name: 'Mint Cream' },
    { color: '#F0F9FF', name: 'Ice Blue' },
    { color: '#FEF9C3', name: 'Cream' },
  ],
  dark: [
    { color: '#000000', name: 'Black' },
    { color: '#0A0A0A', name: 'Near Black' },
    { color: '#1A1A1A', name: 'Dark Gray' },
    { color: '#0F172A', name: 'Slate' },
    { color: '#1E293B', name: 'Dark Slate' },
    { color: '#111827', name: 'Charcoal' },
    { color: '#1F2937', name: 'Dark Gray 2' },
    { color: '#374151', name: 'Dark Gray 3' },
  ],
  coral: [
    { color: '#FEE2E2', name: 'Rose' },
    { color: '#FECACA', name: 'Light Coral' },
    { color: '#FCA5A5', name: 'Coral 300' },
    { color: '#F87171', name: 'Coral' },
    { color: '#EF4444', name: 'Red 500' },
    { color: '#DC2626', name: 'Red 600' },
    { color: '#991B1B', name: 'Deep Red' },
    { color: '#7F1D1D', name: 'Burgundy' },
  ],
  mint: [
    { color: '#F0FDF4', name: 'Mint Cream' },
    { color: '#F0F9FF', name: 'Ice Blue' },
    { color: '#CCFBF1', name: 'Cyan 100' },
    { color: '#06B6D4', name: 'Cyan' },
    { color: '#0891B2', name: 'Cyan 600' },
    { color: '#164E63', name: 'Teal Dark' },
    { color: '#134E4A', name: 'Mint Dark' },
    { color: '#155E75', name: 'Cyan 800' },
  ],
};

const isDarkColor = (color: string): boolean => {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};

/** Find which palette a color belongs to (checks both full palettes and background presets) */
function findPaletteKeyForColor(color: string): keyof typeof COLOR_PALETTES | null {
  for (const [key, palette] of Object.entries(COLOR_PALETTES)) {
    if (palette.colors.includes(color)) return key as keyof typeof COLOR_PALETTES;
  }
  for (const [key, list] of Object.entries(BACKGROUND_COLORS_BY_PALETTE)) {
    if (list.some((c) => c.color === color)) return key as keyof typeof COLOR_PALETTES;
  }
  return null;
}

interface ProfileCustomizationModalProps {
  visible: boolean;
  onClose: () => void;
  onCustomizationChange?: () => void;
}

export function ProfileCustomizationModal({ visible, onClose, onCustomizationChange }: ProfileCustomizationModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [pageCustomization, setPageCustomization] = useState<{
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    postCardBackgroundColor?: string;
    postCardBackgroundImage?: string;
    postCardTextColor?: string;
  }>({});
  const [selectedTextPalette, setSelectedTextPalette] = useState<keyof typeof COLOR_PALETTES>('neutral');
  const [selectedAccentPalette, setSelectedAccentPalette] = useState<keyof typeof COLOR_PALETTES>('ocean');
  const [selectedBackgroundPalette, setSelectedBackgroundPalette] = useState<keyof typeof COLOR_PALETTES>('neutral');
  const [selectedPostCardPalette, setSelectedPostCardPalette] = useState<keyof typeof COLOR_PALETTES>('neutral');
  const [selectedPostCardTextPalette, setSelectedPostCardTextPalette] = useState<keyof typeof COLOR_PALETTES>('neutral');
  const [hasPremium, setHasPremium] = useState(false);

  useEffect(() => {
    if (visible) {
      canUseAdvancedProfileCustomization().then((hasAccess) => {
        setHasPremium(hasAccess);
        if (hasAccess) {
          getProfilePageCustomization().then((customization) => {
            setPageCustomization(customization);

            const bgPalette = customization.backgroundColor
              ? findPaletteKeyForColor(customization.backgroundColor)
              : null;
            if (bgPalette) {
              setSelectedBackgroundPalette(bgPalette);
              setSelectedTextPalette(bgPalette);
              setSelectedAccentPalette(bgPalette);
            }

            const textPalette = customization.textColor
              ? findPaletteKeyForColor(customization.textColor)
              : null;
            if (textPalette) setSelectedTextPalette(textPalette);

            const accentPalette = customization.accentColor
              ? findPaletteKeyForColor(customization.accentColor)
              : null;
            if (accentPalette) setSelectedAccentPalette(accentPalette);

            const postCardPalette = customization.postCardBackgroundColor
              ? findPaletteKeyForColor(customization.postCardBackgroundColor)
              : null;
            if (postCardPalette) setSelectedPostCardPalette(postCardPalette);

            const postCardTextPalette = customization.postCardTextColor
              ? findPaletteKeyForColor(customization.postCardTextColor)
              : null;
            if (postCardTextPalette) setSelectedPostCardTextPalette(postCardTextPalette);
          });
        }
      });
    }
  }, [visible]);

  const handleBackgroundPaletteChange = (palette: keyof typeof COLOR_PALETTES) => {
    haptics.light();
    setSelectedBackgroundPalette(palette);
    setSelectedTextPalette(palette);
    setSelectedAccentPalette(palette);
  };

  const handleBackgroundColorSelect = async (color: string) => {
    haptics.light();
    const updated = { ...pageCustomization, backgroundColor: color };
    const palette = selectedBackgroundPalette;
    const isDark = isDarkColor(color);
    
    if (isDark) {
      const lightColors = COLOR_PALETTES[palette].colors.filter(c => !isDarkColor(c));
      if (lightColors.length > 0) {
        updated.textColor = lightColors[0];
      } else {
        updated.textColor = '#FFFFFF';
      }
      const vibrantColors = COLOR_PALETTES[palette].colors.filter(c => !isDarkColor(c));
      if (vibrantColors.length > 0) {
        updated.accentColor = vibrantColors[Math.min(2, vibrantColors.length - 1)];
      } else {
        updated.accentColor = COLOR_PALETTES[palette].colors[Math.floor(COLOR_PALETTES[palette].colors.length / 2)] || '#3B82F6';
      }
    } else {
      const darkColors = COLOR_PALETTES[palette].colors.filter(c => isDarkColor(c));
      if (darkColors.length > 0) {
        updated.textColor = darkColors[0];
      } else {
        updated.textColor = '#1F2937';
      }
      const vibrantColors = COLOR_PALETTES[palette].colors.filter(c => isDarkColor(c));
      if (vibrantColors.length > 0) {
        updated.accentColor = vibrantColors[Math.min(2, vibrantColors.length - 1)];
      } else {
        updated.accentColor = COLOR_PALETTES[palette].colors[Math.floor(COLOR_PALETTES[palette].colors.length / 2)] || '#3B82F6';
      }
    }
    
    await setProfilePageCustomization(updated);
    setPageCustomization({ ...updated });
    onCustomizationChange?.();
  };

  const handlePostCardPaletteChange = (palette: keyof typeof COLOR_PALETTES) => {
    haptics.light();
    setSelectedPostCardPalette(palette);
  };

  const handlePostCardBackgroundColorSelect = async (color: string) => {
    haptics.light();
    const updated = { ...pageCustomization, postCardBackgroundColor: color, postCardBackgroundImage: undefined };
    await setProfilePageCustomization(updated);
    setPageCustomization({ ...updated });
    onCustomizationChange?.();
  };

  const handlePostCardTextPaletteChange = (palette: keyof typeof COLOR_PALETTES) => {
    haptics.light();
    setSelectedPostCardTextPalette(palette);
  };

  const handlePostCardTextColorSelect = async (color: string) => {
    haptics.light();
    const updated = { ...pageCustomization, postCardTextColor: color };
    await setProfilePageCustomization(updated);
    setPageCustomization({ ...updated });
    onCustomizationChange?.();
  };

  const handleTextColorSelect = async (color: string) => {
    haptics.light();
    const updated = { ...pageCustomization, textColor: color };
    await setProfilePageCustomization(updated);
    setPageCustomization({ ...updated });
    onCustomizationChange?.();
  };

  const handleAccentColorSelect = async (color: string) => {
    haptics.light();
    const updated = { ...pageCustomization, accentColor: color };
    await setProfilePageCustomization(updated);
    setPageCustomization({ ...updated });
    onCustomizationChange?.();
  };

  if (!visible) {
    return null;
  }

  if (!hasPremium) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, {
            borderBottomColor: colors.divider,
            backgroundColor: colors.cardBackground,
            paddingTop: insets.top + Spacing.md,
          }]}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Close"
              accessibilityRole="button">
              <Text style={[styles.cancelText, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Customization</Text>
            <View style={{ width: 56 }} />
          </View>
          <View style={styles.premiumRequired}>
            <View style={[styles.premiumIconWrap, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="lock-closed" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.premiumTitle, { color: colors.text }]}>Premium Required</Text>
            <Text style={[styles.premiumDescription, { color: colors.secondary }]}>
              Profile customization is available for Pro and Pro+ members. Upgrade to unlock custom page colors, accent themes, and post card styling.
            </Text>
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                haptics.light();
                onClose();
                router.push('/settings/subscription-info');
              }}
              activeOpacity={0.7}
              accessibilityLabel="View premium plans"
              accessibilityRole="button">
              <Text style={styles.upgradeButtonText}>View Premium Plans</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.content, { backgroundColor: colors.background }]}>
            <View style={[styles.header, {
              borderBottomColor: colors.divider,
              backgroundColor: colors.cardBackground,
              paddingTop: insets.top + Spacing.md,
            }]}>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close customization"
                accessibilityRole="button">
                <Text style={[styles.cancelText, { color: colors.primary }]}>Close</Text>
              </TouchableOpacity>
              <Text style={[styles.title, { color: colors.text }]}>Customization</Text>
              <View style={{ width: 56 }} />
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
              showsVerticalScrollIndicator={false}
            >
              {/* Page Customization Section */}
              <View style={styles.customizationSection}>
                <View style={[styles.sectionHeader, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                  <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Page Colors</Text>
                </View>

                {/* Background Color */}
                <View style={[styles.customizationCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="color-fill-outline" size={18} color={colors.text} />
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Background Color</Text>
                  </View>
                  <Text style={[styles.cardDescription, { color: colors.secondary }]}>
                    Main background color for your profile
                  </Text>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.paletteSelector}
                    contentContainerStyle={styles.paletteSelectorContent}
                  >
                    {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.paletteButton,
                          {
                            backgroundColor: selectedBackgroundPalette === key ? colors.primary + '15' : colors.surface,
                            borderColor: selectedBackgroundPalette === key ? colors.primary : colors.cardBorder,
                            borderWidth: selectedBackgroundPalette === key ? 2 : 1,
                          },
                        ]}
                        onPress={() => handleBackgroundPaletteChange(key as keyof typeof COLOR_PALETTES)}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={palette.icon as any} 
                          size={18} 
                          color={selectedBackgroundPalette === key ? colors.primary : colors.secondary} 
                        />
                        <Text style={[
                          styles.paletteButtonText,
                          { color: selectedBackgroundPalette === key ? colors.primary : colors.secondary }
                        ]}>
                          {palette.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.colorGrid}>
                    {BACKGROUND_COLORS_BY_PALETTE[selectedBackgroundPalette].map((colorObj, index) => {
                      const color = colorObj.color;
                      const isLight = !isDarkColor(color);
                      const isSelected = pageCustomization.backgroundColor === color;
                      return (
                        <TouchableOpacity
                          key={`bg-${selectedBackgroundPalette}-${color}-${index}`}
                          style={[
                            styles.colorOption,
                            {
                              backgroundColor: color,
                              borderColor: isSelected
                                ? colors.primary
                                : isLight
                                  ? colors.cardBorder
                                  : 'transparent',
                              borderWidth: isSelected ? 3 : 1,
                              shadowColor: isSelected ? color : '#000',
                              shadowOffset: isSelected ? { width: 0, height: 2 } : { width: 0, height: 0 },
                              shadowOpacity: isSelected ? 0.3 : 0,
                              shadowRadius: isSelected ? 4 : 0,
                              elevation: isSelected ? 4 : 0,
                            },
                          ]}
                          onPress={() => handleBackgroundColorSelect(color)}
                          activeOpacity={0.8}
                          accessibilityLabel={isSelected ? `Background ${colorObj.name}, selected` : `Background ${colorObj.name}`}
                          accessibilityRole="button">
                          {isSelected && (
                            <View style={styles.colorCheckmark}>
                              <Ionicons name="checkmark" size={16} color={isLight ? colors.primary : '#FFFFFF'} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Text Color */}
                <View style={[styles.customizationCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="text-outline" size={18} color={colors.text} />
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Text Color</Text>
                  </View>
                  <Text style={[styles.cardDescription, { color: colors.secondary }]}>
                    Color for all text on your profile
                  </Text>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.paletteSelector}
                    contentContainerStyle={styles.paletteSelectorContent}
                  >
                    {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.paletteButton,
                          {
                            backgroundColor: selectedTextPalette === key ? colors.primary + '15' : colors.surface,
                            borderColor: selectedTextPalette === key ? colors.primary : colors.cardBorder,
                            borderWidth: selectedTextPalette === key ? 2 : 1,
                          },
                        ]}
                        onPress={() => {
                          haptics.light();
                          setSelectedTextPalette(key as keyof typeof COLOR_PALETTES);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={palette.icon as any} 
                          size={18} 
                          color={selectedTextPalette === key ? colors.primary : colors.secondary} 
                        />
                        <Text style={[
                          styles.paletteButtonText,
                          { color: selectedTextPalette === key ? colors.primary : colors.secondary }
                        ]}>
                          {palette.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.colorGrid}>
                    {COLOR_PALETTES[selectedTextPalette].colors.map((color, index) => {
                      const isLight = !isDarkColor(color);
                      const isSelected = pageCustomization.textColor === color;
                      return (
                        <TouchableOpacity
                          key={`text-${selectedTextPalette}-${color}-${index}`}
                          style={[
                            styles.colorOption,
                            {
                              backgroundColor: color,
                              borderColor: isSelected
                                ? colors.primary
                                : isLight
                                  ? colors.cardBorder
                                  : 'transparent',
                              borderWidth: isSelected ? 3 : 1,
                              shadowColor: isSelected ? color : '#000',
                              shadowOffset: isSelected ? { width: 0, height: 2 } : { width: 0, height: 0 },
                              shadowOpacity: isSelected ? 0.3 : 0,
                              shadowRadius: isSelected ? 4 : 0,
                              elevation: isSelected ? 4 : 0,
                            },
                          ]}
                          onPress={() => handleTextColorSelect(color)}
                          activeOpacity={0.8}
                          accessibilityLabel={isSelected ? `Text color ${color}, selected` : `Text color ${color}`}
                          accessibilityRole="button">
                          {isSelected && (
                            <View style={styles.colorCheckmark}>
                              <Ionicons name="checkmark" size={16} color={isLight ? colors.primary : '#FFFFFF'} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Accent Color */}
                <View style={[styles.customizationCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="sparkles-outline" size={18} color={colors.text} />
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Accent Color</Text>
                  </View>
                  <Text style={[styles.cardDescription, { color: colors.secondary }]}>
                    Color for highlights, buttons, and interactive elements
                  </Text>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.paletteSelector}
                    contentContainerStyle={styles.paletteSelectorContent}
                  >
                    {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.paletteButton,
                          {
                            backgroundColor: selectedAccentPalette === key ? colors.primary + '15' : colors.surface,
                            borderColor: selectedAccentPalette === key ? colors.primary : colors.cardBorder,
                            borderWidth: selectedAccentPalette === key ? 2 : 1,
                          },
                        ]}
                        onPress={() => {
                          haptics.light();
                          setSelectedAccentPalette(key as keyof typeof COLOR_PALETTES);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={palette.icon as any} 
                          size={18} 
                          color={selectedAccentPalette === key ? colors.primary : colors.secondary} 
                        />
                        <Text style={[
                          styles.paletteButtonText,
                          { color: selectedAccentPalette === key ? colors.primary : colors.secondary }
                        ]}>
                          {palette.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.colorGrid}>
                    {COLOR_PALETTES[selectedAccentPalette].colors.map((color, index) => {
                      const isLight = !isDarkColor(color);
                      const isSelected = pageCustomization.accentColor === color;
                      return (
                        <TouchableOpacity
                          key={`accent-${selectedAccentPalette}-${color}-${index}`}
                          style={[
                            styles.colorOption,
                            {
                              backgroundColor: color,
                              borderColor: isSelected
                                ? colors.primary
                                : isLight
                                  ? colors.cardBorder
                                  : 'transparent',
                              borderWidth: isSelected ? 3 : 1,
                              shadowColor: isSelected ? color : '#000',
                              shadowOffset: isSelected ? { width: 0, height: 2 } : { width: 0, height: 0 },
                              shadowOpacity: isSelected ? 0.3 : 0,
                              shadowRadius: isSelected ? 4 : 0,
                              elevation: isSelected ? 4 : 0,
                            },
                          ]}
                          onPress={() => handleAccentColorSelect(color)}
                          activeOpacity={0.8}
                          accessibilityLabel={isSelected ? `Accent color ${color}, selected` : `Accent color ${color}`}
                          accessibilityRole="button">
                          {isSelected && (
                            <View style={styles.colorCheckmark}>
                              <Ionicons name="checkmark" size={16} color={isLight ? colors.primary : '#FFFFFF'} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Post Card Customization Section */}
              <View style={styles.postCardCustomizationSection}>
                <View style={[styles.sectionHeader, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                  <Ionicons name="card-outline" size={20} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Post Card Customization</Text>
                </View>

                {/* Post Card Background Color */}
                <View style={[styles.customizationCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="color-fill-outline" size={18} color={colors.text} />
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Post Card Background</Text>
                  </View>
                  <Text style={[styles.cardDescription, { color: colors.secondary }]}>
                    Background color for your post cards (visible in all feeds)
                  </Text>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.paletteSelector}
                    contentContainerStyle={styles.paletteSelectorContent}
                  >
                    {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.paletteButton,
                          {
                            backgroundColor: selectedPostCardPalette === key ? colors.primary + '15' : colors.surface,
                            borderColor: selectedPostCardPalette === key ? colors.primary : colors.cardBorder,
                            borderWidth: selectedPostCardPalette === key ? 2 : 1,
                          },
                        ]}
                        onPress={() => handlePostCardPaletteChange(key as keyof typeof COLOR_PALETTES)}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={palette.icon as any} 
                          size={18} 
                          color={selectedPostCardPalette === key ? colors.primary : colors.secondary} 
                        />
                        <Text style={[
                          styles.paletteButtonText,
                          { color: selectedPostCardPalette === key ? colors.primary : colors.secondary }
                        ]}>
                          {palette.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.colorGrid}>
                    {BACKGROUND_COLORS_BY_PALETTE[selectedPostCardPalette].map((colorObj, index) => {
                      const color = colorObj.color;
                      const isLight = !isDarkColor(color);
                      const isSelected = pageCustomization.postCardBackgroundColor === color;
                      return (
                        <TouchableOpacity
                          key={`postcard-bg-${selectedPostCardPalette}-${color}-${index}`}
                          style={[
                            styles.colorOption,
                            {
                              backgroundColor: color,
                              borderColor: isSelected
                                ? colors.primary
                                : isLight
                                  ? colors.cardBorder
                                  : 'transparent',
                              borderWidth: isSelected ? 3 : 1,
                              shadowColor: isSelected ? color : '#000',
                              shadowOffset: isSelected ? { width: 0, height: 2 } : { width: 0, height: 0 },
                              shadowOpacity: isSelected ? 0.3 : 0,
                              shadowRadius: isSelected ? 4 : 0,
                              elevation: isSelected ? 4 : 0,
                            },
                          ]}
                          onPress={() => handlePostCardBackgroundColorSelect(color)}
                          activeOpacity={0.8}
                          accessibilityLabel={isSelected ? `Post card background ${colorObj.name}, selected` : `Post card background ${colorObj.name}`}
                          accessibilityRole="button">
                          {isSelected && (
                            <View style={styles.colorCheckmark}>
                              <Ionicons name="checkmark" size={16} color={isLight ? colors.primary : '#FFFFFF'} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Post Card Text Color */}
                <View style={[styles.customizationCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="text-outline" size={18} color={colors.text} />
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Post Card Text Color</Text>
                  </View>
                  <Text style={[styles.cardDescription, { color: colors.secondary }]}>
                    Text color for your post cards (visible in all feeds)
                  </Text>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.paletteSelector}
                    contentContainerStyle={styles.paletteSelectorContent}
                  >
                    {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.paletteButton,
                          {
                            backgroundColor: selectedPostCardTextPalette === key ? colors.primary + '15' : colors.surface,
                            borderColor: selectedPostCardTextPalette === key ? colors.primary : colors.cardBorder,
                            borderWidth: selectedPostCardTextPalette === key ? 2 : 1,
                          },
                        ]}
                        onPress={() => handlePostCardTextPaletteChange(key as keyof typeof COLOR_PALETTES)}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={palette.icon as any} 
                          size={18} 
                          color={selectedPostCardTextPalette === key ? colors.primary : colors.secondary} 
                        />
                        <Text style={[
                          styles.paletteButtonText,
                          { color: selectedPostCardTextPalette === key ? colors.primary : colors.secondary }
                        ]}>
                          {palette.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.colorGrid}>
                    {BACKGROUND_COLORS_BY_PALETTE[selectedPostCardTextPalette].map((colorObj, index) => {
                      const color = colorObj.color;
                      const isLight = !isDarkColor(color);
                      const isSelected = pageCustomization.postCardTextColor === color;
                      return (
                        <TouchableOpacity
                          key={`postcard-text-${selectedPostCardTextPalette}-${color}-${index}`}
                          style={[
                            styles.colorOption,
                            {
                              backgroundColor: color,
                              borderColor: isSelected
                                ? colors.primary
                                : isLight
                                  ? colors.cardBorder
                                  : 'transparent',
                              borderWidth: isSelected ? 3 : 1,
                              shadowColor: isSelected ? color : '#000',
                              shadowOffset: isSelected ? { width: 0, height: 2 } : { width: 0, height: 0 },
                              shadowOpacity: isSelected ? 0.3 : 0,
                              shadowRadius: isSelected ? 4 : 0,
                              elevation: isSelected ? 4 : 0,
                            },
                          ]}
                          onPress={() => handlePostCardTextColorSelect(color)}
                          activeOpacity={0.8}
                          accessibilityLabel={isSelected ? `Post card text ${colorObj.name}, selected` : `Post card text ${colorObj.name}`}
                          accessibilityRole="button">
                          {isSelected && (
                            <View style={styles.colorCheckmark}>
                              <Ionicons name="checkmark" size={16} color={isLight ? colors.primary : '#FFFFFF'} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {(pageCustomization.backgroundColor || pageCustomization.textColor || pageCustomization.accentColor || pageCustomization.postCardBackgroundColor || pageCustomization.postCardBackgroundImage || pageCustomization.postCardTextColor) && (
                <TouchableOpacity
                  style={[styles.resetButton, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
                  onPress={async () => {
                    haptics.light();
                    await setProfilePageCustomization({
                      backgroundColor: '',
                      textColor: '',
                      accentColor: '',
                      backgroundImage: '',
                      postCardBackgroundColor: '',
                      postCardBackgroundImage: '',
                      postCardTextColor: '',
                    });
                    const clearedCustomization = await getProfilePageCustomization();
                    setPageCustomization(clearedCustomization);
                    setSelectedBackgroundPalette('neutral');
                    setSelectedTextPalette('neutral');
                    setSelectedAccentPalette('ocean');
                    setSelectedPostCardPalette('neutral');
                    setSelectedPostCardTextPalette('neutral');
                    onCustomizationChange?.();
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel="Reset all customization to default"
                  accessibilityRole="button">
                  <Ionicons name="refresh-outline" size={18} color={colors.secondary} />
                  <Text style={[styles.resetButtonText, { color: colors.secondary }]}>Reset All to Default</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  premiumRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl * 1.5,
  },
  premiumIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  premiumDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  upgradeButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  customizationSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  postCardCustomizationSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
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
    flexDirection: 'row',
    paddingRight: Spacing.md,
    alignItems: 'center',
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
    marginHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
