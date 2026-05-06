type AiProvider = 'gemini' | 'openai';
type UsageScope = 'authenticated' | 'guest';
type HookGoal = 'views' | 'trust' | 'sales' | 'education' | 'comments';
type OutputLocale = 'en' | 'ru' | 'pl';

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

type HookContext = {
  hookText: string;
  videoDescription: string;
  targetAudience: string;
  niche: string;
  goals: HookGoal[];
};

type PreparedVideoClip = {
  id: string;
  sourceUri: string;
  clipUri: string;
  fileName: string;
  mimeType: string;
  durationSeconds: 3 | 4 | 5;
  windowStartMs: number;
  windowDurationMs: number;
  preparedAt: string;
  status: 'ready';
  mode: 'client-trim-window' | 'text-context';
};

type VideoFrameSample = {
  id: string;
  timestampMs: number;
  imageDataUrl: string;
  width?: number;
  height?: number;
};

type VideoAudioSample = {
  id: string;
  startMs: number;
  durationMs: number;
  mimeType: string;
  base64Data: string;
  sampleRate: number;
  channelCount: number;
};

type HookAnalysisInput = {
  clip?: PreparedVideoClip | null;
  context: HookContext;
  frames: VideoFrameSample[];
  audio?: VideoAudioSample | null;
  outputLocale?: OutputLocale;
};

