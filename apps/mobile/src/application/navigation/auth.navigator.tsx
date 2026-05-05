import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthContainer } from '../../features/auth/containers/auth.container';
import { AnalysisResultContainer } from '../../features/analysis/containers/analysis-result.container';
import { VideoPrepContainer } from '../../features/video/containers/video-prep.container';

import { AuthStackParamList } from './navigation.types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <AuthStack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
      <AuthStack.Screen component={AuthContainer} name="Auth" />
      <AuthStack.Screen component={VideoPrepContainer} name="GuestVideoPrep" />
      <AuthStack.Screen component={AnalysisResultContainer} name="GuestAnalysisResult" />
    </AuthStack.Navigator>
  );
}
