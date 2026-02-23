import { Platform } from 'react-native';

/** Offset for KeyboardAvoidingView so the focused input stays visible. Tune per screen if needed. */
export const KEYBOARD_VERTICAL_OFFSET = Platform.select({
  ios: 0,
  android: 0,
  default: 0,
});