type HookScoreApiResult = {
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

type HookAnalysisResult = HookScoreApiResult & {
  id: string;
  clipId: string;
  createdAt: string;
  rewrite?: string;
  model?: string;
  frameCount?: number;
  audioSampleIncluded?: boolean;
};

type AnalyzeHookRequest = {
  provider?: AiProvider;
  scope?: UsageScope;
  guestDeviceId?: string;
  input?: HookAnalysisInput;
};

type UsageRow = {
  usage_date: string;
  analysis_count: number;
};

type SavedAnalysisRow = {
  id: string;
  usage_date: string;
  daily_analysis_count?: number;
  created_at: string;
  result: HookAnalysisResult;
  clip: PreparedVideoClip;
  context: HookContext;
};

type OpenAIResponsesApiResponse = {
  id?: string;
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
};

type GeminiPart =
  | {
      text: string;
    }
  | {
      inlineData: {
        mimeType: string;
        data: string;
      };
    };

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';
const DEFAULT_OPENAI_MODEL = 'gpt-5.4-mini';
const MAX_FRAME_COUNT = 5;
const VALID_HOOK_GOALS: HookGoal[] = [
  'views',
  'trust',
  'sales',
  'education',
  'comments',
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const hookScoreResponseSchema = {
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

const hookScoreSystemInstruction =
  'You are HookScore, a short-form video hook analyst. Judge the opening from the first spoken line or on-screen text, creator context, and any attached opening visual or audio samples. Do not require video processing. Score harshly but practically. Return JSON only. Follow the requested output language for user-facing analysis text while keeping schema enum values unchanged.';

class HttpError extends Error {
  constructor(
    message: string,
    readonly status = 500,
    readonly details?: unknown
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

const getHookScoreOutputLanguageName = (locale: OutputLocale = 'en') => {
  const names: Record<OutputLocale, string> = {
    en: 'English',
    ru: 'Russian',
    pl: 'Polish',
  };

  return names[locale] ?? names.en;
};

const buildHookScorePrompt = (input: HookAnalysisInput) =>
  JSON.stringify(
    {
      task: 'Score this short-form video hook using the HookScore rubric before the creator edits or posts.',
      outputLanguage: {
        locale: input.outputLocale ?? 'en',
        name: getHookScoreOutputLanguageName(input.outputLocale),
        instruction:
          'Write verdict, mainProblem, bestFix, rewrites, observations, improvements, and any non-quoted firstFrameText summary in this language. Keep schema enum values, including goals, unchanged. Preserve direct quotes or detected on-screen text in its original language.',
      },
      source:
        input.clip?.mode === 'client-trim-window'
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
          : 'No image or video frame is attached. Score from the hook, idea, viewer, niche, and goal only.',
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
        'Return compact JSON only. Score 0-100. Verdict should be short in the requested output language. Main problem and best fix must each be one sentence. Return exactly 3 rewritten hooks.',
    },
    null,
    2
  );

const stripJsonFence = (value: string) =>
  value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

const clampScore = (score: unknown) => {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

const normalizeText = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const normalizeTextList = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeText(item))
    .filter((item) => item.length > 0)
    .slice(0, 5);
};

const normalizeGoals = (goals: HookGoal[] | undefined) =>
  (goals ?? []).filter((goal): goal is HookGoal =>
    VALID_HOOK_GOALS.includes(goal)
  );

const normalizeHookScoreResult = (
  result: HookScoreApiResult
): HookScoreApiResult => ({
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

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const requireEnv = (name: string) => {
  const value = Deno.env.get(name)?.trim();

  if (!value) {
    throw new HttpError(`${name} is not configured in Supabase secrets`, 500);
  }

  return value;
};

const getOptionalEnv = (name: string) => Deno.env.get(name)?.trim() || undefined;

const normalizeProvider = (provider: unknown): AiProvider => {
  if (provider === 'openai' || provider === 'gemini') {
    return provider;
  }

  const fallbackProvider = getOptionalEnv('AI_PROVIDER');

  if (fallbackProvider === 'openai' || fallbackProvider === 'gemini') {
    return fallbackProvider;
  }

  return 'gemini';
};

const assertProviderAllowed = (provider: AiProvider) => {
  const rawAllowedProviders = getOptionalEnv('AI_ALLOWED_PROVIDERS');

  if (!rawAllowedProviders) {
    return;
  }

  const allowedProviders = rawAllowedProviders
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (!allowedProviders.includes(provider)) {
    throw new HttpError(`AI provider "${provider}" is not enabled`, 403);
  }
};

const assertProviderConfigured = (provider: AiProvider) => {
  if (provider === 'openai') {
    requireEnv('OPENAI_API_KEY');
    return;
  }

  requireEnv('GEMINI_API_KEY');
};

const normalizeScope = (scope: unknown): UsageScope => {
  if (scope === 'guest' || scope === 'authenticated') {
    return scope;
  }

  return 'authenticated';
};

const assertRecord = (
  value: unknown,
  message: string
): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(message, 400);
  }

  return value as Record<string, unknown>;
};

const validateInput = (input: unknown): HookAnalysisInput => {
  const inputRecord = assertRecord(input, 'Hook analysis input is required');
  const context = assertRecord(inputRecord.context, 'Hook context is required');
  const frames = Array.isArray(inputRecord.frames) ? inputRecord.frames : [];

  if (frames.length > MAX_FRAME_COUNT) {
    throw new HttpError(`At most ${MAX_FRAME_COUNT} frames can be analyzed`, 400);
  }

  if (typeof context.hookText !== 'string') {
    throw new HttpError('Hook text is required', 400);
  }

  return {
    clip: (inputRecord.clip as PreparedVideoClip | null | undefined) ?? null,
    context: context as HookContext,
    frames: frames as VideoFrameSample[],
    audio: (inputRecord.audio as VideoAudioSample | null | undefined) ?? null,
    outputLocale: inputRecord.outputLocale as OutputLocale | undefined,
  };
};

const getBearer = (req: Request) => {
  const authorization = req.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    throw new HttpError('Supabase authorization header is required', 401);
  }

  return authorization;
};

const callSupabaseRpc = async <TResponse>(
  functionName: string,
  body: Record<string, unknown>,
  authorization: string
): Promise<TResponse> => {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const supabaseAnonKey = requireEnv('SUPABASE_ANON_KEY');
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const responseText = await response.text();
  let responseBody: unknown = null;

  if (responseText.trim()) {
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }
  }

  if (!response.ok) {
    const message =
      responseBody &&
      typeof responseBody === 'object' &&
      'message' in responseBody &&
      typeof responseBody.message === 'string'
        ? responseBody.message
        : `Supabase RPC ${functionName} failed with status ${response.status}`;

    throw new HttpError(message, response.status, responseBody);
  }

  return responseBody as TResponse;
};

const firstRow = <TRow>(response: TRow[] | TRow | null) =>
  Array.isArray(response) ? response[0] : response;

const mapUsageRow = (row: UsageRow) => ({
  usageDate: row.usage_date,
  analysisCount: row.analysis_count,
});

const reserveUsage = async (
  scope: UsageScope,
  guestDeviceId: string | undefined,
  requestAuthorization: string
) => {
  if (scope === 'guest') {
    if (!guestDeviceId) {
      throw new HttpError('Guest device id is required', 400);
    }

    const supabaseAnonKey = requireEnv('SUPABASE_ANON_KEY');
    const row = firstRow(
      await callSupabaseRpc<UsageRow[] | UsageRow>(
        'record_guest_video_analyzer_use',
        { p_device_id: guestDeviceId },
        `Bearer ${supabaseAnonKey}`
      )
    );

    if (!row) {
      throw new HttpError('Guest usage could not be reserved', 500);
    }

    return mapUsageRow(row);
  }

  const row = firstRow(
    await callSupabaseRpc<UsageRow[] | UsageRow>(
      'record_video_analyzer_use',
      {},
      requestAuthorization
    )
  );

  if (!row) {
    throw new HttpError('Usage could not be reserved', 500);
  }

  return mapUsageRow(row);
};

const parseDataUrl = (dataUrl: string) => {
  const match = /^data:([^;,]+);base64,(.*)$/i.exec(dataUrl);

  if (!match) {
    throw new HttpError('Frame input must be a base64 data URL', 400);
  }

  return {
    mimeType: match[1],
    base64Data: match[2],
  };
};

const buildGeminiGenerateContentBody = (input: HookAnalysisInput) => {
  const parts: GeminiPart[] = [
    {
      text: buildHookScorePrompt(input),
    },
  ];

  for (const [index, frame] of input.frames.entries()) {
    const image = parseDataUrl(frame.imageDataUrl);

    parts.push({
      text: `Frame ${index + 1} at ${frame.timestampMs}ms`,
    });
    parts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.base64Data,
      },
    });
  }

  if (input.audio) {
    parts.push({
      text: `Audio sample from ${input.audio.startMs}ms for ${input.audio.durationMs}ms`,
    });
    parts.push({
      inlineData: {
        mimeType: input.audio.mimeType,
        data: input.audio.base64Data,
      },
    });
  }

  return {
    systemInstruction: {
      parts: [{ text: hookScoreSystemInstruction }],
    },
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseJsonSchema: hookScoreResponseSchema,
    },
  };
};

