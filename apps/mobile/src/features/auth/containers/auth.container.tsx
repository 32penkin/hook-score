import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import { AuthStackParamList } from '../../../application/navigation/navigation.types';
import { useRootStore } from '../../../application/providers/store.provider';
import { AuthScreen } from '../components/auth.component';
import { AuthViewModel } from '../viewModels/auth.vm';

type Props = NativeStackScreenProps<AuthStackParamList, 'Auth'>;

export const AuthContainer = observer(function AuthContainer({ navigation }: Props) {
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
        tryAnalyzer: i18nStore.t('auth.tryAnalyzer'),
        tryAnalyzerHint: i18nStore.t('auth.tryAnalyzerHint'),
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
      onTryAnalyzer={() => navigation.navigate('GuestVideoPrep')}
    />
  );
});
