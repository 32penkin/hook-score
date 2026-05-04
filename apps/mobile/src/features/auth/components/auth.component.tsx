import { ArrowRight, UserPlus } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../shared/components/app-button.component';
import { ScreenContainer } from '../../../shared/components/screen-container.component';
import {
  SegmentedControl,
  SegmentOption,
} from '../../../shared/components/segmented-control.component';
import { TextField } from '../../../shared/components/text-field.component';
import { radii, spacing, typography } from '../../../shared/theme/theme';
import { useAppTheme } from '../../../shared/theme/theme.provider';
import { AuthMode } from '../auth.types';

type AuthScreenCopy = {
  brand: string;
  subtitle: string;
  login: string;
  register: string;
  name: string;
  email: string;
  password: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  submitLogin: string;
  submitRegister: string;
  accessHint: string;
};

type AuthScreenProps = {
  copy: AuthScreenCopy;
  mode: AuthMode;
  name: string;
  email: string;
  password: string;
  error?: string | null;
  notice?: string | null;
  isBusy: boolean;
  onModeChange: (mode: AuthMode) => void;
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: () => void;
};

export function AuthScreen({
  copy,
  mode,
  name,
  email,
  password,
  error,
  notice,
  isBusy,
  onModeChange,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AuthScreenProps) {
  const { colors } = useAppTheme();
  const modeOptions: SegmentOption<AuthMode>[] = [
    { label: copy.login, value: 'login' },
    { label: copy.register, value: 'register' },
  ];

  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <View
          style={[
            styles.brandMark,
            { backgroundColor: colors.accent, borderColor: colors.text },
          ]}
        >
          <Text style={[styles.brandMarkText, { color: colors.black }]}>HS</Text>
        </View>
        <Text style={[styles.brand, { color: colors.text }]}>{copy.brand}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{copy.subtitle}</Text>
      </View>

      <View
        style={[
          styles.panel,
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <SegmentedControl options={modeOptions} value={mode} onChange={onModeChange} />

        {mode === 'register' ? (
          <TextField
            autoCapitalize="words"
            label={copy.name}
            onChangeText={onNameChange}
            placeholder={copy.namePlaceholder}
            value={name}
          />
        ) : null}

        <TextField
          autoCapitalize="none"
          keyboardType="email-address"
          label={copy.email}
          onChangeText={onEmailChange}
          placeholder={copy.emailPlaceholder}
          value={email}
        />

        <TextField
          label={copy.password}
          onChangeText={onPasswordChange}
          placeholder={copy.passwordPlaceholder}
          secureTextEntry
          value={password}
        />

        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
        {notice ? <Text style={[styles.notice, { color: colors.accent }]}>{notice}</Text> : null}

        <AppButton
          icon={mode === 'register' ? UserPlus : ArrowRight}
          label={mode === 'register' ? copy.submitRegister : copy.submitLogin}
          loading={isBusy}
          onPress={onSubmit}
        />

        <Text style={[styles.accessHint, { color: colors.textSubtle }]}>{copy.accessHint}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  brandMark: {
    width: 58,
    height: 58,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  brandMarkText: {
    fontSize: typography.h2,
    fontWeight: '900',
  },
  brand: {
    fontSize: typography.title,
    fontWeight: '900',
  },
  subtitle: {
    maxWidth: 420,
    fontSize: typography.body,
    lineHeight: 24,
  },
  panel: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  error: {
    fontSize: typography.small,
    fontWeight: '700',
  },
  notice: {
    fontSize: typography.small,
    fontWeight: '800',
    lineHeight: 18,
  },
  accessHint: {
    fontSize: typography.small,
    lineHeight: 18,
  },
});
