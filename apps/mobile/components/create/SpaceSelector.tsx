import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Space } from '@/types/post';
import { getSpaceInitials } from '@/lib/utils/spaceUtils';

interface SpaceSelectorProps {
  spaces: Space[];
  selectedSpaces: string[];
  onToggleSpace: (id: string) => void;
}

export function SpaceSelector({ spaces, selectedSpaces, onToggleSpace }: SpaceSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (spaces.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Share to Spaces
        </Text>
        {selectedSpaces.length > 0 && (
          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            {selectedSpaces.length} selected
          </Text>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.spacesList}
      >
        {spaces.map((space) => {
          const isSelected = selectedSpaces.includes(space.id);
          return (
            <TouchableOpacity
              key={space.id}
              style={[
                styles.spaceCard,
                {
                  backgroundColor: isSelected
                    ? colors.tint + '15'
                    : colors.background,
                  borderColor: isSelected ? colors.tint : colors.divider,
                },
              ]}
              onPress={() => onToggleSpace(space.id)}
              activeOpacity={0.7}
            >
              {space.iconImage ? (
                <Image source={{ uri: space.iconImage }} style={styles.spaceIcon} />
              ) : (
                <View
                  style={[
                    styles.spaceIconPlaceholder,
                    { backgroundColor: (space.color || colors.tint) + '20' },
                  ]}
                >
                  <Text style={[styles.spaceIconText, { color: space.color || colors.tint }]}>
                    {getSpaceInitials(space.name)}
                  </Text>
                </View>
              )}
              <Text
                style={[
                  styles.spaceName,
                  { color: colors.text },
                  isSelected && styles.spaceNameSelected,
                ]}
                numberOfLines={1}
              >
                {space.name}
              </Text>
              {isSelected && (
                <View style={[styles.checkBadge, { backgroundColor: colors.tint }]}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  spacesList: {
    gap: Spacing.sm,
  },
  spaceCard: {
    width: 80,
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1.5,
    marginRight: Spacing.sm,
    position: 'relative',
  },
  spaceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: Spacing.xs,
  },
  spaceIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  spaceIconText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  spaceName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  spaceNameSelected: {
    fontWeight: '600',
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
