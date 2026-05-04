export type ClipDurationSeconds = 3 | 4 | 5;

export type HookGoal = 'views' | 'trust' | 'sales' | 'education' | 'comments';

export type HookContext = {
  hookText: string;
  videoDescription: string;
  targetAudience: string;
  goals: HookGoal[];
};

export type HookAnalysisSubscores = {
  clarity: number;
  pace: number;
  goalFit: number;
};

export type HookAnalysisResult = {
  id: string;
  clipId: string;
  createdAt: string;
  score: number;
  subscores: HookAnalysisSubscores;
  goals: HookGoal[];
  rewrite: string;
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
  mode: 'client-trim-window';
  delivery: {
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
