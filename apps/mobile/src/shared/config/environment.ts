export type AppEnvironment = 'development' | 'production';
export type AiProvider = 'gemini' | 'openai';
export type AiTransport = 'supabase' | 'direct';

const GITHUB_PAGES_BASE_URL = 'https://32penkin.github.io/hook-score';
const DEFAULT_ACCOUNT_DELETION_URL = `${GITHUB_PAGES_BASE_URL}/account-deletion/`;
const DEFAULT_PRIVACY_POLICY_URL = `${GITHUB_PAGES_BASE_URL}/privacy/`;

const normalizeEnvValue = (value: string | undefined) => {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : undefined;
};

const resolveAppEnvironment = (value: string | undefined): AppEnvironment => {
  if (value === 'development' || value === 'production') {
    return value;
  }

  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
};

const resolveAiProvider = (value: string | undefined): AiProvider => {
  if (value === 'openai' || value === 'gemini') {
    return value;
  }

  return 'gemini';
};

const resolveAiTransport = (value: string | undefined): AiTransport => {
  if (value === 'direct' || value === 'supabase') {
    return value;
  }

  return 'supabase';
};

const resolveBoolean = (value: string | undefined, fallback: boolean) => {
  const normalizedValue = normalizeEnvValue(value)?.toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalizedValue ?? '')) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalizedValue ?? '')) {
    return false;
  }

  return fallback;
};

const environment = resolveAppEnvironment(process.env.EXPO_PUBLIC_APP_ENV);

export const appConfig = {
  environment,
  accountDeletionUrl:
    normalizeEnvValue(process.env.EXPO_PUBLIC_ACCOUNT_DELETION_URL) ??
    DEFAULT_ACCOUNT_DELETION_URL,
  accountDeletionFunctionName:
    normalizeEnvValue(process.env.EXPO_PUBLIC_ACCOUNT_DELETION_FUNCTION) ?? 'delete-account',
  apiDebugLogs: resolveBoolean(
    process.env.EXPO_PUBLIC_API_DEBUG_LOGS,
    environment === 'development'
  ),
  aiProvider: resolveAiProvider(process.env.EXPO_PUBLIC_AI_PROVIDER),
  authRedirectUrl: normalizeEnvValue(process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL),
  environmentMessage:
    normalizeEnvValue(process.env.EXPO_PUBLIC_ENVIRONMENT_MESSAGE) ?? 'Environment message unset',
  aiTransport: resolveAiTransport(process.env.EXPO_PUBLIC_AI_TRANSPORT),
  geminiApiKey: normalizeEnvValue(process.env.EXPO_PUBLIC_GEMINI_API_KEY),
  geminiBaseUrl:
    normalizeEnvValue(process.env.EXPO_PUBLIC_GEMINI_BASE_URL) ??
    'https://generativelanguage.googleapis.com/v1beta',
  geminiModel: normalizeEnvValue(process.env.EXPO_PUBLIC_GEMINI_MODEL),
  openAiApiKey: normalizeEnvValue(process.env.EXPO_PUBLIC_OPENAI_API_KEY),
  openAiBaseUrl:
    normalizeEnvValue(process.env.EXPO_PUBLIC_OPENAI_BASE_URL) ?? 'https://api.openai.com/v1',
  openAiModel: normalizeEnvValue(process.env.EXPO_PUBLIC_OPENAI_MODEL),
  privacyPolicyUrl:
    normalizeEnvValue(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL) ?? DEFAULT_PRIVACY_POLICY_URL,
  supabasePublishableKey:
    normalizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
    normalizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  supabaseAnalyzeHookFunctionName:
    normalizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_ANALYZE_HOOK_FUNCTION) ?? 'analyze-hook',
  supabaseUrl: normalizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_URL),
};

export const isDevelopmentEnvironment = appConfig.environment === 'development';
