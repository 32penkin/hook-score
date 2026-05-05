import { supabase } from '../auth/supabase.client';
import {
  HookAnalysisResult,
  HookContext,
  PreparedVideoClip,
} from '../../shared/types/video.types';
import { appConfig } from '../../shared/config/environment';
import { stringifyForLog } from '../api/api-logger';

import { GuestDeviceIdentityService } from './guest-device-identity.service';

export type VideoAnalyzerDailyUsage = {
  usageDate: string;
  analysisCount: number;
};

export type VideoAnalyzerUsageScope = 'authenticated' | 'guest';

export const VIDEO_ANALYZER_DAILY_LIMIT = 2;
export const VIDEO_ANALYZER_GUEST_LIMIT = 1;
export const VIDEO_ANALYZER_DAILY_LIMIT_ERROR_MESSAGE =
  'Daily hook check limit reached. Try again tomorrow.';
export const VIDEO_ANALYZER_GUEST_LIMIT_ERROR_MESSAGE =
  'Free hook check already used. Log in or register to keep analyzing.';
export const VIDEO_ANALYZER_GUEST_SETUP_ERROR_MESSAGE =
  'Guest hook checks are not enabled in Supabase yet. Apply the latest guest usage migration.';
export const VIDEO_ANALYZER_PROMO_CODE_SETUP_ERROR_MESSAGE =
  'Promo code redemption is not enabled in Supabase yet. Apply the latest promo code migration.';

export type VideoAnalyzerHistoryItem = {
  id: string;
  usageDate: string;
  createdAt: string;
  result: HookAnalysisResult;
  clip: PreparedVideoClip;
  context: HookContext;
};

type VideoAnalyzerUsageRpcRow = {
  usage_date: string;
  analysis_count: number;
};

type VideoAnalyzerResultRow = {
  id: string;
  usage_date: string;
  daily_analysis_count?: number;
  created_at: string;
  result: HookAnalysisResult;
  clip: PreparedVideoClip;
  context: HookContext;
};

type RecordAnalysisResultInput = {
  result: HookAnalysisResult;
  clip: PreparedVideoClip;
  context: HookContext;
};

type RecordedAnalysisResult = {
  usage: VideoAnalyzerDailyUsage;
  historyItem: VideoAnalyzerHistoryItem;
};

const logDebug = (event: string, payload?: Record<string, unknown>) => {
  if (appConfig.apiDebugLogs) {
    console.log(`[VideoAnalyzerUsageService] ${event} ${stringifyForLog(payload ?? {})}`);
  }
};

const logError = (event: string, error: unknown) => {
  console.error(
    `[VideoAnalyzerUsageService] ${event} ${stringifyForLog(getErrorLogPayload(error))}`
  );
};

const getErrorLogPayload = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (error && typeof error === 'object') {
    const errorRecord = error as Record<string, unknown>;

    return {
      ...errorRecord,
      message: errorRecord.message,
      code: errorRecord.code,
      details: errorRecord.details,
      hint: errorRecord.hint,
      status: errorRecord.status,
      statusCode: errorRecord.statusCode,
    };
  }

  return { error };
};

const isPostgrestFunctionMissingError = (error: unknown, functionName: string) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const errorRecord = error as Record<string, unknown>;
  const message = typeof errorRecord.message === 'string' ? errorRecord.message : '';
  const details = typeof errorRecord.details === 'string' ? errorRecord.details : '';

  return (
    errorRecord.code === 'PGRST202' &&
    (message.includes(functionName) || details.includes(functionName))
  );
};

const getClient = () => {
  if (!supabase) {
    logError('Supabase client is not configured', {
      hasSupabaseUrl: Boolean(appConfig.supabaseUrl),
      hasSupabasePublishableKey: Boolean(appConfig.supabasePublishableKey),
    });

    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    );
  }

  return supabase;
};

const getFallbackUsageDate = () => new Date().toISOString().slice(0, 10);

const normalizePromoCode = (code: string) =>
  code.replace(/[^a-z0-9]/gi, '').toUpperCase();

