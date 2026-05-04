import { HttpClient } from '../api/http.api';
import {
  buildHookScorePrompt,
  HookAnalysisInput,
  HookScoreApiResult,
  hookScoreResponseSchema,
  hookScoreSystemInstruction,
  normalizeHookScoreResult,
  stripJsonFence,
  VideoAnalyzerClient,
} from '../analysis/video-analyzer.client';
import { HookAnalysisResult } from '../../shared/types/video.types';

export type GeminiClientConfig = {
  apiKey?: string;
  model?: string;
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

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export class GeminiClient implements VideoAnalyzerClient {
  readonly supportsAudioInput = true;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly config: GeminiClientConfig = {}
  ) {}

  buildGenerateContentBody(input: HookAnalysisInput) {
    const parts: GeminiPart[] = [
      {
        text: buildHookScorePrompt(input),
      },
    ];

    for (const [index, frame] of input.frames.entries()) {
      const image = this.parseDataUrl(frame.imageDataUrl);

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
  }

  async createHookScore(input: HookAnalysisInput): Promise<HookAnalysisResult> {
    if (!this.config.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    if (input.frames.length === 0) {
      throw new Error('No video frames were sampled for analysis');
    }

    const model = this.normalizeModelName(this.config.model ?? DEFAULT_GEMINI_MODEL);
    const response = await this.httpClient.post<GeminiGenerateContentResponse>(
      `/models/${encodeURIComponent(model)}:generateContent`,
      {
        headers: {
          'x-goog-api-key': this.config.apiKey,
        },
        body: this.buildGenerateContentBody(input),
      }
    );

    const parsedResult = this.parseHookScoreResponse(response);

    return this.toHookAnalysisResult(parsedResult, input, model);
  }

  private parseHookScoreResponse(response: GeminiGenerateContentResponse): HookScoreApiResult {
    const outputText = response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter((text): text is string => Boolean(text))
      .join('')
      .trim();

    if (!outputText) {
      const blockReason = response.promptFeedback?.blockReason;
      throw new Error(
        blockReason
          ? `Gemini response was blocked: ${blockReason}`
          : 'Gemini response did not include analyzer output'
      );
    }

    let parsed: HookScoreApiResult;

    try {
      parsed = JSON.parse(stripJsonFence(outputText)) as HookScoreApiResult;
    } catch {
      throw new Error('Gemini analyzer output was not valid JSON');
    }

    return normalizeHookScoreResult(parsed);
  }

  private parseDataUrl(dataUrl: string) {
    const match = /^data:([^;,]+);base64,(.*)$/i.exec(dataUrl);

    if (!match) {
      throw new Error('Gemini frame input must be a base64 data URL');
    }

    return {
      mimeType: match[1],
      base64Data: match[2],
    };
  }

  private normalizeModelName(model: string) {
    return model.replace(/^models\//, '');
  }

  private toHookAnalysisResult(
    result: HookScoreApiResult,
    input: HookAnalysisInput,
    model: string
  ): HookAnalysisResult {
    return {
      id: `analysis-gemini-${Date.now()}`,
      clipId: input.clip.id,
      createdAt: new Date().toISOString(),
      score: result.score,
      subscores: result.subscores,
      goals: result.goals.length > 0 ? result.goals : input.context.goals,
      rewrite: result.rewrite,
      firstFrameText: result.firstFrameText,
      observations: result.observations,
      improvements: result.improvements,
      model,
      frameCount: input.frames.length,
      audioSampleIncluded: Boolean(input.audio),
    };
  }
}
