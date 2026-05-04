import { ComponentType } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { radii, spacing, typography } from '../theme/theme';
import { useAppTheme } from '../theme/theme.provider';

type IconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

type AppButtonProps = {
  label: string;
  onPress: () => void;
  icon?: ComponentType<IconProps>;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: ViewStyle;
};

export function AppButton({
  label,
  onPress,
  icon: Icon,
  disabled,
  loading,
  variant = 'primary',
  style,
}: AppButtonProps) {
  const { colors } = useAppTheme();
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  const textColor = isPrimary ? colors.black : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary && { backgroundColor: colors.accent, borderColor: colors.accent },
        variant === 'secondary' && {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
        },
        isGhost && { backgroundColor: 'transparent', borderColor: colors.border },
        (pressed || disabled) && styles.dimmed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {Icon ? <Icon color={textColor} size={18} strokeWidth={2.4} /> : null}
          <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
  },
  dimmed: {
    opacity: 0.72,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '800',
  },
});
