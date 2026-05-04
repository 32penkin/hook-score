import { makeAutoObservable } from 'mobx';

import { TranslationKey } from '../../../shared/i18n/translations';
import { AuthStore } from '../stores/auth.store';
import { AuthMode } from '../auth.types';

export class AuthViewModel {
  mode: AuthMode = 'login';
  name = '';
  email = '';
  password = '';
  localErrorKey: TranslationKey | null = null;

  constructor(private readonly authStore: AuthStore) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get isBusy() {
    return this.authStore.isLoading;
  }

  get errorKey() {
    return this.localErrorKey;
  }

  setMode(mode: AuthMode) {
    this.mode = mode;
    this.localErrorKey = null;
    this.authStore.clearError();
  }

  setName(name: string) {
    this.name = name;
  }

  setEmail(email: string) {
    this.email = email;
  }

  setPassword(password: string) {
    this.password = password;
  }

  async submit() {
    this.localErrorKey = null;

    if (!this.email.trim() || !this.password.trim()) {
      this.localErrorKey = 'auth.errorRequired';
      return;
    }

    if (this.mode === 'register') {
      if (!this.name.trim()) {
        this.localErrorKey = 'auth.errorRequired';
        return;
      }

      await this.authStore.register(this.name.trim(), this.email.trim(), this.password);
      return;
    }

    await this.authStore.login(this.email.trim(), this.password);
  }
}
