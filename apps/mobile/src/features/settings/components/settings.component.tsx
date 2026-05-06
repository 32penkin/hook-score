import {
  ArrowLeft,
  ExternalLink,
  History,
  Languages,
  LogOut,
  Moon,
  Sun,
  Trash2,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../shared/components/app-button.component';
import { IconButton } from '../../../shared/components/icon-button.component';
import { ScreenContainer } from '../../../shared/components/screen-container.component';
import {
  SegmentedControl,
  SegmentOption,
} from '../../../shared/components/segmented-control.component';
import { Locale } from '../../../shared/i18n/translations';
import { radii, spacing, ThemeMode, typography } from '../../../shared/theme/theme';
import { useAppTheme } from '../../../shared/theme/theme.provider';

type SettingsCopy = {
  title: string;
  subtitle: string;
  back: string;
  history: string;
  logout: string;
  privacyPolicy: string;
  language: string;
  theme: string;
  deleteAccount: string;
  accountSignedInAs: string;
  accountDeletionDescription: string;
  deleteAccountNow: string;
  openAccountDeletionUrl: string;
};

type SettingsScreenProps = {
  copy: SettingsCopy;
  userEmail: string | null;
  locale: Locale;
  localeOptions: SegmentOption<Locale>[];
  themeMode: ThemeMode;
  themeOptions: SegmentOption<ThemeMode>[];
  accountDeletionError?: string | null;
  accountDeletionNotice?: string | null;
  isAccountDeletionRequesting: boolean;
  onLocaleChange: (locale: Locale) => void;
  onThemeModeChange: (mode: ThemeMode) => void;
  onBack: () => void;
  onOpenHistory: () => void;
  onOpenPrivacyPolicy: () => void;
  onOpenAccountDeletionUrl: () => void;
  onDeleteAccount: () => void;
  onLogout: () => void;
};

export function SettingsScreen({
  copy,
  userEmail,
  locale,
  localeOptions,
  themeMode,
  themeOptions,
  accountDeletionError,
  accountDeletionNotice,
  isAccountDeletionRequesting,
  onLocaleChange,
  onThemeModeChange,
  onBack,
  onOpenHistory,
  onOpenPrivacyPolicy,
  onOpenAccountDeletionUrl,
  onDeleteAccount,
  onLogout,
}: SettingsScreenProps) {
  const { colors } = useAppTheme();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton icon={ArrowLeft} label={copy.back} onPress={onBack} />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{copy.subtitle}</Text>
        </View>
      </View>

      <View
        style={[
          styles.section,
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Languages color={colors.sky} size={18} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.language}</Text>
        </View>
        <SegmentedControl options={localeOptions} value={locale} onChange={onLocaleChange} />
      </View>

      <View
        style={[
          styles.section,
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <View style={styles.sectionHeader}>
          {themeMode === 'dark' ? (
            <Moon color={colors.violet} size={18} />
          ) : (
            <Sun color={colors.amber} size={18} />
          )}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.theme}</Text>
        </View>
        <SegmentedControl options={themeOptions} value={themeMode} onChange={onThemeModeChange} />
      </View>

      <View
        style={[
          styles.section,
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Trash2 color={colors.danger} size={18} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.deleteAccount}</Text>
        </View>
        <View style={styles.accountBody}>
          {userEmail ? (
            <Text style={[styles.accountEmail, { color: colors.textMuted }]}>
              {copy.accountSignedInAs}: {userEmail}
            </Text>
          ) : null}
          <Text style={[styles.accountDescription, { color: colors.textMuted }]}>
            {copy.accountDeletionDescription}
          </Text>
          {accountDeletionNotice ? (
            <Text style={[styles.notice, { color: colors.accent }]}>
              {accountDeletionNotice}
            </Text>
          ) : null}
          {accountDeletionError ? (
            <Text style={[styles.error, { color: colors.danger }]}>{accountDeletionError}</Text>
          ) : null}
          <AppButton
            icon={Trash2}
            label={copy.deleteAccountNow}
            loading={isAccountDeletionRequesting}
            onPress={onDeleteAccount}
            tone="danger"
            variant="secondary"
          />
          <AppButton
            icon={ExternalLink}
            label={copy.openAccountDeletionUrl}
            onPress={onOpenAccountDeletionUrl}
            variant="ghost"
          />
        </View>
      </View>

      <View style={styles.footer}>
        <AppButton icon={History} label={copy.history} onPress={onOpenHistory} variant="secondary" />
        <AppButton
          icon={ExternalLink}
          label={copy.privacyPolicy}
          onPress={onOpenPrivacyPolicy}
          variant="secondary"
        />
        <AppButton icon={LogOut} label={copy.logout} onPress={onLogout} variant="secondary" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.lg,
  },
  headerText: {
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 24,
  },
  section: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.h2,
    fontWeight: '900',
  },
  accountBody: {
    gap: spacing.md,
  },
  accountEmail: {
    fontSize: typography.small,
    lineHeight: 18,
  },
  accountDescription: {
    fontSize: typography.small,
    lineHeight: 20,
  },
  notice: {
    fontSize: typography.small,
    fontWeight: '800',
    lineHeight: 20,
  },
  error: {
    fontSize: typography.small,
    fontWeight: '800',
    lineHeight: 20,
  },
  footer: {
    marginTop: 'auto',
    gap: spacing.sm,
  },
});
