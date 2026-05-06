import { appConfig, type AiProvider } from '../../shared/config/environment';

import {
  HookAnalysisInput,
  HookScoreAnalysisResponse,
  VideoAnalyzerClient,
} from './video-analyzer.client';
import { supabase } from '../auth/supabase.client';
import { GuestDeviceIdentityService } from '../usage/guest-device-identity.service';

type SupabaseAnalyzerFunctionError = {
  context?: Response;
  message?: string;
};

export class SupabaseVideoAnalyzerClient implements VideoAnalyzerClient {
  readonly supportsAudioInput: boolean;

  constructor(
    private readonly provider: AiProvider,
    private readonly functionName = appConfig.supabaseAnalyzeHookFunctionName,
    private readonly guestDeviceIdentityService = new GuestDeviceIdentityService()
  ) {
    this.supportsAudioInput = provider === 'gemini';
  }

  async createHookScore(input: HookAnalysisInput): Promise<HookScoreAnalysisResponse> {
    if (!supabase) {
      throw new Error(
        'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
      );
    }

    const usageScope = input.usageScope ?? 'authenticated';
    const { usageScope: _usageScope, ...providerInput } = input;
    const guestDeviceId =
      usageScope === 'guest' ? await this.guestDeviceIdentityService.getDeviceId() : undefined;
    const { data, error } = await supabase.functions.invoke<HookScoreAnalysisResponse>(
      this.functionName,
      {
        body: {
          provider: this.provider,
          scope: usageScope,
          guestDeviceId,
          input: providerInput,
        },
      }
    );

    if (error) {
      throw await this.normalizeFunctionError(error);
    }

    if (!data?.result) {
      throw new Error('Hook analyzer did not return a result');
    }

    return data;
  }

  private async normalizeFunctionError(error: SupabaseAnalyzerFunctionError) {
    const context = error.context;

    if (context) {
      try {
        const body = await context.json();
        const message = typeof body?.error === 'string' ? body.error : error.message;

        return new Error(message ?? 'Hook analyzer failed');
      } catch {
        return new Error(error.message ?? 'Hook analyzer failed');
      }
    }

    return error instanceof Error ? error : new Error(error.message ?? 'Hook analyzer failed');
  }
}
