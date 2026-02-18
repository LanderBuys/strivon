import { View, Text, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

interface ReadReceiptsProps {
  readBy?: string[]; // User IDs who have read the message
  totalMembers?: number; // Total members in the conversation
  showCount?: boolean;
  maxAvatars?: number;
}

export function ReadReceipts({ readBy = [], totalMembers, showCount = true, maxAvatars = 3 }: ReadReceiptsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!readBy || readBy.length === 0) {
    return (
      <View style={styles.container}>
        <Ionicons name="checkmark" size={12} color={colors.secondary} />
        <Text style={[styles.statusText, { color: colors.secondary }]}>Sent</Text>
      </View>
    );
  }

  const displayAvatars = readBy.slice(0, maxAvatars);
  const remainingCount = readBy.length - maxAvatars;

  return (
    <View style={styles.container}>
      <View style={styles.avatarsContainer}>
        {displayAvatars.map((userId, index) => (
          <View
            key={userId}
            style={[
              styles.avatarWrapper,
              {
                marginLeft: index > 0 ? -8 : 0,
                borderColor: colors.background,
              },
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primary + '40' }]}>
              <Ionicons name="person" size={10} color={colors.primary} />
            </View>
          </View>
        ))}
        {remainingCount > 0 && (
          <View
            style={[
              styles.avatarWrapper,
              styles.moreAvatars,
              {
                marginLeft: -8,
                borderColor: colors.background,
                backgroundColor: colors.secondary + '40',
              },
            ]}
          >
            <Text style={[styles.moreText, { color: colors.text }]}>+{remainingCount}</Text>
          </View>
        )}
      </View>
      {showCount && (
        <Text style={[styles.statusText, { color: colors.primary }]}>
          {readBy.length}{totalMembers ? `/${totalMembers}` : ''} read
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 4,
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreAvatars: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 8,
    fontWeight: '600',
  },
  statusText: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
});



