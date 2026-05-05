import { makeAutoObservable, runInAction } from 'mobx';

import { ExpoVideoPickerService } from '../../../services/video/expo-video-picker.service';
import { VideoAnalyzerUsageScope } from '../../../services/usage/video-analyzer-usage.service';
import { Locale, TranslationKey } from '../../../shared/i18n/translations';
import {
  ClipDurationSeconds,
  HookContext,
  HookGoal,
} from '../../../shared/types/video.types';
import { VideoStore } from '../stores/video.store';

type HookContextTextField = Exclude<keyof HookContext, 'goals'>;

const PROMO_CODE_LENGTH = 16;

const normalizePromoCode = (value: string) =>
  value.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, PROMO_CODE_LENGTH);

const formatPromoCode = (value: string) =>
  normalizePromoCode(value).replace(/(.{4})(?=.)/g, '$1-');

export class VideoPrepViewModel {
  durationSeconds: ClipDurationSeconds = 3;
  context: HookContext = this.defaultContext;
  promoCode = '';
  promoCodeFeedbackKey: TranslationKey | null = null;
  localErrorKey: TranslationKey | null = null;
  isSelectingSource = false;

  private get defaultContext(): HookContext {
    return {
      hookText: '',
      videoDescription: '',
      targetAudience: '',
      niche: '',
      firstFrameContext: '',
      goals: ['views'],
    };
  }

  constructor(
    private readonly videoStore: VideoStore,
    private readonly pickerService: ExpoVideoPickerService,
    private readonly usageScope: VideoAnalyzerUsageScope
  ) {
    this.videoStore.setAnalysisUsageScope(usageScope);
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get selectedVideo() {
    return this.videoStore.selectedVideo;
  }

  get preparedClip() {
    return this.videoStore.preparedClip;
  }

  get isPreparing() {
    return this.videoStore.isPreparing;
  }

  get isSourceLoading() {
    return this.isSelectingSource || this.isPreparing;
  }

  get isAnalyzing() {
    return this.videoStore.isAnalyzing;
  }

  get isUsageLoading() {
    return this.videoStore.isUsageLoading;
  }

  get isPromoCodeRedeeming() {
    return this.videoStore.isPromoCodeRedeeming;
  }

  get todayAnalysisCount() {
    return this.videoStore.todayAnalysisCount;
  }

  get todayAnalysisLimit() {
    return this.videoStore.todayAnalysisLimit;
  }

  get hasReachedDailyAnalysisLimit() {
    return this.videoStore.hasReachedDailyAnalysisLimit;
  }

  get canRedeemPromoCode() {
    return Boolean(
      this.usageScope === 'authenticated' &&
        this.hasReachedDailyAnalysisLimit &&
        normalizePromoCode(this.promoCode).length === PROMO_CODE_LENGTH &&
        !this.isSourceLoading &&
        !this.isAnalyzing &&
        !this.isUsageLoading &&
        !this.isPromoCodeRedeeming
    );
  }

  get promoCodeFeedback() {
    return this.promoCodeFeedbackKey;
  }

  get errorKey() {
    return this.localErrorKey;
  }

  get errorMessage() {
    return this.videoStore.error;
  }

  get canAnalyze() {
    return Boolean(
      this.context.hookText.trim() &&
        this.context.videoDescription.trim() &&
        this.videoStore.hasLoadedCurrentDayAnalysisUsage &&
        !this.isSourceLoading &&
        !this.isAnalyzing &&
        !this.isUsageLoading &&
        !this.hasReachedDailyAnalysisLimit
    );
  }

  setDuration(durationSeconds: ClipDurationSeconds) {
    if (this.isSourceLoading || this.isAnalyzing) {
      return;
    }

    this.durationSeconds = durationSeconds;
    void this.prepareCurrentVideo();
  }

  setContextField(field: HookContextTextField, value: string) {
    if (this.isSourceLoading || this.isAnalyzing) {
      return;
    }

    this.context = {
      ...this.context,
      [field]: value,
    };
  }

  setPromoCode(value: string) {
    if (this.isAnalyzing || this.isPromoCodeRedeeming) {
      return;
    }

    this.promoCode = formatPromoCode(value);
    this.promoCodeFeedbackKey = null;
  }

  toggleGoal(goal: HookGoal) {
    if (this.isSourceLoading || this.isAnalyzing) {
      return;
    }

    const selected = this.context.goals.includes(goal);

    this.context = {
      ...this.context,
      goals: selected
        ? this.context.goals.filter((currentGoal) => currentGoal !== goal)
        : [...this.context.goals, goal],
    };
  }

  async analyzeCurrentVideo(outputLocale: Locale = 'en') {
    if (this.isSourceLoading || this.isAnalyzing) {
      return false;
    }

    this.localErrorKey = null;

    if (!this.contextSnapshot.hookText || !this.contextSnapshot.videoDescription) {
      return false;
    }

    if (this.hasReachedDailyAnalysisLimit) {
      this.localErrorKey =
        this.usageScope === 'guest' ? 'video.guestLimitReached' : 'video.dailyLimitReached';
      return false;
    }

    return this.videoStore.analyzeHook(this.contextSnapshot, this.usageScope, outputLocale);
  }

  async redeemPromoCode() {
    if (this.usageScope !== 'authenticated' || this.isPromoCodeRedeeming) {
      return false;
    }

    this.promoCodeFeedbackKey = null;
    const normalizedCode = normalizePromoCode(this.promoCode);

    if (normalizedCode.length !== PROMO_CODE_LENGTH) {
      this.promoCodeFeedbackKey = 'video.promoCodeFormatError';
      return false;
    }

    const didRedeem = await this.videoStore.redeemPromoCode(normalizedCode);

    runInAction(() => {
      this.promoCodeFeedbackKey = didRedeem
        ? 'video.promoCodeRedeemed'
        : 'video.promoCodeRejected';

      if (didRedeem) {
        this.promoCode = '';
      }
    });

    return didRedeem;
  }

  async pickAndPrepareVideo() {
    if (this.isSourceLoading || this.isAnalyzing) {
      return;
    }

    this.localErrorKey = null;
    this.isSelectingSource = true;

    try {
      const video = await this.pickerService.pickVideo();
      if (!video) {
        return;
      }

      this.videoStore.setSelectedVideo(video);
      await this.prepareCurrentVideo();
    } catch (error) {
      const errorKey =
        error instanceof Error && error.message === 'MEDIA_LIBRARY_PERMISSION_DENIED'
          ? 'video.permissionDenied'
          : 'video.prepareFailed';

      runInAction(() => {
        this.localErrorKey = errorKey;
      });
    } finally {
      runInAction(() => {
        this.isSelectingSource = false;
      });
    }
  }

  clearCurrent() {
    if (this.isSourceLoading || this.isAnalyzing) {
      return;
    }

    this.durationSeconds = 3;
    this.context = this.defaultContext;
    this.videoStore.clearCurrent();
    this.localErrorKey = null;
  }

  async prepareCurrentVideo() {
    if (!this.selectedVideo) {
      return;
    }

    await this.videoStore.prepareSelectedVideo(
      this.durationSeconds,
      0,
      this.contextSnapshot
    );
  }

  get contextSnapshot(): HookContext {
    return {
      hookText: this.context.hookText.trim(),
      videoDescription: this.context.videoDescription.trim(),
      targetAudience: this.context.targetAudience.trim(),
      niche: this.context.niche.trim(),
      firstFrameContext: this.context.firstFrameContext.trim(),
      goals: [...this.context.goals],
    };
  }
}