const mapUsageRow = (
  row: VideoAnalyzerUsageRpcRow | null | undefined
): VideoAnalyzerDailyUsage => ({
  usageDate: row?.usage_date ?? getFallbackUsageDate(),
  analysisCount: row?.analysis_count ?? 0,
});

const mapUsageRpcResponse = (
  data: VideoAnalyzerUsageRpcRow[] | VideoAnalyzerUsageRpcRow | null
) => mapUsageRow(Array.isArray(data) ? data[0] : data);

const mapHistoryRow = (row: VideoAnalyzerResultRow): VideoAnalyzerHistoryItem => ({
  id: row.id,
  usageDate: row.usage_date,
  createdAt: row.created_at,
  result: row.result,
  clip: row.clip,
  context: row.context,
});

export class VideoAnalyzerUsageService {
  constructor(
    private readonly guestDeviceIdentityService = new GuestDeviceIdentityService()
  ) {}

  async getCurrentUsage(
    scope: VideoAnalyzerUsageScope
  ): Promise<VideoAnalyzerDailyUsage> {
    if (scope === 'guest') {
      return this.getCurrentGuestUsage();
    }

    return this.getCurrentDayUsage();
  }

  async getCurrentDayUsage(): Promise<VideoAnalyzerDailyUsage> {
    logDebug('getCurrentDayUsage:start');
    const client = getClient();
    const { data, error } = await client.rpc('get_current_video_analyzer_usage');

    if (error) {
      logError('getCurrentDayUsage:error', error);
      throw error;
    }

    const usage = mapUsageRpcResponse(
      data as VideoAnalyzerUsageRpcRow[] | VideoAnalyzerUsageRpcRow | null
    );

    logDebug('getCurrentDayUsage:success', {
      usageDate: usage.usageDate,
      analysisCount: usage.analysisCount,
    });

    return usage;
  }

  async getCurrentGuestUsage(): Promise<VideoAnalyzerDailyUsage> {
    logDebug('getCurrentGuestUsage:start');
    const client = getClient();
    const deviceId = await this.guestDeviceIdentityService.getDeviceId();
    const { data, error } = await client.rpc('get_guest_video_analyzer_usage', {
      p_device_id: deviceId,
    });

    if (error) {
      if (isPostgrestFunctionMissingError(error, 'get_guest_video_analyzer_usage')) {
        logDebug('getCurrentGuestUsage:schema-missing', {
          message: VIDEO_ANALYZER_GUEST_SETUP_ERROR_MESSAGE,
        });

        return {
          usageDate: getFallbackUsageDate(),
          analysisCount: 0,
        };
      }

      logError('getCurrentGuestUsage:error', error);
      throw error;
    }

    const usage = mapUsageRpcResponse(
      data as VideoAnalyzerUsageRpcRow[] | VideoAnalyzerUsageRpcRow | null
    );

    logDebug('getCurrentGuestUsage:success', {
      usageDate: usage.usageDate,
      analysisCount: usage.analysisCount,
    });

    return usage;
  }

  async recordAnalysisUse(
    scope: VideoAnalyzerUsageScope = 'authenticated'
  ): Promise<VideoAnalyzerDailyUsage> {
    if (scope === 'guest') {
      return this.recordGuestAnalysisUse();
    }

    logDebug('recordAnalysisUse:start');
    const client = getClient();
    const { data, error } = await client.rpc('record_video_analyzer_use');

    if (error) {
      logError('recordAnalysisUse:error', error);
      throw error;
    }

    const usage = mapUsageRpcResponse(
      data as VideoAnalyzerUsageRpcRow[] | VideoAnalyzerUsageRpcRow | null
    );

    logDebug('recordAnalysisUse:success', {
      usageDate: usage.usageDate,
      analysisCount: usage.analysisCount,
    });

    return usage;
  }

