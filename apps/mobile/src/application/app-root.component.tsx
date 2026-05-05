import { useLocales } from 'expo-localization';
import { StatusBar } from 'expo-status-bar';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppNavigator } from './navigation/app.navigator';
import { StoreProvider } from './providers/store.provider';
import { useRootStore } from './providers/store.provider';
import { isDevelopmentEnvironment } from '../shared/config/environment';
import { radii, spacing, typography } from '../shared/theme/theme';
import { ThemeProvider } from '../shared/theme/theme.provider';

export function AppRoot() {
  return (
    <StoreProvider>
      <AppRootContent />
    </StoreProvider>
  );
}

const AppRootContent = observer(function AppRootContent() {
  const deviceLocales = useLocales();
  const { authStore, i18nStore, themeStore } = useRootStore();
  const colors = themeStore.colors;
  const statusBarStyle =
    !authStore.isInitialized || themeStore.resolvedScheme === 'dark' ? 'light' : 'dark';

  useEffect(() => {
    i18nStore.syncDeviceLocales(deviceLocales);
  }, [deviceLocales, i18nStore]);

  return (
    <ThemeProvider value={{ colors, scheme: themeStore.resolvedScheme }}>
      <View style={styles.shell}>
        <StatusBar style={statusBarStyle} />
        <AppNavigator />
        {isDevelopmentEnvironment ? (
          <View
            pointerEvents="none"
            style={[
              styles.environmentLabel,
              { backgroundColor: colors.accentDark, borderColor: colors.accent },
            ]}
          >
            <Text style={[styles.environmentLabelText, { color: colors.accent }]}>DEV</Text>
          </View>
        ) : null}
      </View>
    </ThemeProvider>
  );
});

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  environmentLabel: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  environmentLabelText: {
    fontSize: typography.micro,
    fontWeight: '900',
  },
});
