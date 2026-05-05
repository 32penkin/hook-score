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

export type OpenAIClientConfig = {
  apiKey?: string;
  model?: string;
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

type ResponseContentItem =
  | {
      type: 'input_text';
      text: string;
    }
  | {
      type: 'input_image';
      image_url: string;
      detail: 'low' | 'high' | 'auto';
    };

const DEFAULT_OPENAI_MODEL = 'gpt-5.4-mini';

export class OpenAIClient implements VideoAnalyzerClient {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly config: OpenAIClientConfig = {}
  ) {}

  buildResponsesBody(input: HookAnalysisInput) {
    const promptInput = {
      ...input,
      audio: null,
    };
    const content: ResponseContentItem[] = [
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
      model: this.config.model ?? DEFAULT_OPENAI_MODEL,
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
  }

  async createHookScore(input: HookAnalysisInput): Promise<HookAnalysisResult> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const response = await this.httpClient.post<OpenAIResponsesApiResponse>('/responses', {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: this.buildResponsesBody(input),
    });

    const parsedResult = this.parseHookScoreResponse(response);

    return this.toHookAnalysisResult(parsedResult, input, response.id);
  }

  private parseHookScoreResponse(response: OpenAIResponsesApiResponse): HookScoreApiResult {
    const outputText = this.extractOutputText(response);

    if (!outputText) {
      throw new Error('OpenAI response did not include analyzer output');
    }

    let parsed: HookScoreApiResult;

    try {
      parsed = JSON.parse(stripJsonFence(outputText)) as HookScoreApiResult;
    } catch {
      throw new Error('OpenAI analyzer output was not valid JSON');
    }

    return normalizeHookScoreResult(parsed);
  }

  private extractOutputText(response: OpenAIResponsesApiResponse) {
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
  }

  private toHookAnalysisResult(
    result: HookScoreApiResult,
    input: HookAnalysisInput,
    responseId?: string
  ): HookAnalysisResult {
    return {
      id: responseId ?? `analysis-${Date.now()}`,
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
      model: this.config.model ?? DEFAULT_OPENAI_MODEL,
      frameCount: input.frames.length,
    };
  }
}
