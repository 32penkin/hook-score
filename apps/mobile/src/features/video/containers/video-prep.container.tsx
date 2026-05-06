import { observer } from 'mobx-react-lite';
import { useEffect, useMemo } from 'react';

import {
  AppStackParamList,
  AuthStackParamList,
} from '../../../application/navigation/navigation.types';
import { useRootStore } from '../../../application/providers/store.provider';
import { VideoAnalyzerUsageScope } from '../../../services/usage/video-analyzer-usage.service';
import { SegmentOption } from '../../../shared/components/segmented-control.component';
import { HookGoal } from '../../../shared/types/video.types';
import { VideoPrepScreen } from '../components/video-prep.component';
import { VideoPrepViewModel } from '../viewModels/video-prep.vm';

type VideoPrepNavigation = {
  navigate: (screen: keyof (AppStackParamList & AuthStackParamList)) => void;
};

type Props = {
  navigation: VideoPrepNavigation;
};

export const VideoPrepContainer = observer(function VideoPrepContainer({ navigation }: Props) {
  const { authStore, i18nStore, services, videoStore } = useRootStore();
  const usageScope: VideoAnalyzerUsageScope = authStore.isAuthenticated
    ? 'authenticated'
    : 'guest';
  const viewModel = useMemo(
    () =>
      new VideoPrepViewModel(
        videoStore,
        services.videoPicker,
        usageScope
      ),
    [services.videoPicker, usageScope, videoStore]
  );

  useEffect(() => {
    void videoStore.loadCurrentDayAnalysisUsage(usageScope);
  }, [usageScope, videoStore]);

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
        settings: authStore.isAuthenticated
          ? i18nStore.t('common.settings')
          : i18nStore.t('auth.login'),
        contextTitle: i18nStore.t('video.contextTitle'),
        dictate: i18nStore.t('common.dictate'),
        dictationPermissionDeniedMessage: i18nStore.t('common.dictationPermissionDeniedMessage'),
        dictationPermissionDeniedTitle: i18nStore.t('common.dictationPermissionDeniedTitle'),
        dictationUnavailableMessage: i18nStore.t('common.dictationUnavailableMessage'),
        dictationUnavailableTitle: i18nStore.t('common.dictationUnavailableTitle'),
        hookText: i18nStore.t('video.hookText'),
        hookTextPlaceholder: i18nStore.t('video.hookTextPlaceholder'),
        description: i18nStore.t('video.description'),
        descriptionPlaceholder: i18nStore.t('video.descriptionPlaceholder'),
        audience: i18nStore.t('video.audience'),
        audiencePlaceholder: i18nStore.t('video.audiencePlaceholder'),
        niche: i18nStore.t('video.niche'),
        nichePlaceholder: i18nStore.t('video.nichePlaceholder'),
        goal: i18nStore.t('video.goal'),
        pickVideo: i18nStore.t('video.pickVideo'),
        repickVideo: i18nStore.t('video.repickVideo'),
        selected: i18nStore.t('video.selected'),
        visualContextAdded: i18nStore.t('video.visualContextAdded'),
        noVideo: i18nStore.t('video.noVideo'),
        sourceLoading: i18nStore.t('video.sourceLoading'),
        ready: i18nStore.t('video.ready'),
        duration: i18nStore.t('video.duration'),
        stopDictation: i18nStore.t('common.stopDictation'),
        analyze: i18nStore.t('video.analyze'),
        todayUsage: authStore.isAuthenticated
          ? i18nStore.t('video.todayUsage')
          : i18nStore.t('video.guestUsage'),
        usageLoading: i18nStore.t('video.usageLoading'),
        dailyLimitReached: authStore.isAuthenticated
          ? i18nStore.t('video.dailyLimitReached')
          : i18nStore.t('video.guestLimitReached'),
        promoCodeTitle: i18nStore.t('video.promoCodeTitle'),
        promoCodeHint: i18nStore.t('video.promoCodeHint'),
        promoCode: i18nStore.t('video.promoCode'),
        promoCodePlaceholder: i18nStore.t('video.promoCodePlaceholder'),
        promoCodeHelp: i18nStore.t('video.promoCodeHelp'),
        promoCodeEmailSubject: i18nStore.t('video.promoCodeEmailSubject'),
        promoCodeEmailBody: i18nStore.t('video.promoCodeEmailBody'),
        redeemPromoCode: i18nStore.t('video.redeemPromoCode'),
        clear: i18nStore.t('common.clear'),
      }}
      canAnalyze={viewModel.canAnalyze}
      canRedeemPromoCode={viewModel.canRedeemPromoCode}
      dictationLocale={i18nStore.locale}
      error={viewModel.errorKey ? i18nStore.t(viewModel.errorKey) : viewModel.errorMessage}
      goalOptions={goalOptions}
      isAnalyzing={viewModel.isAnalyzing}
      isPromoCodeRedeeming={viewModel.isPromoCodeRedeeming}
      isPreparing={viewModel.isSourceLoading}
      isSourceLoading={viewModel.isSourceLoading}
      isUsageLoading={viewModel.isUsageLoading}
      hasReachedDailyAnalysisLimit={viewModel.hasReachedDailyAnalysisLimit}
      preparedClip={viewModel.preparedClip}
      promoCode={viewModel.promoCode}
      promoCodeFeedback={
        viewModel.promoCodeFeedback ? i18nStore.t(viewModel.promoCodeFeedback) : null
      }
      selectedVideo={viewModel.selectedVideo}
      todayAnalysisCount={viewModel.todayAnalysisCount}
      todayAnalysisLimit={viewModel.todayAnalysisLimit}
      userName={
        authStore.isAuthenticated ? authStore.userName : i18nStore.t('auth.guestUser')
      }
      isGuest={!authStore.isAuthenticated}
      onAnalyze={() => {
        void viewModel.analyzeCurrentVideo(i18nStore.locale).then((didAnalyze) => {
          if (didAnalyze) {
            navigation.navigate(
              authStore.isAuthenticated ? 'AnalysisResult' : 'GuestAnalysisResult'
            );
          }
        });
      }}
      onClear={viewModel.clearCurrent}
      onContextChange={viewModel.setContextField}
      onGoalToggle={viewModel.toggleGoal}
      onPromoCodeChange={viewModel.setPromoCode}
      onRedeemPromoCode={viewModel.redeemPromoCode}
      onOpenSettings={() =>
        navigation.navigate(authStore.isAuthenticated ? 'Settings' : 'Auth')
      }
      onPickVideo={viewModel.pickAndPrepareVideo}
    />
  );
});
