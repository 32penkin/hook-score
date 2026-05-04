import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthContainer } from '../../features/auth/containers/auth.container';

import { AuthStackParamList } from './navigation.types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen component={AuthContainer} name="Auth" />
    </AuthStack.Navigator>
  );
}