  async recordGuestAnalysisUse(): Promise<VideoAnalyzerDailyUsage> {
    logDebug('recordGuestAnalysisUse:start');
    const client = getClient();
    const deviceId = await this.guestDeviceIdentityService.getDeviceId();
    const { data, error } = await client.rpc('record_guest_video_analyzer_use', {
      p_device_id: deviceId,
    });

    if (error) {
      if (isPostgrestFunctionMissingError(error, 'record_guest_video_analyzer_use')) {
        logDebug('recordGuestAnalysisUse:schema-missing', {
          message: VIDEO_ANALYZER_GUEST_SETUP_ERROR_MESSAGE,
        });

        throw new Error(VIDEO_ANALYZER_GUEST_SETUP_ERROR_MESSAGE);
      }

      logError('recordGuestAnalysisUse:error', error);
      throw error;
    }

    const usage = mapUsageRpcResponse(
      data as VideoAnalyzerUsageRpcRow[] | VideoAnalyzerUsageRpcRow | null
    );

    logDebug('recordGuestAnalysisUse:success', {
      usageDate: usage.usageDate,
      analysisCount: usage.analysisCount,
    });

    return usage;
  }

  async redeemPromoCode(code: string): Promise<VideoAnalyzerDailyUsage> {
    const normalizedCode = normalizePromoCode(code);

    logDebug('redeemPromoCode:start', {
      codeLength: normalizedCode.length,
      hasCode: Boolean(normalizedCode),
    });

    const client = getClient();
    const { data, error } = await client.rpc('redeem_video_analyzer_promo_code', {
      p_code: normalizedCode,
    });

    if (error) {
      if (isPostgrestFunctionMissingError(error, 'redeem_video_analyzer_promo_code')) {
        logDebug('redeemPromoCode:schema-missing', {
          message: VIDEO_ANALYZER_PROMO_CODE_SETUP_ERROR_MESSAGE,
        });

        throw new Error(VIDEO_ANALYZER_PROMO_CODE_SETUP_ERROR_MESSAGE);
      }

      logError('redeemPromoCode:error', error);
      throw error;
    }

    const usage = mapUsageRpcResponse(
      data as VideoAnalyzerUsageRpcRow[] | VideoAnalyzerUsageRpcRow | null
    );

    logDebug('redeemPromoCode:success', {
      usageDate: usage.usageDate,
      analysisCount: usage.analysisCount,
    });

    return usage;
  }

  async recordAnalysisResult({
    result,
    clip,
    context,
  }: RecordAnalysisResultInput): Promise<RecordedAnalysisResult> {
    logDebug('recordAnalysisResult:start', {
      analysisId: result.id,
      clipId: clip.id,
      score: result.score,
      goals: result.goals,
      hasHookText: Boolean(context.hookText),
      hasVideoDescription: Boolean(context.videoDescription),
    });

    const client = getClient();
    const { data, error } = await client.rpc('record_video_analyzer_result', {
      p_result: result,
      p_clip: clip,
      p_context: context,
    });

    if (error) {
      logError('recordAnalysisResult:error', error);
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row) {
      logError('recordAnalysisResult:empty-response', {
        analysisId: result.id,
        clipId: clip.id,
      });
      throw new Error('Hook score result was not saved');
    }

    const resultRow = row as VideoAnalyzerResultRow;
    const recordedResult = {
      usage: {
        usageDate: resultRow.usage_date,
        analysisCount: resultRow.daily_analysis_count ?? 0,
      },
      historyItem: mapHistoryRow(resultRow),
    };

    logDebug('recordAnalysisResult:success', {
      historyId: recordedResult.historyItem.id,
      usageDate: recordedResult.usage.usageDate,
      analysisCount: recordedResult.usage.analysisCount,
    });

    return recordedResult;
  }

  async getAnalysisHistory(limit = 30): Promise<VideoAnalyzerHistoryItem[]> {
    logDebug('getAnalysisHistory:start', { limit });
    const client = getClient();
    const { data, error } = await client
      .from('video_analyzer_results')
      .select('id, usage_date, created_at, result, clip, context')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logError('getAnalysisHistory:error', error);
      throw error;
    }

    const history = ((data ?? []) as VideoAnalyzerResultRow[]).map(mapHistoryRow);

    logDebug('getAnalysisHistory:success', {
      count: history.length,
      firstHistoryId: history[0]?.id,
    });

    return history;
  }
}
