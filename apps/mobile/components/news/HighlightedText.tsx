import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface HighlightedTextProps {
  text: string;
  style?: any;
  numberOfLines?: number;
}

// Business and financial keywords to highlight

// Extract important keywords from text
const extractKeywords = (text: string): string[] => {
  const keywords: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Business keywords
  const businessTerms = [
    'startup', 'funding', 'investment', 'investor', 'valuation', 'revenue', 'profit',
    'ipo', 'vc', 'venture capital', 'series a', 'series b', 'unicorn', 'acquisition',
    'merger', 'stock', 'trading', 'market', 'shares', 'equity', 'debt', 'earnings',
    'ai', 'artificial intelligence', 'blockchain', 'crypto', 'bitcoin', 'nft',
  ];
  
  businessTerms.forEach(term => {
    if (lowerText.includes(term)) {
      keywords.push(term);
    }
  });
  
  return keywords;
};

export function HighlightedText({ text, style, numberOfLines }: HighlightedTextProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  if (!text || text.trim().length === 0) {
    return null;
  }

  // Clean up the text (remove [Removed] markers and truncation indicators)
  let cleanText = text
    .replace(/\[Removed\]/g, '')
    .replace(/\[.*?\]/g, '') // Remove any [bracketed] content
    .replace(/…\s*$/, '') // Remove trailing ellipsis
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Remove common truncation patterns (like "1800 car" at the end which might be character count)
  // Check if text ends with a pattern like "number word" which might be truncation
  const truncationPattern = /\s+\d+\s+\w+\s*$/;
  if (truncationPattern.test(cleanText)) {
    // Remove the last few words if they look like truncation
    const words = cleanText.split(/\s+/);
    if (words.length > 3) {
      const lastWords = words.slice(-2).join(' ');
      // If last words match pattern like "1800 car", remove them
      if (/\d+\s+\w+/.test(lastWords)) {
        cleanText = words.slice(0, -2).join(' ');
      }
    }
  }
  
  // Remove any remaining incomplete sentences at the end
  if (cleanText.length > 0 && !cleanText.match(/[.!?]\s*$/)) {
    // If doesn't end with punctuation, try to find last complete sentence
    const lastSentenceEnd = Math.max(
      cleanText.lastIndexOf('.'),
      cleanText.lastIndexOf('!'),
      cleanText.lastIndexOf('?')
    );
    if (lastSentenceEnd > cleanText.length * 0.7) {
      // If last sentence end is in last 30% of text, use everything up to that point
      cleanText = cleanText.substring(0, lastSentenceEnd + 1);
    }
  }

  // Find all matches
  const matches: Array<{ index: number; length: number; text: string; type: 'keyword' | 'number' | 'currency' }> = [];
  
  // Match financial numbers (currency)
  const numberPattern = /\$[\d,]+\.?\d*\s*(?:million|billion|trillion|M|B|T)?/gi;
  let match: RegExpExecArray | null;
  numberPattern.lastIndex = 0;
  while ((match = numberPattern.exec(cleanText)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      text: match[0],
      type: 'currency',
    });
    // Prevent infinite loop
    if (match.index === numberPattern.lastIndex) {
      numberPattern.lastIndex++;
    }
  }

  // Match percentages
  const percentPattern = /\d+\.?\d*%/g;
  percentPattern.lastIndex = 0;
  while ((match = percentPattern.exec(cleanText)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      text: match[0],
      type: 'number',
    });
    // Prevent infinite loop
    if (match.index === percentPattern.lastIndex) {
      percentPattern.lastIndex++;
    }
  }
  
  // Match large numbers with units (million, billion, etc.)
  const largeNumberPattern = /\b\d+\.?\d*\s*(?:million|billion|trillion|M|B|T)\b/gi;
  largeNumberPattern.lastIndex = 0;
  while ((match = largeNumberPattern.exec(cleanText)) !== null) {
    // Check if not already matched as currency
    const isOverlapping = matches.some(m => 
      match!.index >= m.index && match!.index < m.index + m.length
    );
    if (!isOverlapping) {
      matches.push({
        index: match.index,
        length: match[0].length,
        text: match[0],
        type: 'number',
      });
    }
    // Prevent infinite loop
    if (match.index === largeNumberPattern.lastIndex) {
      largeNumberPattern.lastIndex++;
    }
  }

  // Match business keywords - order matters (longer terms first)
  // Using lowercase for case-insensitive matching
  const keywordTerms = [
    // Multi-word terms first (to avoid partial matches)
    'artificial intelligence', 'venture capital', 'stock market', 'series a', 'series b', 'series c',
    'p/e ratio', 'pe ratio', 'bull market', 'bear market', 'seed round', 'angel investor',
    'machine learning', 'initial public offering', 'price to earnings',
    // Single words - common business terms
    'ipo', 'vc', 'pe', 'roi', 'eps', 'startup', 'startups', 'unicorn', 'funding', 'investment', 
    'investments', 'revenue', 'profit', 'profits', 'earnings', 'valuation', 'valuations',
    'trading', 'ai', 'blockchain', 'cryptocurrency', 'bitcoin', 'ethereum', 'acquisition', 
    'acquisitions', 'merger', 'mergers', 'nasdaq', 'nyse', 'dividend', 'dividends', 'stock', 
    'stocks', 'share', 'shares', 'equity', 'debt', 'investor', 'investors', 'loss', 'losses',
    'ebitda', 'margin', 'margins', 'growth', 'expansion', 'scaling', 'pivot', 'nft', 'web3', 
    'metaverse', 'crypto', 'bonds', 'securities', 'market', 'markets', 'company', 'companies',
    'corporation', 'business', 'enterprise', 'firm', 'firms', 'bank', 'banks', 'finance',
    'financial', 'economy', 'economic', 'gdp', 'inflation', 'deflation', 'recession',
  ];

  keywordTerms.forEach(term => {
    // Escape special regex characters
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Use word boundaries for single words, but allow spaces for multi-word terms
    const pattern = term.includes(' ') 
      ? `(${escapedTerm})`  // Multi-word: no word boundaries
      : `\\b(${escapedTerm})\\b`;  // Single word: use word boundaries
    
    const regex = new RegExp(pattern, 'gi');
    // Reset regex lastIndex to avoid issues with global regex
    regex.lastIndex = 0;
    
    while ((match = regex.exec(cleanText)) !== null) {
      // Check if not already matched
      const isOverlapping = matches.some(m => 
        match!.index >= m.index && match!.index < m.index + m.length
      );
      if (!isOverlapping) {
        matches.push({
          index: match.index,
          length: match[0].length,
          text: match[0],
          type: 'keyword',
        });
      }
      
      // Prevent infinite loop if regex doesn't advance
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }
  });

  // Sort matches by index
  matches.sort((a, b) => a.index - b.index);

  // Remove overlapping matches (keep first)
  const nonOverlapping: typeof matches = [];
  let currentEnd = 0;
  matches.forEach(m => {
    if (m.index >= currentEnd) {
      nonOverlapping.push(m);
      currentEnd = m.index + m.length;
    }
  });

  // Build parts array
  const parts: Array<{ text: string; highlighted: boolean; type?: string }> = [];
  let lastIndex = 0;

  nonOverlapping.forEach(m => {
    // Add text before match
    if (m.index > lastIndex) {
      parts.push({
        text: cleanText.substring(lastIndex, m.index),
        highlighted: false,
      });
    }

    // Add highlighted match
    parts.push({
      text: m.text,
      highlighted: true,
      type: m.type,
    });

    lastIndex = m.index + m.length;
  });

  // Add remaining text
  if (lastIndex < cleanText.length) {
    parts.push({
      text: cleanText.substring(lastIndex),
      highlighted: false,
    });
  }

  // If no matches, return plain text
  if (parts.length === 0) {
    parts.push({ text: cleanText, highlighted: false });
  }
  
  // Debug: log if we have matches
  if (__DEV__ && nonOverlapping.length > 0) {
    console.log('HighlightedText: Found', nonOverlapping.length, 'matches in text');
  }

  return (
    <Text 
      style={[styles.text, style, { color: colors.text }]}
      numberOfLines={numberOfLines}
    >
      {parts.map((part, index) => {
        if (part.highlighted) {
          const highlightColor = 
            part.type === 'currency' ? colors.success :
            part.type === 'number' ? colors.info :
            colors.primary;
          
          return (
            <Text
              key={index}
              style={[
                styles.highlighted,
                {
                  backgroundColor: highlightColor + '30', // More visible background
                  color: highlightColor,
                  fontWeight: '700', // Bolder text
                },
              ]}
            >
              {part.text}
            </Text>
          );
        }
        return <Text key={index}>{part.text}</Text>;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: Typography.base,
    lineHeight: Typography.base * 1.5,
  },
  highlighted: {
    paddingHorizontal: 3,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '700',
  },
});
