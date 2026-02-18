import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThreadMessage } from '@/types/post';

interface ReplyPreviewProps {
  replyingTo: ThreadMessage;
  onCancel: () => void;
}

export function ReplyPreview({ replyingTo, onCancel }: ReplyPreviewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.background,
      borderTopColor: colors.divider,
    }]}>
      <View style={[styles.border, { backgroundColor: colors.primary }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <IconSymbol name="arrow-back" size={14} color={colors.primary} />
          <Text style={[styles.label, { color: colors.primary }]}>
            Replying to {typeof replyingTo?.author?.name === 'string' ? replyingTo.author.name : 'message'}
          </Text>
        </View>
        <View style={styles.messagePreview}>
          {replyingTo?.author?.avatar ? (
            <ExpoImage
              source={{ uri: replyingTo.author.avatar }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {getInitials(replyingTo?.author?.name || 'U')}
              </Text>
            </View>
          )}
          <Text style={[styles.text, { color: colors.secondary }]} numberOfLines={1}>
            {(() => {
              const content = replyingTo?.content;
              if (content && typeof content === 'string' && content.trim().length > 0) {
                return content;
              }
              return replyingTo?.media ? 'Media' : 'Message';
            })()}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        onPress={onCancel} 
        style={styles.cancelButton}
        activeOpacity={0.6}
      >
        <IconSymbol name="close" size={18} color={colors.secondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  border: {
    width: 3,
    borderRadius: 2,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs / 2,
  },
  label: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.xs - 2,
    fontWeight: '700',
  },
  text: {
    fontSize: Typography.sm,
    flex: 1,
  },
  cancelButton: {
    padding: Spacing.xs,
  },
});
