import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { enableScreens } from 'react-native-screens';

import { spacing } from '../../shared/theme/theme';
import { useAppTheme } from '../../shared/theme/theme.provider';
import { useRootStore } from '../providers/store.provider';

import { AuthNavigator } from './auth.navigator';
import { MainNavigator } from './main.navigator';

enableScreens();

export const AppNavigator = observer(function AppNavigator() {
  const { authStore } = useRootStore();
  const { colors } = useAppTheme();

  const navigationTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.background,
      card: colors.background,
      primary: colors.accent,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      {!authStore.isInitialized ? (
        <View style={styles.loadingScreen}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : authStore.isAuthenticated ? (
        <MainNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
});

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
});
