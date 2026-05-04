import {
  ClipDurationSeconds,
  HookAnalysisResult,
  HookContext,
  PreparedVideoClip,
  VideoAsset,
} from '../../shared/types/video.types';

type PrepareClipInput = {
  asset: VideoAsset;
  durationSeconds: ClipDurationSeconds;
  windowStartMs: number;
};

export type HookAnalysisRequestDraft = {
  clip: PreparedVideoClip;
  context: HookContext;
  requestedOutput: {
    score: true;
    subscores: true;
    rewrites: number;
    firstFrameText: true;
  };
};

export class VideoPreparationService {
  prepareOpeningClip({
    asset,
    durationSeconds,
    windowStartMs,
  }: PrepareClipInput): PreparedVideoClip {
    const windowDurationMs = durationSeconds * 1000;
    const safeWindowStartMs = this.clampWindowStart(asset.durationMs, windowStartMs, windowDurationMs);

    return {
      id: `clip-${Date.now()}`,
      sourceUri: asset.uri,
      clipUri: asset.uri,
      fileName: this.buildClipFileName(asset.fileName, safeWindowStartMs, durationSeconds),
      mimeType: asset.mimeType,
      durationSeconds,
      windowStartMs: safeWindowStartMs,
      windowDurationMs,
      preparedAt: new Date().toISOString(),
      status: 'ready',
      mode: 'client-trim-window',
      delivery: {
        fieldName: 'video',
        uri: asset.uri,
        name: this.buildClipFileName(asset.fileName, safeWindowStartMs, durationSeconds),
        type: asset.mimeType,
        trim: {
          startMs: safeWindowStartMs,
          durationMs: windowDurationMs,
        },
      },
    };
  }

  buildAnalysisRequestDraft(
    clip: PreparedVideoClip,
    context: HookContext
  ): HookAnalysisRequestDraft {
    return {
      clip,
      context,
      requestedOutput: {
        score: true,
        subscores: true,
        rewrites: 3,
        firstFrameText: true,
      },
    };
  }

  buildLocalAnalysisResult(clip: PreparedVideoClip, context: HookContext): HookAnalysisResult {
    const hookTextLength = context.hookText.length;
    const descriptionLength = context.videoDescription.length;
    const audienceLength = context.targetAudience.length;
    const goalCount = context.goals.length;

    const clarity = this.clampScore(48 + Math.min(24, hookTextLength) + (descriptionLength > 24 ? 12 : 0));
    const pace = this.clampScore(58 + (clip.durationSeconds === 3 ? 14 : 8) + (hookTextLength > 90 ? -8 : 4));
    const goalFit = this.clampScore(50 + Math.min(goalCount, 3) * 9 + (audienceLength > 8 ? 12 : 0));
    const score = Math.round((clarity + pace + goalFit) / 3);
    const promise =
      context.hookText || context.videoDescription || 'Show the viewer one clear reason to keep watching';

    return {
      id: `analysis-${Date.now()}`,
      clipId: clip.id,
      createdAt: new Date().toISOString(),
      score,
      subscores: {
        clarity,
        pace,
        goalFit,
      },
      goals: [...context.goals],
      rewrite: `${promise.trim()} - then reveal the payoff within ${clip.durationSeconds}s.`,
    };
  }

  private clampWindowStart(durationMs: number | undefined, windowStartMs: number, windowDurationMs: number) {
    if (!durationMs || durationMs <= windowDurationMs) {
      return 0;
    }

    return Math.max(0, Math.min(windowStartMs, durationMs - windowDurationMs));
  }

  private buildClipFileName(fileName: string, startMs: number, durationSeconds: ClipDurationSeconds) {
    const dotIndex = fileName.lastIndexOf('.');
    const baseName = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
    const extension = dotIndex > 0 ? fileName.slice(dotIndex) : '.mp4';
    const startSeconds = Math.round(startMs / 1000);

    return `${baseName}-hook-${startSeconds}s-${durationSeconds}s${extension}`;
  }

  private clampScore(score: number) {
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}
