import { makeAutoObservable, runInAction } from 'mobx';

import {
  VIDEO_ANALYZER_DAILY_LIMIT,
  VIDEO_ANALYZER_DAILY_LIMIT_ERROR_MESSAGE,
  VIDEO_ANALYZER_GUEST_LIMIT,
  VIDEO_ANALYZER_GUEST_LIMIT_ERROR_MESSAGE,
  VideoAnalyzerDailyUsage,
  VideoAnalyzerHistoryItem,
  VideoAnalyzerUsageScope,
  VideoAnalyzerUsageService,
} from '../../../services/usage/video-analyzer-usage.service';
import { VideoAnalyzerClient } from '../../../services/analysis/video-analyzer.client';
import { HttpRequestError } from '../../../services/api/http.api';
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
import type { Locale } from '../../../shared/i18n/translations';

const logDebug = (event: string, payload?: Record<string, unknown>) => {
  if (isDevelopmentEnvironment) {
    console.log(`[VideoStore] ${event} ${stringifyForLog(payload ?? {})}`);
  }
};

const logError = (event: string, error: unknown) => {
  console.error(`[VideoStore] ${event} ${stringifyForLog(getErrorLogPayload(error))}`);
};

const getErrorLogPayload = (error: unknown) => {
  if (error instanceof HttpRequestError) {
    return {
      name: error.name,
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      responseBody: error.responseBody,
      stack: error.stack,
    };
  }

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
  dailyAnalysisUsageScope: VideoAnalyzerUsageScope | null = null;
  analysisUsageScope: VideoAnalyzerUsageScope = 'authenticated';
  analysisHistory: VideoAnalyzerHistoryItem[] = [];
  history: PreparedClipRecord[] = [];
  isPreparing = false;
  isAnalyzing = false;
  isUsageLoading = false;
  isPromoCodeRedeeming = false;
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
    return this.getAnalysisLimit(this.analysisUsageScope);
  }

  get hasLoadedCurrentDayAnalysisUsage() {
    return (
      this.dailyAnalysisUsage !== null &&
      this.dailyAnalysisUsageScope === this.analysisUsageScope
    );
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

  setAnalysisUsageScope(scope: VideoAnalyzerUsageScope) {
    if (this.analysisUsageScope === scope) {
      return;
    }

    this.analysisUsageScope = scope;
    this.dailyAnalysisUsage = null;
    this.dailyAnalysisUsageScope = null;
    this.error = null;
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

  async loadCurrentDayAnalysisUsage(scope = this.analysisUsageScope) {
    this.setAnalysisUsageScope(scope);

    logDebug('loadCurrentDayAnalysisUsage:start', { scope });
    this.isUsageLoading = true;
    this.error = null;

    try {
      const usage = await this.analyzerUsageService.getCurrentUsage(scope);

      runInAction(() => {
        if (this.analysisUsageScope === scope) {
          this.dailyAnalysisUsage = usage;
          this.dailyAnalysisUsageScope = scope;
        }
      });

      logDebug('loadCurrentDayAnalysisUsage:success', {
        scope,
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

  async analyzeHook(
    context: HookContext,
    scope = this.analysisUsageScope,
    outputLocale: Locale = 'en'
  ) {
    this.setAnalysisUsageScope(scope);

    if (!this.hasLoadedCurrentDayAnalysisUsage) {
      await this.loadCurrentDayAnalysisUsage(scope);
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
        this.error = this.getAnalysisLimitErrorMessage(scope);
      });
      return false;
    }

    const sourceClip = this.preparedClip ?? this.preparationService.buildTextOnlyClip(context);

    logDebug('analyzeHook:start', {
      scope,
      clipId: sourceClip.id,
      sourceMode: sourceClip.mode,
      durationSeconds: sourceClip.durationSeconds,
      outputLocale,
      goals: context.goals,
      hasHookText: Boolean(context.hookText),
      hasVideoDescription: Boolean(context.videoDescription),
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
        outputLocale,
      });
      const guestUsage =
        scope === 'guest' ? await this.analyzerUsageService.recordAnalysisUse('guest') : null;
      const savedAnalysis =
        scope === 'authenticated'
          ? await this.analyzerUsageService.recordAnalysisResult({
              result,
              clip: sourceClip,
              context,
            })
          : null;
      const usage = savedAnalysis?.usage ?? guestUsage;

      if (!usage) {
        throw new Error('Video analysis usage failed to update');
      }

      runInAction(() => {
        this.analysisResult = result;
        this.dailyAnalysisUsage = usage;
        this.dailyAnalysisUsageScope = scope;

        if (savedAnalysis) {
          this.analysisHistory = [
            savedAnalysis.historyItem,
            ...this.analysisHistory.filter((item) => item.id !== savedAnalysis.historyItem.id),
          ].slice(0, 30);
        }
      });

      logDebug('analyzeHook:success', {
        scope,
        analysisId: result.id,
        score: result.score,
        historyId: savedAnalysis?.historyItem.id,
        todayAnalysisCount: usage.analysisCount,
        audioSampleIncluded: Boolean(audio),
      });

      return true;
    } catch (error) {
      logError('analyzeHook:error', error);
      const errorMessage = this.getErrorMessage(error, 'Video analysis usage failed to update');
      const isDailyLimitError =
        errorMessage.includes(VIDEO_ANALYZER_DAILY_LIMIT_ERROR_MESSAGE) ||
        errorMessage.includes(VIDEO_ANALYZER_GUEST_LIMIT_ERROR_MESSAGE) ||
        errorMessage.includes('Free hook check already used') ||
        errorMessage.includes('Daily video analysis limit reached');

      runInAction(() => {
        this.error = isDailyLimitError
          ? this.getAnalysisLimitErrorMessage(scope)
          : errorMessage;

        if (isDailyLimitError) {
          this.dailyAnalysisUsage = {
            usageDate: this.dailyAnalysisUsage?.usageDate ?? new Date().toISOString().slice(0, 10),
            analysisCount: this.getAnalysisLimit(scope),
          };
          this.dailyAnalysisUsageScope = scope;
        }
      });

      return false;
    } finally {
      runInAction(() => {
        this.isAnalyzing = false;
      });
    }
  }

  async redeemPromoCode(code: string) {
    if (this.analysisUsageScope !== 'authenticated') {
      return false;
    }

    logDebug('redeemPromoCode:start');
    this.isPromoCodeRedeeming = true;
    this.error = null;

    try {
      const usage = await this.analyzerUsageService.redeemPromoCode(code);

      runInAction(() => {
        this.dailyAnalysisUsage = usage;
        this.dailyAnalysisUsageScope = 'authenticated';
      });

      logDebug('redeemPromoCode:success', {
        usageDate: usage.usageDate,
        analysisCount: usage.analysisCount,
      });

      return true;
    } catch (error) {
      logError('redeemPromoCode:error', error);

      return false;
    } finally {
      runInAction(() => {
        this.isPromoCodeRedeeming = false;
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
    if (error instanceof HttpRequestError && this.isTransientAnalyzerStatus(error.status)) {
      return 'The analyzer is temporarily unavailable. Please try again in a moment.';
    }

    return error instanceof Error ? error.message : fallback;
  }

  private isTransientAnalyzerStatus(status: number) {
    return [408, 409, 425, 429, 500, 502, 503, 504].includes(status);
  }

  private getAnalysisLimitErrorMessage(scope: VideoAnalyzerUsageScope) {
    return scope === 'guest'
      ? VIDEO_ANALYZER_GUEST_LIMIT_ERROR_MESSAGE
      : VIDEO_ANALYZER_DAILY_LIMIT_ERROR_MESSAGE;
  }

  private getAnalysisLimit(scope: VideoAnalyzerUsageScope) {
    return scope === 'guest' ? VIDEO_ANALYZER_GUEST_LIMIT : VIDEO_ANALYZER_DAILY_LIMIT;
  }
}
