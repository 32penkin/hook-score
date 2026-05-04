import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import { useRootStore } from '../../../application/providers/store.provider';
import { AuthScreen } from '../components/auth.component';
import { AuthViewModel } from '../viewModels/auth.vm';

export const AuthContainer = observer(function AuthContainer() {
  const { authStore, i18nStore } = useRootStore();
  const viewModel = useMemo(() => new AuthViewModel(authStore), [authStore]);

  return (
    <AuthScreen
      copy={{
        brand: i18nStore.t('auth.brand'),
        subtitle: i18nStore.t('auth.subtitle'),
        login: i18nStore.t('auth.login'),
        register: i18nStore.t('auth.register'),
        name: i18nStore.t('auth.name'),
        email: i18nStore.t('auth.email'),
        password: i18nStore.t('auth.password'),
        namePlaceholder: i18nStore.t('auth.namePlaceholder'),
        emailPlaceholder: i18nStore.t('auth.emailPlaceholder'),
        passwordPlaceholder: i18nStore.t('auth.passwordPlaceholder'),
        submitLogin: i18nStore.t('auth.submitLogin'),
        submitRegister: i18nStore.t('auth.submitRegister'),
        accessHint: i18nStore.t('auth.accessHint'),
      }}
      email={viewModel.email}
      error={viewModel.errorKey ? i18nStore.t(viewModel.errorKey) : authStore.error}
      isBusy={viewModel.isBusy}
      mode={viewModel.mode}
      name={viewModel.name}
      notice={authStore.noticeKey ? i18nStore.t(authStore.noticeKey) : null}
      password={viewModel.password}
      onEmailChange={viewModel.setEmail}
      onModeChange={viewModel.setMode}
      onNameChange={viewModel.setName}
      onPasswordChange={viewModel.setPassword}
      onSubmit={viewModel.submit}
    />
  );
});
