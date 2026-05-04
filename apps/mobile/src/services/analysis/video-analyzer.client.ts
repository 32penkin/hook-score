import {
  HookAnalysisResult,
  HookContext,
  HookGoal,
  PreparedVideoClip,
  VideoAudioSample,
  VideoFrameSample,
} from '../../shared/types/video.types';

export type HookAnalysisInput = {
  clip: PreparedVideoClip;
  context: HookContext;
  frames: VideoFrameSample[];
  audio?: VideoAudioSample | null;
};

export type HookScoreApiResult = {
  score: number;
  subscores: {
    clarity: number;
    pace: number;
    goalFit: number;
  };
  goals: HookGoal[];
  rewrite: string;
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
    'rewrite',
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
      required: ['clarity', 'pace', 'goalFit'],
      properties: {
        clarity: {
          type: 'integer',
          minimum: 0,
          maximum: 100,
        },
        pace: {
          type: 'integer',
          minimum: 0,
          maximum: 100,
        },
        goalFit: {
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
    rewrite: {
      type: 'string',
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
      task: 'Score this short-form video opening using the HookScore rubric.',
      clip: {
        durationSeconds: input.clip.durationSeconds,
        windowStartMs: input.clip.windowStartMs,
        windowDurationMs: input.clip.windowDurationMs,
        fileName: input.clip.fileName,
      },
      context: input.context,
      frameSampling:
        'Frames are sampled from the selected opening window in chronological order.',
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
        'Return compact JSON only. Score 0-100. Keep observations and improvements practical.',
    },
    null,
    2
  );

export const hookScoreSystemInstruction =
  'You are HookScore, a short-form video hook analyst. Use the sampled frames, any attached audio sample, and user context to judge the first seconds only. Score harshly but practically. Return JSON only.';

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
    pace: clampScore(result.subscores?.pace),
    goalFit: clampScore(result.subscores?.goalFit),
  },
  goals: normalizeGoals(result.goals),
  rewrite: normalizeText(result.rewrite),
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
