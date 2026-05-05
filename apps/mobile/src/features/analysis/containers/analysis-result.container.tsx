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
        specificity: i18nStore.t('analysis.specificity'),
        payoffSpeed: i18nStore.t('analysis.payoffSpeed'),
        curiosity: i18nStore.t('analysis.curiosity'),
        audienceFit: i18nStore.t('analysis.audienceFit'),
        visualTextMatch: i18nStore.t('analysis.visualTextMatch'),
        scrollResistance: i18nStore.t('analysis.scrollResistance'),
        selectedGoals: i18nStore.t('analysis.selectedGoals'),
        verdict: i18nStore.t('analysis.verdict'),
        mainProblem: i18nStore.t('analysis.mainProblem'),
        bestFix: i18nStore.t('analysis.bestFix'),
        tryHooks: i18nStore.t('analysis.tryHooks'),
        firstFrameText: i18nStore.t('analysis.firstFrameText'),
        subscores: i18nStore.t('analysis.subscores'),
        details: i18nStore.t('analysis.details'),
        observations: i18nStore.t('analysis.observations'),
        nextSteps: i18nStore.t('analysis.nextSteps'),
      }}
      goalLabels={goalLabels}
      result={videoStore.analysisResult}
      onBack={navigation.goBack}
    />
  );
});
