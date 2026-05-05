import { makeAutoObservable, runInAction } from 'mobx';

import {
  VIDEO_ANALYZER_DAILY_LIMIT,
  VIDEO_ANALYZER_DAILY_LIMIT_ERROR_MESSAGE,
  VideoAnalyzerDailyUsage,
  VideoAnalyzerHistoryItem,
  VideoAnalyzerUsageService,
} from '../../../services/usage/video-analyzer-usage.service';
import { VideoAnalyzerClient } from '../../../services/analysis/video-analyzer.client';
import { stringifyForLog } from '../../../services/api/api-logger';
import { VideoAudioExtractionService } from '../../../services/video/video-audio-extraction.service';
import { VideoFrameExtractionService } from '../../../services/video/video-frame-extraction.service';
import { VideoPreparationService } from '../../../services/video/video-preparation.service';
import {
  ClipDurationSeconds,
  HookAnalysisResult,
  HookContext,
  PreparedClipRecord,
  PreparedVideoClip,
  VideoAsset,
} from '../../../shared/types/video.types';
import { isDevelopmentEnvironment } from '../../../shared/config/environment';

const logDebug = (event: string, payload?: Record<string, unknown>) => {
  if (isDevelopmentEnvironment) {
    console.log(`[VideoStore] ${event} ${stringifyForLog(payload ?? {})}`);
  }
};

const logError = (event: string, error: unknown) => {
  console.error(`[VideoStore] ${event} ${stringifyForLog(getErrorLogPayload(error))}`);
};

const getErrorLogPayload = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (error && typeof error === 'object') {
    return { ...(error as Record<string, unknown>) };
  }

  return { error };
};

export class VideoStore {
  selectedVideo: VideoAsset | null = null;
  preparedClip: PreparedVideoClip | null = null;
  analysisResult: HookAnalysisResult | null = null;
  dailyAnalysisUsage: VideoAnalyzerDailyUsage | null = null;
  analysisHistory: VideoAnalyzerHistoryItem[] = [];
  history: PreparedClipRecord[] = [];
  isPreparing = false;
  isAnalyzing = false;
  isUsageLoading = false;
  isHistoryLoading = false;
  error: string | null = null;

