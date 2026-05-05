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

  buildTextOnlyClip(context: HookContext): PreparedVideoClip {
    const label = this.buildHookLabel(context);

    return {
      id: `text-hook-${Date.now()}`,
      sourceUri: 'text://hook-score',
      clipUri: 'text://hook-score',
      fileName: label,
      mimeType: 'text/plain',
      durationSeconds: 3,
      windowStartMs: 0,
      windowDurationMs: 3000,
      preparedAt: new Date().toISOString(),
      status: 'ready',
      mode: 'text-context',
    };
  }

  buildLocalAnalysisResult(clip: PreparedVideoClip, context: HookContext): HookAnalysisResult {
    const hookTextLength = context.hookText.length;
    const descriptionLength = context.videoDescription.length;
    const audienceLength = context.targetAudience.length;
    const nicheLength = context.niche.length;
    const firstFrameLength = context.firstFrameContext.length;
    const goalCount = context.goals.length;

    const clarity = this.clampScore(48 + Math.min(24, hookTextLength) + (descriptionLength > 24 ? 12 : 0));
    const specificity = this.clampScore(44 + Math.min(24, descriptionLength / 2) + (nicheLength > 4 ? 12 : 0));
    const payoffSpeed = this.clampScore(56 + (hookTextLength > 90 ? -12 : 8));
    const curiosity = this.clampScore(50 + (hookTextLength > 18 ? 14 : 0) + (descriptionLength > 24 ? 8 : 0));
    const audienceFit = this.clampScore(46 + Math.min(goalCount, 3) * 8 + (audienceLength > 8 ? 16 : 0));
    const visualTextMatch = this.clampScore(48 + (firstFrameLength > 8 ? 18 : 0) + (descriptionLength > 24 ? 8 : 0));
    const scrollResistance = this.clampScore(48 + (hookTextLength > 8 ? 14 : 0) + (hookTextLength > 100 ? -12 : 0));
    const score = Math.round(
      (
        clarity +
        specificity +
        payoffSpeed +
        curiosity +
        audienceFit +
        visualTextMatch +
        scrollResistance
      ) / 7
    );
    const promise =
      context.hookText || context.videoDescription || 'Show the viewer one clear reason to keep watching';
    const rewriteBase = promise.trim();

    return {
      id: `analysis-${Date.now()}`,
      clipId: clip.id,
      createdAt: new Date().toISOString(),
      score,
      subscores: {
        clarity,
        specificity,
        payoffSpeed,
        curiosity,
        audienceFit,
        visualTextMatch,
        scrollResistance,
      },
      goals: [...context.goals],
      verdict: this.buildVerdict(score),
      mainProblem: 'The opening needs a clearer payoff before the setup.',
      bestFix: 'Lead with the outcome or tension, then use the next beat as proof.',
      rewrites: [
        `${rewriteBase} - here is the part most people miss.`,
        `Before you try ${context.videoDescription || 'this'}, check this first.`,
        `I would not start ${context.niche || 'this video'} until I fixed this.`,
      ],
      rewrite: `${rewriteBase} - here is the part most people miss.`,
      firstFrameText: context.firstFrameContext || 'Start with the outcome, not the setup.',
    };
  }

  private buildHookLabel(context: HookContext) {
    const source = context.hookText || context.videoDescription || 'Hook draft';
    const compact = source.replace(/\s+/g, ' ').trim();

    return compact.length > 48 ? `${compact.slice(0, 45)}...` : compact;
  }

  private buildVerdict(score: number) {
    if (score >= 80) {
      return 'strong hook';
    }

    if (score >= 60) {
      return 'promising';
    }

    if (score >= 40) {
      return 'weak but fixable';
    }

    return 'needs a sharper hook';
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
