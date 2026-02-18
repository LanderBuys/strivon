import { Badge } from '@/types/badges';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMaxPinnedPosts } from './subscriptionService';

const PROFILE_ACCENT_COLOR_KEY = '@strivon_profile_accent_color';
const PROFILE_ACCENT_WIDTH_KEY = '@strivon_profile_accent_width';
const PROFILE_BACKGROUND_COLOR_KEY = '@strivon_profile_background_color';
const PROFILE_TEXT_COLOR_KEY = '@strivon_profile_text_color';
const PROFILE_ACCENT_COLOR_PAGE_KEY = '@strivon_profile_accent_color_page';
const PROFILE_BACKGROUND_IMAGE_KEY = '@strivon_profile_background_image';
const POST_CARD_BACKGROUND_COLOR_KEY = '@strivon_post_card_background_color';
const POST_CARD_BACKGROUND_IMAGE_KEY = '@strivon_post_card_background_image';
const POST_CARD_TEXT_COLOR_KEY = '@strivon_post_card_text_color';

export interface BadgePerks {
  visibilityBoost: number; // Multiplier (e.g., 1.05, 1.10, etc.)
  profileAccent?: 'small' | 'strong' | 'highlight' | 'ring' | 'premium' | 'border'; // Deprecated - kept for backwards compatibility
  canPinPosts: number; // Number of posts that can be pinned
  hasCustomTagline: boolean;
  hasPriorityComments: boolean;
  postBoostCredits: number;
  hasAnalytics: boolean;
}

export interface ProfilePageCustomization {
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  backgroundImage?: string;
  postCardBackgroundColor?: string;
  postCardBackgroundImage?: string;
  postCardTextColor?: string;
}

/**
 * Get custom profile accent color
 */
export async function getProfileAccentColor(): Promise<string | null> {
  try {
    const color = await AsyncStorage.getItem(PROFILE_ACCENT_COLOR_KEY);
    return color;
  } catch (error) {
    return null;
  }
}

/**
 * Set custom profile accent color
 */
export async function setProfileAccentColor(color: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_ACCENT_COLOR_KEY, color);
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Get custom profile accent border width
 */
