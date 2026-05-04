import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { observer } from 'mobx-react-lite';

import { AppStackParamList } from '../../../application/navigation/navigation.types';
import { useRootStore } from '../../../application/providers/store.provider';
import { HookGoal } from '../../../shared/types/video.types';
import { AnalysisResultScreen } from '../components/analysis-result.component';

type Props = NativeStackScreenProps<AppStackParamList, 'AnalysisResult'>;

export const AnalysisResultContainer = observer(function AnalysisResultContainer({ navigation }: Props) {
  const { i18nStore, videoStore } = useRootStore();
  const goalLabels: Record<HookGoal, string> = {
    views: i18nStore.t('goal.views'),
    trust: i18nStore.t('goal.trust'),
    sales: i18nStore.t('goal.sales'),
    education: i18nStore.t('goal.education'),
    comments: i18nStore.t('goal.comments'),
  };

  return (
    <AnalysisResultScreen
      copy={{
        title: i18nStore.t('analysis.title'),
        subtitle: i18nStore.t('analysis.subtitle'),
        empty: i18nStore.t('analysis.empty'),
        back: i18nStore.t('common.back'),
        score: i18nStore.t('analysis.score'),
        clarity: i18nStore.t('analysis.clarity'),
        pace: i18nStore.t('analysis.pace'),
        goalFit: i18nStore.t('analysis.goalFit'),
        selectedGoals: i18nStore.t('analysis.selectedGoals'),
        rewrite: i18nStore.t('analysis.rewrite'),
        firstFrameText: i18nStore.t('analysis.firstFrameText'),
        observations: i18nStore.t('analysis.observations'),
        nextSteps: i18nStore.t('analysis.nextSteps'),
        nextStepOpening: i18nStore.t('analysis.nextStepOpening'),
        nextStepPayoff: i18nStore.t('analysis.nextStepPayoff'),
        nextStepGoal: i18nStore.t('analysis.nextStepGoal'),
        window: i18nStore.t('video.window'),
      }}
      clip={videoStore.preparedClip}
      goalLabels={goalLabels}
      result={videoStore.analysisResult}
      onBack={navigation.goBack}
    />
  );
});
