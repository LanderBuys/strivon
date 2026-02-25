import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';

interface LocationPickerProps {
  location?: string;
  onLocationChange: (location: string | undefined) => void;
}

export function LocationPicker({ location, onLocationChange }: LocationPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [showPicker, setShowPicker] = useState(false);

  const handleRemoveLocation = () => {
    haptics.light();
    onLocationChange(undefined);
  };

  const handleSelectLocation = (loc: string) => {
    haptics.light();
    onLocationChange(loc);
    setShowPicker(false);
  };

  // Mock locations - in real app, this would use geolocation API
  const mockLocations = [
    'San Francisco, CA',
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Boston, MA',
    'Seattle, WA',
    'Austin, TX',
    'Denver, CO',
    'Miami, FL',
    'London, UK',
    'Berlin, Germany',
    'Toronto, Canada',
    'Sydney, Australia',
    'Remote',
  ];

  if (location) {
    return (
      <View style={[styles.container, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
        <Ionicons name="location" size={16} color={colors.primary} />
        <Text style={[styles.locationText, { color: colors.primary }]} numberOfLines={1}>
          {location}
        </Text>
        <TouchableOpacity
          onPress={handleRemoveLocation}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.addButton, { borderColor: colors.cardBorder }]}
        onPress={() => {
          haptics.light();
          setShowPicker(true);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="location-outline" size={18} color={colors.secondary} />
        <Text style={[styles.addButtonText, { color: colors.secondary }]}>Add Location</Text>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Location</Text>
            <TouchableOpacity
              onPress={() => setShowPicker(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.locationsList}>
            {mockLocations.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[styles.locationItem, { borderBottomColor: colors.divider }]}
                onPress={() => handleSelectLocation(loc)}
                activeOpacity={0.7}
              >
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={[styles.locationItemText, { color: colors.text }]}>{loc}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  locationText: {
    flex: 1,
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
  },
  locationsList: {
    flex: 1,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  locationItemText: {
    flex: 1,
    fontSize: Typography.base,
  },
});



