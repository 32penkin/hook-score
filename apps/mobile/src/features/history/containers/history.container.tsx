import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo } from 'react';

import { AppStackParamList } from '../../../application/navigation/navigation.types';
import { useRootStore } from '../../../application/providers/store.provider';
import { HookGoal } from '../../../shared/types/video.types';
import { HistoryScreen } from '../components/history.component';
import { HistoryViewModel } from '../viewModels/history.vm';

type Props = NativeStackScreenProps<AppStackParamList, 'History'>;

export const HistoryContainer = observer(function HistoryContainer({ navigation }: Props) {
  const { i18nStore, videoStore } = useRootStore();
  const viewModel = useMemo(() => new HistoryViewModel(videoStore), [videoStore]);

  useEffect(() => {
    void viewModel.load();
  }, [viewModel]);

  const goalLabels: Record<HookGoal, string> = {
    views: i18nStore.t('goal.views'),
    trust: i18nStore.t('goal.trust'),
    sales: i18nStore.t('goal.sales'),
    education: i18nStore.t('goal.education'),
    comments: i18nStore.t('goal.comments'),
  };

  return (
    <HistoryScreen
      copy={{
        title: i18nStore.t('history.title'),
        subtitle: i18nStore.t('history.subtitle'),
        empty: i18nStore.t('history.empty'),
        back: i18nStore.t('common.back'),
        itemGoal: i18nStore.t('history.itemGoal'),
        loading: i18nStore.t('history.loading'),
        score: i18nStore.t('analysis.score'),
        bestFix: i18nStore.t('analysis.bestFix'),
      }}
      error={viewModel.errorMessage}
      goalLabels={goalLabels}
      isLoading={viewModel.isLoading}
      records={viewModel.records}
      onBack={navigation.goBack}
      onOpenRecord={(record) => navigation.push('AnalysisResult', { historyItemId: record.id })}
    />
  );
});
