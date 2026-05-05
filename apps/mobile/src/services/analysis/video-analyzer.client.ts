import {
  HookAnalysisResult,
  HookContext,
  HookGoal,
  PreparedVideoClip,
  VideoAudioSample,
  VideoFrameSample,
} from '../../shared/types/video.types';

export type HookAnalysisInput = {
  clip?: PreparedVideoClip | null;
  context: HookContext;
  frames: VideoFrameSample[];
  audio?: VideoAudioSample | null;
};

export type HookScoreApiResult = {
  score: number;
  subscores: {
    clarity: number;
    specificity: number;
    payoffSpeed: number;
    curiosity: number;
    audienceFit: number;
    visualTextMatch: number;
    scrollResistance: number;
  };
  goals: HookGoal[];
  verdict: string;
  mainProblem: string;
  bestFix: string;
  rewrites: string[];
  firstFrameText: string;
  observations: string[];
  improvements: string[];
};

export type VideoAnalyzerClient = {
  supportsAudioInput?: boolean;
  createHookScore(input: HookAnalysisInput): Promise<HookAnalysisResult>;
};

export const VALID_HOOK_GOALS: HookGoal[] = [
  'views',
  'trust',
  'sales',
  'education',
  'comments',
];

export const hookScoreResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'score',
    'subscores',
    'goals',
    'verdict',
    'mainProblem',
    'bestFix',
    'rewrites',
    'firstFrameText',
    'observations',
    'improvements',
  ],
  properties: {
    score: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
    },
    subscores: {
      type: 'object',
      additionalProperties: false,
      required: [
        'clarity',
        'specificity',
        'payoffSpeed',
        'curiosity',
        'audienceFit',
        'visualTextMatch',
        'scrollResistance',
      ],
      properties: {
        clarity: {
          type: 'integer',
          minimum: 0,
          maximum: 100,
        },
        specificity: {
          type: 'integer',
          minimum: 0,
          maximum: 100,
        },
        payoffSpeed: {
          type: 'integer',
          minimum: 0,
          maximum: 100,
        },
        curiosity: {
          type: 'integer',
          minimum: 0,
          maximum: 100,
        },
        audienceFit: {
          type: 'integer',
          minimum: 0,
          maximum: 100,
        },
        visualTextMatch: {
          type: 'integer',
          minimum: 0,
          maximum: 100,
        },
        scrollResistance: {
          type: 'integer',
          minimum: 0,
          maximum: 100,
        },
      },
    },
    goals: {
      type: 'array',
      items: {
        type: 'string',
        enum: VALID_HOOK_GOALS,
      },
    },
    verdict: {
      type: 'string',
    },
    mainProblem: {
      type: 'string',
    },
    bestFix: {
      type: 'string',
    },
    rewrites: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'string',
      },
    },
    firstFrameText: {
      type: 'string',
    },
    observations: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    improvements: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
};

export const buildHookScorePrompt = (input: HookAnalysisInput) =>
  JSON.stringify(
    {
      task: 'Score this short-form video hook using the HookScore rubric before the creator edits or posts.',
      source: input.clip?.mode === 'client-trim-window'
        ? {
            kind: 'optional_video_context',
            durationSeconds: input.clip.durationSeconds,
            windowStartMs: input.clip.windowStartMs,
            windowDurationMs: input.clip.windowDurationMs,
          }
        : {
            kind: 'text_only_hook_check',
          },
      context: input.context,
      frameSampling:
        input.frames.length > 0
          ? 'Frames are sampled from the optional opening video context in chronological order.'
          : 'No image or video frame is attached. Score from the hook, idea, viewer, niche, goal, and first-frame/caption notes only.',
      audioSampling: input.audio
        ? 'A short audio sample from the same opening window is attached. Use it to judge spoken hook clarity, voice energy, music/silence, pacing, and audio-visual fit.'
        : 'No audio sample is attached. Do not infer speech, music, or sound quality beyond the written context.',
      audioSample: input.audio
        ? {
            startMs: input.audio.startMs,
            durationMs: input.audio.durationMs,
            mimeType: input.audio.mimeType,
            sampleRate: input.audio.sampleRate,
            channelCount: input.audio.channelCount,
          }
        : null,
      outputContract:
        'Return compact JSON only. Score 0-100. Verdict should be short, e.g. "weak but fixable". Main problem and best fix must each be one sentence. Return exactly 3 rewritten hooks.',
    },
    null,
    2
  );

export const hookScoreSystemInstruction =
  'You are HookScore, a short-form video hook analyst. Judge the opening from the first spoken line or on-screen text, the creator context, and any optional first-frame context. Do not require video processing. Score harshly but practically. Return JSON only.';

export const stripJsonFence = (value: string) =>
  value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

export const normalizeHookScoreResult = (result: HookScoreApiResult): HookScoreApiResult => ({
  score: clampScore(result.score),
  subscores: {
    clarity: clampScore(result.subscores?.clarity),
    specificity: clampScore(result.subscores?.specificity),
    payoffSpeed: clampScore(result.subscores?.payoffSpeed),
    curiosity: clampScore(result.subscores?.curiosity),
    audienceFit: clampScore(result.subscores?.audienceFit),
    visualTextMatch: clampScore(result.subscores?.visualTextMatch),
    scrollResistance: clampScore(result.subscores?.scrollResistance),
  },
  goals: normalizeGoals(result.goals),
  verdict: normalizeText(result.verdict),
  mainProblem: normalizeText(result.mainProblem),
  bestFix: normalizeText(result.bestFix),
  rewrites: normalizeTextList(result.rewrites).slice(0, 3),
  firstFrameText: normalizeText(result.firstFrameText),
  observations: normalizeTextList(result.observations),
  improvements: normalizeTextList(result.improvements),
});

export const normalizeGoals = (goals: HookGoal[] | undefined) =>
  (goals ?? []).filter((goal): goal is HookGoal => VALID_HOOK_GOALS.includes(goal));

export const normalizeText = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

export const normalizeTextList = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeText(item))
    .filter((item) => item.length > 0)
    .slice(0, 5);
};

export const clampScore = (score: unknown) => {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};
