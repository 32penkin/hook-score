import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '../theme/theme';
import { useAppTheme } from '../theme/theme.provider';

type ScreenContainerProps = PropsWithChildren<{
  scroll?: boolean;
}>;

export function ScreenContainer({ children, scroll = true }: ScreenContainerProps) {
  const { colors } = useAppTheme();
  const content = scroll ? (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.staticContent}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  staticContent: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.lg,
  },
});
