import { useContext } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { ThemeContext } from '@/contexts/ThemeContext';

// Call hooks unconditionally so order is always the same
export function useColorScheme() {
  const themeContext = useContext(ThemeContext);
  const systemScheme = useRNColorScheme() ?? 'light';
  return themeContext ? themeContext.effectiveTheme : systemScheme;
}