const buildOpenAIResponsesBody = (input: HookAnalysisInput, model: string) => {
  const promptInput = {
    ...input,
    audio: null,
  };
  const content: Array<
    | {
        type: 'input_text';
        text: string;
      }
    | {
        type: 'input_image';
        image_url: string;
        detail: 'low' | 'high' | 'auto';
      }
  > = [
    {
      type: 'input_text',
      text: buildHookScorePrompt(promptInput),
    },
  ];

  for (const [index, frame] of input.frames.entries()) {
    content.push({
      type: 'input_text',
      text: `Frame ${index + 1} at ${frame.timestampMs}ms`,
    });
    content.push({
      type: 'input_image',
      image_url: frame.imageDataUrl,
      detail: index === 0 ? 'high' : 'low',
    });
  }

  return {
    model,
    instructions: hookScoreSystemInstruction,
    input: [
      {
        role: 'user',
        content,
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'hook_score_analysis',
        schema: hookScoreResponseSchema,
        strict: true,
      },
    },
  };
};

const parseGeminiHookScoreResponse = (
  response: GeminiGenerateContentResponse
): HookScoreApiResult => {
  const outputText = response.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter((text): text is string => Boolean(text))
    .join('')
    .trim();

  if (!outputText) {
    const blockReason = response.promptFeedback?.blockReason;
    throw new HttpError(
      blockReason
        ? `Gemini response was blocked: ${blockReason}`
        : 'Gemini response did not include analyzer output',
      502
    );
  }

  try {
    return normalizeHookScoreResult(
      JSON.parse(stripJsonFence(outputText)) as HookScoreApiResult
    );
  } catch {
    throw new HttpError('Gemini analyzer output was not valid JSON', 502);
  }
};

const extractOpenAIOutputText = (response: OpenAIResponsesApiResponse) => {
  if (response.output_text) {
    return response.output_text;
  }

  for (const outputItem of response.output ?? []) {
    const outputText = outputItem.content?.find(
      (contentItem) => contentItem.type === 'output_text' && contentItem.text
    );

    if (outputText?.text) {
      return outputText.text;
    }
  }

  return '';
};

const parseOpenAIHookScoreResponse = (
  response: OpenAIResponsesApiResponse
): HookScoreApiResult => {
  const outputText = extractOpenAIOutputText(response);

  if (!outputText) {
    throw new HttpError('OpenAI response did not include analyzer output', 502);
  }

  try {
    return normalizeHookScoreResult(
      JSON.parse(stripJsonFence(outputText)) as HookScoreApiResult
    );
  } catch {
    throw new HttpError('OpenAI analyzer output was not valid JSON', 502);
  }
};

const toHookAnalysisResult = (
  result: HookScoreApiResult,
  input: HookAnalysisInput,
  model: string,
  provider: AiProvider,
  responseId?: string
): HookAnalysisResult => ({
  id: responseId ?? `analysis-${provider}-${Date.now()}`,
  clipId: input.clip?.id ?? `text-hook-${Date.now()}`,
  createdAt: new Date().toISOString(),
  score: result.score,
  subscores: result.subscores,
  goals: result.goals.length > 0 ? result.goals : input.context.goals,
  verdict: result.verdict,
  mainProblem: result.mainProblem,
  bestFix: result.bestFix,
  rewrites: result.rewrites,
  rewrite: result.rewrites[0],
  firstFrameText: result.firstFrameText,
  observations: result.observations,
  improvements: result.improvements,
  model,
  frameCount: input.frames.length,
  audioSampleIncluded: provider === 'gemini' ? Boolean(input.audio) : undefined,
});

