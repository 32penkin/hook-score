import { supabase } from '../auth/supabase.client';
import {
  HookAnalysisResult,
  HookContext,
  PreparedVideoClip,
} from '../../shared/types/video.types';
import { appConfig } from '../../shared/config/environment';
import { stringifyForLog } from '../api/api-logger';

export type VideoAnalyzerDailyUsage = {
  usageDate: string;
  analysisCount: number;
};

export const VIDEO_ANALYZER_DAILY_LIMIT = 2;
export const VIDEO_ANALYZER_DAILY_LIMIT_ERROR_MESSAGE =
  'Daily video analysis limit reached. Try again tomorrow.';

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

  async recordAnalysisUse(): Promise<VideoAnalyzerDailyUsage> {
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
      throw new Error('Video analyzer result was not saved');
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