export async function getProfileAccentWidth(): Promise<number | null> {
  try {
    const width = await AsyncStorage.getItem(PROFILE_ACCENT_WIDTH_KEY);
    return width ? parseFloat(width) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Set custom profile accent border width
 */
export async function setProfileAccentWidth(width: number): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_ACCENT_WIDTH_KEY, width.toString());
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Get custom profile page background color
 */
export async function getProfileBackgroundColor(): Promise<string | null> {
  try {
    const color = await AsyncStorage.getItem(PROFILE_BACKGROUND_COLOR_KEY);
    return color;
  } catch (error) {
    return null;
  }
}

/**
 * Set custom profile page background color
 */
export async function setProfileBackgroundColor(color: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_BACKGROUND_COLOR_KEY, color);
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Get custom profile page text color
 */
export async function getProfileTextColor(): Promise<string | null> {
  try {
    const color = await AsyncStorage.getItem(PROFILE_TEXT_COLOR_KEY);
    return color;
  } catch (error) {
    return null;
  }
}

/**
 * Set custom profile page text color
 */
export async function setProfileTextColor(color: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_TEXT_COLOR_KEY, color);
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Get custom profile page accent color
 */
export async function getProfileAccentColorPage(): Promise<string | null> {
  try {
    const color = await AsyncStorage.getItem(PROFILE_ACCENT_COLOR_PAGE_KEY);
    return color;
  } catch (error) {
    return null;
  }
}

/**
 * Set custom profile page accent color
 */
export async function setProfileAccentColorPage(color: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_ACCENT_COLOR_PAGE_KEY, color);
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Get custom profile page background image
 */
export async function getProfileBackgroundImage(): Promise<string | null> {
  try {
    const image = await AsyncStorage.getItem(PROFILE_BACKGROUND_IMAGE_KEY);
    return image;
  } catch (error) {
    return null;
  }
}

/**
 * Set custom profile page background image
 */
export async function setProfileBackgroundImage(image: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_BACKGROUND_IMAGE_KEY, image);
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Get custom post card background color
 */
export async function getPostCardBackgroundColor(): Promise<string | null> {
  try {
    const color = await AsyncStorage.getItem(POST_CARD_BACKGROUND_COLOR_KEY);
    return color;
  } catch (error) {
    return null;
  }
}

/**
 * Set custom post card background color
 */
export async function setPostCardBackgroundColor(color: string): Promise<void> {
  try {
    await AsyncStorage.setItem(POST_CARD_BACKGROUND_COLOR_KEY, color);
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Get custom post card background image
 */
export async function getPostCardBackgroundImage(): Promise<string | null> {
  try {
    const image = await AsyncStorage.getItem(POST_CARD_BACKGROUND_IMAGE_KEY);
    return image;
  } catch (error) {
    return null;
  }
}

/**
 * Set custom post card background image
 */
export async function setPostCardBackgroundImage(image: string): Promise<void> {
  try {
    await AsyncStorage.setItem(POST_CARD_BACKGROUND_IMAGE_KEY, image);
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Get custom post card text color
 */
export async function getPostCardTextColor(): Promise<string | null> {
  try {
    const color = await AsyncStorage.getItem(POST_CARD_TEXT_COLOR_KEY);
    return color;
  } catch (error) {
    return null;
  }
}

/**
 * Set custom post card text color
 */
export async function setPostCardTextColor(color: string): Promise<void> {
  try {
    await AsyncStorage.setItem(POST_CARD_TEXT_COLOR_KEY, color);
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Get perks for a user based on their badges
 */
export function getBadgePerks(badges: Badge[]): BadgePerks {
  const perks: BadgePerks = {
    visibilityBoost: 1.0,
    canPinPosts: 0,
    hasCustomTagline: false,
    hasPriorityComments: false,
    postBoostCredits: 0,
    hasAnalytics: false,
  };

  // Check for paid badges (highest tier wins for visibility)
  let highestVisibilityBoost = 1.0;
  let highestProfileAccent: BadgePerks['profileAccent'] = undefined;

  badges.forEach(badge => {
    // Paid badges are now support-only - no perks/features
    // They're just cosmetic badges to show support for Strivon
    if (badge.category === 'paid') {
      // No perks for paid badges - they're just support badges
      return;
    } else if (badge.category === 'limited') {
      switch (badge.name) {
        case 'level-ii':
          highestVisibilityBoost = Math.max(highestVisibilityBoost, 1.50);
          highestProfileAccent = 'border';
          perks.postBoostCredits = Math.max(perks.postBoostCredits, 2);
          break;
        case 'level-iii':
          highestVisibilityBoost = Math.max(highestVisibilityBoost, 2.00);
          highestProfileAccent = 'border';
          perks.postBoostCredits = Math.max(perks.postBoostCredits, 5);
          break;
        case 'day-one':
        case 'beta-tester':
        case 'early':
          // Limited badges get border accent
          if (!highestProfileAccent) {
            highestProfileAccent = 'border';
          }
          break;
      }
    }
  });

  perks.visibilityBoost = highestVisibilityBoost;
  perks.profileAccent = highestProfileAccent;

  return perks;
}

/**
 * Apply visibility boost to post score/ranking
 */
export function applyVisibilityBoost(baseScore: number, visibilityBoost: number): number {
  return baseScore * visibilityBoost;
}

/**
 * Check if user can pin a post
 * Now uses subscription tier instead of badges
 */
export async function canPinPost(currentPinnedCount: number): Promise<boolean> {
  const maxPinned = await getMaxPinnedPosts();
  return currentPinnedCount < maxPinned;
}

/**
 * Get all profile page customizations
 */
export async function getProfilePageCustomization(): Promise<ProfilePageCustomization> {
  try {
    const [backgroundColor, textColor, accentColor, backgroundImage, postCardBackgroundColor, postCardBackgroundImage, postCardTextColor] = await Promise.all([
      getProfileBackgroundColor(),
      getProfileTextColor(),
      getProfileAccentColorPage(),
      getProfileBackgroundImage(),
      getPostCardBackgroundColor(),
      getPostCardBackgroundImage(),
      getPostCardTextColor(),
    ]);
    return {
      backgroundColor: backgroundColor || undefined,
      textColor: textColor || undefined,
      accentColor: accentColor || undefined,
      backgroundImage: backgroundImage || undefined,
      postCardBackgroundColor: postCardBackgroundColor || undefined,
      postCardBackgroundImage: postCardBackgroundImage || undefined,
      postCardTextColor: postCardTextColor || undefined,
    };
  } catch (error) {
    return {};
  }
}

/**
 * Set all profile page customizations
 */
export async function setProfilePageCustomization(customization: ProfilePageCustomization): Promise<void> {
  try {
    // Save all colors, including undefined to clear them if needed
    const promises = [];
    
    if (customization.backgroundColor !== undefined) {
      if (customization.backgroundColor) {
        promises.push(setProfileBackgroundColor(customization.backgroundColor));
      } else {
        promises.push(AsyncStorage.removeItem(PROFILE_BACKGROUND_COLOR_KEY));
      }
    }
    
    if (customization.textColor !== undefined) {
      if (customization.textColor) {
        promises.push(setProfileTextColor(customization.textColor));
      } else {
        promises.push(AsyncStorage.removeItem(PROFILE_TEXT_COLOR_KEY));
      }
    }
    
    if (customization.accentColor !== undefined) {
      if (customization.accentColor) {
        promises.push(setProfileAccentColorPage(customization.accentColor));
      } else {
        promises.push(AsyncStorage.removeItem(PROFILE_ACCENT_COLOR_PAGE_KEY));
      }
    }
    
    if (customization.backgroundImage !== undefined) {
      if (customization.backgroundImage) {
        promises.push(setProfileBackgroundImage(customization.backgroundImage));
      } else {
        promises.push(AsyncStorage.removeItem(PROFILE_BACKGROUND_IMAGE_KEY));
      }
    }
    
    if (customization.postCardBackgroundColor !== undefined) {
      if (customization.postCardBackgroundColor) {
        promises.push(setPostCardBackgroundColor(customization.postCardBackgroundColor));
      } else {
        promises.push(AsyncStorage.removeItem(POST_CARD_BACKGROUND_COLOR_KEY));
      }
    }
    
    if (customization.postCardBackgroundImage !== undefined) {
      if (customization.postCardBackgroundImage) {
        promises.push(setPostCardBackgroundImage(customization.postCardBackgroundImage));
      } else {
        promises.push(AsyncStorage.removeItem(POST_CARD_BACKGROUND_IMAGE_KEY));
      }
    }
    
    if (customization.postCardTextColor !== undefined) {
      if (customization.postCardTextColor) {
        promises.push(setPostCardTextColor(customization.postCardTextColor));
      } else {
        promises.push(AsyncStorage.removeItem(POST_CARD_TEXT_COLOR_KEY));
      }
    }
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error saving profile page customization:', error);
  }
}

