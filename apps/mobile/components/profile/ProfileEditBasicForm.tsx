import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Spacing, BorderRadius } from '@/constants/theme';

export interface ProfileEditBasicFormProps {
  name: string;
  handle: string;
  occupation: string;
  country: string;
  bio: string;
  colors: Record<string, string>;
  onChangeName: (text: string) => void;
  onChangeHandle: (text: string) => void;
  onChangeOccupation: (text: string) => void;
  onChangeCountry: (text: string) => void;
  onChangeBio: (text: string) => void;
}

export function ProfileEditBasicForm({
  name,
  handle,
  occupation,
  country,
  bio,
  colors,
  onChangeName,
  onChangeHandle,
  onChangeOccupation,
  onChangeCountry,
  onChangeBio,
}: ProfileEditBasicFormProps) {
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
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.cardBorder,
            },
          ]}
          value={country}
          onChangeText={onChangeCountry}
          placeholder="e.g., Italy, United States"
          placeholderTextColor={colors.secondary}
          maxLength={50}
        />
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
});
