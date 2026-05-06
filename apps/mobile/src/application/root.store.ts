import { AuthStore } from '../features/auth/stores/auth.store';
import { VideoStore } from '../features/video/stores/video.store';
import { AuthService } from '../services/auth/auth.service';
import { HttpClient } from '../services/api/http.api';
import { VideoAnalyzerClient } from '../services/analysis/video-analyzer.client';
import { SupabaseVideoAnalyzerClient } from '../services/analysis/supabase-video-analyzer.client';
import { GeminiClient } from '../services/gemini/gemini.api';
import { OpenAIClient } from '../services/openai/openai.api';
import { VideoAnalyzerUsageService } from '../services/usage/video-analyzer-usage.service';
import { VideoAudioExtractionService } from '../services/video/video-audio-extraction.service';
import { VideoFrameExtractionService } from '../services/video/video-frame-extraction.service';
import { ExpoVideoPickerService } from '../services/video/expo-video-picker.service';
import { VideoPreparationService } from '../services/video/video-preparation.service';
import { appConfig } from '../shared/config/environment';
import { I18nStore } from '../shared/i18n/i18n.store';
import { ThemeStore } from '../shared/theme/theme.store';

export class RootStore {
  readonly i18nStore = new I18nStore();
  readonly themeStore = new ThemeStore();

  readonly services = {
    auth: new AuthService(),
    geminiHttp: new HttpClient(appConfig.geminiBaseUrl, {
      serviceName: 'Gemini API',
      retry: { maxAttempts: 3 },
    }),
    openAiHttp: new HttpClient(appConfig.openAiBaseUrl, {
      serviceName: 'OpenAI API',
      retry: { maxAttempts: 3 },
    }),
    analyzer: null as VideoAnalyzerClient | null,
    supabaseAnalyzer: null as SupabaseVideoAnalyzerClient | null,
    gemini: null as GeminiClient | null,
    openAi: null as OpenAIClient | null,
    videoAudioExtraction: new VideoAudioExtractionService(),
    videoFrameExtraction: new VideoFrameExtractionService(),
    videoAnalyzerUsage: new VideoAnalyzerUsageService(),
    videoPicker: new ExpoVideoPickerService(),
    videoPreparation: new VideoPreparationService(),
  };

  readonly authStore: AuthStore;
  readonly videoStore: VideoStore;

  constructor() {
    const geminiClient = new GeminiClient(this.services.geminiHttp, {
      apiKey: appConfig.geminiApiKey,
      model: appConfig.geminiModel,
    });
    const openAiClient = new OpenAIClient(this.services.openAiHttp, {
      apiKey: appConfig.openAiApiKey,
      model: appConfig.openAiModel,
    });
    const supabaseAnalyzerClient = new SupabaseVideoAnalyzerClient(appConfig.aiProvider);
    const directAnalyzerClient =
      appConfig.aiProvider === 'openai' ? openAiClient : geminiClient;
    const analyzerClient =
      appConfig.aiTransport === 'direct' ? directAnalyzerClient : supabaseAnalyzerClient;

    this.services.supabaseAnalyzer = supabaseAnalyzerClient;
    this.services.gemini = geminiClient;
    this.services.openAi = openAiClient;
    this.services.analyzer = analyzerClient;
    this.authStore = new AuthStore(this.services.auth);
    this.videoStore = new VideoStore(
      this.services.videoPreparation,
      this.services.videoAnalyzerUsage,
      analyzerClient,
      this.services.videoFrameExtraction,
      this.services.videoAudioExtraction
    );
    void this.authStore.initialize();
  }
}
