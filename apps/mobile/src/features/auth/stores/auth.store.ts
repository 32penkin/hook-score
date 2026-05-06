import { makeAutoObservable, runInAction } from 'mobx';

import { AuthService } from '../../../services/auth/auth.service';
import { AuthState, AuthUser } from '../auth.types';
import { TranslationKey } from '../../../shared/i18n/translations';

export class AuthStore {
  private unsubscribeAuthState?: () => void;
  private unsubscribeAuthCallback?: () => void;

  user: AuthUser | null = null;
  hasSession = false;
  isInitialized = false;
  isLoading = false;
  isAccountDeletionRequesting = false;
  error: string | null = null;
  noticeKey: TranslationKey | null = null;
  accountDeletionError: string | null = null;
  accountDeletionNoticeKey: TranslationKey | null = null;

  constructor(private readonly authService: AuthService) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get isAuthenticated() {
    return this.hasSession;
  }

  get userName() {
    return this.user?.name ?? 'Creator';
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      this.authService.configureAutoRefresh();
      this.unsubscribeAuthState = this.authService.subscribe(this.applyAuthState);
      this.unsubscribeAuthCallback = this.authService.subscribeToAuthCallbacks(
        this.applyAuthCallbackState,
        this.applyAuthCallbackError
      );
      const callbackState = await this.authService.getInitialAuthCallbackState();
      const authState = callbackState ?? (await this.authService.getAuthState());

      runInAction(() => {
        this.applyAuthState(authState);
        this.isInitialized = true;
      });
    } catch (error) {
      runInAction(() => {
        this.hasSession = false;
        this.user = null;
        this.error = error instanceof Error ? error.message : 'Auth initialization failed';
        this.isInitialized = true;
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async login(email: string, password: string) {
    this.isLoading = true;
    this.error = null;
    this.noticeKey = null;

    try {
      const authState = await this.authService.login(email, password);
      runInAction(() => {
        this.applyAuthState(authState);
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Login failed';
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async register(name: string, email: string, password: string) {
    this.isLoading = true;
    this.error = null;
    this.noticeKey = null;

    try {
      const authState = await this.authService.register(name, email, password);
      runInAction(() => {
        this.applyAuthState(authState);
        this.noticeKey = authState.requiresEmailConfirmation ? 'auth.checkEmail' : null;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Registration failed';
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async logout() {
    this.isLoading = true;
    this.error = null;
    this.noticeKey = null;
    this.accountDeletionError = null;
    this.accountDeletionNoticeKey = null;

    try {
      await this.authService.logout();
      runInAction(() => {
        this.applyAuthState({ hasSession: false, user: null });
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Logout failed';
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async requestAccountDeletion() {
    this.isAccountDeletionRequesting = true;
    this.accountDeletionError = null;
    this.accountDeletionNoticeKey = null;

    try {
      await this.authService.requestAccountDeletion();
      runInAction(() => {
        this.accountDeletionNoticeKey = 'settings.accountDeletionRequested';
      });
    } catch (error) {
      runInAction(() => {
        this.accountDeletionError =
          error instanceof Error ? error.message : 'Account deletion request failed';
      });
    } finally {
      runInAction(() => {
        this.isAccountDeletionRequesting = false;
      });
    }
  }

  async deleteAccount() {
    this.isAccountDeletionRequesting = true;
    this.accountDeletionError = null;
    this.accountDeletionNoticeKey = null;

    try {
      await this.authService.deleteAccount();
      runInAction(() => {
        this.applyAuthState({ hasSession: false, user: null });
        this.noticeKey = 'auth.accountDeleted';
      });
    } catch (error) {
      runInAction(() => {
        this.accountDeletionError =
          error instanceof Error ? error.message : 'Account deletion failed';
      });
    } finally {
      runInAction(() => {
        this.isAccountDeletionRequesting = false;
      });
    }
  }

  clearError() {
    this.error = null;
    this.noticeKey = null;
    this.accountDeletionError = null;
    this.accountDeletionNoticeKey = null;
  }

  dispose() {
    this.unsubscribeAuthState?.();
    this.unsubscribeAuthCallback?.();
  }

  private applyAuthState(authState: AuthState) {
    this.hasSession = authState.hasSession;
    this.user = authState.user;
  }

  private applyAuthCallbackState(authState: AuthState) {
    runInAction(() => {
      this.applyAuthState(authState);
      this.error = null;
      this.noticeKey = null;
    });
  }

  private applyAuthCallbackError(error: unknown) {
    runInAction(() => {
      this.error = error instanceof Error ? error.message : 'Auth callback failed';
    });
  }
}
