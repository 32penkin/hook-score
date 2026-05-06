import { ComponentType, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
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
  tone?: 'default' | 'danger';
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: ViewStyle;
};

export function AppButton({
  label,
  onPress,
  icon: Icon,
  disabled,
  loading,
  tone = 'default',
  variant = 'primary',
  style,
}: AppButtonProps) {
  const { colors } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  const isDanger = tone === 'danger';
  const textColor = isPrimary ? colors.black : isDanger ? colors.danger : colors.text;
  const isDisabled = disabled || loading;

  const animateScale = (value: number) => {
    Animated.spring(scale, {
      bounciness: 4,
      speed: 24,
      toValue: value,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={() => animateScale(0.98)}
        onPressOut={() => animateScale(1)}
        style={({ pressed }) => [
          styles.button,
          isPrimary && { backgroundColor: colors.accent, borderColor: colors.accent },
          variant === 'secondary' && {
            backgroundColor: pressed ? colors.surfaceMuted : colors.surfaceElevated,
            borderColor: isDanger
              ? colors.danger
              : pressed
                ? colors.borderStrong
                : colors.border,
          },
          isGhost && {
            backgroundColor: 'transparent',
            borderColor: isDanger ? colors.danger : colors.border,
          },
          (pressed || disabled) && styles.dimmed,
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 2,
  },
  dimmed: {
    opacity: 0.72,
  },
  content: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    flexShrink: 1,
    fontSize: typography.body,
    fontWeight: '800',
    textAlign: 'center',
  },
});
