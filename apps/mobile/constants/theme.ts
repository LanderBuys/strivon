export const Colors = {
  light: {
    text: '#1C1C1E',
    textMuted: '#5C5C6D',
    background: '#F2F3F5',
    tint: '#2563EB',
    primary: '#2563EB',
    secondary: '#5C5C6D',
    tabBarInactive: '#8E8E93',
    tabBarBackground: '#FFFFFF',
    tabBarBorder: 'rgba(0,0,0,0.06)',
    inputBackground: '#FFFFFF',
    inputBorder: 'rgba(0,0,0,0.1)',
    cardBackground: '#FFFFFF',
    cardBorder: 'rgba(0,0,0,0.06)',
    spaceBackground: '#F2F3F5',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: 'rgba(0,0,0,0.08)',
    divider: 'rgba(0,0,0,0.06)',
    error: '#DC2626',
    warning: '#D97706',
    success: '#059669',
    info: '#2563EB',
    danger: '#DC2626',
    purple: '#7C3AED',
    pink: '#DB2777',
    cyan: '#0891B2',
    gold: '#D97706',
    overlay: 'rgba(0, 0, 0, 0.45)',
    shadow: 'rgba(0, 0, 0, 0.07)',
  },
  dark: {
    text: '#F5F5F7',
    textMuted: '#98989F',
    background: '#0C0C0E',
    tint: '#3B82F6',
    primary: '#3B82F6',
    secondary: '#98989F',
    tabBarInactive: '#6E6E73',
    tabBarBackground: '#161618',
    tabBarBorder: 'rgba(255,255,255,0.06)',
    inputBackground: 'rgba(255,255,255,0.06)',
    inputBorder: 'rgba(255,255,255,0.1)',
    cardBackground: '#161618',
    cardBorder: 'rgba(255,255,255,0.06)',
    spaceBackground: '#0C0C0E',
    surface: '#161618',
    surfaceElevated: '#1C1C1E',
    border: 'rgba(255,255,255,0.08)',
    divider: 'rgba(255,255,255,0.06)',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
    cyan: '#06B6D4',
    gold: '#F59E0B',
    overlay: 'rgba(0, 0, 0, 0.65)',
    shadow: 'rgba(0, 0, 0, 0.35)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  // Alias used in a few screens
  xxl: 24,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const Opacity = {
  disabled: 0.5,
  secondary: 0.7,
  tertiary: 0.3,
  hover: 0.8,
};

export const Shadows = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};

// Helper function to convert hex to rgba
export const hexToRgba = (hex: string, opacity: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Helper function for theme-aware colors with opacity
export const getThemeColor = (color: string, opacity: number, colorScheme: 'light' | 'dark' = 'light'): string => {
  if (color.startsWith('#')) {
    return hexToRgba(color, opacity);
  }
  // If it's already an rgba, try to extract and modify
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (rgbaMatch) {
    return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${opacity})`;
  }
  return color;
};


