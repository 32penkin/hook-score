export type ClipDurationSeconds = 3 | 4 | 5;

export type HookGoal = 'views' | 'trust' | 'sales' | 'education' | 'comments';

export type HookContext = {
  hookText: string;
  videoDescription: string;
  targetAudience: string;
  niche: string;
  firstFrameContext: string;
  goals: HookGoal[];
};

export type HookAnalysisSubscores = {
  clarity: number;
  specificity: number;
  payoffSpeed: number;
  curiosity: number;
  audienceFit: number;
  visualTextMatch: number;
  scrollResistance: number;
  pace?: number;
  goalFit?: number;
};

export type HookAnalysisResult = {
  id: string;
  clipId: string;
  createdAt: string;
  score: number;
  subscores: HookAnalysisSubscores;
  goals: HookGoal[];
  verdict: string;
  mainProblem: string;
  bestFix: string;
  rewrites: string[];
  rewrite?: string;
  firstFrameText?: string;
  observations?: string[];
  improvements?: string[];
  model?: string;
  frameCount?: number;
  audioSampleIncluded?: boolean;
};

export type VideoAsset = {
  uri: string;
  fileName: string;
  mimeType: string;
  durationMs?: number;
  fileSize?: number;
  width?: number;
  height?: number;
};

export type PreparedVideoClip = {
  id: string;
  sourceUri: string;
  clipUri: string;
  fileName: string;
  mimeType: string;
  durationSeconds: ClipDurationSeconds;
  windowStartMs: number;
  windowDurationMs: number;
  preparedAt: string;
  status: 'ready';
  mode: 'client-trim-window' | 'text-context';
  delivery?: {
    fieldName: 'video';
    uri: string;
    name: string;
    type: string;
    trim: {
      startMs: number;
      durationMs: number;
    };
  };
};

export type PreparedClipRecord = {
  id: string;
  clip: PreparedVideoClip;
  context: HookContext;
};

export type VideoFrameSample = {
  id: string;
  timestampMs: number;
  imageDataUrl: string;
  width?: number;
  height?: number;
};

export type VideoAudioSample = {
  id: string;
  startMs: number;
  durationMs: number;
  mimeType: string;
  base64Data: string;
  sampleRate: number;
  channelCount: number;
};
