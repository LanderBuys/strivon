import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '@/constants/theme';
import { COUNTRIES, getCitiesForCountry } from '@/lib/data/locations';

export interface ProfileEditBasicFormProps {
  name: string;
  handle: string;
  occupation: string;
  country: string;
  city: string;
  bio: string;
  colors: Record<string, string>;
  onChangeName: (text: string) => void;
  onChangeHandle: (text: string) => void;
  onChangeOccupation: (text: string) => void;
  onChangeCountry: (text: string) => void;
  onChangeCity: (text: string) => void;
  onChangeBio: (text: string) => void;
}

export function ProfileEditBasicForm({
  name,
  handle,
  occupation,
  country,
  city,
  bio,
  colors,
  onChangeName,
  onChangeHandle,
  onChangeOccupation,
  onChangeCountry,
  onChangeCity,
  onChangeBio,
}: ProfileEditBasicFormProps) {
  const [pickerOpen, setPickerOpen] = useState<'country' | 'city' | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  const cityOptions = useMemo(() => getCitiesForCountry(country), [country]);

  const filteredCountries = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.toLowerCase().includes(q));
  }, [pickerSearch]);

  const filteredCities = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return cityOptions;
    return cityOptions.filter((c) => c.toLowerCase().includes(q));
  }, [cityOptions, pickerSearch]);

  const handleOpenPicker = (type: 'country' | 'city') => {
    setPickerSearch('');
    setPickerOpen(type);
  };

  const handleSelectCountry = (value: string) => {
    onChangeCountry(value);
    onChangeCity('');
    setPickerOpen(null);
    setPickerSearch('');
  };

  const handleSelectCity = (value: string) => {
    onChangeCity(value);
    setPickerOpen(null);
    setPickerSearch('');
  };

  const handleClosePicker = () => {
    setPickerOpen(null);
    setPickerSearch('');
  };

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Name</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.cardBorder,
            },
          ]}
          value={name}
          onChangeText={onChangeName}
          placeholder="Your name"
          placeholderTextColor={colors.secondary}
          maxLength={50}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Handle</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.cardBorder,
            },
          ]}
          value={handle}
          onChangeText={onChangeHandle}
          placeholder="@username"
          placeholderTextColor={colors.secondary}
          maxLength={30}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Occupation</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.cardBorder,
            },
          ]}
          value={occupation}
          onChangeText={onChangeOccupation}
          placeholder="e.g., Trader, Dropshipper, Entrepreneur"
          placeholderTextColor={colors.secondary}
          maxLength={50}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Country</Text>
        <TouchableOpacity
          style={[
            styles.pickerTouchable,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
            },
          ]}
          onPress={() => handleOpenPicker('country')}
          activeOpacity={0.7}
        >
          <Text style={[styles.pickerText, { color: country ? colors.text : colors.secondary }]}>
            {country || 'Select country'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>City</Text>
        <TouchableOpacity
          style={[
            styles.pickerTouchable,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
            },
          ]}
          onPress={() => handleOpenPicker('city')}
          activeOpacity={0.7}
          disabled={!country}
        >
          <Text style={[styles.pickerText, { color: city ? colors.text : colors.secondary }]}>
            {city || (country ? 'Select city' : 'Select country first')}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <View style={styles.bioHeader}>
          <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
          <Text style={[styles.charCount, { color: colors.secondary }]}>
            {bio.length}/160
          </Text>
        </View>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.cardBorder,
            },
          ]}
          value={bio}
          onChangeText={onChangeBio}
          placeholder="Tell us about yourself"
          placeholderTextColor={colors.secondary}
          maxLength={160}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <Modal
        visible={pickerOpen !== null}
        transparent
        animationType="fade"
        onRequestClose={handleClosePicker}
      >
        <Pressable style={styles.modalOverlay} onPress={handleClosePicker}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {pickerOpen === 'country' ? 'Select country' : 'Select city'}
              </Text>
              <TouchableOpacity onPress={handleClosePicker} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={[styles.searchWrap, { borderBottomColor: colors.divider }]}>
              <Ionicons name="search-outline" size={20} color={colors.secondary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text, backgroundColor: colors.surface }]}
                placeholder={pickerOpen === 'country' ? 'Search countries...' : 'Search cities...'}
                placeholderTextColor={colors.secondary}
                value={pickerSearch}
                onChangeText={setPickerSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {pickerOpen === 'country' && (
              <FlatList
                data={filteredCountries}
                keyExtractor={(item) => item}
                style={styles.list}
                ListEmptyComponent={
                  <View style={styles.emptyPicker}>
                    <Text style={[styles.emptyPickerText, { color: colors.secondary }]}>
                      {pickerSearch.trim() ? 'No countries match your search' : 'No countries'}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionRow,
                      item === country && { backgroundColor: colors.primary + '18' },
                    ]}
                    onPress={() => handleSelectCountry(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionText, { color: colors.text }]}>{item}</Text>
                    {item === country && (
                      <Ionicons name="checkmark" size={22} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
            {pickerOpen === 'city' && (
              <FlatList
                data={filteredCities}
                keyExtractor={(item) => item}
                style={styles.list}
                ListEmptyComponent={
                  <View style={styles.emptyPicker}>
                    <Text style={[styles.emptyPickerText, { color: colors.secondary }]}>
                      {pickerSearch.trim() ? 'No cities match your search' : 'No cities listed for this country'}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionRow,
                      item === city && { backgroundColor: colors.primary + '18' },
                    ]}
                    onPress={() => handleSelectCity(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionText, { color: colors.text }]}>{item}</Text>
                    {item === city && (
                      <Ionicons name="checkmark" size={22} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xl,
  },
  field: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    letterSpacing: -0.2,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    minHeight: 48,
  },
  pickerTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  pickerText: {
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.sm,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg + 4,
    borderTopRightRadius: BorderRadius.lg + 4,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  list: {
    maxHeight: 360,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
  },
  optionText: {
    fontSize: 16,
  },
  emptyPicker: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyPickerText: {
    fontSize: 15,
  },
});
