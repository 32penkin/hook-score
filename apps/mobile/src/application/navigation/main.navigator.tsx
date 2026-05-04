import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AnalysisResultContainer } from '../../features/analysis/containers/analysis-result.container';
import { HistoryContainer } from '../../features/history/containers/history.container';
import { SettingsContainer } from '../../features/settings/containers/settings.container';
import { VideoPrepContainer } from '../../features/video/containers/video-prep.container';

import { AppStackParamList } from './navigation.types';

const AppStack = createNativeStackNavigator<AppStackParamList>();

export function MainNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen component={VideoPrepContainer} name="VideoPrep" />
      <AppStack.Screen component={AnalysisResultContainer} name="AnalysisResult" />
      <AppStack.Screen component={HistoryContainer} name="History" />
      <AppStack.Screen component={SettingsContainer} name="Settings" />
    </AppStack.Navigator>
  );
}
