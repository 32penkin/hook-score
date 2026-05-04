import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo } from 'react';

import { AppStackParamList } from '../../../application/navigation/navigation.types';
import { useRootStore } from '../../../application/providers/store.provider';
import { SegmentOption } from '../../../shared/components/segmented-control.component';
import { ClipDurationSeconds, HookGoal } from '../../../shared/types/video.types';
import { VideoPrepScreen } from '../components/video-prep.component';
import { VideoPrepViewModel } from '../viewModels/video-prep.vm';

type Props = NativeStackScreenProps<AppStackParamList, 'VideoPrep'>;

export const VideoPrepContainer = observer(function VideoPrepContainer({ navigation }: Props) {
  const { authStore, i18nStore, services, videoStore } = useRootStore();
  const viewModel = useMemo(
    () =>
      new VideoPrepViewModel(
        videoStore,
        services.videoPicker
      ),
    [services.videoPicker, videoStore]
  );

  useEffect(() => {
    if (authStore.isAuthenticated) {
      void videoStore.loadCurrentDayAnalysisUsage();
    }
  }, [authStore.isAuthenticated, videoStore]);

  const durationOptions: SegmentOption<ClipDurationSeconds>[] = [
    { label: '3s', value: 3 },
    { label: '4s', value: 4 },
    { label: '5s', value: 5 },
  ];

  const goalOptions: SegmentOption<HookGoal>[] = [
    { label: i18nStore.t('goal.views'), value: 'views' },
    { label: i18nStore.t('goal.trust'), value: 'trust' },
    { label: i18nStore.t('goal.sales'), value: 'sales' },
    { label: i18nStore.t('goal.education'), value: 'education' },
    { label: i18nStore.t('goal.comments'), value: 'comments' },
  ];

  return (
    <VideoPrepScreen
      context={viewModel.context}
      copy={{
        title: i18nStore.t('video.title'),
        subtitle: i18nStore.t('video.subtitle'),
        settings: i18nStore.t('common.settings'),
        clipWindow: i18nStore.t('video.clipWindow'),
        contextTitle: i18nStore.t('video.contextTitle'),
        hookText: i18nStore.t('video.hookText'),
        hookTextPlaceholder: i18nStore.t('video.hookTextPlaceholder'),
        description: i18nStore.t('video.description'),
        descriptionPlaceholder: i18nStore.t('video.descriptionPlaceholder'),
        audience: i18nStore.t('video.audience'),
        audiencePlaceholder: i18nStore.t('video.audiencePlaceholder'),
        goal: i18nStore.t('video.goal'),
        pickVideo: i18nStore.t('video.pickVideo'),
        repickVideo: i18nStore.t('video.repickVideo'),
        selected: i18nStore.t('video.selected'),
        noVideo: i18nStore.t('video.noVideo'),
        sourceLoading: i18nStore.t('video.sourceLoading'),
        ready: i18nStore.t('video.ready'),
        file: i18nStore.t('video.file'),
        duration: i18nStore.t('video.duration'),
        analyze: i18nStore.t('video.analyze'),
        todayUsage: i18nStore.t('video.todayUsage'),
        usageLoading: i18nStore.t('video.usageLoading'),
        dailyLimitReached: i18nStore.t('video.dailyLimitReached'),
        clear: i18nStore.t('common.clear'),
      }}
      canAnalyze={viewModel.canAnalyze}
      durationOptions={durationOptions}
      error={viewModel.errorKey ? i18nStore.t(viewModel.errorKey) : viewModel.errorMessage}
      goalOptions={goalOptions}
      isAnalyzing={viewModel.isAnalyzing}
      isPreparing={viewModel.isSourceLoading}
      isSourceLoading={viewModel.isSourceLoading}
      isUsageLoading={viewModel.isUsageLoading}
      hasReachedDailyAnalysisLimit={viewModel.hasReachedDailyAnalysisLimit}
      preparedClip={viewModel.preparedClip}
      selectedDuration={viewModel.durationSeconds}
      selectedVideo={viewModel.selectedVideo}
      todayAnalysisCount={viewModel.todayAnalysisCount}
      todayAnalysisLimit={viewModel.todayAnalysisLimit}
      userName={authStore.userName}
      onAnalyze={() => {
        void viewModel.analyzeCurrentVideo().then((didAnalyze) => {
          if (didAnalyze) {
            navigation.navigate('AnalysisResult');
          }
        });
      }}
      onClear={viewModel.clearCurrent}
      onContextChange={viewModel.setContextField}
      onDurationChange={viewModel.setDuration}
      onGoalToggle={viewModel.toggleGoal}
      onOpenSettings={() => navigation.navigate('Settings')}
      onPickVideo={viewModel.pickAndPrepareVideo}
    />
  );
});