  constructor(
    private readonly preparationService: VideoPreparationService,
    private readonly analyzerUsageService: VideoAnalyzerUsageService,
    private readonly analyzerClient: VideoAnalyzerClient,
    private readonly frameExtractionService: VideoFrameExtractionService,
    private readonly audioExtractionService: VideoAudioExtractionService
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get todayAnalysisCount() {
    return this.dailyAnalysisUsage?.analysisCount ?? 0;
  }

  get todayAnalysisLimit() {
    return VIDEO_ANALYZER_DAILY_LIMIT;
  }

  get hasLoadedCurrentDayAnalysisUsage() {
    return this.dailyAnalysisUsage !== null;
  }

  get hasReachedDailyAnalysisLimit() {
    return this.todayAnalysisCount >= this.todayAnalysisLimit;
  }

  setSelectedVideo(video: VideoAsset | null) {
    this.selectedVideo = video;
    if (!video) {
      this.preparedClip = null;
      this.analysisResult = null;
    }
  }

  async prepareSelectedVideo(
    durationSeconds: ClipDurationSeconds,
    windowStartMs: number,
    context: HookContext
  ) {
    if (!this.selectedVideo) {
      return;
    }

    this.isPreparing = true;
    this.error = null;

    try {
      const clip = this.preparationService.prepareOpeningClip({
        asset: this.selectedVideo,
        durationSeconds,
        windowStartMs,
      });

      runInAction(() => {
        this.preparedClip = clip;
        this.analysisResult = null;
        const nextRecord = { id: clip.id, clip, context };
        const [, ...rest] = this.history;
        this.history =
          this.history[0]?.clip.sourceUri === clip.sourceUri
            ? [nextRecord, ...rest]
            : [nextRecord, ...this.history].slice(0, 12);
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Video preparation failed';
      });
    } finally {
      runInAction(() => {
        this.isPreparing = false;
      });
    }
  }

  clearCurrent() {
    this.selectedVideo = null;
    this.preparedClip = null;
    this.analysisResult = null;
    this.error = null;
  }

  async loadCurrentDayAnalysisUsage() {
    logDebug('loadCurrentDayAnalysisUsage:start');
    this.isUsageLoading = true;
    this.error = null;

    try {
      const usage = await this.analyzerUsageService.getCurrentDayUsage();

      runInAction(() => {
        this.dailyAnalysisUsage = usage;
      });

      logDebug('loadCurrentDayAnalysisUsage:success', {
        usageDate: usage.usageDate,
        analysisCount: usage.analysisCount,
      });
    } catch (error) {
      logError('loadCurrentDayAnalysisUsage:error', error);
      runInAction(() => {
        this.error = this.getErrorMessage(error, 'Daily analyzer usage failed to load');
      });
    } finally {
      runInAction(() => {
        this.isUsageLoading = false;
      });
    }
  }

  async analyzeHook(context: HookContext) {
    if (!this.hasLoadedCurrentDayAnalysisUsage) {
      await this.loadCurrentDayAnalysisUsage();
    }

    if (!this.hasLoadedCurrentDayAnalysisUsage) {
      logDebug('analyzeHook:skipped-usage-not-loaded');
      return false;
    }

    if (this.hasReachedDailyAnalysisLimit) {
      logDebug('analyzeHook:skipped-daily-limit', {
        todayAnalysisCount: this.todayAnalysisCount,
        todayAnalysisLimit: this.todayAnalysisLimit,
      });
      runInAction(() => {
        this.error = VIDEO_ANALYZER_DAILY_LIMIT_ERROR_MESSAGE;
      });
      return false;
    }

    const sourceClip = this.preparedClip ?? this.preparationService.buildTextOnlyClip(context);

    logDebug('analyzeHook:start', {
      clipId: sourceClip.id,
      sourceMode: sourceClip.mode,
      durationSeconds: sourceClip.durationSeconds,
      goals: context.goals,
      hasHookText: Boolean(context.hookText),
      hasVideoDescription: Boolean(context.videoDescription),
      hasFirstFrameContext: Boolean(context.firstFrameContext),
    });

    runInAction(() => {
      this.isAnalyzing = true;
      this.error = null;
    });

    try {
      const frames = this.preparedClip
        ? await this.frameExtractionService.extractOpeningFrames(this.preparedClip)
        : [];
      const audio = this.preparedClip && this.analyzerClient.supportsAudioInput
        ? await this.audioExtractionService.extractOpeningAudio(this.preparedClip)
        : null;
      const result = await this.analyzerClient.createHookScore({
        clip: sourceClip,
        context,
        frames,
        audio,
      });
      const savedAnalysis = await this.analyzerUsageService.recordAnalysisResult({
        result,
        clip: sourceClip,
        context,
      });

      runInAction(() => {
        this.analysisResult = result;
        this.dailyAnalysisUsage = savedAnalysis.usage;
        this.analysisHistory = [
          savedAnalysis.historyItem,
          ...this.analysisHistory.filter((item) => item.id !== savedAnalysis.historyItem.id),
        ].slice(0, 30);
      });

      logDebug('analyzeHook:success', {
        analysisId: result.id,
        score: result.score,
        historyId: savedAnalysis.historyItem.id,
        todayAnalysisCount: savedAnalysis.usage.analysisCount,
        audioSampleIncluded: Boolean(audio),
      });

      return true;
    } catch (error) {
      logError('analyzeHook:error', error);
      const errorMessage = this.getErrorMessage(error, 'Video analysis usage failed to update');
      const isDailyLimitError =
        errorMessage.includes(VIDEO_ANALYZER_DAILY_LIMIT_ERROR_MESSAGE) ||
        errorMessage.includes('Daily video analysis limit reached');

      runInAction(() => {
        this.error = isDailyLimitError ? VIDEO_ANALYZER_DAILY_LIMIT_ERROR_MESSAGE : errorMessage;

        if (isDailyLimitError) {
          this.dailyAnalysisUsage = {
            usageDate: this.dailyAnalysisUsage?.usageDate ?? new Date().toISOString().slice(0, 10),
            analysisCount: this.todayAnalysisLimit,
          };
        }
      });

      return false;
    } finally {
      runInAction(() => {
        this.isAnalyzing = false;
      });
    }
  }

  async loadAnalysisHistory() {
    logDebug('loadAnalysisHistory:start');
    this.isHistoryLoading = true;
    this.error = null;

    try {
      const history = await this.analyzerUsageService.getAnalysisHistory();

      runInAction(() => {
        this.analysisHistory = history;
      });

      logDebug('loadAnalysisHistory:success', {
        count: history.length,
        firstHistoryId: history[0]?.id,
      });
    } catch (error) {
      logError('loadAnalysisHistory:error', error);
      runInAction(() => {
        this.error = this.getErrorMessage(error, 'Hook history failed to load');
      });
    } finally {
      runInAction(() => {
        this.isHistoryLoading = false;
      });
    }
  }

  setAnalysisResult(result: HookAnalysisResult) {
    this.analysisResult = result;
  }

  private getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
  }
}