const parseJsonResponse = async <TResponse>(response: Response) => {
  const responseText = await response.text();
  let responseBody: unknown = null;

  if (responseText.trim()) {
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }
  }

  if (!response.ok) {
    throw new HttpError(
      `Provider request failed with status ${response.status}`,
      response.status >= 500 ? 502 : response.status,
      responseBody
    );
  }

  return responseBody as TResponse;
};

const createGeminiHookScore = async (input: HookAnalysisInput) => {
  const apiKey = requireEnv('GEMINI_API_KEY');
  const model = getOptionalEnv('GEMINI_MODEL') ?? DEFAULT_GEMINI_MODEL;
  const normalizedModel = model.replace(/^models\//, '');
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      normalizedModel
    )}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(buildGeminiGenerateContentBody(input)),
    }
  );
  const parsedResponse =
    await parseJsonResponse<GeminiGenerateContentResponse>(response);
  const parsedResult = parseGeminiHookScoreResponse(parsedResponse);

  return toHookAnalysisResult(parsedResult, input, normalizedModel, 'gemini');
};

const createOpenAIHookScore = async (input: HookAnalysisInput) => {
  const apiKey = requireEnv('OPENAI_API_KEY');
  const model = getOptionalEnv('OPENAI_MODEL') ?? DEFAULT_OPENAI_MODEL;
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildOpenAIResponsesBody(input, model)),
  });
  const parsedResponse =
    await parseJsonResponse<OpenAIResponsesApiResponse>(response);
  const parsedResult = parseOpenAIHookScoreResponse(parsedResponse);

  return toHookAnalysisResult(
    parsedResult,
    input,
    model,
    'openai',
    parsedResponse.id
  );
};

const createHookScore = (provider: AiProvider, input: HookAnalysisInput) =>
  provider === 'openai'
    ? createOpenAIHookScore(input)
    : createGeminiHookScore(input);

const saveAuthenticatedResult = async (
  result: HookAnalysisResult,
  input: HookAnalysisInput,
  authorization: string
) => {
  if (!input.clip) {
    throw new HttpError('Analysis clip is required to save history', 400);
  }

  const row = firstRow(
    await callSupabaseRpc<SavedAnalysisRow[] | SavedAnalysisRow>(
      'record_reserved_video_analyzer_result',
      {
        p_result: result,
        p_clip: input.clip,
        p_context: input.context,
      },
      authorization
    )
  );

  if (!row) {
    throw new HttpError('Hook score result was not saved', 500);
  }

  return {
    usage: {
      usageDate: row.usage_date,
      analysisCount: row.daily_analysis_count ?? 0,
    },
    historyItem: {
      id: row.id,
      usageDate: row.usage_date,
      createdAt: row.created_at,
      result: row.result,
      clip: row.clip,
      context: row.context,
    },
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const requestAuthorization = getBearer(req);
    const payload = (await req.json()) as AnalyzeHookRequest;
    const provider = normalizeProvider(payload.provider);
    const scope = normalizeScope(payload.scope);
    const input = validateInput(payload.input);

    assertProviderAllowed(provider);
    assertProviderConfigured(provider);

    const reservedUsage = await reserveUsage(
      scope,
      payload.guestDeviceId,
      requestAuthorization
    );
    const result = await createHookScore(provider, input);

    if (scope === 'guest') {
      return jsonResponse({
        result,
        usage: reservedUsage,
      });
    }

    try {
      const savedResult = await saveAuthenticatedResult(
        result,
        input,
        requestAuthorization
      );

      return jsonResponse({
        result,
        usage: savedResult.usage,
        historyItem: savedResult.historyItem,
      });
    } catch (saveError) {
      const historySaveError =
        saveError instanceof Error ? saveError.message : 'Hook history was not saved';

      console.error('[analyze-hook] history save failed', {
        message: historySaveError,
      });

      return jsonResponse({
        result,
        usage: reservedUsage,
        historySaveError,
      });
    }
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : 'Hook analysis failed';
    const details = error instanceof HttpError ? error.details : undefined;

    console.error('[analyze-hook] failed', {
      message,
      status,
      details,
    });

    return jsonResponse(
      {
        error: message,
        details,
      },
      status
    );
  }
});
