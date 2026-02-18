import React from 'react';
import { Text, StyleSheet, Linking, Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Typography } from '@/constants/theme';

interface FormattedMessageTextProps {
  text: string;
  mentions?: string[];
  color?: string;
}

export function FormattedMessageText({ text, mentions = [], color }: FormattedMessageTextProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const textColor = color || colors.text;
  
  // Ensure text is always a string
  const processedText = typeof text === 'string' ? text : String(text || '');

  // Extract URLs, mentions, and formatting
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const mentionRegex = /@(\w+)/g;
  const boldRegex = /\*\*(.+?)\*\*/g;
  const italicRegex = /_(.+?)_/g;
  const codeRegex = /`(.+?)`/g;

  const parts: Array<{ text: string; type: 'text' | 'url' | 'mention' | 'bold' | 'italic' | 'code' }> = [];
  let lastIndex = 0;

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
      content: match[0],
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

  // Build parts array
  matches.forEach((m) => {
    // Add text before match
    if (m.index > lastIndex) {
      const beforeText = processedText.substring(lastIndex, m.index);
      parts.push({
        text: typeof beforeText === 'string' ? beforeText : String(beforeText || ''),
        type: 'text',
      });
    }

    // Add match
    const matchText = typeof m.content === 'string' ? m.content : String(m.content || '');
    parts.push({
      text: matchText,
      type: m.type as any,
    });

    lastIndex = m.index + m.length;
  });

  // Add remaining text
  if (lastIndex < processedText.length) {
    const remainingText = processedText.substring(lastIndex);
    parts.push({
      text: typeof remainingText === 'string' ? remainingText : String(remainingText || ''),
      type: 'text',
    });
  }

  // If no matches, return plain text
  if (matches.length === 0) {
    return <Text style={[styles.text, { color: textColor }]}>{processedText}</Text>;
  }
  
  // Remove overlapping matches (keep first one)
  const nonOverlappingMatches: typeof matches = [];
  let currentEnd = 0;
  matches.forEach(m => {
    if (m.index >= currentEnd) {
      nonOverlappingMatches.push(m);
      currentEnd = m.index + m.length;
    }
  });
  
  // Rebuild parts with non-overlapping matches
  parts.length = 0;
  lastIndex = 0;
  nonOverlappingMatches.forEach((m) => {
    if (m.index > lastIndex) {
      const beforeText = processedText.substring(lastIndex, m.index);
      parts.push({
        text: typeof beforeText === 'string' ? beforeText : String(beforeText || ''),
        type: 'text',
      });
    }
    const matchText = typeof m.content === 'string' ? m.content : String(m.content || '');
    parts.push({
      text: matchText,
      type: m.type as any,
    });
    lastIndex = m.index + m.length;
  });
  
  if (lastIndex < processedText.length) {
    const remainingText = processedText.substring(lastIndex);
    parts.push({
      text: typeof remainingText === 'string' ? remainingText : String(remainingText || ''),
      type: 'text',
    });
  }

  const handleUrlPress = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  // Ensure parts array is not empty and all parts have valid text
  if (parts.length === 0) {
    return <Text style={[styles.text, { color: textColor }]}>{processedText}</Text>;
  }

  return (
    <Text style={[styles.text, { color: textColor }]}>
      {parts.map((part, index) => {
        const partText = typeof part.text === 'string' ? part.text : String(part.text || '');
        
        switch (part.type) {
          case 'url':
            return (
              <Text
                key={index}
                style={[styles.link, { color: colors.primary }]}
                onPress={() => handleUrlPress(partText)}
              >
                {partText}
              </Text>
            );
          case 'mention':
            return (
              <Text
                key={index}
                style={[styles.mention, { color: colors.primary }]}
              >
                {partText}
              </Text>
            );
          case 'bold':
            return (
              <Text key={index} style={styles.bold}>
                {partText}
              </Text>
            );
          case 'italic':
            return (
              <Text key={index} style={styles.italic}>
                {partText}
              </Text>
            );
          case 'code':
            return (
              <Text key={index} style={[styles.code, { backgroundColor: colors.spaceBackground }]}>
                {partText}
              </Text>
            );
          default:
            return <Text key={index}>{partText}</Text>;
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



























