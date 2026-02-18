import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Platform, TextInput } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';

interface SchedulePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSchedule: (date: Date) => void;
}

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeInput = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export function SchedulePostModal({ visible, onClose, onSchedule }: SchedulePostModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const initialDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [dateInput, setDateInput] = useState(() => formatDateInput(initialDate));
  const [timeInput, setTimeInput] = useState(() => formatTimeInput(initialDate));

  const handleSchedule = () => {
    if (selectedDate <= new Date()) {
      // Date is in the past
      return;
    }
    haptics.success();
    onSchedule(selectedDate);
    onClose();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleDateChange = (text: string) => {
    setDateInput(text);
    const [year, month, day] = text.split('-').map(Number);
    if (year && month && day) {
      const newDate = new Date(selectedDate);
      newDate.setFullYear(year, month - 1, day);
      setSelectedDate(newDate);
    }
  };

  const handleTimeChange = (text: string) => {
    setTimeInput(text);
    const [hours, minutes] = text.split(':').map(Number);
    if (hours !== undefined && minutes !== undefined) {
      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes);
      setSelectedDate(newDate);
    }
  };

  const isDateValid = selectedDate > new Date();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Schedule Post</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.dateTimeContainer}>
            <View style={[styles.dateTimeButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <View style={styles.dateTimeContent}>
                <Text style={[styles.dateTimeLabel, { color: colors.secondary }]}>Date</Text>
                <TextInput
                  style={[styles.dateTimeInput, { color: colors.text }]}
                  value={dateInput}
                  onChangeText={handleDateChange}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.secondary}
                />
                <Text style={[styles.dateTimeDisplay, { color: colors.secondary }]}>
                  {formatDate(selectedDate)}
                </Text>
              </View>
            </View>

            <View style={[styles.dateTimeButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <View style={styles.dateTimeContent}>
                <Text style={[styles.dateTimeLabel, { color: colors.secondary }]}>Time</Text>
                <TextInput
                  style={[styles.dateTimeInput, { color: colors.text }]}
                  value={timeInput}
                  onChangeText={handleTimeChange}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.secondary}
                />
                <Text style={[styles.dateTimeDisplay, { color: colors.secondary }]}>
                  {formatTime(selectedDate)}
                </Text>
              </View>
            </View>
          </View>

          {!isDateValid && (
            <View style={[styles.warning, { backgroundColor: colors.error + '15' }]}>
              <Ionicons name="warning-outline" size={16} color={colors.error} />
              <Text style={[styles.warningText, { color: colors.error }]}>
                Please select a future date and time
              </Text>
            </View>
          )}

          <View style={[styles.info, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              Your post will be published automatically at the scheduled time
            </Text>
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: colors.divider }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.cardBorder }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.scheduleButton,
              { backgroundColor: isDateValid ? colors.primary : colors.secondary },
            ]}
            onPress={handleSchedule}
            disabled={!isDateValid}
            activeOpacity={0.7}
          >
            <Text style={styles.scheduleButtonText}>Schedule</Text>
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  dateTimeContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  dateTimeContent: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: Typography.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dateTimeInput: {
    fontSize: Typography.sm,
    fontWeight: '500',
    marginTop: 2,
    padding: 0,
  },
  dateTimeDisplay: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.4,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  scheduleButton: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: '600',
  },
});

