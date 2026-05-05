import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import { enableScreens } from 'react-native-screens';

import { useAppTheme } from '../../shared/theme/theme.provider';
import { SplashScreen } from '../components/splash-screen.component';
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
    <NavigationContainer
      key={authStore.isAuthenticated ? 'authenticated-navigation' : 'guest-navigation'}
      theme={navigationTheme}
    >
      {!authStore.isInitialized ? (
        <SplashScreen />
      ) : authStore.isAuthenticated ? (
        <MainNavigator key="authenticated" />
      ) : (
        <AuthNavigator key="guest" />
      )}
    </NavigationContainer>
  );
});
