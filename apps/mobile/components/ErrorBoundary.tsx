import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional: called when user taps Retry; if not provided, children are remounted. */
  onRetry?: () => void;
  /** Optional: if provided, a "Go home" button is shown that calls this. */
  onGoHome?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  retryKey: number;
}

function ErrorFallback({
  onRetry,
  onGoHome,
}: {
  onRetry: () => void;
  onGoHome?: () => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>
      <Text style={[styles.message, { color: colors.secondary }]}>
        An unexpected error occurred. You can try again or go back to the home screen.
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={onRetry}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text style={styles.primaryButtonText}>Try again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
          onPress={handleGoHome}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go home"
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Go home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, retryKey: 0 };
  }

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  handleRetry = () => {
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      this.setState({ hasError: false, retryKey: this.state.retryKey + 1 });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          onRetry={this.handleRetry}
          onGoHome={this.props.onGoHome}
        />
      );
    }
    return <View key={this.state.retryKey} style={styles.wrapper}>{this.props.children}</View>;
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: Typography.base * 1.4,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  actions: {
    gap: Spacing.md,
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 10,
    minWidth: 160,
    alignItems: 'center',
  },
  primaryButton: {},
  primaryButtonText: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  secondaryButtonText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
});
