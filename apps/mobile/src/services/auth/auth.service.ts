import { Session, User } from '@supabase/supabase-js';
import { Linking, Platform } from 'react-native';

import { AuthState, AuthUser, RegistrationResult } from '../../features/auth/auth.types';
import { appConfig } from '../../shared/config/environment';

import { configureSupabaseAutoRefresh, supabase } from './supabase.client';

type AuthStateListener = (state: AuthState) => void;
type AuthErrorListener = (error: unknown) => void;

type AccountDeletionRequestStatus = 'pending' | 'completed' | 'cancelled';

type AccountDeletionRequestRow = {
  id: string;
  email: string;
  status: AccountDeletionRequestStatus;
  requested_at: string;
  updated_at: string;
};

type SupabaseFunctionError = {
  context?: Response;
  message?: string;
};

export type AccountDeletionRequest = {
  id: string;
  email: string;
  status: AccountDeletionRequestStatus;
  requestedAt: string;
  updatedAt: string;
};

const NATIVE_AUTH_REDIRECT_URL = 'hookscore://auth/callback';

const getUserName = (user: User) => {
  const metadataName = user.user_metadata?.name;

  if (typeof metadataName === 'string' && metadataName.trim()) {
    return metadataName.trim();
  }

  return user.email?.split('@')[0] || 'Creator';
};

const mapUser = (user: User): AuthUser => ({
  id: user.id,
  email: user.email ?? null,
  name: getUserName(user),
});

const mapSession = (session: Session | null): AuthState => ({
  hasSession: Boolean(session?.access_token),
  user: session?.user ? mapUser(session.user) : null,
});

const mapAccountDeletionRequest = (
  row: AccountDeletionRequestRow
): AccountDeletionRequest => ({
  id: row.id,
  email: row.email,
  status: row.status,
  requestedAt: row.requested_at,
  updatedAt: row.updated_at,
});

const getClient = () => {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    );
  }

  return supabase;
};

const getWebAuthRedirectUrl = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.location.origin;
};

const getAuthRedirectUrl = () =>
  appConfig.authRedirectUrl ??
  (Platform.OS === 'web' ? getWebAuthRedirectUrl() : NATIVE_AUTH_REDIRECT_URL);

const getAuthCallbackParams = (url: string) => {
  const parsedUrl = new URL(url);
  const params = new URLSearchParams(parsedUrl.search);
  const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));

  hashParams.forEach((value, key) => {
    params.set(key, value);
  });

  return params;
};

const scrubBrowserAuthParams = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }

  window.history.replaceState(null, document.title, window.location.pathname);
};

const normalizeFunctionError = async (error: SupabaseFunctionError) => {
  const context = error.context;

  if (context) {
    try {
      const body = await context.json();
      const message = typeof body?.error === 'string' ? body.error : error.message;

      return new Error(message ?? 'Request failed');
    } catch {
      return new Error(error.message ?? 'Request failed');
    }
  }

  return error instanceof Error ? error : new Error(error.message ?? 'Request failed');
};

export class AuthService {
  async getAuthState(): Promise<AuthState> {
    const client = getClient();
    const { data, error } = await client.auth.getSession();

    if (error) {
      throw error;
    }

    return mapSession(data.session);
  }

  subscribe(listener: AuthStateListener) {
    const client = getClient();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      listener(mapSession(session));
    });

    return () => subscription.unsubscribe();
  }

  subscribeToAuthCallbacks(listener: AuthStateListener, errorListener: AuthErrorListener) {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void this.handleAuthCallbackUrl(url)
        .then((authState) => {
          if (authState) {
            listener(authState);
          }
        })
        .catch(errorListener);
    });

    return () => subscription.remove();
  }

  async getInitialAuthCallbackState() {
    const initialUrl = await Linking.getInitialURL();

    if (!initialUrl) {
      return null;
    }

    return this.handleAuthCallbackUrl(initialUrl);
  }

  async handleAuthCallbackUrl(url: string): Promise<AuthState | null> {
    const params = getAuthCallbackParams(url);
    const error = params.get('error_description') ?? params.get('error');

    if (error) {
      scrubBrowserAuthParams();
      throw new Error(error);
    }

    const code = params.get('code');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!code && (!accessToken || !refreshToken)) {
      return null;
    }

    const client = getClient();
    const { data, error: callbackError } = code
      ? await client.auth.exchangeCodeForSession(code)
      : await client.auth.setSession({
          access_token: accessToken as string,
          refresh_token: refreshToken as string,
        });

    scrubBrowserAuthParams();

    if (callbackError) {
      throw callbackError;
    }

    return mapSession(data.session);
  }

  async login(email: string, password: string): Promise<AuthState> {
    const client = getClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }

    return mapSession(data.session);
  }

  async register(name: string, email: string, password: string): Promise<RegistrationResult> {
    const client = getClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });

    if (error) {
      throw error;
    }

    return {
      ...mapSession(data.session),
      requiresEmailConfirmation: !data.session,
    };
  }

  async logout() {
    const client = getClient();
    const { error } = await client.auth.signOut({ scope: 'local' });

    if (error) {
      throw error;
    }
  }

  async requestAccountDeletion(): Promise<AccountDeletionRequest> {
    const client = getClient();
    const { data, error } = await client.rpc('request_account_deletion');

    if (error) {
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row) {
      throw new Error('Account deletion request was not saved');
    }

    return mapAccountDeletionRequest(row as AccountDeletionRequestRow);
  }

  async deleteAccount(): Promise<void> {
    const client = getClient();
    const { error } = await client.functions.invoke(appConfig.accountDeletionFunctionName, {
      body: {
        confirm: true,
      },
    });

    if (error) {
      throw await normalizeFunctionError(error);
    }

    const { error: signOutError } = await client.auth.signOut({ scope: 'local' });

    if (signOutError) {
      console.warn('[AuthService] Local sign out after account deletion failed', signOutError);
    }
  }

  configureAutoRefresh() {
    configureSupabaseAutoRefresh();
  }
}
