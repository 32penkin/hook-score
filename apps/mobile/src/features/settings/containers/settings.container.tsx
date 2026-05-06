import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { observer } from 'mobx-react-lite';
import { Alert, Linking } from 'react-native';

import { AppStackParamList } from '../../../application/navigation/navigation.types';
import { useRootStore } from '../../../application/providers/store.provider';
import { SegmentOption } from '../../../shared/components/segmented-control.component';
import { appConfig } from '../../../shared/config/environment';
import { localeLabels, Locale } from '../../../shared/i18n/translations';
import { ThemeMode } from '../../../shared/theme/theme';
import { SettingsScreen } from '../components/settings.component';

type Props = NativeStackScreenProps<AppStackParamList, 'Settings'>;

export const SettingsContainer = observer(function SettingsContainer({ navigation }: Props) {
  const { authStore, i18nStore, themeStore } = useRootStore();

  const localeOptions = Object.entries(localeLabels).map(([value, label]) => ({
    value: value as Locale,
    label,
  })) satisfies SegmentOption<Locale>[];

  const themeOptions: SegmentOption<ThemeMode>[] = [
    { label: i18nStore.t('theme.system'), value: 'system' },
    { label: i18nStore.t('theme.light'), value: 'light' },
    { label: i18nStore.t('theme.dark'), value: 'dark' },
  ];
  const confirmAccountDeletion = () => {
    Alert.alert(
      i18nStore.t('settings.deleteAccountConfirmTitle'),
      i18nStore.t('settings.deleteAccountConfirmMessage'),
      [
        {
          text: i18nStore.t('common.cancel'),
          style: 'cancel',
        },
        {
          text: i18nStore.t('settings.deleteAccountConfirmAction'),
          style: 'destructive',
          onPress: authStore.deleteAccount,
        },
      ]
    );
  };

  return (
    <SettingsScreen
      copy={{
        title: i18nStore.t('settings.title'),
        subtitle: i18nStore.t('settings.subtitle'),
        back: i18nStore.t('common.back'),
        history: i18nStore.t('video.history'),
        logout: i18nStore.t('common.logout'),
        privacyPolicy: i18nStore.t('common.privacyPolicy'),
        language: i18nStore.t('settings.language'),
        theme: i18nStore.t('settings.theme'),
        deleteAccount: i18nStore.t('settings.deleteAccount'),
        accountSignedInAs: i18nStore.t('settings.accountSignedInAs'),
        accountDeletionDescription: i18nStore.t('settings.accountDeletionDescription'),
        deleteAccountNow: i18nStore.t('settings.deleteAccountNow'),
        openAccountDeletionUrl: i18nStore.t('settings.openAccountDeletionUrl'),
      }}
      userEmail={authStore.user?.email ?? null}
      locale={i18nStore.locale}
      localeOptions={localeOptions}
      themeMode={themeStore.mode}
      themeOptions={themeOptions}
      accountDeletionError={authStore.accountDeletionError}
      accountDeletionNotice={
        authStore.accountDeletionNoticeKey
          ? i18nStore.t(authStore.accountDeletionNoticeKey)
          : null
      }
      isAccountDeletionRequesting={authStore.isAccountDeletionRequesting}
      onBack={navigation.goBack}
      onLocaleChange={i18nStore.setLocale}
      onOpenHistory={() => navigation.navigate('History')}
      onOpenPrivacyPolicy={() => {
        void Linking.openURL(appConfig.privacyPolicyUrl).catch(() => undefined);
      }}
      onOpenAccountDeletionUrl={() => {
        void Linking.openURL(appConfig.accountDeletionUrl).catch(() => undefined);
      }}
      onDeleteAccount={confirmAccountDeletion}
      onLogout={authStore.logout}
      onThemeModeChange={themeStore.setMode}
    />
  );
});
