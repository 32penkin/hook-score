import { makeAutoObservable, runInAction } from 'mobx';

import { ExpoVideoPickerService } from '../../../services/video/expo-video-picker.service';
import { TranslationKey } from '../../../shared/i18n/translations';
import {
  ClipDurationSeconds,
  HookContext,
  HookGoal,
} from '../../../shared/types/video.types';
import { VideoStore } from '../stores/video.store';

type HookContextTextField = Exclude<keyof HookContext, 'goals'>;

export class VideoPrepViewModel {
  durationSeconds: ClipDurationSeconds = 3;
  context: HookContext = this.defaultContext;
  localErrorKey: TranslationKey | null = null;
  isSelectingSource = false;

  private get defaultContext(): HookContext {
    return {
      hookText: '',
      videoDescription: '',
      targetAudience: '',
      goals: ['views'],
    };
  }

  constructor(
    private readonly videoStore: VideoStore,
    private readonly pickerService: ExpoVideoPickerService
  ) {
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

  get todayAnalysisCount() {
    return this.videoStore.todayAnalysisCount;
  }

  get todayAnalysisLimit() {
    return this.videoStore.todayAnalysisLimit;
  }

  get hasReachedDailyAnalysisLimit() {
    return this.videoStore.hasReachedDailyAnalysisLimit;
  }

  get errorKey() {
    return this.localErrorKey;
  }

  get errorMessage() {
    return this.videoStore.error;
  }

  get canAnalyze() {
    return Boolean(
      this.preparedClip &&
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

  async analyzeCurrentVideo() {
    if (this.isSourceLoading || this.isAnalyzing) {
      return false;
    }

    this.localErrorKey = null;

    if (!this.preparedClip) {
      return false;
    }

    if (this.hasReachedDailyAnalysisLimit) {
      this.localErrorKey = 'video.dailyLimitReached';
      return false;
    }

    return this.videoStore.analyzePreparedClip(this.contextSnapshot);
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
      goals: [...this.context.goals],
    };
  }
}
