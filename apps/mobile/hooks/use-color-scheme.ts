import { useColorScheme as useRNColorScheme } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

// For backward compatibility, keep the old hook but use the new context
export function useColorScheme() {
  try {
    const { effectiveTheme } = useTheme();
    return effectiveTheme;
  } catch {
    // Fallback if ThemeProvider is not available
    return useRNColorScheme() ?? 'light';
  }
}


