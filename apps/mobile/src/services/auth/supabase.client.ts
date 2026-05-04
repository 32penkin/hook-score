import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import { createClient, processLock } from '@supabase/supabase-js';

import { appConfig } from '../../shared/config/environment';
import { createApiFetchLogger } from '../api/api-logger';

import { secureStoreStorage } from './secure-store.storage';

const SUPABASE_AUTH_STORAGE_KEY = 'hook-score-supabase-auth';
const supabaseFetch = createApiFetchLogger('Supabase API');

let autoRefreshConfigured = false;

export const isSupabaseConfigured = () =>
  Boolean(appConfig.supabaseUrl && appConfig.supabasePublishableKey);

export const supabase = isSupabaseConfigured()
  ? createClient(appConfig.supabaseUrl as string, appConfig.supabasePublishableKey as string, {
      global: {
        fetch: supabaseFetch,
      },
      auth: {
        ...(Platform.OS === 'web' ? {} : { storage: secureStoreStorage }),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
        lock: processLock,
        storageKey: SUPABASE_AUTH_STORAGE_KEY,
      },
    })
  : null;

export const configureSupabaseAutoRefresh = () => {
  if (!supabase || autoRefreshConfigured || Platform.OS === 'web') {
    return;
  }

  autoRefreshConfigured = true;

  if (AppState.currentState === 'active') {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }

  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
      return;
    }

    void supabase.auth.stopAutoRefresh();
  });
};
