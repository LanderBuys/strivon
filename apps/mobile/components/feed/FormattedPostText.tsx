import React from 'react';
import { Text, StyleSheet, Linking, TouchableOpacity, Platform, type TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Typography } from '@/constants/theme';

interface FormattedPostTextProps {
  text: string;
  color?: string;
  onMentionPress?: (handle: string) => void;
  onHashtagPress?: (hashtag: string) => void;
  style?: TextStyle;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

export function FormattedPostText({ 
  text, 
  color,
  onMentionPress,
  onHashtagPress,
  style,
  numberOfLines,
  ellipsizeMode,
}: FormattedPostTextProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const textColor = color || colors.text;

  // Extract URLs, mentions, hashtags, and formatting
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const mentionRegex = /@(\w+)/g;
  const hashtagRegex = /#(\w+)/g;
  const boldRegex = /\*\*(.+?)\*\*/g;
  const italicRegex = /_(.+?)_/g;
  const codeRegex = /`(.+?)`/g;

  const parts: Array<{ text: string; type: 'text' | 'url' | 'mention' | 'hashtag' | 'bold' | 'italic' | 'code' }> = [];
  let lastIndex = 0;
  let processedText = text;

  // Find all matches
  const matches: Array<{ index: number; length: number; type: string; content: string }> = [];

  // URLs
  let match;
  while ((match = urlRegex.exec(processedText)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'url',
      content: match[0],
    });
  }

  // Mentions
  while ((match = mentionRegex.exec(processedText)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'mention',
      content: match[1], // Just the handle without @
    });
  }

  // Hashtags
  while ((match = hashtagRegex.exec(processedText)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'hashtag',
      content: match[1], // Just the tag without #
    });
  }

  // Bold
  while ((match = boldRegex.exec(processedText)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'bold',
      content: match[1],
    });
  }

  // Italic
  while ((match = italicRegex.exec(processedText)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'italic',
      content: match[1],
    });
  }

  // Code
  while ((match = codeRegex.exec(processedText)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'code',
      content: match[1],
    });
  }

  // Sort matches by index
  matches.sort((a, b) => a.index - b.index);

  // Remove overlapping matches (keep first one)
  const nonOverlappingMatches: typeof matches = [];
  let currentEnd = 0;
  matches.forEach(m => {
    if (m.index >= currentEnd) {
      nonOverlappingMatches.push(m);
      currentEnd = m.index + m.length;
    }
  });

  // Build parts array
  lastIndex = 0;
  nonOverlappingMatches.forEach((m) => {
    if (m.index > lastIndex) {
      parts.push({
        text: processedText.substring(lastIndex, m.index),
        type: 'text',
      });
    }
    parts.push({
      text: m.type === 'bold' || m.type === 'italic' || m.type === 'code' ? m.content : m.content,
      type: m.type as any,
    });
    lastIndex = m.index + m.length;
  });

  if (lastIndex < processedText.length) {
    parts.push({
      text: processedText.substring(lastIndex),
      type: 'text',
    });
  }

  // If no matches, return plain text
  if (matches.length === 0) {
    return (
      <Text
        style={[styles.text, { color: textColor }, style]}
        numberOfLines={numberOfLines}
        ellipsizeMode={ellipsizeMode}
      >
        {text}
      </Text>
    );
  }

  const handleUrlPress = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  const handleMentionPress = (handle: string) => {
    if (onMentionPress) {
      onMentionPress(handle);
    } else {
      // Default: navigate to profile
      router.push(`/profile/${handle.replace('@', '')}`);
    }
  };

  const handleHashtagPress = (hashtag: string) => {
    if (onHashtagPress) {
      onHashtagPress(hashtag);
    } else {
      // Default: navigate to search
      router.push({
        pathname: '/search-results',
        params: { query: `#${hashtag}` },
      });
    }
  };

  return (
    <Text
      style={[styles.text, { color: textColor }, style]}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
    >
      {parts.map((part, index) => {
        switch (part.type) {
          case 'url':
            return (
              <Text
                key={index}
                style={[styles.link, { color: colors.primary }]}
                onPress={() => handleUrlPress(part.text)}
              >
                {part.text}
              </Text>
            );
          case 'mention':
            return (
              <Text
                key={index}
                style={[styles.mention, { color: colors.primary }]}
                onPress={() => handleMentionPress(part.text)}
              >
                @{part.text}
              </Text>
            );
          case 'hashtag':
            return (
              <Text
                key={index}
                style={[styles.hashtag, { color: colors.primary }]}
                onPress={() => handleHashtagPress(part.text)}
              >
                #{part.text}
              </Text>
            );
          case 'bold':
            return (
              <Text key={index} style={styles.bold}>
                {part.text}
              </Text>
            );
          case 'italic':
            return (
              <Text key={index} style={styles.italic}>
                {part.text}
              </Text>
            );
          case 'code':
            return (
              <Text key={index} style={[styles.code, { backgroundColor: colors.spaceBackground }]}>
                {part.text}
              </Text>
            );
          default:
            return <Text key={index}>{part.text}</Text>;
        }
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: Typography.base,
    lineHeight: Typography.base * 1.5,
    fontWeight: '400',
    letterSpacing: -0.15,
  },
  link: {
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  mention: {
    fontWeight: '600',
  },
  hashtag: {
    fontWeight: '600',
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: Typography.sm,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
